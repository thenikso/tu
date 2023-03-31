// @ts-check

/** @typedef {import('./types.js').Receiver} Receiver */
/** @typedef {import('./types.js').Environment} Environment */
/** @typedef {import('./types.js').Method} Method */
/** @typedef {import('./types.js').Locals<import('./types.js').Receiver<any, any>, Receiver>} Locals */

import { dValue, dGet, lock } from './util.js';

/**
 * Installs the core receiver in the environment.
 * @example
 * import { createEnvironment } from './environment.js';
 * import { coreReceiverInstaller } from './receiver.js';
 *
 * const environment = createEnvironment
 *  .use(coreReceiverInstaller());
 * const env = environment();
 * @returns {import('./types.js').EnvironmentPlugin}
 */
export function coreReceiverInstaller() {
  const rootReceiver = createRootReceiver();
  const Core = createReceiver([rootReceiver], {
    type: dValue('Core'),
  });
  const Lobby = createReceiver([Core], {
    type: dValue('Lobby'),
  });

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
      return Lobby;
    },
    secure() {
      lock(rootReceiver);
      lock(Core);
      lock(Lobby);
    },
  };
}

/**
 * If assigned to a `function` it indicates that it is a `method` rather
 * than a plain javascript function.
 * A method function should have as many arguments as it intends to evaluate
 * before it's called. Other arguments will be passed as `Message`s resolver
 * functions.
 */
const MethodArgsSymbol = Symbol('MethodArgs');

/** @type {PropertyDescriptorMap} */
const RECEIVER_DESCRIPTORS = {
  type: dValue('Receiver'),
  self: dGet(function () {
    return this;
  }),
  proto: dGet(function () {
    return Object.getPrototypeOf(this.self);
  }),
  protos: dGet(function () {
    return this.self.proto ? [this.self.proto] : [];
  }),
  hasProto: dValue(
    /**
     * @this {Locals}
     * @param {Receiver} newProto
     * @returns {boolean}
     */
    function Receiver_hasProto(newProto) {
      const protos = this.self.protos;
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
     * @this {Locals}
     * @param {Receiver} newProto
     * @returns {Receiver}
     * @this {Receiver}
     */
    function Receiver_appendProto(newProto) {
      Object.setPrototypeOf(this.self, createProtos(this.self.proto, newProto));
      return this.self;
    },
  ),
  prependProto: dValue(
    /**
     * @this {Locals}
     * @param {Receiver} newProto
     * @returns {Receiver}
     */
    function Receiver_prependProto(newProto) {
      Object.setPrototypeOf(this.self, createProtos(newProto, this.self.proto));
      return this.self;
    },
  ),
  clone: dValue(
    /**
     * @this {Locals}
     * @returns {Receiver}
     */
    function Receiver_clone() {
      const obj = Object.create(this.self, {
        type: {
          value: this.self.type,
          configurable: true,
        },
      });
      obj.init?.();
      return obj;
    },
  ),
  updateSlot: dValue(
    /**
     * @this {Locals}
     * @template T
     * @param {string} slotNameString
     * @param {T} slotValue
     * @returns {T}
     */
    function Receiver_updateSlot(slotNameString, slotValue) {
      if (!(slotNameString in this.self)) {
        throw new Error(
          `Slot ${slotNameString} not found. Must define slot using := operator before updating.`,
        );
      }
      this[slotNameString] = slotValue ?? null;
      return slotValue;
    },
  ),
  setSlot: dValue(
    /**
     * @this {Locals}
     * @template T
     * @param {string} slotNameString
     * @param {T} slotValue
     * @returns {T}
     */
    function Receiver_setSlot(slotNameString, slotValue) {
      this.self[slotNameString] = slotValue ?? null;
      // If the slotValue has a configurable `type`, it means it's just been
      // cloned and we can change it's `type` to match the slot name
      // if it starts with a capital letter
      if (
        slotValue &&
        slotNameString[0] === slotNameString[0].toUpperCase() &&
        typeof slotValue === 'object' &&
        Object.getOwnPropertyDescriptor(slotValue, 'type')?.configurable
      ) {
        Object.defineProperty(slotValue, 'type', {
          value: slotNameString,
        });
      }
      return slotValue;
    },
  ),
  newSlot: dValue(
    /**
     * @this {Locals}
     * @template T
     * @param {string} slotNameString
     * @param {T} slotValue
     * @returns {Receiver}
     */
    function Receiver_newSlot(slotNameString, slotValue) {
      this.self.setSlot(slotNameString, slotValue);
      const setterName = `set${slotNameString[0].toUpperCase()}${slotNameString.slice(
        1,
      )}`;
      Object.defineProperty(this.self, setterName, {
        enumerable: true,
        /**
         * @this {Locals}
         * @param {any} value
         * @returns {Receiver}
         */
        value: function (value) {
          this.self.updateSlot(slotNameString, value);
          return this.self;
        },
      });
      return this.self;
    },
  ),
  method: dValue(
    method(
      [],
      /**
       * @this {Locals}
       * @param  {...any} args
       * @returns {Method}
       */
      function Receiver_method(...args) {
        const body = args.pop();
        // TODO find a way to get args containing message names instead of
        // functions or resolved values like `message(['...?args', '?body'], ...)`
        const argNames = this.call.message.arguments
          ?.slice(0, args.length)
          .map((msg, i) => {
            if (
              msg.isLiteral ||
              msg.isTerminal ||
              !(msg.next?.isTerminal ?? true)
            ) {
              throw new Error(`Expected symbol for argument ${i}`);
            }
            return msg.name;
          });
        const m = method(argNames, body);
        return m;
      },
    ),
  ),
  // do: {
  //   value: method(
  //     function (fn) {
  //       fn.call(this.self);
  //       return this.self;
  //     },
  //     [],
  //     Receiver_do_compile,
  //   ),
  // },
  // print: {
  //   value: function () {
  //     console.log(this.asString ? this.asString() : this);
  //   },
  // },
  // write: {
  //   value: function (...str) {
  //     console.log(...str);
  //   },
  // },
  // list: {
  //   value: function (...items) {
  //     return List.clone().append(...items);
  //   },
  // },
};

/**
 * Create a new root {@link Receiver} which can be used as the
 * root object of a new {@link Environment}.
 * @returns {import('./types.js').Receiver<[], {}>} The new root receiver.
 */
export function createRootReceiver() {
  const Receiver = Object.create(null, {
    ...RECEIVER_DESCRIPTORS,
    Receiver: dGet(function Receiver_Receiver() {
      return Receiver;
    }),
  });
  return Receiver;
}

/**
 * Creates a new {@link Receiver} with the given prototype and
 * property descriptors.
 * @type {import('./types.js').createReceiver}
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
    return this.self;
  }

  /**
   * Append a new prototype to the list of prototypes.
   * @param {Receiver} newProto The new prototype.
   * @returns {Receiver} Returns this.
   */
  function appendProto(newProto) {
    _protos.push(newProto);
    return this.self;
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

/**
 * Agument the given function with method argument names that are used when
 * interpreting the function as a method.
 * The interpreter (in {@link Message}) will resolve the named arguments as
 * usual and pass them to the function as well as in the locals context.
 * Other arguments exceeding the number of named arguments will be passed
 * as functions that will resolve the corresponding argument when called.
 * @example
 * const m = method(['a'], function (a, b) {
 *   return a + b.call(this);
 * });
 * @param {string[]} argNames The names of the arguments.
 * @param {Method} fn The function to augment.
 * @returns {Method} The augmented function.
 */
export function method(argNames, fn) {
  Object.defineProperty(fn, MethodArgsSymbol, dValue(argNames));
  return fn;
}
