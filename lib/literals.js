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
      method(Bool_ifTrue);

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
      method(Bool_ifFalse);

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

      const Nil = Object.create(Lobby.Receiver, NIL_DESCRIPTORS);
      Object.defineProperty(Lobby.Core, 'Nil', dValue(Nil));

      /**
       * @this {any[]}
       * @returns {any[]}
       */
      function List_select(...args) {
        return withItemIndexBody.call(this, args, (cb) => this.filter(cb));
      }
      method(List_select);

      /**
       * Returns the first value for which the message evaluates to a non-nil.
       * @this {any[]}
       * @returns {any[]}
       */
      function List_detect(...args) {
        return withItemIndexBody.call(this, args, (cb) => {
          for (let i = 0, l = this.length; i < l; i++) {
            const item = this[i];
            const result = cb(item, i);
            if (result !== null) {
              return item;
            }
          }
          return null;
        });
      }
      method(List_detect);

      /**
       * Maps the list items to a new list.
       * @this {any[]}
       * @returns {any[]}
       */
      function List_map(...args) {
        return withItemIndexBody.call(this, args, (cb) => this.map(cb));
      }
      method(List_map);

      /**
       * Executes a function for each element in the list. Retuns the list.
       * @this {any[]}
       * @returns {any[]}
       */
      function List_foreach(...args) {
        withItemIndexBody.call(this, args, (cb) => {
          for (let i = 0, l = this.length; i < l; i++) {
            cb(this[i], i);
          }
        });
        return this;
      }
      method(List_foreach);

      const List = Object.create(Lobby.Receiver, {
        ...LIST_DESCRIPTORS,
        select: {
          value: List_select,
        },
        detect: {
          value: List_detect,
        },
        map: {
          value: List_map,
        },
        foreach: {
          value: List_foreach,
        },
      });
      Object.defineProperty(Lobby.Core, 'List', dValue(List));
      Object.defineProperty(Lobby.Receiver, 'list', dValue(Receiver_list));

      return Lobby;
    },
  };
}

const STR_DESCRIPTORS = {
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
  '-': {
    /**
     * @this number
     * @param {number} other
     * @returns number
     */
    value: function Number_minus(other) {
      return this - other;
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
  '/': {
    /**
     * @this number
     * @param {number} other
     * @returns number
     */
    value: function Number_divide(other) {
      return this / other;
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

const NIL_DESCRIPTORS = {
  forward: {
    value: () => null,
  },
};

const LIST_DESCRIPTORS = {
  type: {
    value: 'List',
  },
  clone: {
    /**
     * @this {any[]}
     * @returns {any[]}
     */
    value: function List_clone() {
      return Array.isArray(this) ? [...this] : [];
    },
  },
  append: {
    /**
     * @this {any[]}
     * @param {...any} items
     * @returns {any[]}
     */
    value: function List_append(...items) {
      this.push(...items);
      return this;
    },
  },
  size: {
    /**
     * @this {any[]}
     * @returns {number}
     */
    value: function List_size() {
      return this.length;
    },
  },
  sortInPlace: {
    /**
     * @this {any[]}
     * @returns {any[]}
     */
    value: function List_sortInPlace() {
      this.sort((a, b) => a - b);
      return this;
    },
  },
  sort: {
    /**
     * @this {any[]}
     * @returns {any[]}
     */
    value: function List_sort() {
      const copy = this.slice();
      LIST_DESCRIPTORS.sortInPlace.value.call(copy);
      return copy;
    },
  },
  first: {
    /**
     * @this {any[]}
     * @returns {any}
     */
    value: function List_first() {
      return this[0] ?? null;
    },
  },
  last: {
    /**
     * @this {any[]}
     * @returns {any}
     */
    value: function List_last() {
      return this[this.length - 1] ?? null;
    },
  },
  at: {
    /**
     * @this {any[]}
     * @param {number} index
     * @returns {any}
     */
    value: function List_at(index) {
      return this[index] ?? null;
    },
  },
  remove: {
    /**
     * @this {any[]}
     * @param {any} item
     * @returns {any[]}
     */
    value: function List_remove(item) {
      const index = this.indexOf(item);
      if (index > -1) {
        this.splice(index, 1);
      }
      return this;
    },
  },
  atPut: {
    /**
     * @this {any[]}
     * @param {number} index
     * @param {any} item
     * @returns {any[]}
     */
    value: function List_atPut(index, item) {
      this[index] = item;
      return this;
    },
  },
};

/**
 * @this {any[]}
 * @returns {any[]}
 */
function withItemIndexBody(args, fn) {
  switch (args.length) {
    case 1: {
      const selector = args[0];
      return fn((item) => selector.call(item));
    }
    case 2: {
      const eName = args[0].message?.name;
      if (!eName) {
        throw new Error('argument 0 must be a symbol');
      }
      const selector = args[1];
      const locals = { [eName]: null };
      return fn((item) => {
        locals[eName] = item;
        return selector.call(this, locals);
      });
    }
    case 3: {
      const iName = args[0].message?.name;
      if (!iName) {
        throw new Error('argument 0 must be a symbol');
      }
      const eName = args[1].message?.name;
      if (!eName) {
        throw new Error('argument 1 must be a symbol');
      }
      const selector = args[2];
      const locals = { [eName]: null, [iName]: 0 };
      return fn((item, index) => {
        locals[eName] = item;
        locals[iName] = index;
        return selector.call(this, locals);
      });
    }
    default:
      throw new Error(`wrong number of arguments`);
  }
}

/**
 * @param {...any} items
 * @returns {any[]}
 */
function Receiver_list(...items) {
  return items;
}
