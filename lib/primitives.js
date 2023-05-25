// @ts-check

import {
  dValue,
  dType,
  STOP_STATUS_RETURN,
  STOP_STATUS_BREAK,
  STOP_STATUS_CONTINUE,
} from './util.js';

/**
 * Installs:
 * - `Core.Str` - the receiver responding to `string` messages
 * - `Core.Num` - the receiver responding to `number` messages
 * - `Core.Bool` - the receiver responding to `boolean` messages
 * - `Core.Nil` - the receiver responding to `null` messages
 * @param {(...arg: any[]) => Function} method
 * @returns {import('./types.js').EnvironmentPlugin}
 */
export function primitivesInstaller(method) {
  return {
    install(Lobby) {
      if (!Lobby.Receiver) {
        throw new Error(
          'Literals can only be installed in environments with a core Receiver. Lobby.Receiver must be defined.',
        );
      }

      //
      // String
      //

      const Str = Object.create(Lobby.Receiver, STR_DESCRIPTORS);
      Object.defineProperty(Lobby.Core, 'Str', dValue(Str));

      //
      // Number
      //

      const Num = Object.create(Lobby.Receiver, NUM_DESCRIPTORS);
      Object.defineProperty(Lobby.Core, 'Num', dValue(Num));

      //
      // Bool
      //

      /**
       * @this boolean
       * @param {import('./types.js').Locals} locals
       * @returns {boolean | null | Promise<boolean | null>}
       */
      function Bool_ifTrue(locals) {
        if (this === true) {
          const body = locals.call.evalArgAt(0);
          if (body instanceof Promise) {
            return body.then(() => null);
          }
          return null;
        }
        return this;
      }
      method(Bool_ifTrue);

      /**
       * @this boolean
       * @param {import('./types.js').Locals} locals
       * @returns {boolean | null | Promise<boolean | null>}
       */
      function Bool_ifFalse(locals) {
        if (this === false) {
          const body = locals.call.evalArgAt(0);
          if (body instanceof Promise) {
            return body.then(() => null);
          }
          return null;
        }
        return this;
      }
      method(Bool_ifFalse);

      /**
       * @this {boolean}
       * @param {import('./types.js').Locals} locals
       * @returns {boolean | Promise<boolean>}
       */
      function Bool_elseif(locals) {
        if (this === false) {
          const body = locals.call.evalArgAt(0);
          if (body instanceof Promise) {
            return body.then((b) => b ?? false);
          }
          return body ?? false;
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

      Object.defineProperties(Lobby.Receiver, {
        true: {
          value: true,
        },
        false: {
          value: false,
        },
      });

      //
      // Nil
      //

      const Nil = Object.create(Lobby.Receiver, {
        clone: {
          value: method(() => null),
        },
        forward: {
          value: method(() => null),
        },
      });
      Object.defineProperty(Lobby.Core, 'Nil', dValue(Nil));

      //
      // List
      //

      /**
       * @returns {any[]}
       */
      function List_select(locals) {
        const { body } = getIndexItemBody(locals);
        const result = [];
        for (let i = 0, l = this.length; i < l; i++) {
          if (body(this[i], i)) {
            result.push(this[i]);
          }
        }
        return result;
      }
      method(List_select);

      /**
       * Returns the first value for which the message evaluates to a non-nil.
       * @this {any[]}
       * @returns {any}
       */
      function List_detect(locals) {
        const { body } = getIndexItemBody(locals);
        for (let i = 0, l = this.length; i < l; i++) {
          const item = this[i];
          const result = body(item, i);
          if (result !== null) {
            return item;
          }
        }
        return null;
      }
      method(List_detect);

      /**
       * Maps the list items to a new list.
       * @this {any[]}
       * @param {import('./types.js').Locals} locals
       * @returns {any[]}
       */
      function List_map(locals) {
        const { body } = getIndexItemBody(locals);
        const result = [];
        for (let i = 0, l = this.length; i < l; i++) {
          result.push(body(this[i], i));
        }
        return result;
      }
      method(List_map);

      /**
       * Executes a function for each element in the list. Retuns the list.
       * @this {any[]}
       * @param {import('./types.js').Locals} locals
       * @returns {any[]}
       */
      function List_foreach(locals) {
        const { body } = getIndexItemBody(locals);
        let v = null;
        for (let i = 0, l = this.length; i < l; i++) {
          v = body(this[i], i);
          if (locals.stopStatus === STOP_STATUS_RETURN) {
            return v;
          }
          if (locals.stopStatus === STOP_STATUS_BREAK) {
            locals.resetStopStatus();
            break;
          }
          if (locals.stopStatus === STOP_STATUS_CONTINUE) {
            locals.resetStopStatus();
            continue;
          }
        }
        return v;
      }
      method(List_foreach);

      function List_sortInPlaceBy(locals) {
        let block = locals.call.evalArgAt(0);
        if (typeof block !== 'function') {
          throw new Error('Argument must be a block');
        }
        if (block.toJs) {
          block = block.toJs();
        }
        this.sort((a, b) => {
          const result = block(a, b);
          if (typeof result === 'number') {
            return result;
          }
          return result ? -1 : 1;
        });
        return this;
      }
      method(List_sortInPlaceBy);

      function List_sortBy(locals) {
        let list = this.slice();
        List_sortInPlaceBy.call(list, locals);
        return list;
      }
      method(List_sortBy);

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
        sortInPlaceBy: {
          value: List_sortInPlaceBy,
        },
        sortBy: {
          value: List_sortBy,
        },
      });
      Object.defineProperty(Lobby.Core, 'List', dValue(List));
      Object.defineProperty(Lobby.Receiver, 'list', dValue(Receiver_list));

      //
      // Map
      //

      /**
       * @this {Map}
       * @param {import('./types.js').Locals} locals
       * @returns {Map}
       */
      function Map_foreach(locals) {
        const { body } = getIndexItemBody(locals);
        let v;
        for (const [key, value] of this.entries()) {
          v = body(value, key);
          if (locals.stopStatus === STOP_STATUS_RETURN) {
            return v;
          }
          if (locals.stopStatus === STOP_STATUS_BREAK) {
            locals.resetStopStatus();
            break;
          }
          if (locals.stopStatus === STOP_STATUS_CONTINUE) {
            locals.resetStopStatus();
            continue;
          }
        }
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
  ...dType('Str'),
  toString: {
    value: function () {
      return this;
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
  ...dType('Num'),
  toString: {
    value: function () {
      return String(this);
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
  '%': {
    /**
     * @this number
     * @param {number} other
     * @returns number
     */
    value: function Number_modulo(other) {
      return this % other;
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
  ...dType('Bool'),
  toString: {
    value: function () {
      return String(this);
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

const LIST_DESCRIPTORS = {
  ...dType('List'),
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
  empty: {
    /**
     * @this {any[]}
     * @returns {any[]}
     */
    value: function List_empty() {
      this.length = 0;
      return this;
    },
  },
  toString: {
    value: function List_toString() {
      return `list(${this.join(', ')})`;
    },
  },
};

/**
 * For methods accepting 1 to 3 arguments where:
 * - the last argument is always the body of a loop
 * - the second to last argument is (optional) the item variable name
 * - the third to last argument is (optional) the index variable name
 * This helper function generates a function that executes the body of the loop
 * with the correct locals.
 * @param {import('./types.js').Locals} locals
 * @returns {{ iterLocals: import('./types.js').Locals, body: (item: any, index: number) => any }}
 */
function getIndexItemBody(locals) {
  switch (locals.call.message.arguments.length) {
    case 1: {
      const bodyMsg = locals.call.message.arguments[0];
      return { iterLocals: locals, body: (item) => bodyMsg.doInContext(item) };
    }
    case 2: {
      const eName = locals.call.message.arguments[0].name;
      if (!eName) {
        throw new Error('argument 0 must be a symbol');
      }
      const bodyMsg = locals.call.message.arguments[1];
      // TODO better way to get locals
      let senderLocals = locals.call.sender;
      let sender = senderLocals.self;
      if (!sender) {
        sender = senderLocals;
        senderLocals = null;
      }
      const iterLocals = Object.create(senderLocals ?? sender, {
        [eName]: { value: null, writable: true },
      });
      return {
        iterLocals,
        body: (item) => {
          iterLocals[eName] = item;
          return bodyMsg.doInContext(sender, iterLocals);
        },
      };
    }
    case 3: {
      const iName = locals.call.message.arguments[0].name;
      if (!iName) {
        throw new Error('argument 0 must be a symbol');
      }
      const eName = locals.call.message.arguments[1].name;
      if (!eName) {
        throw new Error('argument 1 must be a symbol');
      }
      const bodyMsg = locals.call.message.arguments[2];
      // TODO better way to get locals
      let senderLocals = locals.call.sender;
      let sender = senderLocals.self;
      if (!sender) {
        sender = senderLocals;
        senderLocals = null;
      }
      const iterLocals = Object.create(senderLocals ?? sender, {
        [eName]: { value: null, writable: true },
        [iName]: { value: 0, writable: true },
      });
      return {
        iterLocals,
        body: (item, index) => {
          iterLocals[eName] = item;
          iterLocals[iName] = index;
          return bodyMsg.doInContext(sender, iterLocals);
        },
      };
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
  ...dType('Map'),
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
