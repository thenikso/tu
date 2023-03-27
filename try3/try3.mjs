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

//
// Environment
//

/**
 * Symbol used in {@link Receiver} objects to identify the instance.
 */
const IdSymbol = Symbol('id');

/**
 * Symbol used as {@link Message.name} to indicate that the message is
 * a terminator.
 */
const MessageTerminatorSymbol = Symbol('Terminator');

/**
 * If assigned to a `function` it indicates that it is a `method` rather
 * than a plain javascript function.
 * A method function should have as many arguments as it intends to evaluate
 * before it's called. Other arguments will be passed as `Message`s.
 */
const MethodArgsSymbol = Symbol('Method');

/**
 * A prototype generated with `protos` is a `Proxy` and will respond to
 * this symbol to allow `Receiver.protos` to properly identify the
 * prototype.
 */
const ProtosSymbol = Symbol('protos');

export function environment(options) {
  const Receiver = Object.create(null, {
    ...ReceiverDescriptors,
    [Symbol.hasInstance]: {
      value: (inst) => hasProto(Receiver, inst),
    },
    clone: {
      enumerable: true,
      /**
       * Clones the receiver and calls `init` if it exists.
       * @returns {Receiver}
       */
      value: function Receiver_clone() {
        const obj = Object.create(this, {
          [IdSymbol]: idDescriptor(this.type, true),
        });
        if ('init' in obj) {
          message(Symbol.for('init')).doInContext(obj);
        }
        return obj;
      },
    },
    print: {
      enumerable: true,
      value: function () {
        return this.println();
      },
    },
    println: {
      enumerable: true,
      value: function () {
        if (options?.log) {
          options?.log(this?.asString?.() ?? this);
        } else {
          console.log(this?.asString?.() ?? this);
        }
        return this;
      },
    },
    writeln: {
      enumerable: true,
      value: function (...msgs) {
        const msg = msgs.map((m) => m?.asString?.() ?? String(m)).join('');
        if (options?.log) {
          options?.log(msg);
        } else {
          console.log(msg);
        }
        return this;
      },
    },
    list: {
      enumerable: true,
      value: function (...items) {
        return List.clone().append(...items);
      },
    },
    try: {
      enumerable: true,
      value: asMethod(function Receiver_try() {
        const body = arguments[0];
        if (body) {
          try {
            body.doInContext(this.self);
            return null;
          } catch (error) {
            return exception(error);
          }
        }
      }),
    },
    '@': {
      enumerable: true,
      value: asMethod(function Receiver_at() {
        const body = arguments[0];
        if (!body) {
          throw new Error('missing argument');
        }
        const self = this.self;
        return future(
          new Promise(async (resolve) => {
            const result = await body.doInContext(self);
            resolve(result);
          }),
        );
      }),
    },
  });

  const OperatorTable = createReceiver('OperatorTable', Receiver, {
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
  });
  const Call = createReceiver('Call', Receiver, CallDescriptors);
  const Nil = createReceiver('Nil', Receiver, NilDescriptors);
  const Num = createReceiver('Number', Receiver, NumDescriptors);
  const Str = createReceiver('String', Receiver, StrDescriptors);
  const Bool = createReceiver('Boolean', Receiver, BoolDescriptors);
  const List = createReceiver('List', Receiver, {
    ...ListDescriptors,
    jsArray: {
      enumerable: true,
      writable: true,
      value: null,
    },
    init: {
      enumerable: true,
      value: function List_init() {
        if (this.proto instanceof List) {
          this.jsArray = this.proto.jsArray.slice();
        } else {
          this.jsArray = [];
        }
        return this;
      },
    },
  });
  const MapReceiver = createReceiver('Map', Receiver, {
    ...MapDescriptors,
    jsMap: {
      enumerable: true,
      writable: true,
      value: null,
    },
    init: {
      enumerable: true,
      value: function Map_init() {
        if (this.proto instanceof MapReceiver) {
          this.jsMap = new Map(this.proto.jsMap);
        } else {
          this.jsMap = new Map();
        }
        return this;
      },
    },
  });
  const Exception = createReceiver('Exception', Receiver, ExceptionDescriptors);

  function exception(error) {
    const obj = Exception.clone();
    obj.error = error;
    return obj;
  }

  const Future = createReceiver('Future', Receiver, FutureDescriptors);

  function future(promise) {
    const obj = Future.clone();
    obj.promise = promise;
    return obj;
  }

  const Core = createReceiver('Core', Receiver, {
    Object: {
      enumerable: true,
      value: Receiver,
    },
    OperatorTable: {
      enumerable: true,
      value: OperatorTable,
    },
    Call: {
      enumerable: true,
      value: Call,
    },
    Number: {
      enumerable: true,
      value: Num,
    },
    String: {
      enumerable: true,
      value: Str,
    },
    Boolean: {
      enumerable: true,
      value: Bool,
    },
    List: {
      enumerable: true,
      value: List,
    },
    Map: {
      enumerable: true,
      value: MapReceiver,
    },
    Exception: {
      enumerable: true,
      value: Exception,
    },
    Message: {
      enumerable: true,
      get() {
        return Message;
      },
    },
    Time: {
      enumerable: true,
      value: createReceiver('Time', Receiver, TimeDescriptors),
    },
  });

  const Lobby = createReceiver('Lobby', Core);

  const Message = createReceiver('Message', Receiver, {
    ...MessageDescriptors,
    doInContext: {
      enumerable: true,
      value: makeMessage_doInContext(Lobby, Call, Nil, Num, Str, Bool, List),
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
      [IdSymbol]: idDescriptor('Message'),
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
      let result = msg.doInContext(env.Lobby);
      if (result instanceof List) {
        result = result.jsArray;
      } else if (result instanceof Future) {
        result = result.promise;
      }
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

/**
 * Creates a function to be assigned as `doInContext` on a Message.
 * It's done this way because we need instances of Receivers for the
 * specific environment.
 */
function makeMessage_doInContext(Lobby, Call, Nil, Num, Str, Bool, List) {
  /**
   * @param {Receiver} context
   * @param {Receiver=} locals
   */
  return function Message_doInContext(context, locals) {
    /** @type {Message} */
    let msg = this;
    let cursor = null;
    let target = context;
    let localsTarget;
    let sender = locals ?? context;
    let slotName;
    let slot;
    let i, l;
    /** @type {MethodArgs} */
    let methodArgs;
    while (msg) {
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
      localsTarget = target;
      if (
        typeof msg.name === 'symbol' &&
        (slotName = Symbol.keyFor(msg.name))
      ) {
        switch (typeof target) {
          case 'number':
            slot = Num[slotName];
            localsTarget = Num;
            break;
          case 'string':
            slot = Str[slotName];
            localsTarget = Str;
            break;
          case 'boolean':
            slot = Bool[slotName];
            localsTarget = Bool;
            break;
          default:
            if (target === null) {
              slot = Nil[slotName];
              localsTarget = Nil;
            } else {
              slot = target[slotName];
            }
            break;
        }
        if (typeof slot === 'undefined' && locals) {
          slot = locals[slotName];
        }
        if (typeof slot === 'undefined' && target.forward) {
          slot = target.forward;
        }
        if (typeof slot === 'undefined') {
          slot = Lobby[slotName];
        }
      }
      if (typeof slot === 'undefined') {
        throw new Error(
          `${target.type ?? typeof target} does not respond to '${
            typeof msg.name === 'symbol' ? Symbol.keyFor(msg.name) : msg.name
          }'`,
        );
      }

      cursor = slot;

      if (typeof cursor === 'function') {
        methodArgs = cursor[MethodArgsSymbol];
        if (methodArgs) {
          const newLocals = Object.create(localsTarget, {
            self: {
              enumerable: true,
              value: target,
            },
            call: {
              enumerable: true,
              value: Object.create(Call, {
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
            },
          });
          // Eval args requested by method
          const localArgs = [];
          for (i = 0, l = methodArgs.length; i < l; i++) {
            newLocals[methodArgs[i]] = localArgs[i] =
              msg.arguments[i]?.doInContext(sender) ?? null;
          }
          // other arguments will be sent as `Message`s in `arguments`
          for (l = msg.arguments.length; i < l; i++) {
            localArgs[i] = msg.arguments[i];
          }
          // Apply method
          cursor = cursor.apply(newLocals, localArgs);
          // Methods may return `this` so if `cursor` is `locals`
          // then we need to return `target` instead
          if (cursor === newLocals) {
            // cursor = target;
            throw new Error(
              `Method '${slotName}' returned 'this' which is not allowed, use 'this.self' instead`,
            );
          }
        } else {
          // for normal funciton resolve all args and send
          cursor = cursor.apply(
            target,
            msg.arguments.map((arg) => arg.doInContext(sender)),
          );
        }
        // Convert arrays to `List`s
        if (Array.isArray(cursor)) {
          const l = cursor;
          cursor = List.clone();
          cursor.jsArray = l;
        }
      }

      target = cursor;
      msg = msg.next;
    }

    return cursor;
  };
}

function asMethod(...args) {
  const argNames = args.slice(0, -1);
  if (argNames.includes('self')) {
    throw new Error(`Cannot use 'self' as an argument name`);
  } else if (argNames.includes('call')) {
    throw new Error(`Cannot use 'call' as an argument name`);
  }
  const fn = args[args.length - 1];
  Object.defineProperty(fn, MethodArgsSymbol, {
    enumerable: false,
    get() {
      return argNames;
    },
  });
  return fn;
}

const ReceiverDescriptors = {
  [IdSymbol]: {
    enumerable: false,
    get() {
      return 'Object';
    },
  },
  proto: {
    enumerable: true,
    get() {
      const proto = Object.getPrototypeOf(this);
      if (!proto) return null;
      const protos = proto[ProtosSymbol];
      return protos ? protos[0] : proto;
    },
  },
  type: {
    enumerable: true,
    get() {
      return this[IdSymbol].split('_')[0];
    },
  },
  setSlot: {
    enumerable: true,
    value: function Receiver_setSlot(slotNameString, slotValue) {
      this[slotNameString] = slotValue ?? null;
      // If the slotValue has a configurable `id`, it means it's just been
      // cloned and we can change it's `id`/`type` to match the slot name
      // if it starts with a capital letter
      if (
        slotValue &&
        slotNameString[0] === slotNameString[0].toUpperCase() &&
        typeof slotValue === 'object' &&
        Object.getOwnPropertyDescriptor(slotValue, IdSymbol)?.configurable
      ) {
        Object.defineProperty(
          slotValue,
          IdSymbol,
          idDescriptor(slotNameString),
        );
      }
      return slotValue;
    },
  },
  updateSlot: {
    enumerable: true,
    value: function Receiver_updateSlot(slotNameString, slotValue) {
      this[slotNameString] = slotValue ?? null;
      return slotValue;
    },
  },
  /**
   * Like `setSlot` but also create a setter method for the slot.
   * The setter method will be named `set` + slotNameString capitalized.
   */
  newSlot: {
    enumerable: true,
    value: function Receiver_newSlot(slotNameString, slotValue) {
      this.setSlot(slotNameString, slotValue);
      const setterName = `set${slotNameString[0].toUpperCase()}${slotNameString.slice(
        1,
      )}`;
      Object.defineProperty(this, setterName, {
        enumerable: true,
        value: function (value) {
          this.updateSlot(slotNameString, value);
          return this;
        },
      });
      return slotValue;
    },
  },
  hasSlot: {
    enumerable: true,
    value: function Receiver_hasSlot(slotNameString) {
      return slotNameString in this;
    },
  },
  slotNames: {
    enumerable: true,
    value: function Receiver_slotNames() {
      return Object.getOwnPropertyNames(this);
    },
  },
  getSlot: {
    enumerable: true,
    value: function Receiver_getSlot(slotNameString) {
      return this[slotNameString] ?? null;
    },
  },
  evalArg: {
    enumerable: true,
    value: asMethod(function Receiver_evalArg() {
      const arg = arguments[0];
      if (!arg) {
        throw new Error(`argument required for 'evalArg'`);
      }
      return arg.doInContext(this.call.sender);
    }),
  },
  evalArgAndReturnSelf: {
    enumerable: true,
    value: asMethod(function Receiver_evalArgAndReturnSelf() {
      this.evalArg.apply(this, arguments);
      return this.self;
    }),
  },
  evalArgAndReturnNil: {
    enumerable: true,
    value: asMethod(function Receiver_evalArgAndReturnNil() {
      this.evalArg.apply(this, arguments);
      return null;
    }),
  },
  doMessage: {
    enumerable: true,
    value: function Receiver_doMessage(msg) {
      return msg.doInContext(this);
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
      // const sender = this.sender;
      const method = asMethod(...argNames, function () {
        // TODO this should really be like this?
        // return bodyMsg.doInContext(this, sender);
        return bodyMsg.doInContext(this);
      });
      Object.defineProperty(method, 'asString', {
        enumerable: true,
        value: function Method_asString() {
          return `method(${[...argNames, bodyMsg.asString()].join(', ')})`;
        },
      });
      return method;
    }),
  },
  nil: {
    enumerable: true,
    get() {
      return null;
    },
  },
  do: {
    enumerable: true,
    value: asMethod(function Receiver_do() {
      if (arguments.length !== 1) {
        throw new Error(`method 'do' expects 1 argument`);
      }
      arguments[0].doInContext(this.self);
      return this.self;
    }),
  },
  '': {
    enumerable: false,
    get() {
      // TODO this should be `evalArgs`?
      return this;
    },
  },
  '==': {
    enumerable: true,
    value: function Receiver_equals(other) {
      return this === other;
    },
  },
  if: {
    enumerable: true,
    value: asMethod('condition', function Receiver_if(condition) {
      if (condition) {
        const then = arguments[1];
        return then ? then.doInContext(this.self, this.call.sender) : true;
      }
      const otherwise = arguments[2];
      return otherwise
        ? otherwise.doInContext(this.self, this.call.sender)
        : false;
    }),
  },
  for: {
    enumerable: true,
    value: asMethod(function Receiver_for() {
      if (arguments.length !== 4) {
        throw new Error(`method 'for' expects 4 arguments`);
      }
      const iName =
        typeof arguments[0].name === 'symbol' &&
        Symbol.keyFor(arguments[0].name);
      if (!iName) {
        throw new Error(`argument 0 to method 'for' must be a symbol`);
      }
      const start = arguments[1].doInContext(this.self);
      if (typeof start !== 'number') {
        throw new Error(`argument 1 to method 'for' must be a Number`);
      }
      const end = arguments[2].doInContext(this.self);
      if (typeof end !== 'number') {
        throw new Error(`argument 2 to method 'for' must be a Number`);
      }
      const body = arguments[3];
      const locals = Object.create(this);
      for (let i = start; i <= end; i++) {
        locals[iName] = i;
        body.doInContext(this.call.sender, locals);
      }
      return end;
    }),
  },
};

const CallDescriptors = {
  // TODO call descriptors
};

const NilDescriptors = {
  forward: {
    enumerable: false,
    value: () => null,
  },
};

const NumDescriptors = {
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
  '>': {
    enumerable: true,
    value: function Number_greaterThan(b = null) {
      if (typeof b !== 'number') {
        throw new Error(`argument 0 to method '>' must be a Number. Got ${b}.`);
      }
      return this > b;
    },
  },
  '>=': {
    enumerable: true,
    value: function Number_greaterThanOrEqual(b = null) {
      if (typeof b !== 'number') {
        throw new Error(
          `argument 0 to method '>=' must be a Number. Got ${b}.`,
        );
      }
      return this >= b;
    },
  },
  '<': {
    enumerable: true,
    value: function Number_lessThan(b = null) {
      if (typeof b !== 'number') {
        throw new Error(`argument 0 to method '<' must be a Number. Got ${b}.`);
      }
      return this < b;
    },
  },
  '<=': {
    enumerable: true,
    value: function Number_lessThanOrEqual(b = null) {
      if (typeof b !== 'number') {
        throw new Error(
          `argument 0 to method '<=' must be a Number. Got ${b}.`,
        );
      }
      return this <= b;
    },
  },
  asCharacter: {
    enumerable: true,
    value: function Number_asCharacter() {
      return String.fromCharCode(this);
    },
  },
};

const StrDescriptors = {
  '..': {
    enumerable: true,
    value: function String_concat(b) {
      if (typeof b !== 'string') {
        throw new Error(`argument 0 to method '..' must be a String.`);
      }
      return this + b;
    },
  },
  at: {
    enumerable: true,
    value: function String_at(index) {
      if (typeof index !== 'number') {
        throw new Error(
          `argument 0 to method 'at' must be a Number. Got ${b}.`,
        );
      }
      return this.charCodeAt(index);
    },
  },
  /**
   * Returns a list containing the sub-string of the receiver divided by the
   * given arguments. If no arguments are given the string is split on white
   * space.
   */
  split: {
    enumerable: true,
    value: function String_split() {
      const splitBy = Array.from(arguments);
      if (!splitBy.every((arg) => typeof arg === 'string')) {
        throw new Error(`arguments to method 'split' must be Strings.`);
      }
      const splitRegExp = new RegExp(splitBy.join('|'), 'gu');
      return this.split(splitRegExp);
    },
  },
  find: {
    enumerable: true,
    value: function List_find(item) {
      const result = this.indexOf(item);
      if (result === -1) {
        return null;
      }
      return result;
    },
  },
  slice: {
    enumerable: true,
    value: function String_slice(start, end) {
      if (typeof start !== 'number') {
        throw new Error(
          `argument 0 to method 'slice' must be a Number. Got ${start}.`,
        );
      }
      if (typeof end === 'undefined') {
        return this.slice(start);
      }
      if (typeof end !== 'number') {
        throw new Error(
          `argument 1 to method 'slice' must be a Number. Got ${end}.`,
        );
      }
      return this.slice(start, end);
    },
  },
};

const BoolDescriptors = {
  // TODO use Receiver.evalArgAndReturnSelf instead?
  ifTrue: {
    enumerable: true,
    value: asMethod(function Boolean_ifTrue() {
      if (this.self === true) {
        return ReceiverDescriptors.evalArgAndReturnSelf.value.apply(
          this,
          arguments,
        );
      }
      return this.self;
    }),
  },
  ifFalse: {
    enumerable: true,
    value: asMethod(function Boolean_ifFalse() {
      if (this.self === false) {
        return ReceiverDescriptors.evalArgAndReturnSelf.value.apply(
          this,
          arguments,
        );
      }
      return this.self;
    }),
  },
  then: {
    enumerable: true,
    value: asMethod(function Boolean_then() {
      if (this.self === true) {
        return ReceiverDescriptors.evalArgAndReturnNil.value.apply(
          this,
          arguments,
        );
      }
      return this.self;
    }),
  },
  else: {
    enumerable: true,
    value: asMethod(function Boolean_else() {
      if (this.self === false) {
        return ReceiverDescriptors.evalArgAndReturnNil.value.apply(
          this,
          arguments,
        );
      }
      return this.self;
    }),
  },
  elseif: {
    enumerable: true,
    value: asMethod('condition', function Boolean_elseif(condition) {
      if (this.self === false) {
        return condition;
      }
      return this.self;
    }),
  },
  not: {
    enumerable: true,
    value: function Boolean_not() {
      return !this;
    },
  },
};

const ListDescriptors = {
  jsArray: {
    enumerable: true,
    get() {
      return [];
    },
  },
  append: {
    enumerable: true,
    value: function List_append(...items) {
      this.jsArray.push(...items);
      return this;
    },
  },
  size: {
    enumerable: true,
    value: function List_size() {
      return this.jsArray.length;
    },
  },
  asString: {
    enumerable: true,
    value: function List_print() {
      return `list(${this.jsArray.join(', ')})`;
    },
  },
  sortInPlace: {
    enumerable: true,
    value: function List_sortInPlace() {
      this.jsArray.sort((a, b) => a - b);
      return this;
    },
  },
  sort: {
    enumerable: true,
    value: function List_sort() {
      const copy = this.clone();
      copy.sortInPlace.apply(copy, arguments);
      return copy;
    },
  },
  first: {
    enumerable: true,
    value: function List_first() {
      return this.jsArray[0] ?? null;
    },
  },
  last: {
    enumerable: true,
    value: function List_last() {
      return this.jsArray[this.jsArray.length - 1] ?? null;
    },
  },
  at: {
    enumerable: true,
    value: function List_at(index) {
      if (typeof index !== 'number') {
        throw new Error(
          `argument 0 to method 'at' must be a Number. Got ${index}.`,
        );
      }
      return this.jsArray[index] ?? null;
    },
  },
  remove: {
    enumerable: true,
    value: function List_remove(item) {
      const index = this.jsArray.indexOf(item);
      if (index >= 0) {
        this.jsArray.splice(index, 1);
      }
      return this;
    },
  },
  atPut: {
    enumerable: true,
    value: function List_atPut(index, item) {
      if (typeof index !== 'number') {
        throw new Error(
          `argument 0 to method 'atPut' must be a Number. Got ${index}.`,
        );
      }
      this.jsArray[index] = item;
      return this;
    },
  },
  select: {
    enumerable: true,
    value: asMethod(function List_select() {
      const resultList = this.self.clone();
      withIndexItemBody(this, arguments, (cb) => {
        resultList.jsArray = this.self.jsArray.filter(cb);
      });
      return resultList;
    }),
  },
  /**
   * Returns the first value for which the message evaluates to a non-nil.
   */
  detect: {
    enumerable: true,
    value: asMethod(function List_detect() {
      return (
        withIndexItemBody(this, arguments, (cb) => {
          for (let i = 0, l = this.self.jsArray.length; i < l; i++) {
            const item = this.self.jsArray[i];
            const result = cb(item);
            if (result !== null) {
              return item;
            }
          }
        }) ?? null
      );
    }),
  },
  mapInPlace: {
    enumerable: true,
    value: asMethod(function List_map() {
      withIndexItemBody(this, arguments, (cb) => {
        this.self.jsArray = this.self.jsArray.map(cb);
      });
      return this.self;
    }),
  },
  map: {
    enumerable: true,
    value: asMethod(function List_map() {
      const copy = this.self.clone();
      // TODO this is `call delegateToMethod(self clone, "mapInPlace")`
      const newLocals = Object.create(this, {
        self: {
          enumerable: true,
          value: copy,
        },
      });
      copy.mapInPlace.apply(newLocals, arguments);
      return copy;
    }),
  },
  foreach: {
    enumerable: true,
    value: asMethod(function List_foreach() {
      withIndexItemBody(this, arguments, (cb) => {
        for (let i = 0, l = this.self.jsArray.length; i < l; i++) {
          cb(this.self.jsArray[i], i);
        }
      });
      return this.self;
    }),
  },
  join: {
    enumerable: true,
    value: function List_join(separator) {
      return this.jsArray.join(separator);
    },
  },
};

const MapDescriptors = {
  jsMap: {
    enumerable: true,
    get() {
      return new Map();
    },
  },
  atPut: {
    enumerable: true,
    value: function Map_atPut(key, value) {
      this.jsMap.set(key, value);
      return this;
    },
  },
  hasKey: {
    enumerable: true,
    value: function Map_hasKey(key) {
      return this.jsMap.has(key);
    },
  },
  hasValue: {
    enumerable: true,
    value: function Map_hasValue(value) {
      for (const v of this.jsMap.values()) {
        if (v === value) {
          return true;
        }
      }
      return false;
    },
  },
  at: {
    enumerable: true,
    value: function Map_at(key) {
      return this.jsMap.get(key) ?? null;
    },
  },
  keys: {
    enumerable: true,
    value: function Map_keys() {
      return [...this.jsMap.keys()];
    },
  },
  foreach: {
    enumerable: true,
    value: asMethod(function Map_foreach() {
      withIndexItemBody(this, arguments, (cb) => {
        for (const [key, value] of this.self.jsMap.entries()) {
          cb(value, key);
        }
      });
      return this.self;
    }),
  },
};

const ExceptionDescriptors = {
  raise: {
    enumerable: true,
    value: function Exception_raise(error) {
      throw new Error(error);
    },
  },
  catch: {
    enumerable: true,
    value: asMethod('exceptionProto', function Exception_catch(exceptionProto) {
      if (this.self instanceof exceptionProto) {
        const body = arguments[1];
        if (body) {
          body.doInContext(this.call.sender);
        }
      }
      return this.self;
    }),
  },
};

const TimeDescriptors = {
  timeout: {
    enumerable: true,
    value: asMethod('delay', function Time_timeout(delay) {
      if (typeof delay !== 'number' || delay < 0) {
        throw new Error(
          `argument 0 to method 'timeout' must be a positive Number.`,
        );
      }
      const body = arguments[1];
      const sender = this.call.sender;
      return new Promise((resolve) => {
        setTimeout(() => {
          if (body) {
            resolve(body.doInContext(sender));
          }
          resolve(null);
        }, delay);
      });
    }),
  },
};

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
  asString: {
    enumerable: true,
    value: function Message_asString() {
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
          str += JSON.stringify(msg.name);
        } else if (typeof msg.name === 'number') {
          str += msg.name + ' ';
        } else {
          str += Symbol.keyFor(msg.name);
          if (msg.arguments.length > 0) {
            inArgs = true;
            str += '(';
            str += msg.arguments
              .map((arg) => arg.asString().trimEnd())
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
  argAt: {
    enumerable: true,
    value: function Message_argAt(index) {
      return this.arguments[index] ?? null;
    },
  },
};

const FutureDescriptors = {
  forward: {
    enumerable: true,
    value: asMethod(function Future_forward() {
      const msg = this.call.message;
      const sender = this.call.sender;
      this.self.promise = this.self.promise.then((value) => {
        return msg.doInContext(value, sender);
      });
      return this.self;
    }),
  },
};

//
// Utils
//

function createReceiver(prefix, proto, descriptors) {
  const Obj = Object.create(proto, {
    [IdSymbol]: idDescriptor(prefix),
    [Symbol.hasInstance]: {
      value: (inst) => hasProto(Obj, inst),
    },
    ...(descriptors || {}),
  });
  return Obj;
}

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

function idDescriptor(prefix, configurable = false) {
  const id =
    prefix +
    '_0x' +
    Math.abs(Date.now() ^ (Math.random() * 10000000000000)).toString(32);
  return {
    enumerable: false,
    configurable,
    get() {
      return id;
    },
  };
}

/**
 * Utility function for methods that take a block with an optional index
 * and item argument. For example `map`:
 *     list(1, 2, 3) map(<2)                // only body
 *     list(1, 2, 3) map(x, x<2)            // item and body
 *     list(1, 2, 3) map(i, x, x<2 && i>0)  // index, item, and body
 * @param {{call: Call, self: Receiver}} locals
 * @param {Message[]} args
 * @param {(cb: (item: any) => any) => any} fn
 */
function withIndexItemBody(locals, args, fn) {
  const argCount = args.length;
  const sender = locals.call.sender;
  let body;
  if (argCount === 0) {
    throw new Error(`missing argument`);
  }
  if (argCount === 1) {
    body = args[0];
    return fn((item) => body.doInContext(item));
  } else if (argCount === 2) {
    const eName =
      typeof args[0].name === 'symbol' ? Symbol.keyFor(args[0].name) : null;
    if (!eName) {
      throw new Error(`argument 0 must be a Symbol`);
    }
    body = args[1];
    // Do not use `clone` as it could recurse via `init` call
    const context = locals; // const context = Object.create(locals);
    return fn((item) => {
      context.setSlot(eName, item);
      return body.doInContext(sender, context);
    });
  } else if (argCount === 3) {
    const iName =
      typeof args[0].name === 'symbol' ? Symbol.keyFor(args[0].name) : null;
    if (!iName) {
      throw new Error(`argument 0 must be a Symbol`);
    }
    const eName =
      typeof args[1].name === 'symbol' ? Symbol.keyFor(args[1].name) : null;
    if (!eName) {
      throw new Error(`argument 1 must be a Symbol`);
    }
    body = args[2];
    const context = locals; // const context = Object.create(locals);
    return fn((item, index) => {
      context.setSlot(iName, index);
      context.setSlot(eName, item);
      return body.doInContext(sender, context);
    });
  } else {
    throw new Error(`too many arguments`);
  }
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
      // A syntethic message name to be used in the case of infix resolution
      groupEndSymbol: Symbol('groupEnd'),
      // In the case an exp starts with a parathesis, we need to terminate infix
      // resolution early. We save those messages here because they need to be
      // removed from the final message anyway.
      groupEndMessages: [],
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
        if (assignName.arguments.length > 0) {
          throw new Error(`Assign name must not have arguments`);
        }
        if (!assignValue) {
          throw new Error(`Missing assign value`);
        }
        if (assignEnd) {
          assignEnd.previous?.setNext(null);
        }
        const assignLiteral = env.messageLiteral(
          Symbol.keyFor(assignName.name),
        );
        assignName.setName(Symbol.for(assignMethod));
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
          argEnd.name !== MessageTerminatorSymbol &&
          argEnd.name !== infixes.groupEndSymbol &&
          !infixesNotYetResolved.includes(Symbol.keyFor(argEnd.name))
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

    // Remove group end messages
    for (const groupEndMsg of infixes.groupEndMessages) {
      groupEndMsg.previous.setNext(groupEndMsg.next);
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

    // Having an `(exp)` only happens if it's the first message after a
    // terminator (or the first message of the program), because other
    // parenthesis are handled by the `Arguments` rule.
    // So here we insert a temporary message to be able to resolve
    // the infixes.
    const msg = exp.toMessage(env, assigns, infixes);
    const groupEndMsg = env.messageLiteral(infixes.groupEndSymbol);
    infixes.groupEndMessages.push(groupEndMsg);
    msg.last.setNext(groupEndMsg);
    return msg;
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
        if (typeof infixPriority !== 'undefined') {
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
  Arguments(_1, args, t, _2) {
    const { env, assigns, infixes } = this.args;

    const msgs = args
      .asIteration()
      .children.map((exps) => exps.toMessage(env, assigns, infixes));
    if (t.sourceString && msgs.length > 0) {
      msgs[msgs.length - 1].last.setNext(env.messageTerminator());
    }
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
