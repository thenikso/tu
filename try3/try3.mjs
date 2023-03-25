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
 * @alias {string[]} MethodInfo
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
const MethodInfoSymbol = Symbol('Method');

export function environment() {
  const Receiver = Object.create(null, {
    [Symbol.hasInstance]: {
      value: (inst) => hasProto(Receiver, inst),
    },
    '': {
      enumerable: false,
      get() {
        return this;
      },
    },
    ...ReceiverDescriptors,
  });

  const Message = Object.create(Receiver, {
    [Symbol.hasInstance]: {
      value: (inst) => hasProto(Message, inst),
    },
    ...MessageDescriptors,
  });

  const Call = Object.create(Receiver, {
    [Symbol.hasInstance]: {
      value: (inst) => hasProto(Call, inst),
    },
    ...CallDescriptors,
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
          return _prev?.deref();
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
      const msg = semantics(match).toMessage(env);
      return msg;
    },
  };

  return env;
}

function asMethod(...args) {
  const argNames = args.slice(0, -1);
  const fn = args[args.length - 1];
  fn[MethodInfoSymbol] = argNames;
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
          throw new Error(
            `Exception: argument ${i} to method 'method' must be a symbol`,
          );
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
    value: function Number_plus(b) {
      if (typeof b !== 'number') {
        throw new Error(`Exception: argument 0 to method '+' must be a Number`);
      }
      return this + b;
    },
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
      /** @type {Message} */
      let msg = this;
      let cursor = null;
      let target = context;
      let sender = locals ?? context;
      let slotName;
      let slot;
      let i, l;
      /** @type {MethodInfo} */
      let methodInfo;
      do {
        if (msg.name === MessageTerminatorSymbol) {
          cursor = null;
          target = context;
          sender = locals ?? context;
          msg = msg.next;
          continue;
        }

        if (typeof msg.name === 'string' || typeof msg.name === 'number') {
          cursor = msg.name;
          target = cursor;
          msg = msg.next;
          continue;
        }

        if (
          typeof msg.name === 'symbol' &&
          (slotName = Symbol.keyFor(msg.name))
        ) {
          // TODO string
          if (typeof target === 'number') {
            slot = Num[slotName];
          } else {
            slot = target[slotName];
          }
        }
        if (!slot) {
          throw new Error(
            `Exception: ${target.id ?? typeof target} does not respond to '${
              typeof msg.name === 'symbol' ? Symbol.keyFor(msg.name) : msg.name
            }'`,
          );
        }

        cursor = slot;

        if (typeof cursor === 'function') {
          methodInfo = cursor[MethodInfoSymbol];
          if (methodInfo) {
            // generate `locals` with `target` as proto
            const locals = Object.create(target, {
              self: {
                enumerable: true,
                value: target,
              },
              // TODO call
              // TODO will need Receiver here to create Call? maybe use null?
            });
            // Eval args requested by method
            const localArgs = [];
            for (i = 0, l = methodInfo.length; i < l; i++) {
              locals[methodInfo[i]] = localArgs[i] =
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
            // for normal funciton resolve all args and send
            cursor = cursor.apply(
              target,
              msg.arguments.map((arg) => arg.doInContext(sender)),
            );
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
      return str;
    },
  },
};

const CallDescriptors = {
  // TODO call descriptors
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
    = ident ("::=" | ":=" | "=") Exp   -- assignMacro
    | Exp Message                      -- multiMessage
    | Message                          -- singleMessage

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
    = (~("(" | ")" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space) any)+

  number (a number)
    = digit* "." digit+  -- float
    | digit+             -- int
    // TODO exponentials, hex

  // TODO escape sequences
  string
  	= "\"" (~"\"" any)* "\""
}`);
const semantics = grammar.createSemantics();
semantics.addOperation('toMessage(env)', {
  Program(exps, _1) {
    /** @type {Environment} */
    const env = this.args.env;

    // TODO apply operators macros
    return exps.toMessage(env);
  },
  Exps_single(exp) {
    /** @type {Environment} */
    const env = this.args.env;

    return exp.toMessage(env);
  },
  Exps_many(exps, term, exp) {
    /** @type {Environment} */
    const env = this.args.env;

    /** @type {Message} */
    const msg = exps.toMessage(env);
    const termMsg = term.toMessage(env);
    msg.last.setNext(termMsg);
    termMsg.setNext(exp.toMessage(env));
    return msg;
  },
  Exp_assignMacro(symbol, assign, exp) {
    /** @type {Environment} */
    const env = this.args.env;

    let assignMethod;
    switch (assign.sourceString) {
      case '::=':
        assignMethod = 'newSlot';
        break;
      case ':=':
        assignMethod = 'setSlot';
        break;
      case '=':
        assignMethod = 'updateSlot';
        break;
      default:
        throw new Error(`Unknown assignment method: ${assign.sourceString}`);
    }

    return env.message(assignMethod, [
      env.messageLiteral(symbol.sourceString),
      exp.toMessage(env),
    ]);
  },
  Exp_singleMessage(exp) {
    /** @type {Environment} */
    const env = this.args.env;

    const msg = exp.toMessage(env);
    return msg;
  },
  Exp_multiMessage(exp, message) {
    /** @type {Environment} */
    const env = this.args.env;

    /** @type {Message} */
    const msg = exp.toMessage(env);
    msg.last.setNext(message.toMessage(env));
    return msg;
  },
  Message(symbol) {
    /** @type {Environment} */
    const env = this.args.env;

    const literal = symbol.toMessage(env);
    return literal;
  },
  Message_args(symbol, args) {
    /** @type {Environment} */
    const env = this.args.env;

    /** @type {Message} */
    const msg = symbol.toMessage(env);
    msg.setArguments(args.toMessage(env));
    return msg;
  },
  Arguments(_1, args, _2) {
    /** @type {Environment} */
    const env = this.args.env;

    const msgs = args.asIteration().children.map((exps) => exps.toMessage(env));
    return msgs;
  },
  Symbol(symbol) {
    /** @type {Environment} */
    const env = this.args.env;

    return symbol.toMessage(env);
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
