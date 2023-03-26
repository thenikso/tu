// @ts-check

import ohm from '../vendor/ohm.mjs';

//
// Types
//

/**
 * @typedef {Object} Receiver
 * @property {Readonly<string>} id
 * @property {Readonly<Receiver>} proto
 */

/**
 * @typedef {Object} Str
 * @property {Readonly<string>} id
 * @property {Readonly<string>} value
 */

/**
 * @typedef {Object} Num
 * @property {Readonly<string>} id
 * @property {Readonly<number>} value
 */

/**
 * @typedef {Object} Message
 * @property {Readonly<string>} id
 * @property {Readonly<Symbol | string | number>} name
 * @property {Readonly<Message[]>} arguments
 * @property {(args: Message[]) => Message} setArguments
 * @property {Message | null} next
 * @property {(msg: Message | null) => Message} setNext
 * @property {Message | null} previous
 * @property {(msg: Message | null) => Message} setPrevious
 * @property {Message} last
 */

/**
 * @typedef {ReturnType<typeof environment>} Environment
 */

/**
 * @alias {string[]} MethodArgs
 */

/**
 * @alias {boolean} MethodRaw
 */

//
// Environment
//

const MessageTerminatorSymbol = Symbol('Terminator');

/**
 * If assigned to a `function` it indicates that it is a `method` rather
 * than a plain javascript function.
 * A method function should have as many arguments as it intends to evaluate
 * before it's called. Other arguments will be passed as `Message`s.
 */
const MethodArgsSymbol = Symbol('Method');

/**
 * If assigned to a `function` it indicates that it is a "raw" `method` rather
 * than a plain javascript function.
 * A raw method function will receive all arguments as un-evaluated
 * {@link Message}s in a single array argument.
 * The first argument will instead be the sender {@link Receiver}.
 * `this` will still be the target (which may be a {@link Receiver} or a literal).
 */
const MethodRawSymbol = Symbol('RawMethod');

export function environment(options) {
  // TODO figure out options

  const Receiver = Object.create(null, {
    ...ReceiverDescriptors,
    [Symbol.hasInstance]: {
      value: (inst) => hasProto(Receiver, inst),
    },
    println: {
      enumerable: true,
      value: function () {
        if (options?.log) {
          options?.log(this);
        } else {
          console.log(this);
        }
        return this;
      },
    },
  });

  const Message = Object.create(Receiver, {
    ...MessageDescriptors,
    [Symbol.hasInstance]: {
      value: (inst) => hasProto(Message, inst),
    },
  });

  /**
   *
   * @param {Symbol | string | number} name
   * @param {Message[] | null} args
   * @returns {Message}
   */
  function message(name, args) {
    let _name = name;
    let _args = args;
    let _next = null;
    let _prev = null;
    return Object.create(Message, {
      id: idDescriptor('Message'),
      name: {
        enumerable: true,
        get() {
          return _name;
        },
      },
      setName: {
        enumerable: true,
        value: function (v) {
          _name = v;
          return this;
        },
      },
      arguments: {
        enumerable: true,
        get() {
          return _args ?? [];
        },
      },
      setArguments: {
        enumerable: true,
        value: function (v) {
          _args = v;
          return this;
        },
      },
      next: {
        enumerable: true,
        get() {
          return _next;
        },
      },
      setNext: {
        enumerable: true,
        value: function (v) {
          _next = v;
          if (v) {
            v.setPrevious(this);
          }
          return this;
        },
      },
      previous: {
        enumerable: true,
        get() {
          return _prev?.deref() ?? null;
        },
      },
      setPrevious: {
        enumerable: true,
        value: function (v) {
          _prev = v && new WeakRef(v);
          return this;
        },
      },
    });
  }

  // TODO this should be in core
  const OperatorTable = Object.create(Receiver, {
    [Symbol.hasInstance]: {
      value: (inst) => hasProto(OperatorTable, inst),
    },
    id: idDescriptor('OperatorTable'),
    operators: {
      enumerable: true,
      // TODO make it a Map
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
    assignOperators: {
      // TODO make a map
      enumerable: true,
      value: {
        '::=': 'newSlot',
        ':=': 'setSlot',
        '=': 'updateSlot',
      },
    },
  });

  const Lobby = Object.create(Receiver, {
    id: idDescriptor('Lobby'),
  });

  const env = {
    /** @type {Receiver} */
    Receiver,
    /** @type {Receiver} */
    Lobby,
    /** @type {(symbol: string, args?: Message[]) => Message} */
    message: (symbol, args) => message(Symbol.for(symbol), args),
    /** @type {(literal: string | number) => Message} */
    messageLiteral: (literal) => message(literal),
    /** @type {() => Message} */
    messageTerminator: () => message(MessageTerminatorSymbol, null),
    /** @type {(code: string) => Message} */
    parse: (code) => {
      const match = grammar.match(code, 'Program');
      const infixPriorities = OperatorTable.operators;
      const assignOperators = OperatorTable.assignOperators;
      const msg = semantics(match).toMessage(
        env,
        assignOperators,
        infixPriorities,
      );
      return msg;
    },
    eval: (code) => {
      const msg = env.parse(code);
      const result = msg.doInContext(env.Lobby);
      return result;
    },
    tu: (strings, ...values) => {
      let code = '';
      for (let i = 0; i < strings.length; i++) {
        code += strings[i];
        if (i < values.length) {
          code += values[i];
        }
      }
      return env.eval(code);
    },
  };

  return env;
}

function asMethod(...args) {
  const argNames = args.slice(0, -1);
  if (argNames.includes('self')) {
    throw new Error(`Cannot use 'self' as an argument name`);
  } else if (argNames.includes('call')) {
    throw new Error(`Cannot use 'call' as an argument name`);
  }
  const fn = args[args.length - 1];
  fn[MethodArgsSymbol] = argNames;
  return fn;
}

/**
 * A raw method will not have it's arguments pre-evaluated, meaning that
 * it will receive {@link Message} objects instead of their values.
 * Also the provided function will receive the target as `this`, the sender
 * as the first argument, and the arguments as the second argument.
 * @param {(sender: Receiver, args: Message[]) => any} fn
 */
function asRawMethod(fn) {
  if (fn.length !== 2) {
    throw new Error(`Raw methods must have exactly 2 arguments`);
  }
  fn[MethodRawSymbol] = true;
  return fn;
}

const ReceiverDescriptors = {
  id: {
    enumerable: true,
    get() {
      return 'Receiver';
    },
  },
  proto: {
    enumerable: true,
    get() {
      // TODO if supporting multiple prototypes with a Proxy,
      // this needs to account for that and only return the first one
      return Object.getPrototypeOf(this);
    },
  },
  setSlot: {
    enumerable: true,
    value: function Receiver_setSlot(slotNameString, slotValue) {
      this[slotNameString] = slotValue ?? null;
      return slotValue;
    },
  },
  method: {
    enumerable: true,
    value: asMethod(function Receiver_method() {
      const argumentsArray = Array.from(arguments);
      const argsMsgs = argumentsArray.slice(0, -1);
      const argNames = argsMsgs.map((msg, i) => {
        if (
          msg.name === MessageTerminatorSymbol ||
          typeof msg.name !== 'symbol'
        ) {
          throw new Error(`argument ${i} to method 'method' must be a symbol`);
        }
        return Symbol.keyFor(msg.name);
      });
      const bodyMsg = argumentsArray[argumentsArray.length - 1];
      const sender = this.self;
      const method = asMethod(...argNames, function () {
        return bodyMsg.doInContext(this, sender);
      });
      return method;
    }),
  },
  evalArgAndReturnSelf: {
    enumerable: true,
  },
  '': {
    enumerable: false,
    get() {
      return this;
    },
  },
  '==': {
    enumerable: true,
    value: function Receiver_equals(other) {
      return this === other;
    },
  },
};

const Num = Object.create(null, {
  id: {
    enumerable: true,
    get() {
      return 'Number';
    },
  },
  '+': {
    enumerable: true,
    value: function Number_plus(b = null) {
      if (typeof b !== 'number') {
        throw new Error(`argument 0 to method '+' must be a Number. Got ${b}.`);
      }
      return this + b;
    },
  },
  '-': {
    enumerable: true,
    value: function Number_minus(b = null) {
      if (typeof b !== 'number') {
        throw new Error(`argument 0 to method '-' must be a Number. Got ${b}.`);
      }
      return this - b;
    },
  },
  '*': {
    enumerable: true,
    value: function Number_times(b = null) {
      if (typeof b !== 'number') {
        throw new Error(`argument 0 to method '*' must be a Number. Got ${b}.`);
      }
      return this * b;
    },
  },
  '/': {
    enumerable: true,
    value: function Number_dividedBy(b = null) {
      if (typeof b !== 'number') {
        throw new Error(`argument 0 to method '/' must be a Number. Got ${b}.`);
      }
      return this / b;
    },
  },
  sqrt: {
    enumerable: true,
    value: function Number_sqrt() {
      return Math.sqrt(this);
    },
  },
});

const Str = Object.create(null, {
  id: {
    enumerable: true,
    get() {
      return 'String';
    },
  },
});

const Bool = Object.create(null, {
  id: {
    enumerable: true,
    get() {
      return 'Boolean';
    },
  },
  ifTrue: {
    enumerable: true,
    value: asRawMethod(function Boolean_ifTrue(sender, [trueBlock]) {
      if (typeof trueBlock === 'undefined') {
        throw new Error(`argument 0 to method 'ifTrue' is required`);
      }
      if (this === true) {
        trueBlock.doInContext(sender);
      }
      return this;
    }),
  },
  ifFalse: {
    enumerable: true,
    value: asRawMethod(function Boolean_ifFalse(sender, [falseBlock]) {
      if (typeof falseBlock === 'undefined') {
        throw new Error(`argument 0 to method 'ifFalse' is required`);
      }
      if (this === false) {
        falseBlock.doInContext(sender);
      }
      return this;
    }),
  },
});

const MessageDescriptors = {
  last: {
    enumerable: true,
    get() {
      let last = this;
      while (last.next) {
        last = last.next;
      }
      return last;
    },
  },
  doInContext: {
    enumerable: true,
    /**
     * @param {Receiver} context
     * @param {Receiver=} locals
     */
    value: function Message_doInContext(context, locals) {
      const rootReceiver = this.proto;
      /** @type {Message} */
      let msg = this;
      let cursor = null;
      let target = context;
      let sender = locals ?? context;
      let slotName;
      let slot;
      let i, l;
      /** @type {MethodRaw} */
      let methodRaw;
      /** @type {MethodArgs} */
      let methodArgs;
      do {
        if (msg.name === MessageTerminatorSymbol) {
          cursor = null;
          target = context;
          sender = locals ?? context;
          msg = msg.next;
          continue;
        }

        if (
          typeof msg.name === 'string' ||
          typeof msg.name === 'number' ||
          typeof msg.name === 'boolean'
        ) {
          cursor = msg.name;
          target = cursor;
          msg = msg.next;
          continue;
        }

        slot = null;
        if (
          typeof msg.name === 'symbol' &&
          (slotName = Symbol.keyFor(msg.name))
        ) {
          switch (typeof target) {
            case 'number':
              // Simulate Num being a prototype of Receiver
              slot = Num[slotName] ?? rootReceiver[slotName];
              break;
            case 'string':
              slot = Str[slotName] ?? rootReceiver[slotName];
              break;
            case 'boolean':
              slot = Bool[slotName] ?? rootReceiver[slotName];
              break;
            default:
              slot = target[slotName];
          }
        }
        if (!slot) {
          throw new Error(
            `${target.id ?? typeof target} does not respond to '${
              typeof msg.name === 'symbol' ? Symbol.keyFor(msg.name) : msg.name
            }'`,
          );
        }

        cursor = slot;

        if (typeof cursor === 'function') {
          methodArgs = cursor[MethodArgsSymbol];
          if (methodArgs) {
            // generate `locals` with `target` as proto
            const locals = Object.create(target, {
              self: {
                enumerable: true,
                value: target,
              },
              call: Object.create(rootReceiver, {
                // current object for the method (aka `this` in js or `self`)
                target: {
                  enumerable: true,
                  value: target,
                },
                // the method being called
                activated: {
                  enumerable: true,
                  value: cursor,
                },
                // message used to call the method
                message: {
                  enumerable: true,
                  value: msg,
                },
                // locals object of caller
                // TODO remove for [safety?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/caller)
                sender: {
                  enumerable: true,
                  value: sender,
                },
                // missing `slotContext` which should be the proto object that
                // defines the slot/method being called
              }),
            });
            // Eval args requested by method
            const localArgs = [];
            for (i = 0, l = methodArgs.length; i < l; i++) {
              locals[methodArgs[i]] = localArgs[i] =
                msg.arguments[i]?.doInContext(sender) ?? null;
            }
            // other arguments will be sent as `Message`s in `arguments`
            for (l = msg.arguments.length; i < l; i++) {
              localArgs[i] = msg.arguments[i];
            }
            // Apply method
            cursor = cursor.apply(locals, localArgs);
            // Methods may return `this` so if `cursor` is `locals`
            // then we need to return `target` instead
            if (cursor === locals) {
              cursor = target;
            }
          } else {
            methodRaw = cursor[MethodRawSymbol];
            if (methodRaw) {
              // raw method function will not pre-eval args
              cursor = cursor.call(target, sender, msg.arguments);
            } else {
              // for normal funciton resolve all args and send
              cursor = cursor.apply(
                target,
                msg.arguments.map((arg) => arg.doInContext(sender)),
              );
            }
          }
        }

        target = cursor;
        msg = msg.next;
      } while (msg);

      return cursor;
    },
  },
  toString: {
    enumerable: true,
    value: function Message_toString() {
      let str = '';
      /** @type {Message} */
      let msg = this;
      let inArgs = false;
      do {
        if (msg.name === MessageTerminatorSymbol) {
          str = str.trimEnd();
          str += ';';
          str += inArgs ? ' ' : '\n';
        } else if (typeof msg.name === 'string') {
          str += '"' + msg.name + '" ';
        } else if (typeof msg.name === 'number') {
          str += msg.name + ' ';
        } else {
          str += Symbol.keyFor(msg.name);
          if (msg.arguments.length > 0) {
            inArgs = true;
            str += '(';
            str += msg.arguments
              .map((arg) => arg.toString().trimEnd())
              .join(', ');
            str += ')';
            inArgs = false;
          }
          str += ' ';
        }
        msg = msg.next;
      } while (msg);
      return str.trim();
    },
  },
};

//
// Utils
//

function hasProto(proto, inst) {
  let p = inst?.proto;
  while (p) {
    if (p === proto) {
      return true;
    }
    p = p.proto;
  }
  return false;
}

function idDescriptor(prefix) {
  const id =
    prefix +
    '_0x' +
    Math.abs(Date.now() ^ (Math.random() * 10000000000000)).toString(32);
  return {
    enumerable: true,
    get() {
      return id;
    },
  };
}

//
// Parser
//

// Debug it at https://ohmlang.github.io/editor/#
const grammar = ohm.grammar(String.raw`Io {
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
    = "(" ListOf<Exps, ","> ")"

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
semantics.addOperation('toMessage(env, assigns, infixes)', {
  Program(exps, _1) {
    /** @type {Environment} */
    const env = this.args.env;
    /** @type {Record<string, string>} */
    const assignsMacros = this.args.assigns;
    /** @type {Record<string, number>} */
    const infixPriorities = this.args.infixes;
    const allInfixes = Array.from(Object.keys(infixPriorities));

    // Compile message
    const assigns = {
      macros: assignsMacros,
      /** @type {Record<string, [Message]>} */
      messagesByMacro: {},
    };
    const infixes = {
      allInfixes,
      priorities: infixPriorities,
      messagesByPriority: {},
    };
    let msg = exps.toMessage(env, assigns, infixes);

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
        while (assignEnd && assignEnd?.name !== MessageTerminatorSymbol) {
          assignEnd = assignEnd.next;
        }
        if (!assignName) {
          throw new Error(`Missing assign name`);
        }
        if (typeof assignName.name !== 'symbol') {
          throw new Error(`Assign name must be a symbol`);
        }
        if (!assignValue) {
          throw new Error(`Missing assign value`);
        }
        if (assignEnd) {
          assignEnd.previous?.setNext(null);
        }
        const assignMsg = env.message(assignMethod, [
          env.messageLiteral(Symbol.keyFor(assignName.name)),
          assignValue,
        ]);
        if (assignFollow) {
          assignFollow.setNext(assignMsg);
        } else {
          msg = assignMsg;
        }
        if (assignEnd) {
          assignMsg.setNext(assignEnd);
        }
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
     * @type {[number, Message[]][]}
     */
    const infixMessages = Array.from(
      Object.entries(infixes.messagesByPriority).map((x) => [
        parseInt(x[0], 10),
        x[1],
      ]),
    ).sort((a, b) => a[0] - b[0]);

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
      const infixesNamesAlreadyResolved = allPriorities
        .filter((p) => p < priority)
        .flatMap((p) => infixesByPriority[p]);
      for (const infixMsg of infixMsgs) {
        const arg = infixMsg.next;
        if (!arg) {
          continue;
        }
        let argEnd = arg.next;
        while (
          typeof argEnd?.name === 'symbol' &&
          infixesNamesAlreadyResolved.includes(Symbol.keyFor(argEnd.name))
        ) {
          argEnd = argEnd.next;
        }
        // Cut arg until argEnd
        if (argEnd) {
          argEnd.previous.setNext(null);
        }
        // We are expecing infixMsg.arguments to be empty
        infixMsg.setArguments([arg]);
        // Set next to argEnd
        infixMsg.setNext(argEnd);
      }
    }

    return msg;
  },
  Exps_single(exp) {
    const { env, assigns, infixes } = this.args;

    return exp.toMessage(env, assigns, infixes);
  },
  Exps_many(exps, term, exp) {
    const { env, assigns, infixes } = this.args;

    /** @type {Message} */
    const msg = exps.toMessage(env, assigns, infixes);
    const termMsg = term.toMessage(env, assigns, infixes);
    msg.last.setNext(termMsg);
    termMsg.setNext(exp.toMessage(env, assigns, infixes));
    return msg;
  },
  Exp_singleMessage(exp) {
    const { env, assigns, infixes } = this.args;

    const msg = exp.toMessage(env, assigns, infixes);
    return msg;
  },
  Exp_multiMessage(exp, message) {
    const { env, assigns, infixes } = this.args;

    /** @type {Message} */
    const msg = exp.toMessage(env, assigns, infixes);
    msg.last.setNext(message.toMessage(env, assigns, infixes));
    return msg;
  },
  Exp_parentheses(lb, exp, rb) {
    const { env, assigns, infixes } = this.args;

    return exp.toMessage(env, assigns, infixes);
  },
  Exp_curlyBrackets(lb, exp, rb) {
    // TODO use env.Receiver.curlyBrackets
    throw new Error('Brackets not implemented');
  },
  Exp_squareBrackets(lb, exp, rb) {
    // TODO use env.Receiver.curlyBrackets
    throw new Error('Brackets not implemented');
  },
  Message(symbol) {
    const { env, assigns, infixes } = this.args;

    const literalOrSymbolMsg = symbol.toMessage(env, assigns, infixes);
    if (typeof literalOrSymbolMsg.name === 'symbol') {
      const symbolString = Symbol.keyFor(literalOrSymbolMsg.name);
      // Check for assign macros
      const assignMacro = assigns.macros[symbolString];
      if (assignMacro) {
        assigns.messagesByMacro[assignMacro] ??= [];
        assigns.messagesByMacro[assignMacro].push(literalOrSymbolMsg);
      } else {
        // Check for infix macros
        const infixPriority = infixes.priorities[symbolString];
        if (infixPriority) {
          infixes.messagesByPriority[infixPriority] ??= [];
          infixes.messagesByPriority[infixPriority].push(literalOrSymbolMsg);
        }
      }
    }
    return literalOrSymbolMsg;
  },
  Message_args(symbol, args) {
    const { env, assigns, infixes } = this.args;

    /** @type {Message} */
    const msg = symbol.toMessage(env, assigns, infixes);
    msg.setArguments(args.toMessage(env, assigns, infixes));
    return msg;
  },
  Arguments(_1, args, _2) {
    const { env, assigns, infixes } = this.args;

    const msgs = args
      .asIteration()
      .children.map((exps) => exps.toMessage(env, assigns, infixes));
    return msgs;
  },
  Symbol(symbol) {
    const { env, assigns, infixes } = this.args;

    return symbol.toMessage(env, assigns, infixes);
  },
  Terminator(_1) {
    /** @type {Environment} */
    const env = this.args.env;

    return env.messageTerminator();
  },
  // primitives
  ident(id) {
    /** @type {Environment} */
    const env = this.args.env;

    return env.message(id.sourceString);
  },
  number(chars) {
    /** @type {Environment} */
    const env = this.args.env;

    return env.messageLiteral(parseInt(chars.sourceString, 10));
  },
  string(l, chars, r) {
    /** @type {Environment} */
    const env = this.args.env;

    return env.messageLiteral(chars.sourceString);
  },
});
