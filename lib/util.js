// @ts-check

/** @typedef {import('./types').Receiver<any, any>} Receiver */

/**
 * Creates a property descriptor for an unlocked {@link Receiver}
 * with the given value.
 * @template T
 * @param {T} value The value of the property.
 * @returns {PropertyDescriptor} The property descriptor.
 */
export function dValue(value) {
  return {
    value,
    writable: true,
    enumerable: false,
    configurable: true,
  };
}

/**
 * Creates a property descriptor for an unlocked {@link Receiver}
 * with the given getter.
 * @template T
 * @param {() => T} getter The getter of the property.
 * @returns {PropertyDescriptor} The property descriptor.
 */
export function dGet(getter) {
  return {
    get: getter,
    set: undefined,
    enumerable: false,
    configurable: true,
  };
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
