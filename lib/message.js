// @ts-check

import { dValue } from './util.js';

const MethodArgsSymbol = Symbol('MethodArgs');

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
  const fn = args.slice(-1)[0];
  fn[MethodArgsSymbol] = methodArgs;
  return fn;
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

  function Receiver_message() {
    // TODO consider arguments
    const msg = Message.clone();
    return msg;
  }

  // Install as `Receiver.message`
  Object.defineProperty(Lobby.Receiver, 'message', dValue(Receiver_message));

  //
  // Install `method`
  //

  // TODO get all literals or default to Receiver
  // const Num = Lobby.Num || Lobby.Receiver;

  /**
   * This function will be called when calling:
   *
   *     a := method(x, x + 1)
   *
   * Or it can be called via javascript:
   *
   *     const a = Lobby.method('x', function (x) {
   *       return x + 1;
   *     });
   *
   * And creates a function with a special property MethodArgsSymbol that
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
   * In addition, a special `arguments` value `'!'` is added to the end of
   * the list. This is used by the `Message.doInContext` method to know
   * whether to send the Message that originated the call to the method
   * function which, in turn, can use it to prepare the locals.
   *
   * In fact, when called, a method function will have `this` set to an
   * object deriving from the target of the message, and with the following
   * properties:
   * - `self`: the target of the message
   * - `call`: a Call object with the following properties:
   *   - `target`: the target of the message (same as `self`)
   *   - `activated`: the method function
   *   - `message`: the message that originated the call
   * @param  {...any} args
   * @returns
   */
  function Receiver_method(...args) {
    const bodyFn = args.pop();
    if (typeof bodyFn !== 'function') {
      throw new Error('method() requires a function body.');
    }

    const argNames = args.slice();
    if (!argNames.every((arg) => typeof arg === 'string')) {
      throw new Error('method() requires all arguments to be symbols.');
    }

    /**
     * A method can be called as a regular function from javascript.
     * The `Message.doInContext` method will call it with the same way
     * but adding the message as the last argument.
     * This wrapper will create a `Locals` object to use as `this` for
     * the method function body.
     */
    function methodFn(...argValues) {
      // If the last argument is a Message, it means that the method
      // function was called from the `Message.doInContext` method.
      // In this case, we remove the last argument and use it as the
      // message to prepare the locals.
      let msg = argValues[argValues.length - 1];
      if (
        argValues.length > argNames.length &&
        Message &&
        msg?.proto === Message
      ) {
        argValues.pop();
      } else {
        msg = null;
      }
      // If `this` is a literal value (e.g. a number), we "proxy" locals to the
      // appropriate Lobby object.
      let localsTarget = this;
      const thisType = typeof this;
      if (thisType === 'number') {
        localsTarget = Lobby.Num;
      } else if (thisType === 'string') {
        localsTarget = Lobby.Str;
      } else if (thisType === 'boolean') {
        localsTarget = Lobby.Bool;
      } else if (Array.isArray(this)) {
        localsTarget = Lobby.List;
      } else if (this === null) {
        localsTarget = Lobby.Nil;
      }
      // TODO List, Map, Set
      // Create a `Locals` object to use as `this` for the method function
      const locals = Object.create(localsTarget, {
        self: {
          value: this,
        },
        call: {
          value: Object.create(Call, {
            target: {
              value: this,
            },
            activated: {
              value: methodFn,
            },
            message: {
              value: msg,
            },
          }),
        },
      });
      for (let i = 0; i < argNames.length; i++) {
        locals[argNames[i]] = argValues[i] ?? null;
      }
      const result = bodyFn.apply(locals, argValues);
      // Safety check for method return
      if (result === locals) {
        throw new Error(
          `Method '${msg.name}' returned 'this' which is not allowed, use 'this.self' instead`,
        );
        // return result.self;
      }
      return result;
    }
    Object.defineProperty(methodFn, MethodArgsSymbol, {
      value: [
        ...argNames,
        // With a '!' argument, the `evalMessage` function should send the
        // message to the method function.
        '!',
      ],
    });
    return methodFn;
  }

  /**
   * We attach a function `arguments` property to the method function.
   * This should be used by the `evalMessage` function to compute the
   * argument values to pass to the method function.
   * In this case we want to pass all the arguments except the last one
   * (the function body) as strings, and the last as a function.
   */
  function method_arguments(methodMsg, evalMessage) {
    const argNames = methodMsg.arguments.slice(0, -1).map((argMsg, i) => {
      if (
        argMsg.isLiteral ||
        argMsg.isTerminal ||
        !(argMsg.next?.isTerminal ?? true)
      ) {
        throw new Error(`Expected symbol for argument ${i}`);
      }
      return argMsg.name;
    });
    const methodBody = methodMsg.arguments[methodMsg.arguments.length - 1];
    const methodFn = function () {
      return evalMessage(Lobby, methodBody, this);
    };
    return [...argNames, methodFn];
  }

  // Install as `method.arguments`
  Object.defineProperty(Receiver_method, MethodArgsSymbol, {
    value: method_arguments,
  });

  // Install as `Receiver.method`
  Object.defineProperty(Lobby.Receiver, 'method', dValue(Receiver_method));

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
  const sender = locals?.self ?? context;

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
    } else if (target === null) {
      slot = Lobby.Nil[slotName];
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
            target?.type ?? (Array.isArray(target) ? 'List' : typeof target)
          } does not respond to '${slotName}'`,
        );
      }
    }

    // Advance cursor to slot
    cursor = slot;

    // Execute cursor if function
    if (typeof cursor === 'function') {
      // Eval args
      let localArgs;
      const methodArgs = cursor[MethodArgsSymbol];
      if (typeof methodArgs === 'function') {
        // methodArgs can be a function to process arguments in a custom way
        localArgs = methodArgs(msg, evalMessage);
      } else {
        localArgs = [];
        const methodArgsCount = methodArgs?.length;
        let i = 0;
        let l = methodArgsCount ?? msg.arguments?.length;
        if (typeof l !== 'undefined') {
          // By default arguments are evaluated if present in the method
          // `arguments` list (or the list is not present at all).
          for (; i < l; i++) {
            if (methodArgs?.[i].startsWith('!')) {
              // If the method argument starts with a '!' character, the
              // argument is not evaluated.
              localArgs[i] = methodArgs[i] === '!' ? msg : msg.arguments[i];
              continue;
            }
            localArgs[i] = evalMessage(Lobby, msg.arguments[i], sender, locals);
          }

          // Othwerwise, "lazy" arguments are provided
          const argContext = sender;
          for (l = msg.arguments?.length; i < l; i++) {
            const bodyMsg = msg.arguments[i];
            if (bodyMsg) {
              localArgs[i] = function (argLocals) {
                // @ts-ignore-next-line
                return evalMessage(Lobby, bodyMsg, this ?? argContext, argLocals);
              };
              localArgs[i].message = bodyMsg;
            } else {
              localArgs[i] = returnNull;
            }
          }
        }
      }

      // Eval function
      cursor = cursor.apply(target, localArgs);
    }

    // Next message
    target = cursor;
    msg = msg.next;
  } while (msg);

  // Return cursor
  switch (cursor?.proto) {
    case Lobby.Str:
    case Lobby.Num:
    case Lobby.Bool:
      return cursor.value;
    case Lobby.Nil:
      return null;
    // TODO Lobby.List
  }
  return cursor;
}

function returnNull() {
  return null;
}

const CALL_DESCRIPTORS = {
  type: {
    value: 'Call',
  },
};

const MESSAGE_DESCRIPTORS = {
  init: {
    value: function Message_ini() {
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
};
