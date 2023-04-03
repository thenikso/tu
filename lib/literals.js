// @ts-check

import { dValue } from './util.js';

/**
 * Installs:
 * - `Core.Str` - the receiver responding to `string` messages
 * - `Core.Num` - the receiver responding to `number` messages
 * - `Core.Bool` - the receiver responding to `boolean` messages
 * - `Core.Nil` - the receiver responding to `null` messages
 * @param {(...arg: any[]) => Function} method
 * @returns {import('./types').EnvironmentPlugin}
 */
export function literalsInstaller(method) {
  return {
    install(Lobby) {
      if (!Lobby.Receiver) {
        throw new Error(
          'Literals can only be installed in environments with a core Receiver. Lobby.Receiver must be defined.',
        );
      }

      const Str = Object.create(Lobby.Receiver, STR_DESCRIPTORS);
      Object.defineProperty(Lobby.Core, 'Str', dValue(Str));

      const Num = Object.create(Lobby.Receiver, NUM_DESCRIPTORS);
      Object.defineProperty(Lobby.Core, 'Num', dValue(Num));

      method(Bool_ifTrue);
      method(Bool_ifFalse);
      method(Bool_elseif);
      const Bool = Object.create(Lobby.Receiver, {
        ...BOOL_DESCRIPTORS,
        ifTrue: {
          value: Bool_ifTrue,
        },
        ifFalse: {
          value: Bool_ifFalse,
        },
        then: {
          value: Bool_ifTrue,
        },
        else: {
          value: Bool_ifFalse,
        },
        elseif: {
          value: Bool_elseif,
        },
      });
      Object.defineProperty(Lobby.Core, 'Bool', dValue(Bool));

      method('condition', Receiver_if);
      Object.defineProperty(Lobby.Receiver, 'if', dValue(Receiver_if));

      const Nil = Object.create(Lobby.Receiver, NIL_DESCRIPTORS);
      Object.defineProperty(Lobby.Core, 'Nil', dValue(Nil));

      return Lobby;
    },
  };
}

const STR_DESCRIPTORS = {
  value: {
    writable: true,
    value: '',
  },
  type: {
    value: 'Str',
  },
  toString: {
    value: function () {
      return this.value;
    },
  },
};

const NUM_DESCRIPTORS = {
  value: {
    writable: true,
    value: 0,
  },
  type: {
    value: 'Num',
  },
  toString: {
    value: function () {
      return String(this.value);
    },
  },
  '+': {
    /**
     * @this number
     * @param {number} other
     * @returns number
     */
    value: function Number_plus(other) {
      return this + other;
    },
  },
  '*': {
    /**
     * @this number
     * @param {number} other
     * @returns number
     */
    value: function Number_times(other) {
      return this * other;
    },
  },
  sqrt: {
    /**
     * @this {number}
     * @returns {number}
     */
    value: function Number_sqrt() {
      return Math.sqrt(this);
    },
  },
};

const BOOL_DESCRIPTORS = {
  value: {
    writable: true,
    value: false,
  },
  type: {
    value: 'Bool',
  },
  toString: {
    value: function () {
      return String(this.value);
    },
  },
  not: {
    /**
     * @this {boolean}
     * @returns {boolean}
     */
    value: function Bool_not() {
      return !this;
    },
  },
};

/**
 * @this {boolean}
 * @returns {boolean}
 */
function Bool_ifTrue() {
  const then = arguments[0];
  if (this === true) {
    then?.();
  }
  return this;
}

/**
 * @this {boolean}
 * @returns {boolean}
 */
function Bool_ifFalse() {
  const then = arguments[0];
  if (this === false) {
    then?.();
  }
  return this;
}

/**
 * @this {boolean}
 * @returns {boolean}
 */
function Bool_elseif() {
  const condition = arguments[0];
  if (this === false) {
    return condition?.() ?? false;
  }
  return this;
}

/**
 * @this {import('./types').Receiver}
 * @param {boolean} condition
 * @returns {boolean}
 */
function Receiver_if(condition) {
  if (condition) {
    const then = arguments[1];
    return then ? then() : true;
  }
  const otherwise = arguments[2];
  return otherwise ? otherwise() : false;
}

const NIL_DESCRIPTORS = {
  forward: {
    value: () => null,
  },
};
