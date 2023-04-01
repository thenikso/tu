// @ts-check

import * as ohm from '../dist/ohm.js';
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
        const match = grammar.match(code, 'Program');
        const assigns = OperatorTable.assignOperators;
        const infixes = OperatorTable.operators;
        const msg = semantics(match).toMessage(Lobby, assigns, infixes);
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
  // TODO make it a Map
  operators: {
    enumerable: true,
    value: {
      //0   ? @ @@
      '?': 0,
      '@': 0,
      '@@': 0,
      //1   **
      '**': 1,
      //2   % * /
      '%': 2,
      '*': 2,
      '/': 2,
      //3   + -
      '+': 3,
      '-': 3,
      //4   << >>
      '<<': 4,
      '>>': 4,
      //5   < <= > >=
      '<': 5,
      '<=': 5,
      '>': 5,
      '>=': 5,
      //6   != ==
      '!=': 6,
      '==': 6,
      //7   &
      '&': 7,
      //8   ^
      '^': 8,
      //9   |
      '|': 9,
      //10  && and
      '&&': 10,
      and: 10,
      //11  or ||
      '||': 11,
      or: 11,
      //12  ..
      '..': 12,
      //13  %= &= *= += -= /= <<= >>= ^= |=
      '%=': 13,
      '&=': 13,
      '*=': 13,
      '+=': 13,
      '-=': 13,
      '/=': 13,
      '<<=': 13,
      '>>=': 13,
      '^=': 13,
      '|=': 13,
      //14  return
      return: 14,
    },
  },
  // TODO make a map
  assignOperators: {
    enumerable: true,
    value: {
      '::=': 'newSlot',
      ':=': 'setSlot',
      '=': 'updateSlot',
    },
  },
};

const grammar = ohm.grammar(String.raw`Tu {
  Program
    = Exps Terminator?

  Exps
    = Exps Terminator Exp -- many
    | Exp                 -- single

  Exp
    = Exp Message                      -- multiMessage
    | Message                          -- singleMessage
    | "(" Exp ")"                      -- parentheses
    | "{" Exp "}"                      -- curlyBrackets
    | "[" Exp "]"                      -- squareBrackets

  Message
    = Symbol Arguments -- args
    | Symbol

  Arguments
    = "(" ListOf<Exps, ","> Terminator? ")"

  Symbol
    = number | string | ident

  Terminator
    = ";" // this should? have a newline after it but as syntactic rule it doesn't work
          // I should convert all to lexycal? maybe later

  ident  (an identifier)
    = (~("(" | ")" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space | alnum) any)+
    | (~("(" | ")" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space) alnum)+

  number (a number)
    = digit* "." digit+  -- float
    | digit+             -- int
    // TODO exponentials, hex

  // TODO escape sequences
  string
  	= "\"" (~"\"" any)* "\""
}`);

const semantics = grammar.createSemantics();

semantics.addOperation('toMessage(Lobby, assigns, infixes)', {
  Program(exps, _1) {
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
    let msg = exps.toMessage(Lobby, assigns, infixes);

    //
    // apply assign macros
    //

    // a := b -> setSlot("a", b)
    for (const [assignMethod, messages] of Object.entries(
      assigns.messagesByMacro,
    )) {
      for (const assignOp of messages) {
        const assignName = assignOp.previous;
        const assignFollow = assignName?.previous;
        const assignValue = assignOp.next;
        let assignEnd = assignValue.next;
        while (assignEnd && !assignEnd?.isTerminal) {
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
        const assignLiteral = Lobby.messageLiteral(assignName.name);
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
    for (const [infix, priority] of Object.entries(infixPriorities)) {
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
          !argEnd.isTerminator &&
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
  Exps_single(exp) {
    const { Lobby, assigns, infixes } = this.args;
    return exp.toMessage(Lobby, assigns, infixes);
  },
  Exps_many(exps, term, exp) {
    const { Lobby, assigns, infixes } = this.args;
    const msg = exps.toMessage(Lobby, assigns, infixes);
    const termMsg = term.toMessage(Lobby, assigns, infixes);
    msg.last.setNext(termMsg);
    termMsg.setNext(exp.toMessage(Lobby, assigns, infixes));
    return msg;
  },
  Exp_singleMessage(exp) {
    const { Lobby, assigns, infixes } = this.args;
    return exp.toMessage(Lobby, assigns, infixes);
  },
  Exp_multiMessage(exp, message) {
    const { Lobby, assigns, infixes } = this.args;
    const msg = exp.toMessage(Lobby, assigns, infixes);
    msg.last.setNext(message.toMessage(Lobby, assigns, infixes));
    return msg;
  },
  Exp_parentheses(lb, exp, rb) {
    const { Lobby, assigns, infixes } = this.args;

    // Having an `(exp)` only happens if it's the first message after a
    // terminator (or the first message of the program), because other
    // parenthesis are handled by the `Arguments` rule.
    // So here we insert a temporary message to be able to resolve
    // the infixes.
    const msg = exp.toMessage(Lobby, assigns, infixes);
    // const groupEndMsg = Lobby.messageLiteral(infixes.groupEndSymbol);
    // infixes.groupEndMessages.push(groupEndMsg);
    // msg.last.setNext(groupEndMsg);
    return msg;
  },
  Exp_curlyBrackets(lb, exp, rb) {
    throw new Error('Brackets not implemented');
  },
  Exp_squareBrackets(lb, exp, rb) {
    throw new Error('Brackets not implemented');
  },
  Message(symbol) {
    const { Lobby, assigns, infixes } = this.args;

    const literalOrSymbolMsg = symbol.toMessage(Lobby, assigns, infixes);
    if (!literalOrSymbolMsg.isLiteral) {
      const symbolString = literalOrSymbolMsg.name;
      // Check for assign macros
      const assignMacro = assigns.macros[symbolString];
      if (assignMacro) {
        assigns.messagesByMacro[assignMacro] ??= [];
        assigns.messagesByMacro[assignMacro].push(literalOrSymbolMsg);
      } else {
        // Check for infix macros
        const infixPriority = infixes.priorities[symbolString];
        if (typeof infixPriority !== 'undefined') {
          infixes.messagesByPriority[infixPriority] ??= [];
          infixes.messagesByPriority[infixPriority].push(literalOrSymbolMsg);
        }
      }
    }
    return literalOrSymbolMsg;
  },
  Message_args(symbol, args) {
    const { Lobby, assigns, infixes } = this.args;

    const msg = symbol.toMessage(Lobby, assigns, infixes);
    msg.setArguments(args.toMessage(Lobby, assigns, infixes));
    return msg;
  },
  Arguments(_1, args, t, _2) {
    const { Lobby, assigns, infixes } = this.args;

    const msgs = args
      .asIteration()
      .children.map((exps) => exps.toMessage(Lobby, assigns, infixes));
    if (t.sourceString && msgs.length > 0) {
      msgs[msgs.length - 1].last.setNext(Lobby.messageTerminator());
    }
    return msgs;
  },
  Symbol(symbol) {
    const { Lobby, assigns, infixes } = this.args;

    return symbol.toMessage(Lobby, assigns, infixes);
  },
  Terminator(term) {
    const { Lobby } = this.args;

    const msg = Lobby.message();
    msg.name = term;
    msg.isTerminator = true;
    return msg;
  },
  // primitives
  ident(id) {
    const { Lobby } = this.args;

    const msg = Lobby.message();
    msg.name = id.sourceString;
    return msg;
  },
  number(chars) {
    const { Lobby } = this.args;

    const msg = Lobby.message();
    msg.name = parseInt(chars.sourceString, 10);
    msg.isLiteral = true;
    return msg;
  },
  string(l, chars, r) {
    const { Lobby } = this.args;

    const msg = Lobby.message();
    msg.name = chars.sourceString;
    msg.isLiteral = true;
    return msg;
  },
});
