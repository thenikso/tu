// @ts-check

import { dValue } from './util.js';

/**
 * @returns {import('./types').EnvironmentPlugin}
 */
export function literalsInstaller() {
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

      const Bool = Object.create(Lobby.Receiver, BOOL_DESCRIPTORS);
      Object.defineProperty(Lobby.Core, 'Bool', dValue(Bool));

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
    value: function Number_plus(other) {
      return this.value + other;
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
};

const NIL_DESCRIPTORS = {
  forward: {
    value: () => null,
  },
};
