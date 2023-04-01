// @ts-check

/** @typedef {import('./types').Receiver} Receiver */
/** @typedef {import('./types').Environment} Environment */
/** @typedef {import('./types').Locals<import('./types').Receiver<any, any>, Receiver>} Locals */

import { dValue, dGet, lock } from './util.js';

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
 * @returns {import('./types').EnvironmentPlugin}
 */
export function receiverInstaller() {
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
      const rootReceiver = createRootReceiver();
      const Core = createReceiver(rootReceiver, {
        type: dValue('Core'),
        Core: {
          get() {
            return Core;
          },
        },
      });
      const Lobby = createReceiver(Core, {
        type: dValue('Lobby'),
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
 * @returns {import('./types').Receiver<[], {}>} The new root receiver.
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
