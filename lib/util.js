// @ts-check

/** @typedef {import('./types').Receiver} Receiver */

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
