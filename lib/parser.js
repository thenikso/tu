// @ts-check

import { grammar } from '../dist/ohm.js';
import { dValue } from './util.js';

/**
 * Defines:
 * - `Core.OperatorTable` - a table of affixes and assignment operators
 * - `Message.fromString` - a method to create a Message from a string
 * @returns {import('./types').EnvironmentPlugin}
 */
export function parserInstaller() {
  return {
    install(Lobby) {
      const OperatorTable = Object.create(
        Lobby.Receiver,
        OPERATOR_TABLE_DESCRIPTORS,
      );
      Object.defineProperty(Lobby.Core, 'OperatorTable', dValue(OperatorTable));

      function Message_fromString(code) {
        const match = tuGrammar.match(code, 'Program');
        const assigns = OperatorTable.assignOperators;
        const infixes = OperatorTable.operators;
        const msg = tuSemantics(match).toMessage(Lobby, assigns, infixes);
        return msg;
      }
      Object.defineProperty(Lobby.Core.Message, 'fromString', {
        value: Message_fromString,
      });

      return Lobby;
    },
  };
}

const OPERATOR_TABLE_DESCRIPTORS = {
  operators: {
    enumerable: true,
    value: new Map([
      //0   ? @ @@
      ['?', 0],
      ['@', 0],
      ['@@', 0],
      //1   **
      ['**', 1],
      //2   % * /
      ['%', 2],
      ['*', 2],
      ['/', 2],
      //3   + -
      ['+', 3],
      ['-', 3],
      //4   << >>
      ['<<', 4],
      ['>>', 4],
      //5   < <= > >=
      ['<', 5],
      ['<=', 5],
      ['>', 5],
      ['>=', 5],
      //6   != ==
      ['!=', 6],
      ['==', 6],
      //7   &
      ['&', 7],
      //8   ^
      ['^', 8],
      //9   |
      ['|', 9],
      //10  && and
      ['&&', 10],
      ['and', 10],
      //11  or ||
      ['||', 11],
      ['or', 11],
      //12  ..
      ['..', 12],
      //13  %= &= *= += -= /= <<= >>= ^= |=
      ['%=', 13],
      ['&=', 13],
      ['*=', 13],
      ['+=', 13],
      ['-=', 13],
      ['/=', 13],
      ['<<=', 13],
      ['>>=', 13],
      ['^=', 13],
      ['|=', 13],
      //14  return
      ['return', 14],
    ]),
  },
  assignOperators: {
    enumerable: true,
    value: new Map([
      ['::=', 'newSlot'],
      [':=', 'setSlot'],
      ['=', 'updateSlot'],
    ]),
  },
};

/** @type {import('ohm-js').Grammar} */
const tuGrammar = grammar(String.raw`Tu {
  Program
    = expression

  // messages

  expression
    = (message | brackets | sctpad)+
  message
    = scpad* symbol scpad* arguments?
  brackets
    = "(" expression ")"               -- round
    | "[" listOf<argument, comma> "]"  -- square
    | "{" listOf<argument, comma> "}"  -- curly
  arguments
    = "(" wcpad* listOf<argument, comma> ")"
  argument
    = scpad* expression scpad*

  // symbols

  symbol
    = number | quote | identifier | operator
  identifier
    = (~("(" | ")" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space) alnum | "_")+
  operator
    = (~("(" | ")" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space | alnum | "_") any)+

  // quotes

  quote
  	= "\"" ("\\\"" | ~"\"" any)* "\""
    | "\"\"\"" (~"\"\"\"" any)* "\"\"\""

  // spans

  terminator
    = separator* (";" | "\n") separator*
  separator
    = (~"\n" space)
  whitespace
  	= " " | "\r" | "\t" | "\n"
  sctpad
    = (separator | comment | terminator)
  scpad
    = (separator | comment)
  wcpad
    = (whitespace | comment)

  // comments

  comment
    = "/*" (~"*/" any)* "*/"         -- block
    | "//" (~"\n" any)* ("\n" | end) -- line
    | "#" (~"\n" any)* ("\n" | end)  -- hash

  // numbers

  number
    = "0" caseInsensitive<"x"> (digit | "a".."f" | "A".."F")+   -- hex
    | digit* "." digit+ ("e" "-"? digit+)?         -- exp
    | digit+                                       -- dec

  // characters

  comma = ","
}`);

const tuSemantics = tuGrammar.createSemantics();

tuSemantics.addOperation('toMessage(Lobby, assigns, infixes)', {
  _terminal() {
    return null;
  },
  _iter(...children) {
    const { Lobby, assigns, infixes } = this.args;
    let msg;
    let lastMsg;
    for (const child of children) {
      const newMsg = child.toMessage(Lobby, assigns, infixes);
      if (!newMsg) {
        // skipping whitespace
        continue;
      }
      if (newMsg.comment) {
        // skipping comments for now
        continue;
      }
      if (!msg) {
        if (newMsg.isEndOfLine) {
          // Do not start with a terminator
          continue;
        }
        msg = newMsg;
        lastMsg = msg.last;
      } else {
        // Do not stack multiple terminators
        if (newMsg.isEndOfLine && lastMsg.isEndOfLine) {
          // Ensure to propagate "hard" terminators (aka: `;`)
          if (lastMsg.name === '\n') {
            lastMsg.name = newMsg.name;
          }
          continue;
        }
        lastMsg.setNext(newMsg);
        lastMsg = newMsg.last;
      }
    }
    return msg;
  },
  Program(exps) {
    const {
      Lobby,
      assigns: assignsMacros,
      infixes: infixPriorities,
    } = this.args;
    const allInfixes = Array.from(Object.keys(infixPriorities));
    const assigns = {
      macros: assignsMacros,
      messagesByMacro: {},
    };
    const infixes = {
      allInfixes,
      priorities: infixPriorities,
      /** @type {{[key: string]: import('./types').Message}} */
      messagesByPriority: {},
      // A syntethic message name to be used in the case of infix resolution
      groupEndSymbol: Symbol('groupEnd'),
      // In the case an exp starts with a parathesis, we need to terminate infix
      // resolution early. We save those messages here because they need to be
      // removed from the final message anyway.
      /** @type {import('./types').Message[]} */
      groupEndMessages: [],
    };

    //
    // Main conversion
    //

    let msg = exps.toMessage(Lobby, assigns, infixes);

    // Remove trailing "non-hard" terminators
    const lastMsg = msg.last;
    if (lastMsg.isEndOfLine && lastMsg.name !== ';') {
      lastMsg.previous.setNext(null);
    }

    //
    // apply assign macros
    //

    // a := b -> setSlot("a", b)
    for (const [assignMethod, messages] of Object.entries(
      assigns.messagesByMacro,
    )) {
      for (const assignOp of messages) {
        const assignName = assignOp.previous;
        const assignValue = assignOp.next;
        let assignEnd = assignValue.next;
        while (assignEnd && !assignEnd?.isEndOfLine) {
          assignEnd = assignEnd.next;
        }
        if (!assignName) {
          throw new Error(`Missing assign name`);
        }
        if (assignName.isLiteral) {
          throw new Error(`Assign name must be a symbol`);
        }
        if (assignName.arguments?.length > 0) {
          throw new Error(`Assign name must not have arguments`);
        }
        if (!assignValue) {
          throw new Error(`Missing assign value`);
        }
        if (assignEnd) {
          assignEnd.previous?.setNext(null);
        }
        const assignLiteral = Lobby.message();
        assignLiteral.name = assignName.name;
        assignLiteral.isLiteral = true;
        assignName.setName(assignMethod);
        assignName.setArguments([assignLiteral, assignValue]);
        assignName.setNext(assignEnd);
      }
    }

    //
    // apply infixes macros
    //

    /**
     * Gether infixes by priority
     * @type {Record<number, string[]>}
     */
    const infixesByPriority = {};
    for (const [infix, priority] of infixPriorities.entries()) {
      if (!infixesByPriority[priority]) {
        infixesByPriority[priority] = [];
      }
      infixesByPriority[priority].push(infix);
    }
    const allPriorities = Array.from(Object.keys(infixesByPriority)).map((x) =>
      parseInt(x, 10),
    );
    /**
     * Sort infix messages by priority (lower number means higher priority first)
     * @type {[number, import('./types').Message[]][]}
     */
    // @ts-ignore
    const infixMessages = Array.from(
      Object.entries(infixes.messagesByPriority).map(([k, m]) => [
        parseInt(k, 10),
        m,
      ]),
    )
      // @ts-ignore
      .sort((a, b) => a[0] - b[0]);

    /**
     * We now want to transform infix messages in messages with a parameter:
     *     a * b -> a *(b)
     * But we need to keep in mind the priority of the infixes:
     *    a + b * c -> a +(b *(c))
     * Even if there are messasges with already resolved infixes:
     *    a + b *(c) -> a +(b *(c))
     * So we start from the highest priority and we use as argument of
     * the resolved infix, the next messages while there are next messages
     * with a (resolved) infix name.
     */
    for (const [priority, infixMsgs] of infixMessages) {
      const infixesNotYetResolved = allPriorities
        .filter((p) => p >= priority)
        .flatMap((p) => infixesByPriority[p]);
      for (const infixMsg of infixMsgs) {
        const arg = infixMsg.next;
        if (!arg) {
          continue;
        }
        let argEnd = arg.next;
        while (
          argEnd &&
          !argEnd.isEndOfLine &&
          // @ts-ignore-next-line
          argEnd.name !== infixes.groupEndSymbol &&
          !infixesNotYetResolved.includes(argEnd.name)
        ) {
          argEnd = argEnd.next;
        }
        // Cut arg until argEnd
        if (argEnd) {
          argEnd.previous?.setNext(null);
        }
        // We are expecing infixMsg.arguments to be empty
        infixMsg.setArguments([arg]);
        // Set next to argEnd
        infixMsg.setNext(argEnd);
      }
    }

    // Remove group end messages
    for (const groupEndMsg of infixes.groupEndMessages) {
      groupEndMsg.previous?.setNext(groupEndMsg.next);
    }

    return msg;
  },
  // messages
  expression(exp) {
    const { Lobby, assigns, infixes } = this.args;
    return exp.toMessage(Lobby, assigns, infixes);
  },
  message(_pad1, symbol, _pad2, args) {
    const { Lobby, assigns, infixes } = this.args;
    const msg = symbol.toMessage(Lobby, assigns, infixes);
    if (args.sourceString) {
      msg.setArguments(args.toMessage(Lobby, assigns, infixes));
    } else {
      const symbolString = msg.name;
      // Check for assign macros
      const assignMacro = assigns.macros.get(symbolString);
      if (assignMacro) {
        assigns.messagesByMacro[assignMacro] ??= [];
        assigns.messagesByMacro[assignMacro].push(msg);
      } else {
        // Check for infix macros
        const infixPriority = infixes.priorities.get(symbolString);
        if (typeof infixPriority !== 'undefined') {
          infixes.messagesByPriority[infixPriority] ??= [];
          infixes.messagesByPriority[infixPriority].push(msg);
        }
      }
    }
    return msg;
  },
  brackets_round(_open, exp, _close) {
    const { Lobby, assigns, infixes } = this.args;
    // Having an `(exp)` only happens if it's the first message after a
    // terminator (or the first message of the program), because other
    // parenthesis are handled by the `Arguments` rule.
    // So here we insert a temporary message to be able to resolve
    // the infixes.
    const msg = exp.toMessage(Lobby, assigns, infixes);
    const groupEndMsg = Lobby.message();
    groupEndMsg.name = infixes.groupEndSymbol;
    groupEndMsg.isLiteral = true;
    infixes.groupEndMessages.push(groupEndMsg);
    msg.last.setNext(groupEndMsg);
    return msg;
  },
  arguments(_open, _pad1, args, _close) {
    const { Lobby, assigns, infixes } = this.args;
    const msgs = args
      .asIteration()
      .children.map((exps) => exps.toMessage(Lobby, assigns, infixes));
    // Remove last terminator if it is not "hard" (aka `;` stay, `\n` are removed)
    if (msgs.length > 0) {
      const last = msgs[msgs.length - 1].last;
      if (last.isEndOfLine && last.name !== ';') {
        last.previous.setNext(null);
      }
    }
    return msgs;
  },
  argument(_pad1, exp, _pad2) {
    const { Lobby, assigns, infixes } = this.args;
    return exp.toMessage(Lobby, assigns, infixes);
  },
  // symbols
  identifier(id) {
    const { Lobby } = this.args;
    const msg = Lobby.message();
    msg.name = id.sourceString;
    const { lineNum } = id.source.getLineAndColumn();
    msg.characterNumber = id.source.startIdx;
    msg.lineNumber = lineNum;
    return msg;
  },
  operator(id) {
    const { Lobby } = this.args;
    const msg = Lobby.message();
    msg.name = id.sourceString;
    const { lineNum } = id.source.getLineAndColumn();
    msg.characterNumber = id.source.startIdx;
    msg.lineNumber = lineNum;
    return msg;
  },
  // quote
  quote(_open, chars, _close) {
    const { Lobby } = this.args;
    const msg = Lobby.message();
    if (_open.sourceString === '"""') {
      msg.name = chars.sourceString;
    } else {
      msg.name = JSON.parse(`"${chars.sourceString}"`);
    }
    msg.isLiteral = true;
    const { lineNum } = chars.source.getLineAndColumn();
    msg.characterNumber = chars.source.startIdx;
    msg.lineNumber = lineNum;
    return msg;
  },
  // spans
  terminator(_pan1, term, _pan2) {
    const { Lobby } = this.args;
    const termMsg = Lobby.message();
    termMsg.name = term.sourceString;
    termMsg.isEndOfLine = true;
    const { lineNum } = term.source.getLineAndColumn();
    termMsg.characterNumber = term.source.startIdx;
    termMsg.lineNumber = lineNum;
    return termMsg;
  },
  // comments
  comment_block(_open, chars, _close) {
    return {
      comment: 'block',
      text: chars.sourceString.replace(/^\s*\*(.*)/gm, '$1'),
    };
  },
  comment_line(_open, chars, _end) {
    return {
      comment: 'line',
      text: chars.sourceString,
    };
  },
  comment_hash(_hash, chars, _end) {
    return {
      comment: 'hash',
      text: chars.sourceString,
    };
  },
  // numbers
  number_hex(_zero, _x, digits) {
    const { Lobby } = this.args;
    const msg = Lobby.message();
    msg.name = parseInt(digits.sourceString, 16);
    msg.isLiteral = true;
    const { lineNum } = _zero.source.getLineAndColumn();
    msg.characterNumber = _zero.source.startIdx;
    msg.lineNumber = lineNum;
    return msg;
  },
  number_exp(digit1, _dot, digit2, e, esign, digit3) {
    const { Lobby } = this.args;
    const msg = Lobby.message();
    msg.name = parseFloat(
      `${digit1.sourceString || '0'}.${
        digit2.sourceString
      }${
        e.sourceString
          ? `e${esign.sourceString || ''}${digit3.sourceString}`
          : ''
      }`,
    );
    msg.isLiteral = true;
    const { lineNum } = digit1.source.getLineAndColumn();
    msg.characterNumber = digit1.source.startIdx;
    msg.lineNumber = lineNum;
    return msg;
  },
  number_dec(digits) {
    const { Lobby } = this.args;
    const msg = Lobby.message();
    msg.name = parseInt(digits.sourceString, 10);
    msg.isLiteral = true;
    const { lineNum } = digits.source.getLineAndColumn();
    msg.characterNumber = digits.source.startIdx;
    msg.lineNumber = lineNum;
    return msg;
  },
});
