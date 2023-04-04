// @ts-check

import { dValue } from './util.js';

const MethodArgsSymbol = Symbol('MethodArgs');
const MethodApplySymbol = Symbol('MethodApply');

/**
 * Utility function that can be used by installers before `Receiver.method` is
 * available. It can define a "method" wich is a javascript function that will
 * be called with appropriate parameters by `Message.doInContext`.
 * - Regular javascript function:
 *   All parameters are resolved and passed to the function.
 * - Function with `method` decorator:
 *   All parameters defined in the method argumnets array are resolved and
 *   passed to the function. The rest of the parameters are passed as functions
 *   that will resolve the remaining parameter when called (aka: lazy parameters).
 *
 * This utility function does not construct the locals object. It should therefore
 * only be used by installers before `Receiver.method` is available.
 * @param {...any} args - The arguments to the method, a variable number of
 * parameters names followed by the function.
 * @returns {Function} The method function.
 */
export function method(...args) {
  const methodArgs = args.slice(0, -1);
  const methodArgsLen = methodArgs.length;
  const methodFn = args.slice(-1)[0];
  function Method_apply(target, msg, sender, Lobby) {
    // If `this` is a literal value (e.g. a number), we "proxy" locals to the
    // appropriate Lobby object.
    let localsTarget = target;
    const thisType = typeof target;
    if (thisType === 'number') {
      localsTarget = Lobby.Num;
    } else if (thisType === 'string') {
      localsTarget = Lobby.Str;
    } else if (thisType === 'boolean') {
      localsTarget = Lobby.Bool;
    } else if (Array.isArray(target)) {
      localsTarget = Lobby.List;
    } else if (target instanceof Map) {
      localsTarget = Lobby.Map;
    } else if (target === null) {
      localsTarget = Lobby.Nil;
    }

    // Create a `Locals` object to use as `this` for the method function
    const locals = Object.create(localsTarget, {
      self: {
        value: target,
      },
      call: {
        value: Object.create(Lobby.Call, {
          target: {
            value: target,
          },
          activated: {
            value: methodFn,
          },
          message: {
            value: msg,
          },
          sender: {
            value: sender,
          },
        }),
      },
    });
    if (methodArgsLen > 0) {
      let argLocals = sender;
      let argSender = argLocals.self;
      if (!argSender) {
        argSender = argLocals;
        argLocals = undefined;
      }
      for (let i = 0; i < methodArgsLen; i++) {
        locals[methodArgs[i]] =
          msg.arguments[i]?.doInContext(argSender, argLocals) ?? null;
      }
    }

    const result = this.call(target, locals);

    // Safety check for method return
    if (result === locals) {
      throw new Error(
        `Method '${msg.name}' returned 'this' which is not allowed, use 'this.self' instead`,
      );
      // return result.self;
    }

    return result;
  }
  Object.defineProperties(methodFn, {
    [MethodArgsSymbol]: {
      value: methodArgs,
    },
    [MethodApplySymbol]: {
      value: Method_apply,
    },
  });
  return methodFn;
}

/**
 * Defines:
 * - `Core.Call` - the root Call for locals definitions
 * - `Core.Message` - the root Message for message definitions
 * - `Receiver.message` - a method to generate a new Message
 * - `Receiver.method` - a method to generate a new method
 * @returns {import('./types').EnvironmentPlugin}
 */
export function messageInstaller() {
  return {
    install,
  };
}

function install(Lobby) {
  // TODO check that all Lobby requirements are satisfied

  //
  // Install `Call`
  //

  const Call = Object.create(Lobby.Receiver, CALL_DESCRIPTORS);

  // Install as `Core.Call`
  Object.defineProperty(Lobby.Core, 'Call', dValue(Call));

  //
  // Install `Message`
  //

  /**
   * @type {import('./types').Message}
   */
  const Message = Object.create(Lobby.Receiver, {
    ...MESSAGE_DESCRIPTORS,
    doInContext: {
      value: function (context, locals) {
        return evalMessage(Lobby, this, context, locals);
      },
    },
  });

  // Install as `Core.Message`
  Object.defineProperty(Lobby.Core, 'Message', dValue(Message));

  // Install as `Receiver.message`
  Object.defineProperty(
    Lobby.Receiver,
    'message',
    dValue(
      method(
        /**
         * @param {import('./types').Locals=} locals
         * @returns {import('./types').Message}
         */
        function Receiver_message(locals) {
          if (locals?.call.message.arguments.length) {
            return locals.call.message.arguments[0];
          }
          // Not using `Message.clone()` or we get an infinite loop with
          // `Receiver.clone` creating a new `init` message to send.
          const newMsg = Object.create(Message);
          newMsg.init();
          return newMsg;
        },
      ),
    ),
  );

  // Install `Receiver.doMessage`
  Object.defineProperty(
    Lobby.Receiver,
    'doMessage',
    dValue(function Receiver_doMessage(msg) {
      return msg.doInContext(this);
    }),
  );

  //
  // Install `method`
  //

  /**
   * This function will be used when:
   *
   *     a := method(x, x + 1)
   *
   * Or it can be called via javascript:
   *
   *     const a = Lobby.method('x', function (x) {
   *       return x + 1;
   *     });
   *
   * And creates a function with a special property `MethodArgsSymbol` that
   * contains the names of the arguments.
   * This property can be used by the `Message.doInContext` method to
   * properly transform the arguments values when calling this function.
   * Specifically, when the method is called like so:
   *
   *    a(1, 2, 3)
   *
   * The `Message.doInContext` method will resolve the first argument (`x`)
   * to the value `1`, and the remaining arguments to functions that, when
   * called, will return the values `2` and `3` (basically lazy evaluating
   * them).
   *
   * In fact, when called, a method function will have `this` set to an
   * object deriving from the target of the message, and with the following
   * properties:
   * - `self`: the target of the message
   * - `call`: a Call object with the following properties:
   *   - `target`: the target of the message (same as `self`)
   *   - `activated`: the method function
   *   - `message`: the message that originated the call
   *   - `sender`: the sender Receiver of the message
   * @param  {import('./types').Locals} locals
   * @returns
   */
  function Receiver_method(locals) {
    const args = locals.call.message.arguments.slice();
    const bodyMsg = args.pop();
    const argNames = args.map((argMsg) => {
      if (
        argMsg.isLiteral ||
        argMsg.isTerminator ||
        typeof argMsg.name !== 'string'
      ) {
        throw new Error('method() requires all arguments to be symbols.');
      }
      return argMsg.name;
    });

    /**
     * A method can be called as a regular function from javascript.
     * The `Message.doInContext` method will call it with the same way
     * but adding the message as the last argument.
     * This wrapper will create a `Locals` object to use as `this` for
     * the method function body.
     */
    function methodFn(methodLocals) {
      const result = bodyMsg?.doInContext(this, methodLocals);
      return result;
    }
    method(...argNames, methodFn);
    Object.defineProperties(methodFn, {
      toString: {
        value: () => `method(${[...argNames, bodyMsg?.toString()].join(', ')})`,
      },
    });
    return methodFn;
  }

  // Install as `Receiver.method`
  Object.defineProperty(
    Lobby.Receiver,
    'method',
    dValue(method(Receiver_method)),
  );

  return Lobby;
}

/**
 * Evaluates a message in a context.
 * @param {import('./types').Receiver<any, any>} Lobby The Lobby object
 * @param {import('./types').Message} firstMsg The first message to evaluate
 * @param {import('./types').Receiver} context The context to evaluate the message in
 * @param {import('./types').Locals=} locals The locals to use when evaluating the message
 * @returns {any} The result of evaluating the message
 */
function evalMessage(Lobby, firstMsg, context, locals) {
  /** @type {import('./types').Message | null} */
  let msg = firstMsg;
  const sender = locals ?? context;

  let cursor = null;
  /** @type {import('./types').Receiver | string | number | boolean | null} */
  let target = context;
  let targetType;

  let slotName;
  let slot;

  do {
    // Terminal resets the context and proceeds to the next message
    if (msg.isTerminator) {
      cursor = null;
      target = context;
      msg = msg.next;
      continue;
    }

    // Literal values are wrapped in a Receiver
    if (msg.isLiteral) {
      cursor = msg.name;
      target = cursor;
      msg = msg.next;
      continue;
    }

    // Find slot for symbol messages
    slotName = msg.name;
    slot = null;
    targetType = typeof target;
    if (targetType === 'number') {
      slot = Lobby.Num[slotName];
    } else if (targetType === 'string') {
      slot = Lobby.Str[slotName];
    } else if (targetType === 'boolean') {
      slot = Lobby.Bool[slotName];
    } else if (Array.isArray(target)) {
      slot = Lobby.List[slotName];
      targetType = 'List';
    } else if (target instanceof Map) {
      slot = Lobby.Map[slotName];
      targetType = 'Map';
    } else if (target === null) {
      slot = Lobby.Nil[slotName];
      targetType = 'Nil';
    } else {
      slot = target[slotName];
    }

    if (typeof slot === 'undefined') {
      // Search locals
      if (locals) {
        slot = locals[slotName];
      }
      // Search for own `forward` slot
      if (
        typeof slot === 'undefined' &&
        Object.hasOwnProperty.call(target, 'forward')
      ) {
        // @ts-ignore-next-line
        slot = target.forward;
      }
      // Search in Lobby
      if (typeof slot === 'undefined') {
        slot = Lobby[slotName];
      }
      // Slot not found
      if (typeof slot === 'undefined') {
        throw new Error(
          `${
            // @ts-ignore-next-line
            target?.type ?? targetType
          } does not respond to '${slotName}'`,
        );
      }
    }

    // Advance cursor to slot
    cursor = slot;

    // Execute cursor if function
    if (typeof cursor === 'function') {
      if (MethodApplySymbol in cursor) {
        cursor = cursor[MethodApplySymbol](target, msg, sender, Lobby);
      } else {
        // Eval args
        const localArgs = [];
        // By default arguments are evaluated if present in the method
        // `arguments` list (or the list is not present at all).
        for (let i = 0, l = msg.arguments?.length; i < l; i++) {
          localArgs[i] = evalMessage(
            Lobby,
            msg.arguments[i],
            sender.self ?? sender,
            locals,
          );
        }

        cursor = cursor.apply(target, localArgs);
      }
    }

    // Next message
    target = cursor;
    msg = msg.next;
  } while (msg);

  // Return cursor
  return cursor;
}

function returnNull() {
  return null;
}

const CALL_DESCRIPTORS = {
  type: {
    value: 'Call',
  },
  evalArgAt: {
    value: function Call_evalArgAt(index) {
      // TODO better way to check for sender locals
      let locals = this.sender;
      let sender = locals.self;
      if (!sender) {
        sender = locals;
        locals = null;
      }
      return this.message.arguments[index]?.doInContext(sender, locals) ?? null;
    },
  },
};

const MESSAGE_DESCRIPTORS = {
  init: {
    value: function Message_init() {
      let _previous = null;
      Object.defineProperties(this, {
        previous: {
          get() {
            return _previous?.deref() ?? null;
          },
          set(value) {
            // @ts-ignore-next-line
            _previous = value && new WeakRef(value);
          },
        },
        setPrevious: {
          value: function (previous) {
            this.previous = previous;
            return this;
          },
        },
        setNext: {
          value: function (next) {
            this.next = next;
            if (next) {
              next.setPrevious(this);
            }
            return this;
          },
        },
      });
      return this;
    },
  },
  type: {
    value: 'Message',
  },
  name: {
    writable: true,
    value: '',
  },
  setName: {
    value: function (name) {
      this.name = name;
      return this;
    },
  },
  arguments: {
    writable: true,
    value: [],
  },
  setArguments: {
    value: function (args) {
      this.arguments = args;
      return this;
    },
  },
  next: {
    writable: true,
    value: null,
  },
  isLiteral: {
    writable: true,
    value: false,
  },
  isTerminator: {
    writable: true,
    value: false,
  },
  last: {
    get() {
      let last = this;
      while (last.next) {
        last = last.next;
      }
      return last;
    },
  },
  toString: {
    value: function Message_toString() {
      let str = '';
      let msg = this;
      let inArgs = false;
      do {
        if (msg.isTerminator) {
          str = str.trimEnd();
          str += ';';
          str += inArgs ? ' ' : '\n';
        } else if (msg.isLiteral) {
          str += JSON.stringify(msg.name) + ' ';
        } else {
          str += msg.name;
          if (msg.arguments?.length > 0) {
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
  argAt: {
    value: function Message_argAt(index) {
      return this.arguments[index] ?? null;
    },
  },
};
