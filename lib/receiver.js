// @ts-check

/** @typedef {import('./types').Receiver} Receiver */
/** @typedef {import('./types').Environment} Environment */
/** @typedef {import('./types').Locals} Locals */

import {
  dValue,
  dGet,
  dType,
  TypeSymbol,
  lock,
  STOP_STATUS_RETURN,
  STOP_STATUS_BREAK,
  STOP_STATUS_CONTINUE,
} from './util.js';

/**
 * Installs the core Receiver in the environment.
 *
 * Defines:
 * - `Receiver` - the root Receiver
 * - `Core` - the collection of all core Receivers
 * - `Lobby` - the access point for all root messages
 * @example
 * import { createEnvironment } from './environment.js';
 * import { coreReceiverInstaller } from './receiver.js';
 *
 * const environment = createEnvironment
 *  .use(coreReceiverInstaller());
 * const env = environment();
 * @param {(...arg: any[]) => Function} method
 * @returns {import('./types').EnvironmentPlugin}
 */
export function receiverInstaller(method) {
  return {
    /**
     * @type {any}
     */
    install(nil) {
      if (nil !== null) {
        throw new Error(
          'core Receiver can only be installed in empty environments. Lobby must be null.',
        );
      }
      const rootReceiver = createRootReceiver(method);
      const Exception = createReceiver(rootReceiver, {
        ...dType('Exception'),
        raise: dValue(function Exception_raise(message) {
          throw new Error(message);
        }),
        catch: dValue(
          method(
            'exceptionProto',
            /**
             * @param {import('./types').Locals<{ exceptionProto: Object }>} locals
             */
            function Exception_catch(locals) {
              if (this.hasProto(locals.exceptionProto)) {
                let body = locals.call.evalArgAt(1);
                if (body instanceof Promise) {
                  return body.then(() => this.self);
                }
              }
              return this.self;
            },
          ),
        ),
      });
      Object.defineProperties(rootReceiver, {
        exception: dValue(function Receiver_exception(error) {
          const exception = Exception.clone();
          if (error instanceof Promise) {
            return error.then((error) => {
              exception.error = error;
              return exception;
            });
          }
          exception.error = error;
          return exception;
        }),
        try: dValue(
          method(function Receiver_try(locals) {
            try {
              const body = locals.call.evalArgAt(0);
              if (body instanceof Promise) {
                return body
                  .then(() => null)
                  .catch((error) => this.exception(error));
              }
              return null;
            } catch (error) {
              return this.exception(error);
            }
          }),
        ),
      });
      const Core = createReceiver(rootReceiver, {
        ...dType('Core'),
        Core: {
          get() {
            return Core;
          },
        },
        Receiver: dGet(function Core_Receiver() {
          return rootReceiver;
        }),
        // Alias for Receiver
        Object: dGet(function Core_Object() {
          return rootReceiver;
        }),
        Exception: dValue(Exception),
      });
      const Lobby = createReceiver(Core, {
        ...dType('Lobby'),
        Lobby: dGet(function Lobby_Lobby() {
          return Lobby;
        }),
      });

      return Lobby;
    },
    secure(Lobby) {
      lock(Lobby.Receiver);
      lock(Lobby.Core);
      lock(Lobby);
    },
  };
}

/**
 * Create a new root {@link Receiver} which can be used as the
 * root object of a new {@link Environment}.
 * @param {(...arg: any[]) => Function} method
 * @returns {import('./types').Receiver<[], {}>} The new root receiver.
 */
export function createRootReceiver(method = (x) => x) {
  const Receiver = Object.create(null, {
    ...RECEIVER_DESCRIPTORS,
    for: dValue(
      method(
        /**
         * @param {import('./types').Locals} locals
         */
        function Receiver_for(locals) {
          if (locals.call.message.arguments.length < 4) {
            throw new Error(`message 'for' requires 4 arguments`);
          }
          const iName = locals.call.message.arguments[0].name;
          if (!iName) {
            throw new Error(`message 'for' requires a name for the index`);
          }
          const startIndex = locals.call.evalArgAt(1);
          if (typeof startIndex !== 'number') {
            throw new Error(
              `message 'for' requires a number for the start index`,
            );
          }
          const endIndex = locals.call.evalArgAt(2);
          if (typeof endIndex !== 'number') {
            throw new Error(
              `message 'for' requires a number for the end index`,
            );
          }
          let step = 1;
          let bodyArgumentIndex = 3;
          if (locals.call.message.arguments.length > 4) {
            step = locals.call.evalArgAt(3);
            if (typeof step !== 'number') {
              throw new Error(`message 'for' requires a number for the step`);
            }
            bodyArgumentIndex = 4;
          }
          const newLocals = Object.create(locals, {
            [iName]: {
              value: startIndex,
              writable: true,
            },
          });
          const bodyMsg = locals.call.message.arguments[bodyArgumentIndex];
          const bodyCtx = locals.call.sender;
          let value;
          if (startIndex === endIndex) {
            return bodyMsg.doInContext(bodyCtx, newLocals);
          }
          if (startIndex < endIndex) {
            if (step <= 0) {
              throw new Error(
                `message 'for' requires a positive step when start < end`,
              );
            }
            for (let i = startIndex; i <= endIndex; i += step) {
              newLocals[iName] = i;
              value = bodyMsg.doInContext(bodyCtx, newLocals);
              if (newLocals.stopStatus === STOP_STATUS_RETURN) {
                return value;
              }
              if (newLocals.stopStatus === STOP_STATUS_BREAK) {
                newLocals.resetStopStatus();
                break;
              }
              if (newLocals.stopStatus === STOP_STATUS_CONTINUE) {
                newLocals.resetStopStatus();
                continue;
              }
            }
          } else if (startIndex > endIndex) {
            if (step >= 0) {
              throw new Error(
                `message 'for' requires a negative step when start > end`,
              );
            }
            for (let i = startIndex; i >= endIndex; i += step) {
              newLocals[iName] = i;
              value = bodyMsg.doInContext(bodyCtx, newLocals);
              if (newLocals.stopStatus === STOP_STATUS_RETURN) {
                return value;
              }
              if (newLocals.stopStatus === STOP_STATUS_BREAK) {
                newLocals.resetStopStatus();
                break;
              }
              if (newLocals.stopStatus === STOP_STATUS_CONTINUE) {
                newLocals.resetStopStatus();
                continue;
              }
            }
          }
          return value;
        },
      ),
    ),
    if: dValue(
      method(
        'condition',
        /**
         * @this {import('./types').Receiver}
         * @param {import('./types').Locals<{ condition: boolean }>} locals
         * @returns {boolean | Promise<boolean>}
         */
        function Receiver_if(locals) {
          if (locals.condition) {
            if (locals.call.message.arguments.length < 2) {
              return true;
            }
            return locals.call.evalArgAt(1);
          }
          if (locals.call.message.arguments.length < 3) {
            return false;
          }
          return locals.call.evalArgAt(2);
        },
      ),
    ),
    do: dValue(
      method(
        /**
         * @this {import('./types').Receiver}
         * @param {import('./types').Locals} locals
         * @returns {Receiver | Promise<Receiver>}
         */
        function Receiver_do(locals) {
          const bodyMsg = locals.call.message.arguments[0];
          if (bodyMsg) {
            const body = bodyMsg.doInContext(this, locals);
            if (body instanceof Promise) {
              return body.then(() => this);
            }
          }
          return this;
        },
      ),
    ),
    '-': dValue(function Receiver_minus(value) {
      return -value;
    }),
  });
  return Receiver;
}

/** @type {PropertyDescriptorMap} */
const RECEIVER_DESCRIPTORS = {
  ...dType('Receiver'),
  [Symbol.hasInstance]: dValue(function Receiver_hasInstance(value) {
    return value.hasProto?.(this);
  }),
  type: {
    get() {
      return this[TypeSymbol];
    },
  },
  proto: dGet(function () {
    return Object.getPrototypeOf(this);
  }),
  protos: dGet(function () {
    return this.proto ? [this.proto] : [];
  }),
  hasProto: dValue(
    /**
     * @param {Receiver} newProto
     * @returns {boolean}
     */
    function Receiver_hasProto(newProto) {
      const protos = this.protos;
      let hasProto = protos.includes(newProto);
      if (!hasProto) {
        for (const p of protos) {
          if (p.hasProto(newProto)) {
            hasProto = true;
            break;
          }
        }
      }
      return hasProto;
    },
  ),
  appendProto: dValue(
    /**
     * @param {Receiver} newProto
     * @returns {Receiver}
     */
    function Receiver_appendProto(newProto) {
      Object.setPrototypeOf(this, createProtos(this.proto, newProto));
      return this;
    },
  ),
  prependProto: dValue(
    /**
     * @param {Receiver} newProto
     * @returns {Receiver}
     */
    function Receiver_prependProto(newProto) {
      Object.setPrototypeOf(this, createProtos(newProto, this.proto));
      return this;
    },
  ),
  clone: dValue(
    /**
     * @returns {Receiver | Promise<Receiver>}
     */
    function Receiver_clone() {
      const obj = Object.create(this, {
        [TypeSymbol]: {
          value: this.type,
          configurable: true,
        },
      });

      if ('init' in obj) {
        const initMsg = obj.message?.();
        let init;
        if (initMsg) {
          initMsg.setName('init');
          init = initMsg.doInContext(obj);
        } else {
          init = obj.init();
        }
        if (init instanceof Promise) {
          return init.then(() => obj);
        }
      }
      return obj;
    },
  ),
  updateSlot: dValue(
    /**
     * @template T
     * @param {string} slotNameString
     * @param {T} slotValue
     * @returns {T}
     */
    function Receiver_updateSlot(slotNameString, slotValue) {
      if (!(slotNameString in this)) {
        throw new Error(
          `Slot ${slotNameString} not found. Must define slot using := operator before updating.`,
        );
      }
      // TODO enable reactivity by informing watchers when a slot is set
      this[slotNameString] = slotValue ?? null;
      return slotValue;
    },
  ),
  setSlot: dValue(
    /**
     * @template T
     * @param {string} slotNameString
     * @param {T} slotValue
     * @returns {T}
     */
    function Receiver_setSlot(slotNameString, slotValue) {
      // TODO enable reactivity by informing watchers when a slot is set
      this[slotNameString] = slotValue ?? null;
      // If the slotValue has a configurable `type`, it means it's just been
      // cloned and we can change it's `type` to match the slot name
      // if it starts with a capital letter
      if (
        slotValue &&
        slotNameString[0] === slotNameString[0].toUpperCase() &&
        typeof slotValue === 'object' &&
        Object.getOwnPropertyDescriptor(slotValue, TypeSymbol)?.configurable
      ) {
        Object.defineProperty(slotValue, TypeSymbol, {
          value: slotNameString,
        });
      }
      return slotValue;
    },
  ),
  newSlot: dValue(
    /**
     * @template T
     * @param {string} slotNameString
     * @param {T} slotValue
     * @returns {T}
     */
    function Receiver_newSlot(slotNameString, slotValue) {
      this.setSlot(slotNameString, slotValue);
      const setterName = `set${slotNameString[0].toUpperCase()}${slotNameString.slice(
        1,
      )}`;
      Object.defineProperty(this, setterName, {
        enumerable: true,
        /**
         * @param {any} value
         * @returns {Receiver}
         */
        value: function (value) {
          this.updateSlot(slotNameString, value);
          return this;
        },
      });
      return slotValue;
    },
  ),
  hasSlot: dValue(
    /**
     * @param {string} slotNameString
     * @returns {boolean}
     */
    function Receiver_hasSlot(slotNameString) {
      return slotNameString in this;
    },
  ),
  getSlot: dValue(
    /**
     * @param {string} slotNameString
     * @returns {any}
     */

    function Receiver_getSlot(slotNameString) {
      return this[slotNameString];
    },
  ),
  slotNames: dValue(
    /**
     * @this {Receiver}
     * @returns {string[]}
     */
    function Receiver_slotNames() {
      return Object.getOwnPropertyNames(this);
    },
  ),
  nil: dValue(function Receiver_nil() {
    return null;
  }),
  '==': dValue(function Receiver_equals(other) {
    return this === other;
  }),
  '!=': dValue(function Receiver_notEquals(other) {
    return this !== other;
  }),
  '>': dValue(function Receiver_greaterThan(other) {
    return this > other;
  }),
  '>=': dValue(function Receiver_greaterThanOrEqual(other) {
    return this >= other;
  }),
  '<': dValue(function Receiver_lessThan(other) {
    return this < other;
  }),
  '<=': dValue(function Receiver_lessThanOrEqual(other) {
    return this <= other;
  }),
  and: dValue(function Receiver_and(other) {
    return this && other;
  }),
  or: dValue(function Receiver_or(other) {
    return this || other;
  }),
};

/**
 * Creates a new {@link Receiver} with the given prototype and
 * property descriptors.
 * @type {import('./types').createReceiver}
 */
export function createReceiver(proto, descriptors = {}) {
  const newReceiver = Object.create(
    Array.isArray(proto) ? createProtos(...proto) : proto,
    descriptors,
  );
  return newReceiver;
}

/**
 * Creates a `Proxy` that can be used as prototype in `Object.create`
 * and will act as if the object has multiple prototypes.
 * @param  {...Receiver} protos The prototypes.
 * @returns {Receiver} The new prototype.
 */
function createProtos(...protos) {
  if (protos.length === 0) {
    throw new Error('No prototypes given');
  }

  // If there are no other prototypes, just return the first one.
  if (protos.length === 1) {
    return protos[0];
  }

  const _protos = protos.slice();

  /**
   * Prepend a new prototype to the list of prototypes.
   * @param {Receiver} newProto The new prototype.
   * @returns {Receiver} Returns this.
   */
  function prependProto(newProto) {
    _protos.unshift(newProto);
    return this;
  }

  /**
   * Append a new prototype to the list of prototypes.
   * @param {Receiver} newProto The new prototype.
   * @returns {Receiver} Returns this.
   */
  function appendProto(newProto) {
    _protos.push(newProto);
    return this;
  }

  return new Proxy(Object.create(null), {
    get(target, prop, receiver) {
      if (prop in target) {
        return target[prop];
      }
      switch (prop) {
        case 'proto':
          return _protos[0];
        case 'protos':
          return _protos;
        case 'prependProto':
          return prependProto;
        case 'appendProto':
          return appendProto;
        default:
          break;
      }
      for (let i = 0, l = _protos.length; i < l; i++) {
        if (prop in protos[i]) {
          // return protos[i][prop];
          return Reflect.get(protos[i], prop, receiver);
        }
      }
      return undefined;
    },
    has(target, prop) {
      if (prop in target) {
        return true;
      }
      for (let i = 0, l = _protos.length; i < l; i++) {
        if (prop in protos[i]) {
          return true;
        }
      }
      return false;
    },
  });
}
