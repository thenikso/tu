// @ts-check

import {
  dValue,
  dType,
  STOP_STATUS_NORMAL,
  STOP_STATUS_RETURN,
  STOP_STATUS_BREAK,
  STOP_STATUS_CONTINUE,
} from './util.js';

const MethodSymbol = Symbol('Method');

export class EvalError extends Error {
  /**
   * @param {string} message
   * @param {import('./types').Message} startMessage
   */
  constructor(message, startMessage) {
    super(message);
    this.startMessage = startMessage;
  }
}

/**
 * Utility function to define a "method" wich is a javascript function that will
 * be called with appropriate parameters by `Message.doInContext`.
 * - Regular javascript function:
 *   All parameters are resolved and passed to the function.
 * - Function with `method` decorator:
 *   The function will receive a single parameters `locals` which is an object
 *   with the following properties:
 *   - `self`: the receiver on which the method was called (same as `this`)
 *   - `call`: the `Call` object that triggered the method call
 * @example
 * method('a', function MyMethod(locals) {
 *   // get the first argument
 *   const a = locals.a;
 *   // evaluates the second argument in the context of the call the sender
 *   const b = locals.call.evalArgAt(1);
 *   return this;
 * })
 * @param {...any} args - The arguments to the method, a variable number of
 * parameters names followed by the `function(locals)`.
 * @returns {Function} The method function.
 */
export function method(...args) {
  const methodFn = args.pop();
  if (typeof methodFn !== 'function') {
    throw new TypeError('method must be a function');
  }
  const methodArgs = args;
  Object.defineProperty(methodFn, MethodSymbol, {
    value: methodArgs,
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
      return evalMessage(Lobby, msg, this);
    }),
  );

  //
  // Block
  //

  const Block = Object.create(Lobby.Receiver, {
    ...dType('Block'),
    argumentNames: {
      value: [],
      writable: true,
    },
    message: {
      value: null,
      writable: true,
    },
    scope: {
      value: null,
      writable: true,
    },
    performOn: {
      value: function Block_performOn(aReceiver, optionalLocals) {
        if (!this.message) {
          throw new Error('Block has no message');
        }
        return evalMessage(
          Lobby,
          this.message,
          aReceiver,
          optionalLocals,
          true,
        );
      },
    },
    call: {
      value: function Block_call(...args) {
        if (this.argumentNames.length > args.length) {
          throw new Error(
            `Not enough arguments to method "${this.toString()}"`,
          );
        }
        // TODO better construction of `locals` to include `self` and `call`
        // like in `Method_apply`
        const locals = Object.create(null);
        for (const argName of this.argumentNames) {
          locals[argName] = args.shift();
        }
        // TODO have `Lobby.Envine.target` to be the current target
        return this.performOn(Lobby, locals);
      },
    },
    toString: {
      value: function Block_asString() {
        return `${this.scope ? 'block' : 'method'}(${[
          ...this.argumentNames,
          this.message?.toString(),
        ].join(', ')})`;
      },
    },
    asJsFunction: {
      value: function Block_asJsFunction() {
        return (...args) => {
          this.call(...args);
        };
      },
    },
  });

  // Install as `Core.Block`
  Object.defineProperty(Lobby.Core, 'Block', dValue(Block));

  function block(argumentNames, message, scope) {
    this.argumentNames = argumentNames;
    this.message = message;
    this.scope = scope || null;
  }
  block.prototype = Block;

  //
  // Install `method`
  //

  /**
   * This function will be used when:
   *
   *     a := method(x, x + 1)
   *
   * And creates a function with a special property `MethodSymbol` that
   * will be properly interpreted by `evalMessage`.
   * This activation is used by the `Message.doInContext` method to
   * properly transform the arguments values when calling the method.
   * Specifically, when the method is called like so:
   *
   *    a(1, 2, 3)
   *
   * `Message.doInContext` will forward target, message and sender to
   * `evalMessage` which will then create a `Locals` object and call
   * the method function with it.
   *
   * When called, a method javascript function will have `locals` set to an
   * object deriving from the target of the message, and with the following
   * properties:
   * - `self`: the target of the message
   * - `call`: a Call object with the following properties:
   *   - `target`: the target of the message (same as `self`)
   *   - `activated`: the method function
   *   - `message`: the message that originated the call
   *   - `sender`: the sender Receiver or Locals object
   * - any named argument of the method
   * @param  {import('./types').Locals} locals
   * @returns
   */
  function Receiver_method(locals) {
    const args = locals.call.message.arguments.slice();
    const bodyMsg = args.pop();
    const argNames = args.map((argMsg) => {
      if (
        argMsg.isLiteral ||
        argMsg.isEndOfLine ||
        typeof argMsg.name !== 'string'
      ) {
        throw new Error('method() requires all arguments to be symbols.');
      }
      return argMsg.name;
    });

    return new block(argNames, bodyMsg, null);
  }

  // Install as `Receiver.method`
  Object.defineProperty(
    Lobby.Receiver,
    'method',
    dValue(method(Receiver_method)),
  );

  function Receiver_block(locals) {
    const args = locals.call.message.arguments.slice();
    const bodyMsg = args.pop();
    const argNames = args.map((argMsg) => {
      if (
        argMsg.isLiteral ||
        argMsg.isEndOfLine ||
        typeof argMsg.name !== 'string'
      ) {
        throw new Error('method() requires all arguments to be symbols.');
      }
      return argMsg.name;
    });

    return new block(argNames, bodyMsg, locals);
  }

  // Install as `Receiver.block`
  Object.defineProperty(
    Lobby.Receiver,
    'block',
    dValue(method(Receiver_block)),
  );

  //
  // Install `super`
  //

  // TODO super will require a way to chagne the `target` for
  // prop resolution but not for `this` reference in `evalMessage`

  // function Receiver_super(locals) {
  //   const bodyMsg = locals.call.message.arguments[0];
  //   if (!bodyMsg) {
  //     throw new Error('super() requires an argument.');
  //   }
  //   const fn = this.proto[bodyMsg.name];
  //   debugger;
  //   return fn.performOn(this);
  //   // return evalMessage(Lobby, bodyMsg, this, this.proto);
  // }

  // Object.defineProperty(
  //   Lobby.Receiver,
  //   'super',
  //   dValue(method(Receiver_super)),
  // );

  //
  // Install `Call`
  //

  const Call = Object.create(null, {
    ...dType('Call'),
    evalArgAt: {
      value: function Call_evalArgAt(index) {
        // TODO better way to check for sender locals
        let locals = this.sender;
        let sender = locals.self;
        if (!sender) {
          sender = locals;
          locals = null;
        }
        return evalMessage(
          Lobby,
          this.message.arguments[index],
          sender,
          locals,
        );
      },
    },
  });

  // Install as `Core.Call`
  Object.defineProperty(Lobby.Core, 'Call', dValue(Call));

  // For performance reason, call and method locals are constructed as follows:

  function call(target, activated, message, sender) {
    this.target = target;
    this.activated = activated;
    this.message = message;
    this.sender = sender;
  }
  call.prototype = Call;

  function makeBlockLocals(
    target,
    proto,
    cursor,
    msg,
    sender,
    methodArgNames,
  ) {
    let methodLocals;
    if (proto?.stopStatus >= 0) {
      methodLocals = {
        self: target,
        call: new call(target, cursor, msg, sender),
      };
    } else {
      let stopStatusValue = STOP_STATUS_NORMAL;
      methodLocals = {
        self: target,
        call: new call(target, cursor, msg, sender),
        get stopStatus() {
          return stopStatusValue;
        },
        resetStopStatus() {
          stopStatusValue = STOP_STATUS_NORMAL;
        },
        return(value) {
          stopStatusValue = STOP_STATUS_RETURN;
          return value;
        },
        break() {
          stopStatusValue = STOP_STATUS_BREAK;
        },
        continue() {
          stopStatusValue = STOP_STATUS_CONTINUE;
        },
      };
    }
    for (const n of methodArgNames) {
      methodLocals[n] = null;
    }
    // TODO make more performant with `new locals`
    Object.setPrototypeOf(methodLocals, proto || null);
    return methodLocals;
  }

  const BLOCK_NONE = 0;
  const BLOCK_OBJECT = 1;
  const BLOCK_FUNCTION = 2;

  /**
   * Evaluates a message in a context.
   * @param {import('./types').Receiver<any, any>} Lobby The Lobby object
   * @param {import('./types').Message} firstMsg The first message to evaluate
   * @param {import('./types').Receiver} context The context to evaluate the message in
   * @param {import('./types').Locals=} locals The locals to use when evaluating the message
   * @param {boolean=} passStops Whether to use `locals` as the prototype
   * of new method calls to relay the stop status. This is used by `method`.
   * TODO understand better what `passStops` does and name it better
   * @returns {any} The result of evaluating the message
   */
  function evalMessage(Lobby, firstMsg, context, locals, passStops) {
    /** @type {import('./types').Message | null} */
    let msg = firstMsg;
    const sender = locals ?? context;

    let cursor = null;
    /** @type {import('./types').Receiver | string | number | boolean | null} */
    let target = context;

    let blockType = BLOCK_NONE;
    let blockArgNames = undefined;
    let blockArgValues = undefined;
    let blockArgCount = undefined;
    let blockLocals = undefined;
    let blockLocalsProto = undefined;

    while (msg) {
      // Terminal resets the context and proceeds to the next message
      if (msg.isEndOfLine) {
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

      // Advance cursor to slot
      blockLocalsProto = getLocalsTarget(Lobby, target);
      cursor = findSlot(Lobby, msg, blockLocalsProto, locals);

      if (Object.getPrototypeOf(cursor) === Block) {
        blockType = BLOCK_OBJECT;
        blockArgNames = cursor.argumentNames || [];
      } else if (typeof cursor === 'function') {
        blockType = BLOCK_FUNCTION;
        blockArgNames = cursor[MethodSymbol];
      }

      // Execute cursor if block
      if (blockType > BLOCK_NONE) {
        blockArgValues = msg.arguments.slice();
        if (blockArgNames) {
          blockArgCount = blockArgNames.length;
          if (msg.arguments.length < blockArgCount) {
            throw new EvalError(
              `Not enough arguments for method "${msg.name}". Expected ${blockArgCount}, got ${msg.arguments.length}.`,
              msg,
            );
          }
          blockLocals = makeBlockLocals(
            target,
            // TODO restore `localsTarget` and pass instead of `null` here?
            passStops ? locals : null,
            cursor,
            msg,
            sender,
            blockArgNames,
          );
        } else {
          blockArgCount = blockArgValues.length;
          blockLocals = undefined;
        }

        // By default arguments are evaluated if present in the method
        // `arguments` list.
        let hasAsyncArgs = false;
        let argLocals = sender.self ?? sender;
        for (let i = 0; i < blockArgCount; i++) {
          const argValue = evalMessage(
            Lobby,
            blockArgValues[i],
            argLocals,
            locals,
          );
          blockArgValues[i] = argValue;
          if (blockLocals) {
            blockLocals[blockArgNames[i]] = argValue;
          }
          if (argValue instanceof Promise) {
            hasAsyncArgs = true;
          }
        }

        if (hasAsyncArgs) {
          return Promise.all(blockArgValues).then(async (args) => {
            if (blockArgNames) {
              for (let i = 0; i < blockArgCount; i++) {
                blockLocals[blockArgNames[i]] = args[i];
              }
              cursor = cursor.call(target, blockLocals);
            } else {
              cursor = cursor.apply(target, args);
            }
            return continueEvalMessageAsync(
              Lobby,
              msg,
              context,
              locals,
              passStops ?? false,
              cursor,
            );
          });
        }

        if (blockType === BLOCK_OBJECT) {
          cursor = cursor.performOn(target, blockLocals);
        } else if (blockLocals) {
          cursor = cursor.call(target, blockLocals);
        } else {
          cursor = cursor.apply(target, blockArgValues);
        }

        blockType = BLOCK_NONE;
      }

      if (cursor instanceof Promise) {
        return continueEvalMessageAsync(
          Lobby,
          msg,
          context,
          locals,
          passStops ?? false,
          cursor,
        );
      }

      // return statement
      if (locals && locals.stopStatus > 0) {
        return cursor;
      }

      // Next message
      target = cursor;
      msg = msg.next;
    }

    // Return cursor
    return cursor;
  }

  /**
   * Async evaluates a message in a context.
   * This evaluator is automatically switched to from `evalMessage` when a promise
   * is returned from a method.
   * @param {import('./types').Receiver<any, any>} Lobby The Lobby object
   * @param {import('./types').Message | null} firstMsg The first message to evaluate
   * @param {import('./types').Receiver} context The context to evaluate the message in
   * @param {any} locals The locals to use when evaluating the message
   * @param {boolean} passStops
   * @param {any} initCursor
   * @returns {Promise<any>} The result of evaluating the message
   */
  async function continueEvalMessageAsync(
    Lobby,
    firstMsg,
    context,
    locals,
    passStops,
    initCursor,
  ) {
    /** @type {import('./types').Message | null} */
    let msg = firstMsg;
    const sender = locals ?? context;

    let cursor = initCursor;
    /** @type {import('./types').Receiver | string | number | boolean | null} */
    let target = null;

    let blockType = BLOCK_NONE;
    let blockArgNames = undefined;
    let blockArgValues = undefined;
    let blockArgCount = undefined;
    let blockLocals = undefined;
    let blockLocalsProto = undefined;

    // Continue from `evalMessage`

    // return statement
    if (locals && locals.stopStatus > 0) {
      return cursor;
    }

    // Next message
    target = await cursor;
    msg = msg?.next ?? null;

    while (msg) {
      // Terminal resets the context and proceeds to the next message
      if (msg.isEndOfLine) {
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

      // Advance cursor to slot
      blockLocalsProto = getLocalsTarget(Lobby, target);
      cursor = findSlot(Lobby, msg, blockLocalsProto, locals);

      if (Object.getPrototypeOf(cursor) === Block) {
        blockType = BLOCK_OBJECT;
        blockArgNames = cursor.argumentNames;
      } else if (typeof cursor === 'function') {
        blockType = BLOCK_FUNCTION;
        blockArgNames = cursor[MethodSymbol];
      }

      // Execute cursor if block
      if (blockType > BLOCK_NONE) {
        blockArgValues = msg.arguments.slice();
        if (blockArgNames) {
          blockArgCount = blockArgNames.length;
          if (msg.arguments.length < blockArgCount) {
            throw new EvalError(
              `Not enough arguments for method "${msg.name}". Expected ${blockArgCount}, got ${msg.arguments.length}.`,
              msg,
            );
          }
          blockLocals = makeBlockLocals(
            target,
            // TODO restore `localsTarget` and pass instead of `null` here?
            passStops ? locals : null,
            cursor,
            msg,
            sender,
            blockArgNames,
          );
        } else {
          blockArgCount = blockArgValues.length;
          blockLocals = undefined;
        }

        // By default arguments are evaluated if present in the method
        // `arguments` list.
        let hasAsyncArgs = false;
        for (let i = 0; i < blockArgCount; i++) {
          const argValue = evalMessage(
            Lobby,
            blockArgValues[i],
            sender.self ?? sender,
            locals,
          );
          blockArgValues[i] = argValue;
          if (blockLocals) {
            blockLocals[blockArgNames[i]] = argValue;
          }
          if (argValue instanceof Promise) {
            hasAsyncArgs = true;
          }
        }

        if (hasAsyncArgs) {
          blockArgValues = await Promise.all(blockArgValues);
        }

        if (blockLocals) {
          for (let i = 0; i < blockArgCount; i++) {
            blockLocals[blockArgNames[i]] = blockArgCount[i];
          }
        }

        if (blockType === BLOCK_OBJECT) {
          cursor = await cursor.performOn(target, blockLocals);
        } else if (blockLocals) {
          cursor = await cursor.call(target, blockLocals);
        } else {
          cursor = await cursor.apply(target, blockArgValues);
        }

        blockType = BLOCK_NONE;
      }

      // return statement
      if (locals && locals.stopStatus > 0) {
        return cursor;
      }

      // Next message
      target = cursor;
      msg = msg.next;
    }

    // Return cursor
    return cursor;
  }

  return Lobby;
}

function getLocalsTarget(Lobby, target) {
  /** @type {string} */
  let targetType = typeof target;
  if (targetType === 'number') {
    return Lobby.Num;
  } else if (targetType === 'string') {
    return Lobby.Str;
  } else if (targetType === 'boolean') {
    return Lobby.Bool;
  } else if (Array.isArray(target)) {
    return Lobby.List;
  } else if (target instanceof Map) {
    return Lobby.Map;
  } else if (target === null) {
    return Lobby.Nil;
  }
  return target;
}

function findSlot(Lobby, msg, target, locals) {
  const slotName = msg.name;

  // Search in locals first
  let slot = locals?.[slotName];

  // Search in target
  if (typeof slot === 'undefined') {
    slot = target[slotName];
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
    let targetType = target?.type;
    if (target === Lobby.List) {
      targetType = 'List';
    } else if (target === Lobby.Map) {
      targetType = 'Map';
    } else if (target === Lobby.Nil) {
      targetType = 'Nil';
    }
    throw new EvalError(`${targetType} does not respond to '${slotName}'`, msg);
  }

  return slot;
}

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
  isEndOfLine: {
    writable: true,
    value: false,
  },
  characterNumber: {
    writable: true,
    value: 0,
  },
  lineNumber: {
    writable: true,
    value: 0,
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
        if (msg.isEndOfLine) {
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
