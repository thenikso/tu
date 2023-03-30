// @ts-check

/** @typedef {import('./types').Receiver} Receiver */
/** @typedef {import('./types').Environment} Environment */

import { dValue, dGet } from './util.js';

/** @type {PropertyDescriptorMap} */
const RECEIVER_DESCRIPTORS = {
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
     * @this {Receiver}
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
     * @this {Receiver}
     */
    function Receiver_prependProto(newProto) {
      Object.setPrototypeOf(this, createProtos(newProto, this.proto));
      return this;
    },
  ),
  clone: dValue(function Receiver_clone() {
    const obj = Object.create(this);
    obj.init?.();
    return obj;
  }),
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
      this[slotNameString] = slotValue ?? null;
      return slotValue;
    },
  ),
  newSlot: dValue(
    /**
     * @template T
     * @param {string} slotNameString
     * @param {T} slotValue
     * @returns {Receiver}
     */
    function (slotNameString, slotValue) {
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
      return this;
    },
  ),
  // method: {
  //   value: method(
  //     function (...args) {
  //       const fn = args.pop();
  //       const argNames = this.call.message.arguments
  //         ?.slice(0, args.length)
  //         .map((msg, i) => {
  //           if (
  //             msg.isLiteral ||
  //             msg.isTerminal ||
  //             !(msg.next?.isTerminal ?? true)
  //           ) {
  //             throw new Error(`Expected symbol for argument ${i}`);
  //           }
  //           return msg.name;
  //         });
  //       const m = method(fn, argNames);
  //       return m;
  //     },
  //     [],
  //     Receiver_method_compile,
  //   ),
  // },
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
 * @returns {Receiver} The new root receiver.
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
 * @param {Receiver | Receiver[]} proto The prototype or prototypes.
 * @param {PropertyDescriptorMap} descriptors The property descriptors.
 * @returns {any} The new receiver.
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
    get(target, prop) {
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
          return protos[i][prop];
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
 * Locks a {@link Receiver} by making all current properties
 * non-configurable and non-writable.
 * @param {Receiver} receiver The receiver to lock.
 * @returns {Receiver} The locked receiver.
 */
export function lock(receiver) {
  const props = Object.getOwnPropertyDescriptors(receiver);
  for (const propName in props) {
    const prop = props[propName];
    if (prop.configurable === false) {
      continue;
    }
    Object.defineProperty(receiver, propName, {
      ...prop,
      writable: false,
      configurable: false,
    });
  }
  return receiver;
}
