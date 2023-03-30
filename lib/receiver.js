// @ts-check

/** @typedef {import('./types').Receiver} Receiver */
/** @typedef {import('./types').Environment} Environment */

import { dValue, dGet } from './util.js';

/**
 * Create a new root {@link Receiver} which can be used as the
 * root object of a new {@link Environment}.
 * @returns {Receiver} The new root receiver.
 */
export function createRootReceiver() {
  const Receiver = Object.create(null, {
    self: dGet(function Receiver_self() {
      return this;
    }),
    Receiver: dGet(function Receiver_Receiver() {
      return Receiver;
    }),
    proto: dGet(function () {
      return Object.getPrototypeOf(this);
    }),
    protos: dGet(function () {
      return this.proto ? [this.proto] : [];
    }),
    hasProto: dValue(
      /**
       * @param {Receiver} proto
       * @returns {boolean}
       */
      function Receiver_hasProto(proto) {
        const protos = this.protos;
        let hasProto = protos.includes(proto);
        if (!hasProto) {
          for (const p of protos) {
            if (p.hasProto(proto)) {
              hasProto = true;
              break;
            }
          }
        }
        return hasProto;
      },
    ),
    // clone: {
    //   value: method(
    //     function () {
    //       const obj = Object.create(this);
    //       obj.init?.();
    //       return obj;
    //     },
    //     [],
    //     Receiver_clone_compile,
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
    // str: {
    //   value: function (value) {
    //     const str = Object.create(Str);
    //     str[JsValueSymbol] = value;
    //     return str;
    //   },
    // },
    // num: {
    //   value: function (value) {
    //     const num = Object.create(Num);
    //     num[JsValueSymbol] = value;
    //     return num;
    //   },
    // },
    // bool: {
    //   value: function (value) {
    //     const bool = Object.create(Bool);
    //     bool[JsValueSymbol] = value;
    //     return bool;
    //   },
    // },
    // setSlot: {
    //   value: method(
    //     function (slotNameString, slotValue) {
    //       this.self[slotNameString] = slotValue ?? null;
    //       return slotValue;
    //     },
    //     ['slotNameString', 'slotValue'],
    //     Receiver_setSlot_compile,
    //   ),
    // },
    // updateSlot: {
    //   value: method(
    //     function (slotNameString, slotValue) {
    //       if (!(slotNameString in this.self)) {
    //         throw new Error(`Slot ${slotNameString} does not exist`);
    //       }
    //       this.self[slotNameString] = slotValue ?? null;
    //       return this.self;
    //     },
    //     ['slotNameString', 'slotValue'],
    //     Receiver_setSlot_compile,
    //   ),
    // },
    // newSlot: {
    //   value: function (slotNameString, slotValue) {
    //     this.setSlot(slotNameString, slotValue);
    //     const setterName = `set${slotNameString[0].toUpperCase()}${slotNameString.slice(
    //       1,
    //     )}`;
    //     Object.defineProperty(this.self, setterName, {
    //       enumerable: true,
    //       value: function (value) {
    //         this.self.updateSlot(slotNameString, value);
    //         return this.self;
    //       },
    //     });
    //     return slotValue;
    //   },
    // },
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
    // list: {
    //   value: function (...items) {
    //     return List.clone().append(...items);
    //   },
    // },
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
      // Special case for the ProtosSymbol.
      switch (prop) {
        case 'proto':
          return _protos[0];
        case 'protos':
          return _protos;
        case 'appendProto':
          return appendProto;
        default:
          break;
      }
      if (prop in target) {
        return target[prop];
      }
      for (let i = 0, l = _protos.length; i < l; i++) {
        if (prop in protos[i]) {
          return protos[i][prop];
        }
      }
      return undefined;
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
