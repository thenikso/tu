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

      /**
       * @this {Map}
       * @param  {...any} args
       * @returns {Map}
       */
      function Map_foreach(...args) {
        withItemIndexBody.call(this, args, (cb) => {
          for (const [key, value] of this.entries()) {
            cb(value, key);
          }
        });
        return this;
      }
      method(Map_foreach);

      const _Map = Object.create(Lobby.Receiver, {
        ...MAP_DESCRIPTORS,
        foreach: {
          value: Map_foreach,
        },
      });
      Object.defineProperty(Lobby.Core, 'Map', dValue(_Map));

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
  '..': {
    /**
     * @this string
     * @param {string} other
     * @returns string
     */
    value: function String_concat(other) {
      return this + other;
    },
  },
  at: {
    /**
     * @this {string}
     * @param {number} index
     * @returns {number}
     */
    value: function String_at(index) {
      if (typeof index !== 'number') {
        throw new Error(`argument 0 to method 'at' must be a Number.`);
      }
      return this.charCodeAt(index);
    },
  },
  split: {
    /**
     * Returns a list containing the sub-string of the receiver divided by the
     * given arguments. If no arguments are given the string is split on white
     * space.
     * @this {string}
     * @param {...string} separators
     * @returns {string[]}
     */
    value: function String_split(...separators) {
      const splitBy = separators.length ? separators : ['\\s+'];
      if (!splitBy.every((arg) => typeof arg === 'string')) {
        throw new Error(`arguments to method 'split' must be Strings.`);
      }
      const splitRegExp = new RegExp(splitBy.join('|'), 'gu');
      return this.split(splitRegExp);
    },
  },
  find: {
    /**
     * Returns the first index of the given string in the receiver. If the
     * string is not found Nil is returned.
     * @this {string}
     * @param {string} str
     * @returns {number | null}
     */
    value: function String_find(str) {
      const result = this.indexOf(str);
      if (result === -1) {
        return null;
      }
      return result;
    },
  },
  slice: {
    /**
     * Returns a sub-string of the receiver.
     * @this {string}
     * @param {number} start
     * @param {number} end
     * @returns {string}
     */
    value: function String_slice(start, end) {
      return this.slice(start, end);
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
  asCharacter: {
    /**
     * @this {number}
     * @returns {string}
     */
    value: function Number_asCharacter() {
      return String.fromCharCode(this);
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
  join: {
    /**
     * @this {any[]}
     * @param {string} separator
     * @returns {string}
     */
    value: function List_join(separator) {
      return this.join(separator);
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
      const eName = args[0].$message?.name;
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
      const iName = args[0].$message?.name;
      if (!iName) {
        throw new Error('argument 0 must be a symbol');
      }
      const eName = args[1].$message?.name;
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

const MAP_DESCRIPTORS = {
  type: {
    value: 'Map',
  },
  clone: {
    /**
     * @this {Map<any, any>}
     * @returns {Map<any, any>}
     */
    value: function Map_clone() {
      return this instanceof Map ? new Map(this) : new Map();
    },
  },
  atPut: {
    /**
     * @this {Map<any, any>}
     * @param {any} key
     * @param {any} value
     * @returns {Map<any, any>}
     */
    value: function Map_atPut(key, value) {
      this.set(key, value);
      return this;
    },
  },
  hasKey: {
    /**
     * @this {Map<any, any>}
     * @param {any} key
     * @returns {boolean}
     */
    value: function Map_hasKey(key) {
      return this.has(key);
    },
  },
  hasValue: {
    /**
     * @this {Map<any, any>}
     * @param {any} value
     * @returns {boolean}
     */
    value: function Map_hasValue(value) {
      for (const v of this.values()) {
        if (v === value) {
          return true;
        }
      }
      return false;
    },
  },
  at: {
    /**
     * @this {Map<any, any>}
     * @param {any} key
     * @returns {any}
     */
    value: function Map_at(key) {
      return this.get(key) ?? null;
    },
  },
  keys: {
    /**
     * @this {Map<any, any>}
     * @returns {any[]}
     */
    value: function Map_keys() {
      return [...this.keys()];
    },
  },
};
