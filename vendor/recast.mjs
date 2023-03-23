const exp = (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){
'use strict';

var objectAssign = require('object-assign');

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:
// NB: The URL to the CommonJS spec is kept just for tradition.
//     node-assert has evolved a lot since then, both in API and behavior.

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

// Expose a strict only variant of assert
function strict(value, message) {
  if (!value) fail(value, true, message, '==', strict);
}
assert.strict = objectAssign(strict, assert, {
  equal: assert.strictEqual,
  deepEqual: assert.deepStrictEqual,
  notEqual: assert.notStrictEqual,
  notDeepEqual: assert.notDeepStrictEqual
});
assert.strict.strict = assert.strict;

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"object-assign":34,"util/":4}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":36,"inherits":2}],5:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var es_proposals_1 = tslib_1.__importDefault(require("./es-proposals"));
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    fork.use(es_proposals_1.default);
    var types = fork.use(types_1.default);
    var defaults = fork.use(shared_1.default).defaults;
    var def = types.Type.def;
    var or = types.Type.or;
    def("Noop")
        .bases("Statement")
        .build();
    def("DoExpression")
        .bases("Expression")
        .build("body")
        .field("body", [def("Statement")]);
    def("BindExpression")
        .bases("Expression")
        .build("object", "callee")
        .field("object", or(def("Expression"), null))
        .field("callee", def("Expression"));
    def("ParenthesizedExpression")
        .bases("Expression")
        .build("expression")
        .field("expression", def("Expression"));
    def("ExportNamespaceSpecifier")
        .bases("Specifier")
        .build("exported")
        .field("exported", def("Identifier"));
    def("ExportDefaultSpecifier")
        .bases("Specifier")
        .build("exported")
        .field("exported", def("Identifier"));
    def("CommentBlock")
        .bases("Comment")
        .build("value", /*optional:*/ "leading", "trailing");
    def("CommentLine")
        .bases("Comment")
        .build("value", /*optional:*/ "leading", "trailing");
    def("Directive")
        .bases("Node")
        .build("value")
        .field("value", def("DirectiveLiteral"));
    def("DirectiveLiteral")
        .bases("Node", "Expression")
        .build("value")
        .field("value", String, defaults["use strict"]);
    def("InterpreterDirective")
        .bases("Node")
        .build("value")
        .field("value", String);
    def("BlockStatement")
        .bases("Statement")
        .build("body")
        .field("body", [def("Statement")])
        .field("directives", [def("Directive")], defaults.emptyArray);
    def("Program")
        .bases("Node")
        .build("body")
        .field("body", [def("Statement")])
        .field("directives", [def("Directive")], defaults.emptyArray)
        .field("interpreter", or(def("InterpreterDirective"), null), defaults["null"]);
    // Split Literal
    def("StringLiteral")
        .bases("Literal")
        .build("value")
        .field("value", String);
    def("NumericLiteral")
        .bases("Literal")
        .build("value")
        .field("value", Number)
        .field("raw", or(String, null), defaults["null"])
        .field("extra", {
        rawValue: Number,
        raw: String
    }, function getDefault() {
        return {
            rawValue: this.value,
            raw: this.value + ""
        };
    });
    def("BigIntLiteral")
        .bases("Literal")
        .build("value")
        // Only String really seems appropriate here, since BigInt values
        // often exceed the limits of JS numbers.
        .field("value", or(String, Number))
        .field("extra", {
        rawValue: String,
        raw: String
    }, function getDefault() {
        return {
            rawValue: String(this.value),
            raw: this.value + "n"
        };
    });
    def("NullLiteral")
        .bases("Literal")
        .build()
        .field("value", null, defaults["null"]);
    def("BooleanLiteral")
        .bases("Literal")
        .build("value")
        .field("value", Boolean);
    def("RegExpLiteral")
        .bases("Literal")
        .build("pattern", "flags")
        .field("pattern", String)
        .field("flags", String)
        .field("value", RegExp, function () {
        return new RegExp(this.pattern, this.flags);
    });
    var ObjectExpressionProperty = or(def("Property"), def("ObjectMethod"), def("ObjectProperty"), def("SpreadProperty"), def("SpreadElement"));
    // Split Property -> ObjectProperty and ObjectMethod
    def("ObjectExpression")
        .bases("Expression")
        .build("properties")
        .field("properties", [ObjectExpressionProperty]);
    // ObjectMethod hoist .value properties to own properties
    def("ObjectMethod")
        .bases("Node", "Function")
        .build("kind", "key", "params", "body", "computed")
        .field("kind", or("method", "get", "set"))
        .field("key", or(def("Literal"), def("Identifier"), def("Expression")))
        .field("params", [def("Pattern")])
        .field("body", def("BlockStatement"))
        .field("computed", Boolean, defaults["false"])
        .field("generator", Boolean, defaults["false"])
        .field("async", Boolean, defaults["false"])
        .field("accessibility", // TypeScript
    or(def("Literal"), null), defaults["null"])
        .field("decorators", or([def("Decorator")], null), defaults["null"]);
    def("ObjectProperty")
        .bases("Node")
        .build("key", "value")
        .field("key", or(def("Literal"), def("Identifier"), def("Expression")))
        .field("value", or(def("Expression"), def("Pattern")))
        .field("accessibility", // TypeScript
    or(def("Literal"), null), defaults["null"])
        .field("computed", Boolean, defaults["false"]);
    var ClassBodyElement = or(def("MethodDefinition"), def("VariableDeclarator"), def("ClassPropertyDefinition"), def("ClassProperty"), def("ClassPrivateProperty"), def("ClassMethod"), def("ClassPrivateMethod"));
    // MethodDefinition -> ClassMethod
    def("ClassBody")
        .bases("Declaration")
        .build("body")
        .field("body", [ClassBodyElement]);
    def("ClassMethod")
        .bases("Declaration", "Function")
        .build("kind", "key", "params", "body", "computed", "static")
        .field("key", or(def("Literal"), def("Identifier"), def("Expression")));
    def("ClassPrivateMethod")
        .bases("Declaration", "Function")
        .build("key", "params", "body", "kind", "computed", "static")
        .field("key", def("PrivateName"));
    ["ClassMethod",
        "ClassPrivateMethod",
    ].forEach(function (typeName) {
        def(typeName)
            .field("kind", or("get", "set", "method", "constructor"), function () { return "method"; })
            .field("body", def("BlockStatement"))
            .field("computed", Boolean, defaults["false"])
            .field("static", or(Boolean, null), defaults["null"])
            .field("abstract", or(Boolean, null), defaults["null"])
            .field("access", or("public", "private", "protected", null), defaults["null"])
            .field("accessibility", or("public", "private", "protected", null), defaults["null"])
            .field("decorators", or([def("Decorator")], null), defaults["null"])
            .field("optional", or(Boolean, null), defaults["null"]);
    });
    var ObjectPatternProperty = or(def("Property"), def("PropertyPattern"), def("SpreadPropertyPattern"), def("SpreadProperty"), // Used by Esprima
    def("ObjectProperty"), // Babel 6
    def("RestProperty") // Babel 6
    );
    // Split into RestProperty and SpreadProperty
    def("ObjectPattern")
        .bases("Pattern")
        .build("properties")
        .field("properties", [ObjectPatternProperty])
        .field("decorators", or([def("Decorator")], null), defaults["null"]);
    def("SpreadProperty")
        .bases("Node")
        .build("argument")
        .field("argument", def("Expression"));
    def("RestProperty")
        .bases("Node")
        .build("argument")
        .field("argument", def("Expression"));
    def("ForAwaitStatement")
        .bases("Statement")
        .build("left", "right", "body")
        .field("left", or(def("VariableDeclaration"), def("Expression")))
        .field("right", def("Expression"))
        .field("body", def("Statement"));
    // The callee node of a dynamic import(...) expression.
    def("Import")
        .bases("Expression")
        .build();
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./es-proposals":9,"tslib":31}],6:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var babel_core_1 = tslib_1.__importDefault(require("./babel-core"));
var flow_1 = tslib_1.__importDefault(require("./flow"));
function default_1(fork) {
    fork.use(babel_core_1.default);
    fork.use(flow_1.default);
}
exports.default = default_1;
module.exports = exports["default"];

},{"./babel-core":5,"./flow":17,"tslib":31}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogicalOperators = exports.AssignmentOperators = exports.BinaryOperators = void 0;
exports.BinaryOperators = [
    "==", "!=", "===", "!==",
    "<", "<=", ">", ">=",
    "<<", ">>", ">>>",
    "+", "-", "*", "/", "%",
    "&",
    "|", "^", "in",
    "instanceof",
];
exports.AssignmentOperators = [
    "=", "+=", "-=", "*=", "/=", "%=",
    "<<=", ">>=", ">>>=",
    "|=", "^=", "&=",
];
exports.LogicalOperators = [
    "||", "&&",
];

},{}],8:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_operators_1 = require("./core-operators");
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    var types = fork.use(types_1.default);
    var Type = types.Type;
    var def = Type.def;
    var or = Type.or;
    var shared = fork.use(shared_1.default);
    var defaults = shared.defaults;
    var geq = shared.geq;
    // Abstract supertype of all syntactic entities that are allowed to have a
    // .loc field.
    def("Printable")
        .field("loc", or(def("SourceLocation"), null), defaults["null"], true);
    def("Node")
        .bases("Printable")
        .field("type", String)
        .field("comments", or([def("Comment")], null), defaults["null"], true);
    def("SourceLocation")
        .field("start", def("Position"))
        .field("end", def("Position"))
        .field("source", or(String, null), defaults["null"]);
    def("Position")
        .field("line", geq(1))
        .field("column", geq(0));
    def("File")
        .bases("Node")
        .build("program", "name")
        .field("program", def("Program"))
        .field("name", or(String, null), defaults["null"]);
    def("Program")
        .bases("Node")
        .build("body")
        .field("body", [def("Statement")]);
    def("Function")
        .bases("Node")
        .field("id", or(def("Identifier"), null), defaults["null"])
        .field("params", [def("Pattern")])
        .field("body", def("BlockStatement"))
        .field("generator", Boolean, defaults["false"])
        .field("async", Boolean, defaults["false"]);
    def("Statement").bases("Node");
    // The empty .build() here means that an EmptyStatement can be constructed
    // (i.e. it's not abstract) but that it needs no arguments.
    def("EmptyStatement").bases("Statement").build();
    def("BlockStatement")
        .bases("Statement")
        .build("body")
        .field("body", [def("Statement")]);
    // TODO Figure out how to silently coerce Expressions to
    // ExpressionStatements where a Statement was expected.
    def("ExpressionStatement")
        .bases("Statement")
        .build("expression")
        .field("expression", def("Expression"));
    def("IfStatement")
        .bases("Statement")
        .build("test", "consequent", "alternate")
        .field("test", def("Expression"))
        .field("consequent", def("Statement"))
        .field("alternate", or(def("Statement"), null), defaults["null"]);
    def("LabeledStatement")
        .bases("Statement")
        .build("label", "body")
        .field("label", def("Identifier"))
        .field("body", def("Statement"));
    def("BreakStatement")
        .bases("Statement")
        .build("label")
        .field("label", or(def("Identifier"), null), defaults["null"]);
    def("ContinueStatement")
        .bases("Statement")
        .build("label")
        .field("label", or(def("Identifier"), null), defaults["null"]);
    def("WithStatement")
        .bases("Statement")
        .build("object", "body")
        .field("object", def("Expression"))
        .field("body", def("Statement"));
    def("SwitchStatement")
        .bases("Statement")
        .build("discriminant", "cases", "lexical")
        .field("discriminant", def("Expression"))
        .field("cases", [def("SwitchCase")])
        .field("lexical", Boolean, defaults["false"]);
    def("ReturnStatement")
        .bases("Statement")
        .build("argument")
        .field("argument", or(def("Expression"), null));
    def("ThrowStatement")
        .bases("Statement")
        .build("argument")
        .field("argument", def("Expression"));
    def("TryStatement")
        .bases("Statement")
        .build("block", "handler", "finalizer")
        .field("block", def("BlockStatement"))
        .field("handler", or(def("CatchClause"), null), function () {
        return this.handlers && this.handlers[0] || null;
    })
        .field("handlers", [def("CatchClause")], function () {
        return this.handler ? [this.handler] : [];
    }, true) // Indicates this field is hidden from eachField iteration.
        .field("guardedHandlers", [def("CatchClause")], defaults.emptyArray)
        .field("finalizer", or(def("BlockStatement"), null), defaults["null"]);
    def("CatchClause")
        .bases("Node")
        .build("param", "guard", "body")
        .field("param", def("Pattern"))
        .field("guard", or(def("Expression"), null), defaults["null"])
        .field("body", def("BlockStatement"));
    def("WhileStatement")
        .bases("Statement")
        .build("test", "body")
        .field("test", def("Expression"))
        .field("body", def("Statement"));
    def("DoWhileStatement")
        .bases("Statement")
        .build("body", "test")
        .field("body", def("Statement"))
        .field("test", def("Expression"));
    def("ForStatement")
        .bases("Statement")
        .build("init", "test", "update", "body")
        .field("init", or(def("VariableDeclaration"), def("Expression"), null))
        .field("test", or(def("Expression"), null))
        .field("update", or(def("Expression"), null))
        .field("body", def("Statement"));
    def("ForInStatement")
        .bases("Statement")
        .build("left", "right", "body")
        .field("left", or(def("VariableDeclaration"), def("Expression")))
        .field("right", def("Expression"))
        .field("body", def("Statement"));
    def("DebuggerStatement").bases("Statement").build();
    def("Declaration").bases("Statement");
    def("FunctionDeclaration")
        .bases("Function", "Declaration")
        .build("id", "params", "body")
        .field("id", def("Identifier"));
    def("FunctionExpression")
        .bases("Function", "Expression")
        .build("id", "params", "body");
    def("VariableDeclaration")
        .bases("Declaration")
        .build("kind", "declarations")
        .field("kind", or("var", "let", "const"))
        .field("declarations", [def("VariableDeclarator")]);
    def("VariableDeclarator")
        .bases("Node")
        .build("id", "init")
        .field("id", def("Pattern"))
        .field("init", or(def("Expression"), null), defaults["null"]);
    def("Expression").bases("Node");
    def("ThisExpression").bases("Expression").build();
    def("ArrayExpression")
        .bases("Expression")
        .build("elements")
        .field("elements", [or(def("Expression"), null)]);
    def("ObjectExpression")
        .bases("Expression")
        .build("properties")
        .field("properties", [def("Property")]);
    // TODO Not in the Mozilla Parser API, but used by Esprima.
    def("Property")
        .bases("Node") // Want to be able to visit Property Nodes.
        .build("kind", "key", "value")
        .field("kind", or("init", "get", "set"))
        .field("key", or(def("Literal"), def("Identifier")))
        .field("value", def("Expression"));
    def("SequenceExpression")
        .bases("Expression")
        .build("expressions")
        .field("expressions", [def("Expression")]);
    var UnaryOperator = or("-", "+", "!", "~", "typeof", "void", "delete");
    def("UnaryExpression")
        .bases("Expression")
        .build("operator", "argument", "prefix")
        .field("operator", UnaryOperator)
        .field("argument", def("Expression"))
        // Esprima doesn't bother with this field, presumably because it's
        // always true for unary operators.
        .field("prefix", Boolean, defaults["true"]);
    var BinaryOperator = or.apply(void 0, core_operators_1.BinaryOperators);
    def("BinaryExpression")
        .bases("Expression")
        .build("operator", "left", "right")
        .field("operator", BinaryOperator)
        .field("left", def("Expression"))
        .field("right", def("Expression"));
    var AssignmentOperator = or.apply(void 0, core_operators_1.AssignmentOperators);
    def("AssignmentExpression")
        .bases("Expression")
        .build("operator", "left", "right")
        .field("operator", AssignmentOperator)
        .field("left", or(def("Pattern"), def("MemberExpression")))
        .field("right", def("Expression"));
    var UpdateOperator = or("++", "--");
    def("UpdateExpression")
        .bases("Expression")
        .build("operator", "argument", "prefix")
        .field("operator", UpdateOperator)
        .field("argument", def("Expression"))
        .field("prefix", Boolean);
    var LogicalOperator = or.apply(void 0, core_operators_1.LogicalOperators);
    def("LogicalExpression")
        .bases("Expression")
        .build("operator", "left", "right")
        .field("operator", LogicalOperator)
        .field("left", def("Expression"))
        .field("right", def("Expression"));
    def("ConditionalExpression")
        .bases("Expression")
        .build("test", "consequent", "alternate")
        .field("test", def("Expression"))
        .field("consequent", def("Expression"))
        .field("alternate", def("Expression"));
    def("NewExpression")
        .bases("Expression")
        .build("callee", "arguments")
        .field("callee", def("Expression"))
        // The Mozilla Parser API gives this type as [or(def("Expression"),
        // null)], but null values don't really make sense at the call site.
        // TODO Report this nonsense.
        .field("arguments", [def("Expression")]);
    def("CallExpression")
        .bases("Expression")
        .build("callee", "arguments")
        .field("callee", def("Expression"))
        // See comment for NewExpression above.
        .field("arguments", [def("Expression")]);
    def("MemberExpression")
        .bases("Expression")
        .build("object", "property", "computed")
        .field("object", def("Expression"))
        .field("property", or(def("Identifier"), def("Expression")))
        .field("computed", Boolean, function () {
        var type = this.property.type;
        if (type === 'Literal' ||
            type === 'MemberExpression' ||
            type === 'BinaryExpression') {
            return true;
        }
        return false;
    });
    def("Pattern").bases("Node");
    def("SwitchCase")
        .bases("Node")
        .build("test", "consequent")
        .field("test", or(def("Expression"), null))
        .field("consequent", [def("Statement")]);
    def("Identifier")
        .bases("Expression", "Pattern")
        .build("name")
        .field("name", String)
        .field("optional", Boolean, defaults["false"]);
    def("Literal")
        .bases("Expression")
        .build("value")
        .field("value", or(String, Boolean, null, Number, RegExp))
        .field("regex", or({
        pattern: String,
        flags: String
    }, null), function () {
        if (this.value instanceof RegExp) {
            var flags = "";
            if (this.value.ignoreCase)
                flags += "i";
            if (this.value.multiline)
                flags += "m";
            if (this.value.global)
                flags += "g";
            return {
                pattern: this.value.source,
                flags: flags
            };
        }
        return null;
    });
    // Abstract (non-buildable) comment supertype. Not a Node.
    def("Comment")
        .bases("Printable")
        .field("value", String)
        // A .leading comment comes before the node, whereas a .trailing
        // comment comes after it. These two fields should not both be true,
        // but they might both be false when the comment falls inside a node
        // and the node has no children for the comment to lead or trail,
        // e.g. { /*dangling*/ }.
        .field("leading", Boolean, defaults["true"])
        .field("trailing", Boolean, defaults["false"]);
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./core-operators":7,"tslib":31}],9:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
var es2020_1 = tslib_1.__importDefault(require("./es2020"));
function default_1(fork) {
    fork.use(es2020_1.default);
    var types = fork.use(types_1.default);
    var Type = types.Type;
    var def = types.Type.def;
    var or = Type.or;
    var shared = fork.use(shared_1.default);
    var defaults = shared.defaults;
    def("AwaitExpression")
        .build("argument", "all")
        .field("argument", or(def("Expression"), null))
        .field("all", Boolean, defaults["false"]);
    // Decorators
    def("Decorator")
        .bases("Node")
        .build("expression")
        .field("expression", def("Expression"));
    def("Property")
        .field("decorators", or([def("Decorator")], null), defaults["null"]);
    def("MethodDefinition")
        .field("decorators", or([def("Decorator")], null), defaults["null"]);
    // Private names
    def("PrivateName")
        .bases("Expression", "Pattern")
        .build("id")
        .field("id", def("Identifier"));
    def("ClassPrivateProperty")
        .bases("ClassProperty")
        .build("key", "value")
        .field("key", def("PrivateName"))
        .field("value", or(def("Expression"), null), defaults["null"]);
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./es2020":14,"tslib":31}],10:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_operators_1 = require("./core-operators");
var es6_1 = tslib_1.__importDefault(require("./es6"));
var types_1 = tslib_1.__importDefault(require("../lib/types"));
function default_1(fork) {
    fork.use(es6_1.default);
    var types = fork.use(types_1.default);
    var def = types.Type.def;
    var or = types.Type.or;
    var BinaryOperator = or.apply(void 0, tslib_1.__spreadArrays(core_operators_1.BinaryOperators, ["**"]));
    def("BinaryExpression")
        .field("operator", BinaryOperator);
    var AssignmentOperator = or.apply(void 0, tslib_1.__spreadArrays(core_operators_1.AssignmentOperators, ["**="]));
    def("AssignmentExpression")
        .field("operator", AssignmentOperator);
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/types":29,"./core-operators":7,"./es6":15,"tslib":31}],11:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var es2016_1 = tslib_1.__importDefault(require("./es2016"));
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    fork.use(es2016_1.default);
    var types = fork.use(types_1.default);
    var def = types.Type.def;
    var defaults = fork.use(shared_1.default).defaults;
    def("Function")
        .field("async", Boolean, defaults["false"]);
    def("AwaitExpression")
        .bases("Expression")
        .build("argument")
        .field("argument", def("Expression"));
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./es2016":10,"tslib":31}],12:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var es2017_1 = tslib_1.__importDefault(require("./es2017"));
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    fork.use(es2017_1.default);
    var types = fork.use(types_1.default);
    var def = types.Type.def;
    var or = types.Type.or;
    var defaults = fork.use(shared_1.default).defaults;
    def("ForOfStatement")
        .field("await", Boolean, defaults["false"]);
    // Legacy
    def("SpreadProperty")
        .bases("Node")
        .build("argument")
        .field("argument", def("Expression"));
    def("ObjectExpression")
        .field("properties", [or(def("Property"), def("SpreadProperty"), // Legacy
        def("SpreadElement"))]);
    def("TemplateElement")
        .field("value", { "cooked": or(String, null), "raw": String });
    // Legacy
    def("SpreadPropertyPattern")
        .bases("Pattern")
        .build("argument")
        .field("argument", def("Pattern"));
    def("ObjectPattern")
        .field("properties", [or(def("PropertyPattern"), def("Property"), def("RestElement"), def("SpreadPropertyPattern"))]);
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./es2017":11,"tslib":31}],13:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var es2018_1 = tslib_1.__importDefault(require("./es2018"));
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    fork.use(es2018_1.default);
    var types = fork.use(types_1.default);
    var def = types.Type.def;
    var or = types.Type.or;
    var defaults = fork.use(shared_1.default).defaults;
    def("CatchClause")
        .field("param", or(def("Pattern"), null), defaults["null"]);
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./es2018":12,"tslib":31}],14:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_operators_1 = require("./core-operators");
var es2019_1 = tslib_1.__importDefault(require("./es2019"));
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    fork.use(es2019_1.default);
    var types = fork.use(types_1.default);
    var def = types.Type.def;
    var or = types.Type.or;
    var shared = fork.use(shared_1.default);
    var defaults = shared.defaults;
    def("ImportExpression")
        .bases("Expression")
        .build("source")
        .field("source", def("Expression"));
    def("ExportAllDeclaration")
        .build("source", "exported")
        .field("source", def("Literal"))
        .field("exported", or(def("Identifier"), null));
    // Optional chaining
    def("ChainElement")
        .bases("Node")
        .field("optional", Boolean, defaults["false"]);
    def("CallExpression")
        .bases("Expression", "ChainElement");
    def("MemberExpression")
        .bases("Expression", "ChainElement");
    def("ChainExpression")
        .bases("Expression")
        .build("expression")
        .field("expression", def("ChainElement"));
    def("OptionalCallExpression")
        .bases("CallExpression")
        .build("callee", "arguments", "optional")
        .field("optional", Boolean, defaults["true"]);
    // Deprecated optional chaining type, doesn't work with babelParser@7.11.0 or newer
    def("OptionalMemberExpression")
        .bases("MemberExpression")
        .build("object", "property", "computed", "optional")
        .field("optional", Boolean, defaults["true"]);
    // Nullish coalescing
    var LogicalOperator = or.apply(void 0, tslib_1.__spreadArrays(core_operators_1.LogicalOperators, ["??"]));
    def("LogicalExpression")
        .field("operator", LogicalOperator);
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./core-operators":7,"./es2019":13,"tslib":31}],15:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = tslib_1.__importDefault(require("./core"));
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    fork.use(core_1.default);
    var types = fork.use(types_1.default);
    var def = types.Type.def;
    var or = types.Type.or;
    var defaults = fork.use(shared_1.default).defaults;
    def("Function")
        .field("generator", Boolean, defaults["false"])
        .field("expression", Boolean, defaults["false"])
        .field("defaults", [or(def("Expression"), null)], defaults.emptyArray)
        // Legacy
        .field("rest", or(def("Identifier"), null), defaults["null"]);
    // The ESTree way of representing a ...rest parameter.
    def("RestElement")
        .bases("Pattern")
        .build("argument")
        .field("argument", def("Pattern"))
        .field("typeAnnotation", // for Babylon. Flow parser puts it on the identifier
    or(def("TypeAnnotation"), def("TSTypeAnnotation"), null), defaults["null"]);
    def("SpreadElementPattern")
        .bases("Pattern")
        .build("argument")
        .field("argument", def("Pattern"));
    def("FunctionDeclaration")
        .build("id", "params", "body", "generator", "expression")
        // May be `null` in the context of `export default function () {}`
        .field("id", or(def("Identifier"), null));
    def("FunctionExpression")
        .build("id", "params", "body", "generator", "expression");
    def("ArrowFunctionExpression")
        .bases("Function", "Expression")
        .build("params", "body", "expression")
        // The forced null value here is compatible with the overridden
        // definition of the "id" field in the Function interface.
        .field("id", null, defaults["null"])
        // Arrow function bodies are allowed to be expressions.
        .field("body", or(def("BlockStatement"), def("Expression")))
        // The current spec forbids arrow generators, so I have taken the
        // liberty of enforcing that. TODO Report this.
        .field("generator", false, defaults["false"]);
    def("ForOfStatement")
        .bases("Statement")
        .build("left", "right", "body")
        .field("left", or(def("VariableDeclaration"), def("Pattern")))
        .field("right", def("Expression"))
        .field("body", def("Statement"));
    def("YieldExpression")
        .bases("Expression")
        .build("argument", "delegate")
        .field("argument", or(def("Expression"), null))
        .field("delegate", Boolean, defaults["false"]);
    def("GeneratorExpression")
        .bases("Expression")
        .build("body", "blocks", "filter")
        .field("body", def("Expression"))
        .field("blocks", [def("ComprehensionBlock")])
        .field("filter", or(def("Expression"), null));
    def("ComprehensionExpression")
        .bases("Expression")
        .build("body", "blocks", "filter")
        .field("body", def("Expression"))
        .field("blocks", [def("ComprehensionBlock")])
        .field("filter", or(def("Expression"), null));
    def("ComprehensionBlock")
        .bases("Node")
        .build("left", "right", "each")
        .field("left", def("Pattern"))
        .field("right", def("Expression"))
        .field("each", Boolean);
    def("Property")
        .field("key", or(def("Literal"), def("Identifier"), def("Expression")))
        .field("value", or(def("Expression"), def("Pattern")))
        .field("method", Boolean, defaults["false"])
        .field("shorthand", Boolean, defaults["false"])
        .field("computed", Boolean, defaults["false"]);
    def("ObjectProperty")
        .field("shorthand", Boolean, defaults["false"]);
    def("PropertyPattern")
        .bases("Pattern")
        .build("key", "pattern")
        .field("key", or(def("Literal"), def("Identifier"), def("Expression")))
        .field("pattern", def("Pattern"))
        .field("computed", Boolean, defaults["false"]);
    def("ObjectPattern")
        .bases("Pattern")
        .build("properties")
        .field("properties", [or(def("PropertyPattern"), def("Property"))]);
    def("ArrayPattern")
        .bases("Pattern")
        .build("elements")
        .field("elements", [or(def("Pattern"), null)]);
    def("SpreadElement")
        .bases("Node")
        .build("argument")
        .field("argument", def("Expression"));
    def("ArrayExpression")
        .field("elements", [or(def("Expression"), def("SpreadElement"), def("RestElement"), null)]);
    def("NewExpression")
        .field("arguments", [or(def("Expression"), def("SpreadElement"))]);
    def("CallExpression")
        .field("arguments", [or(def("Expression"), def("SpreadElement"))]);
    // Note: this node type is *not* an AssignmentExpression with a Pattern on
    // the left-hand side! The existing AssignmentExpression type already
    // supports destructuring assignments. AssignmentPattern nodes may appear
    // wherever a Pattern is allowed, and the right-hand side represents a
    // default value to be destructured against the left-hand side, if no
    // value is otherwise provided. For example: default parameter values.
    def("AssignmentPattern")
        .bases("Pattern")
        .build("left", "right")
        .field("left", def("Pattern"))
        .field("right", def("Expression"));
    def("MethodDefinition")
        .bases("Declaration")
        .build("kind", "key", "value", "static")
        .field("kind", or("constructor", "method", "get", "set"))
        .field("key", def("Expression"))
        .field("value", def("Function"))
        .field("computed", Boolean, defaults["false"])
        .field("static", Boolean, defaults["false"]);
    var ClassBodyElement = or(def("MethodDefinition"), def("VariableDeclarator"), def("ClassPropertyDefinition"), def("ClassProperty"));
    def("ClassProperty")
        .bases("Declaration")
        .build("key")
        .field("key", or(def("Literal"), def("Identifier"), def("Expression")))
        .field("computed", Boolean, defaults["false"]);
    def("ClassPropertyDefinition") // static property
        .bases("Declaration")
        .build("definition")
        // Yes, Virginia, circular definitions are permitted.
        .field("definition", ClassBodyElement);
    def("ClassBody")
        .bases("Declaration")
        .build("body")
        .field("body", [ClassBodyElement]);
    def("ClassDeclaration")
        .bases("Declaration")
        .build("id", "body", "superClass")
        .field("id", or(def("Identifier"), null))
        .field("body", def("ClassBody"))
        .field("superClass", or(def("Expression"), null), defaults["null"]);
    def("ClassExpression")
        .bases("Expression")
        .build("id", "body", "superClass")
        .field("id", or(def("Identifier"), null), defaults["null"])
        .field("body", def("ClassBody"))
        .field("superClass", or(def("Expression"), null), defaults["null"]);
    def("Super")
        .bases("Expression")
        .build();
    // Specifier and ModuleSpecifier are abstract non-standard types
    // introduced for definitional convenience.
    def("Specifier").bases("Node");
    // This supertype is shared/abused by both def/babel.js and
    // def/esprima.js. In the future, it will be possible to load only one set
    // of definitions appropriate for a given parser, but until then we must
    // rely on default functions to reconcile the conflicting AST formats.
    def("ModuleSpecifier")
        .bases("Specifier")
        // This local field is used by Babel/Acorn. It should not technically
        // be optional in the Babel/Acorn AST format, but it must be optional
        // in the Esprima AST format.
        .field("local", or(def("Identifier"), null), defaults["null"])
        // The id and name fields are used by Esprima. The id field should not
        // technically be optional in the Esprima AST format, but it must be
        // optional in the Babel/Acorn AST format.
        .field("id", or(def("Identifier"), null), defaults["null"])
        .field("name", or(def("Identifier"), null), defaults["null"]);
    // import {<id [as name]>} from ...;
    def("ImportSpecifier")
        .bases("ModuleSpecifier")
        .build("imported", "local")
        .field("imported", def("Identifier"));
    // import <id> from ...;
    def("ImportDefaultSpecifier")
        .bases("ModuleSpecifier")
        .build("local");
    // import <* as id> from ...;
    def("ImportNamespaceSpecifier")
        .bases("ModuleSpecifier")
        .build("local");
    def("ImportDeclaration")
        .bases("Declaration")
        .build("specifiers", "source", "importKind")
        .field("specifiers", [or(def("ImportSpecifier"), def("ImportNamespaceSpecifier"), def("ImportDefaultSpecifier"))], defaults.emptyArray)
        .field("source", def("Literal"))
        .field("importKind", or("value", "type"), function () {
        return "value";
    });
    def("ExportNamedDeclaration")
        .bases("Declaration")
        .build("declaration", "specifiers", "source")
        .field("declaration", or(def("Declaration"), null))
        .field("specifiers", [def("ExportSpecifier")], defaults.emptyArray)
        .field("source", or(def("Literal"), null), defaults["null"]);
    def("ExportSpecifier")
        .bases("ModuleSpecifier")
        .build("local", "exported")
        .field("exported", def("Identifier"));
    def("ExportDefaultDeclaration")
        .bases("Declaration")
        .build("declaration")
        .field("declaration", or(def("Declaration"), def("Expression")));
    def("ExportAllDeclaration")
        .bases("Declaration")
        .build("source")
        .field("source", def("Literal"));
    def("TaggedTemplateExpression")
        .bases("Expression")
        .build("tag", "quasi")
        .field("tag", def("Expression"))
        .field("quasi", def("TemplateLiteral"));
    def("TemplateLiteral")
        .bases("Expression")
        .build("quasis", "expressions")
        .field("quasis", [def("TemplateElement")])
        .field("expressions", [def("Expression")]);
    def("TemplateElement")
        .bases("Node")
        .build("value", "tail")
        .field("value", { "cooked": String, "raw": String })
        .field("tail", Boolean);
    def("MetaProperty")
        .bases("Expression")
        .build("meta", "property")
        .field("meta", def("Identifier"))
        .field("property", def("Identifier"));
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./core":8,"tslib":31}],16:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var es2020_1 = tslib_1.__importDefault(require("./es2020"));
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    fork.use(es2020_1.default);
    var types = fork.use(types_1.default);
    var defaults = fork.use(shared_1.default).defaults;
    var def = types.Type.def;
    var or = types.Type.or;
    def("VariableDeclaration")
        .field("declarations", [or(def("VariableDeclarator"), def("Identifier") // Esprima deviation.
        )]);
    def("Property")
        .field("value", or(def("Expression"), def("Pattern") // Esprima deviation.
    ));
    def("ArrayPattern")
        .field("elements", [or(def("Pattern"), def("SpreadElement"), null)]);
    def("ObjectPattern")
        .field("properties", [or(def("Property"), def("PropertyPattern"), def("SpreadPropertyPattern"), def("SpreadProperty") // Used by Esprima.
        )]);
    // Like ModuleSpecifier, except type:"ExportSpecifier" and buildable.
    // export {<id [as name]>} [from ...];
    def("ExportSpecifier")
        .bases("ModuleSpecifier")
        .build("id", "name");
    // export <*> from ...;
    def("ExportBatchSpecifier")
        .bases("Specifier")
        .build();
    def("ExportDeclaration")
        .bases("Declaration")
        .build("default", "declaration", "specifiers", "source")
        .field("default", Boolean)
        .field("declaration", or(def("Declaration"), def("Expression"), // Implies default.
    null))
        .field("specifiers", [or(def("ExportSpecifier"), def("ExportBatchSpecifier"))], defaults.emptyArray)
        .field("source", or(def("Literal"), null), defaults["null"]);
    def("Block")
        .bases("Comment")
        .build("value", /*optional:*/ "leading", "trailing");
    def("Line")
        .bases("Comment")
        .build("value", /*optional:*/ "leading", "trailing");
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./es2020":14,"tslib":31}],17:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var es_proposals_1 = tslib_1.__importDefault(require("./es-proposals"));
var type_annotations_1 = tslib_1.__importDefault(require("./type-annotations"));
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    fork.use(es_proposals_1.default);
    fork.use(type_annotations_1.default);
    var types = fork.use(types_1.default);
    var def = types.Type.def;
    var or = types.Type.or;
    var defaults = fork.use(shared_1.default).defaults;
    // Base types
    def("Flow").bases("Node");
    def("FlowType").bases("Flow");
    // Type annotations
    def("AnyTypeAnnotation")
        .bases("FlowType")
        .build();
    def("EmptyTypeAnnotation")
        .bases("FlowType")
        .build();
    def("MixedTypeAnnotation")
        .bases("FlowType")
        .build();
    def("VoidTypeAnnotation")
        .bases("FlowType")
        .build();
    def("SymbolTypeAnnotation")
        .bases("FlowType")
        .build();
    def("NumberTypeAnnotation")
        .bases("FlowType")
        .build();
    def("BigIntTypeAnnotation")
        .bases("FlowType")
        .build();
    def("NumberLiteralTypeAnnotation")
        .bases("FlowType")
        .build("value", "raw")
        .field("value", Number)
        .field("raw", String);
    // Babylon 6 differs in AST from Flow
    // same as NumberLiteralTypeAnnotation
    def("NumericLiteralTypeAnnotation")
        .bases("FlowType")
        .build("value", "raw")
        .field("value", Number)
        .field("raw", String);
    def("BigIntLiteralTypeAnnotation")
        .bases("FlowType")
        .build("value", "raw")
        .field("value", null)
        .field("raw", String);
    def("StringTypeAnnotation")
        .bases("FlowType")
        .build();
    def("StringLiteralTypeAnnotation")
        .bases("FlowType")
        .build("value", "raw")
        .field("value", String)
        .field("raw", String);
    def("BooleanTypeAnnotation")
        .bases("FlowType")
        .build();
    def("BooleanLiteralTypeAnnotation")
        .bases("FlowType")
        .build("value", "raw")
        .field("value", Boolean)
        .field("raw", String);
    def("TypeAnnotation")
        .bases("Node")
        .build("typeAnnotation")
        .field("typeAnnotation", def("FlowType"));
    def("NullableTypeAnnotation")
        .bases("FlowType")
        .build("typeAnnotation")
        .field("typeAnnotation", def("FlowType"));
    def("NullLiteralTypeAnnotation")
        .bases("FlowType")
        .build();
    def("NullTypeAnnotation")
        .bases("FlowType")
        .build();
    def("ThisTypeAnnotation")
        .bases("FlowType")
        .build();
    def("ExistsTypeAnnotation")
        .bases("FlowType")
        .build();
    def("ExistentialTypeParam")
        .bases("FlowType")
        .build();
    def("FunctionTypeAnnotation")
        .bases("FlowType")
        .build("params", "returnType", "rest", "typeParameters")
        .field("params", [def("FunctionTypeParam")])
        .field("returnType", def("FlowType"))
        .field("rest", or(def("FunctionTypeParam"), null))
        .field("typeParameters", or(def("TypeParameterDeclaration"), null));
    def("FunctionTypeParam")
        .bases("Node")
        .build("name", "typeAnnotation", "optional")
        .field("name", or(def("Identifier"), null))
        .field("typeAnnotation", def("FlowType"))
        .field("optional", Boolean);
    def("ArrayTypeAnnotation")
        .bases("FlowType")
        .build("elementType")
        .field("elementType", def("FlowType"));
    def("ObjectTypeAnnotation")
        .bases("FlowType")
        .build("properties", "indexers", "callProperties")
        .field("properties", [
        or(def("ObjectTypeProperty"), def("ObjectTypeSpreadProperty"))
    ])
        .field("indexers", [def("ObjectTypeIndexer")], defaults.emptyArray)
        .field("callProperties", [def("ObjectTypeCallProperty")], defaults.emptyArray)
        .field("inexact", or(Boolean, void 0), defaults["undefined"])
        .field("exact", Boolean, defaults["false"])
        .field("internalSlots", [def("ObjectTypeInternalSlot")], defaults.emptyArray);
    def("Variance")
        .bases("Node")
        .build("kind")
        .field("kind", or("plus", "minus"));
    var LegacyVariance = or(def("Variance"), "plus", "minus", null);
    def("ObjectTypeProperty")
        .bases("Node")
        .build("key", "value", "optional")
        .field("key", or(def("Literal"), def("Identifier")))
        .field("value", def("FlowType"))
        .field("optional", Boolean)
        .field("variance", LegacyVariance, defaults["null"]);
    def("ObjectTypeIndexer")
        .bases("Node")
        .build("id", "key", "value")
        .field("id", def("Identifier"))
        .field("key", def("FlowType"))
        .field("value", def("FlowType"))
        .field("variance", LegacyVariance, defaults["null"])
        .field("static", Boolean, defaults["false"]);
    def("ObjectTypeCallProperty")
        .bases("Node")
        .build("value")
        .field("value", def("FunctionTypeAnnotation"))
        .field("static", Boolean, defaults["false"]);
    def("QualifiedTypeIdentifier")
        .bases("Node")
        .build("qualification", "id")
        .field("qualification", or(def("Identifier"), def("QualifiedTypeIdentifier")))
        .field("id", def("Identifier"));
    def("GenericTypeAnnotation")
        .bases("FlowType")
        .build("id", "typeParameters")
        .field("id", or(def("Identifier"), def("QualifiedTypeIdentifier")))
        .field("typeParameters", or(def("TypeParameterInstantiation"), null));
    def("MemberTypeAnnotation")
        .bases("FlowType")
        .build("object", "property")
        .field("object", def("Identifier"))
        .field("property", or(def("MemberTypeAnnotation"), def("GenericTypeAnnotation")));
    def("UnionTypeAnnotation")
        .bases("FlowType")
        .build("types")
        .field("types", [def("FlowType")]);
    def("IntersectionTypeAnnotation")
        .bases("FlowType")
        .build("types")
        .field("types", [def("FlowType")]);
    def("TypeofTypeAnnotation")
        .bases("FlowType")
        .build("argument")
        .field("argument", def("FlowType"));
    def("ObjectTypeSpreadProperty")
        .bases("Node")
        .build("argument")
        .field("argument", def("FlowType"));
    def("ObjectTypeInternalSlot")
        .bases("Node")
        .build("id", "value", "optional", "static", "method")
        .field("id", def("Identifier"))
        .field("value", def("FlowType"))
        .field("optional", Boolean)
        .field("static", Boolean)
        .field("method", Boolean);
    def("TypeParameterDeclaration")
        .bases("Node")
        .build("params")
        .field("params", [def("TypeParameter")]);
    def("TypeParameterInstantiation")
        .bases("Node")
        .build("params")
        .field("params", [def("FlowType")]);
    def("TypeParameter")
        .bases("FlowType")
        .build("name", "variance", "bound", "default")
        .field("name", String)
        .field("variance", LegacyVariance, defaults["null"])
        .field("bound", or(def("TypeAnnotation"), null), defaults["null"])
        .field("default", or(def("FlowType"), null), defaults["null"]);
    def("ClassProperty")
        .field("variance", LegacyVariance, defaults["null"]);
    def("ClassImplements")
        .bases("Node")
        .build("id")
        .field("id", def("Identifier"))
        .field("superClass", or(def("Expression"), null), defaults["null"])
        .field("typeParameters", or(def("TypeParameterInstantiation"), null), defaults["null"]);
    def("InterfaceTypeAnnotation")
        .bases("FlowType")
        .build("body", "extends")
        .field("body", def("ObjectTypeAnnotation"))
        .field("extends", or([def("InterfaceExtends")], null), defaults["null"]);
    def("InterfaceDeclaration")
        .bases("Declaration")
        .build("id", "body", "extends")
        .field("id", def("Identifier"))
        .field("typeParameters", or(def("TypeParameterDeclaration"), null), defaults["null"])
        .field("body", def("ObjectTypeAnnotation"))
        .field("extends", [def("InterfaceExtends")]);
    def("DeclareInterface")
        .bases("InterfaceDeclaration")
        .build("id", "body", "extends");
    def("InterfaceExtends")
        .bases("Node")
        .build("id")
        .field("id", def("Identifier"))
        .field("typeParameters", or(def("TypeParameterInstantiation"), null), defaults["null"]);
    def("TypeAlias")
        .bases("Declaration")
        .build("id", "typeParameters", "right")
        .field("id", def("Identifier"))
        .field("typeParameters", or(def("TypeParameterDeclaration"), null))
        .field("right", def("FlowType"));
    def("DeclareTypeAlias")
        .bases("TypeAlias")
        .build("id", "typeParameters", "right");
    def("OpaqueType")
        .bases("Declaration")
        .build("id", "typeParameters", "impltype", "supertype")
        .field("id", def("Identifier"))
        .field("typeParameters", or(def("TypeParameterDeclaration"), null))
        .field("impltype", def("FlowType"))
        .field("supertype", or(def("FlowType"), null));
    def("DeclareOpaqueType")
        .bases("OpaqueType")
        .build("id", "typeParameters", "supertype")
        .field("impltype", or(def("FlowType"), null));
    def("TypeCastExpression")
        .bases("Expression")
        .build("expression", "typeAnnotation")
        .field("expression", def("Expression"))
        .field("typeAnnotation", def("TypeAnnotation"));
    def("TupleTypeAnnotation")
        .bases("FlowType")
        .build("types")
        .field("types", [def("FlowType")]);
    def("DeclareVariable")
        .bases("Statement")
        .build("id")
        .field("id", def("Identifier"));
    def("DeclareFunction")
        .bases("Statement")
        .build("id")
        .field("id", def("Identifier"))
        .field("predicate", or(def("FlowPredicate"), null), defaults["null"]);
    def("DeclareClass")
        .bases("InterfaceDeclaration")
        .build("id");
    def("DeclareModule")
        .bases("Statement")
        .build("id", "body")
        .field("id", or(def("Identifier"), def("Literal")))
        .field("body", def("BlockStatement"));
    def("DeclareModuleExports")
        .bases("Statement")
        .build("typeAnnotation")
        .field("typeAnnotation", def("TypeAnnotation"));
    def("DeclareExportDeclaration")
        .bases("Declaration")
        .build("default", "declaration", "specifiers", "source")
        .field("default", Boolean)
        .field("declaration", or(def("DeclareVariable"), def("DeclareFunction"), def("DeclareClass"), def("FlowType"), // Implies default.
    def("TypeAlias"), // Implies named type
    def("DeclareOpaqueType"), // Implies named opaque type
    def("InterfaceDeclaration"), null))
        .field("specifiers", [or(def("ExportSpecifier"), def("ExportBatchSpecifier"))], defaults.emptyArray)
        .field("source", or(def("Literal"), null), defaults["null"]);
    def("DeclareExportAllDeclaration")
        .bases("Declaration")
        .build("source")
        .field("source", or(def("Literal"), null), defaults["null"]);
    def("ImportDeclaration")
        .field("importKind", or("value", "type", "typeof"), function () { return "value"; });
    def("FlowPredicate").bases("Flow");
    def("InferredPredicate")
        .bases("FlowPredicate")
        .build();
    def("DeclaredPredicate")
        .bases("FlowPredicate")
        .build("value")
        .field("value", def("Expression"));
    def("Function")
        .field("predicate", or(def("FlowPredicate"), null), defaults["null"]);
    def("CallExpression")
        .field("typeArguments", or(null, def("TypeParameterInstantiation")), defaults["null"]);
    def("NewExpression")
        .field("typeArguments", or(null, def("TypeParameterInstantiation")), defaults["null"]);
    // Enums
    def("EnumDeclaration")
        .bases("Declaration")
        .build("id", "body")
        .field("id", def("Identifier"))
        .field("body", or(def("EnumBooleanBody"), def("EnumNumberBody"), def("EnumStringBody"), def("EnumSymbolBody")));
    def("EnumBooleanBody")
        .build("members", "explicitType")
        .field("members", [def("EnumBooleanMember")])
        .field("explicitType", Boolean);
    def("EnumNumberBody")
        .build("members", "explicitType")
        .field("members", [def("EnumNumberMember")])
        .field("explicitType", Boolean);
    def("EnumStringBody")
        .build("members", "explicitType")
        .field("members", or([def("EnumStringMember")], [def("EnumDefaultedMember")]))
        .field("explicitType", Boolean);
    def("EnumSymbolBody")
        .build("members")
        .field("members", [def("EnumDefaultedMember")]);
    def("EnumBooleanMember")
        .build("id", "init")
        .field("id", def("Identifier"))
        .field("init", or(def("Literal"), Boolean));
    def("EnumNumberMember")
        .build("id", "init")
        .field("id", def("Identifier"))
        .field("init", def("Literal"));
    def("EnumStringMember")
        .build("id", "init")
        .field("id", def("Identifier"))
        .field("init", def("Literal"));
    def("EnumDefaultedMember")
        .build("id")
        .field("id", def("Identifier"));
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./es-proposals":9,"./type-annotations":19,"tslib":31}],18:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var es2020_1 = tslib_1.__importDefault(require("./es2020"));
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    fork.use(es2020_1.default);
    var types = fork.use(types_1.default);
    var def = types.Type.def;
    var or = types.Type.or;
    var defaults = fork.use(shared_1.default).defaults;
    def("JSXAttribute")
        .bases("Node")
        .build("name", "value")
        .field("name", or(def("JSXIdentifier"), def("JSXNamespacedName")))
        .field("value", or(def("Literal"), // attr="value"
    def("JSXExpressionContainer"), // attr={value}
    def("JSXElement"), // attr=<div />
    def("JSXFragment"), // attr=<></>
    null // attr= or just attr
    ), defaults["null"]);
    def("JSXIdentifier")
        .bases("Identifier")
        .build("name")
        .field("name", String);
    def("JSXNamespacedName")
        .bases("Node")
        .build("namespace", "name")
        .field("namespace", def("JSXIdentifier"))
        .field("name", def("JSXIdentifier"));
    def("JSXMemberExpression")
        .bases("MemberExpression")
        .build("object", "property")
        .field("object", or(def("JSXIdentifier"), def("JSXMemberExpression")))
        .field("property", def("JSXIdentifier"))
        .field("computed", Boolean, defaults.false);
    var JSXElementName = or(def("JSXIdentifier"), def("JSXNamespacedName"), def("JSXMemberExpression"));
    def("JSXSpreadAttribute")
        .bases("Node")
        .build("argument")
        .field("argument", def("Expression"));
    var JSXAttributes = [or(def("JSXAttribute"), def("JSXSpreadAttribute"))];
    def("JSXExpressionContainer")
        .bases("Expression")
        .build("expression")
        .field("expression", or(def("Expression"), def("JSXEmptyExpression")));
    var JSXChildren = [or(def("JSXText"), def("JSXExpressionContainer"), def("JSXSpreadChild"), def("JSXElement"), def("JSXFragment"), def("Literal") // Legacy: Esprima should return JSXText instead.
        )];
    def("JSXElement")
        .bases("Expression")
        .build("openingElement", "closingElement", "children")
        .field("openingElement", def("JSXOpeningElement"))
        .field("closingElement", or(def("JSXClosingElement"), null), defaults["null"])
        .field("children", JSXChildren, defaults.emptyArray)
        .field("name", JSXElementName, function () {
        // Little-known fact: the `this` object inside a default function
        // is none other than the partially-built object itself, and any
        // fields initialized directly from builder function arguments
        // (like openingElement, closingElement, and children) are
        // guaranteed to be available.
        return this.openingElement.name;
    }, true) // hidden from traversal
        .field("selfClosing", Boolean, function () {
        return this.openingElement.selfClosing;
    }, true) // hidden from traversal
        .field("attributes", JSXAttributes, function () {
        return this.openingElement.attributes;
    }, true); // hidden from traversal
    def("JSXOpeningElement")
        .bases("Node")
        .build("name", "attributes", "selfClosing")
        .field("name", JSXElementName)
        .field("attributes", JSXAttributes, defaults.emptyArray)
        .field("selfClosing", Boolean, defaults["false"]);
    def("JSXClosingElement")
        .bases("Node")
        .build("name")
        .field("name", JSXElementName);
    def("JSXFragment")
        .bases("Expression")
        .build("openingFragment", "closingFragment", "children")
        .field("openingFragment", def("JSXOpeningFragment"))
        .field("closingFragment", def("JSXClosingFragment"))
        .field("children", JSXChildren, defaults.emptyArray);
    def("JSXOpeningFragment")
        .bases("Node")
        .build();
    def("JSXClosingFragment")
        .bases("Node")
        .build();
    def("JSXText")
        .bases("Literal")
        .build("value", "raw")
        .field("value", String)
        .field("raw", String, function () {
        return this.value;
    });
    def("JSXEmptyExpression")
        .bases("Node")
        .build();
    def("JSXSpreadChild")
        .bases("Node")
        .build("expression")
        .field("expression", def("Expression"));
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./es2020":14,"tslib":31}],19:[function(require,module,exports){
"use strict";;
/**
 * Type annotation defs shared between Flow and TypeScript.
 * These defs could not be defined in ./flow.ts or ./typescript.ts directly
 * because they use the same name.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    var types = fork.use(types_1.default);
    var def = types.Type.def;
    var or = types.Type.or;
    var defaults = fork.use(shared_1.default).defaults;
    var TypeAnnotation = or(def("TypeAnnotation"), def("TSTypeAnnotation"), null);
    var TypeParamDecl = or(def("TypeParameterDeclaration"), def("TSTypeParameterDeclaration"), null);
    def("Identifier")
        .field("typeAnnotation", TypeAnnotation, defaults["null"]);
    def("ObjectPattern")
        .field("typeAnnotation", TypeAnnotation, defaults["null"]);
    def("Function")
        .field("returnType", TypeAnnotation, defaults["null"])
        .field("typeParameters", TypeParamDecl, defaults["null"]);
    def("ClassProperty")
        .build("key", "value", "typeAnnotation", "static")
        .field("value", or(def("Expression"), null))
        .field("static", Boolean, defaults["false"])
        .field("typeAnnotation", TypeAnnotation, defaults["null"]);
    ["ClassDeclaration",
        "ClassExpression",
    ].forEach(function (typeName) {
        def(typeName)
            .field("typeParameters", TypeParamDecl, defaults["null"])
            .field("superTypeParameters", or(def("TypeParameterInstantiation"), def("TSTypeParameterInstantiation"), null), defaults["null"])
            .field("implements", or([def("ClassImplements")], [def("TSExpressionWithTypeArguments")]), defaults.emptyArray);
    });
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"tslib":31}],20:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var babel_core_1 = tslib_1.__importDefault(require("./babel-core"));
var type_annotations_1 = tslib_1.__importDefault(require("./type-annotations"));
var types_1 = tslib_1.__importDefault(require("../lib/types"));
var shared_1 = tslib_1.__importDefault(require("../lib/shared"));
function default_1(fork) {
    // Since TypeScript is parsed by Babylon, include the core Babylon types
    // but omit the Flow-related types.
    fork.use(babel_core_1.default);
    fork.use(type_annotations_1.default);
    var types = fork.use(types_1.default);
    var n = types.namedTypes;
    var def = types.Type.def;
    var or = types.Type.or;
    var defaults = fork.use(shared_1.default).defaults;
    var StringLiteral = types.Type.from(function (value, deep) {
        if (n.StringLiteral &&
            n.StringLiteral.check(value, deep)) {
            return true;
        }
        if (n.Literal &&
            n.Literal.check(value, deep) &&
            typeof value.value === "string") {
            return true;
        }
        return false;
    }, "StringLiteral");
    def("TSType")
        .bases("Node");
    var TSEntityName = or(def("Identifier"), def("TSQualifiedName"));
    def("TSTypeReference")
        .bases("TSType", "TSHasOptionalTypeParameterInstantiation")
        .build("typeName", "typeParameters")
        .field("typeName", TSEntityName);
    // An abstract (non-buildable) base type that provide a commonly-needed
    // optional .typeParameters field.
    def("TSHasOptionalTypeParameterInstantiation")
        .field("typeParameters", or(def("TSTypeParameterInstantiation"), null), defaults["null"]);
    // An abstract (non-buildable) base type that provide a commonly-needed
    // optional .typeParameters field.
    def("TSHasOptionalTypeParameters")
        .field("typeParameters", or(def("TSTypeParameterDeclaration"), null, void 0), defaults["null"]);
    // An abstract (non-buildable) base type that provide a commonly-needed
    // optional .typeAnnotation field.
    def("TSHasOptionalTypeAnnotation")
        .field("typeAnnotation", or(def("TSTypeAnnotation"), null), defaults["null"]);
    def("TSQualifiedName")
        .bases("Node")
        .build("left", "right")
        .field("left", TSEntityName)
        .field("right", TSEntityName);
    def("TSAsExpression")
        .bases("Expression", "Pattern")
        .build("expression", "typeAnnotation")
        .field("expression", def("Expression"))
        .field("typeAnnotation", def("TSType"))
        .field("extra", or({ parenthesized: Boolean }, null), defaults["null"]);
    def("TSNonNullExpression")
        .bases("Expression", "Pattern")
        .build("expression")
        .field("expression", def("Expression"));
    [
        "TSAnyKeyword",
        "TSBigIntKeyword",
        "TSBooleanKeyword",
        "TSNeverKeyword",
        "TSNullKeyword",
        "TSNumberKeyword",
        "TSObjectKeyword",
        "TSStringKeyword",
        "TSSymbolKeyword",
        "TSUndefinedKeyword",
        "TSUnknownKeyword",
        "TSVoidKeyword",
        "TSThisType",
    ].forEach(function (keywordType) {
        def(keywordType)
            .bases("TSType")
            .build();
    });
    def("TSArrayType")
        .bases("TSType")
        .build("elementType")
        .field("elementType", def("TSType"));
    def("TSLiteralType")
        .bases("TSType")
        .build("literal")
        .field("literal", or(def("NumericLiteral"), def("StringLiteral"), def("BooleanLiteral"), def("TemplateLiteral"), def("UnaryExpression")));
    ["TSUnionType",
        "TSIntersectionType",
    ].forEach(function (typeName) {
        def(typeName)
            .bases("TSType")
            .build("types")
            .field("types", [def("TSType")]);
    });
    def("TSConditionalType")
        .bases("TSType")
        .build("checkType", "extendsType", "trueType", "falseType")
        .field("checkType", def("TSType"))
        .field("extendsType", def("TSType"))
        .field("trueType", def("TSType"))
        .field("falseType", def("TSType"));
    def("TSInferType")
        .bases("TSType")
        .build("typeParameter")
        .field("typeParameter", def("TSTypeParameter"));
    def("TSParenthesizedType")
        .bases("TSType")
        .build("typeAnnotation")
        .field("typeAnnotation", def("TSType"));
    var ParametersType = [or(def("Identifier"), def("RestElement"), def("ArrayPattern"), def("ObjectPattern"))];
    ["TSFunctionType",
        "TSConstructorType",
    ].forEach(function (typeName) {
        def(typeName)
            .bases("TSType", "TSHasOptionalTypeParameters", "TSHasOptionalTypeAnnotation")
            .build("parameters")
            .field("parameters", ParametersType);
    });
    def("TSDeclareFunction")
        .bases("Declaration", "TSHasOptionalTypeParameters")
        .build("id", "params", "returnType")
        .field("declare", Boolean, defaults["false"])
        .field("async", Boolean, defaults["false"])
        .field("generator", Boolean, defaults["false"])
        .field("id", or(def("Identifier"), null), defaults["null"])
        .field("params", [def("Pattern")])
        // tSFunctionTypeAnnotationCommon
        .field("returnType", or(def("TSTypeAnnotation"), def("Noop"), // Still used?
    null), defaults["null"]);
    def("TSDeclareMethod")
        .bases("Declaration", "TSHasOptionalTypeParameters")
        .build("key", "params", "returnType")
        .field("async", Boolean, defaults["false"])
        .field("generator", Boolean, defaults["false"])
        .field("params", [def("Pattern")])
        // classMethodOrPropertyCommon
        .field("abstract", Boolean, defaults["false"])
        .field("accessibility", or("public", "private", "protected", void 0), defaults["undefined"])
        .field("static", Boolean, defaults["false"])
        .field("computed", Boolean, defaults["false"])
        .field("optional", Boolean, defaults["false"])
        .field("key", or(def("Identifier"), def("StringLiteral"), def("NumericLiteral"), 
    // Only allowed if .computed is true.
    def("Expression")))
        // classMethodOrDeclareMethodCommon
        .field("kind", or("get", "set", "method", "constructor"), function getDefault() { return "method"; })
        .field("access", // Not "accessibility"?
    or("public", "private", "protected", void 0), defaults["undefined"])
        .field("decorators", or([def("Decorator")], null), defaults["null"])
        // tSFunctionTypeAnnotationCommon
        .field("returnType", or(def("TSTypeAnnotation"), def("Noop"), // Still used?
    null), defaults["null"]);
    def("TSMappedType")
        .bases("TSType")
        .build("typeParameter", "typeAnnotation")
        .field("readonly", or(Boolean, "+", "-"), defaults["false"])
        .field("typeParameter", def("TSTypeParameter"))
        .field("optional", or(Boolean, "+", "-"), defaults["false"])
        .field("typeAnnotation", or(def("TSType"), null), defaults["null"]);
    def("TSTupleType")
        .bases("TSType")
        .build("elementTypes")
        .field("elementTypes", [or(def("TSType"), def("TSNamedTupleMember"))]);
    def("TSNamedTupleMember")
        .bases("TSType")
        .build("label", "elementType", "optional")
        .field("label", def("Identifier"))
        .field("optional", Boolean, defaults["false"])
        .field("elementType", def("TSType"));
    def("TSRestType")
        .bases("TSType")
        .build("typeAnnotation")
        .field("typeAnnotation", def("TSType"));
    def("TSOptionalType")
        .bases("TSType")
        .build("typeAnnotation")
        .field("typeAnnotation", def("TSType"));
    def("TSIndexedAccessType")
        .bases("TSType")
        .build("objectType", "indexType")
        .field("objectType", def("TSType"))
        .field("indexType", def("TSType"));
    def("TSTypeOperator")
        .bases("TSType")
        .build("operator")
        .field("operator", String)
        .field("typeAnnotation", def("TSType"));
    def("TSTypeAnnotation")
        .bases("Node")
        .build("typeAnnotation")
        .field("typeAnnotation", or(def("TSType"), def("TSTypeAnnotation")));
    def("TSIndexSignature")
        .bases("Declaration", "TSHasOptionalTypeAnnotation")
        .build("parameters", "typeAnnotation")
        .field("parameters", [def("Identifier")]) // Length === 1
        .field("readonly", Boolean, defaults["false"]);
    def("TSPropertySignature")
        .bases("Declaration", "TSHasOptionalTypeAnnotation")
        .build("key", "typeAnnotation", "optional")
        .field("key", def("Expression"))
        .field("computed", Boolean, defaults["false"])
        .field("readonly", Boolean, defaults["false"])
        .field("optional", Boolean, defaults["false"])
        .field("initializer", or(def("Expression"), null), defaults["null"]);
    def("TSMethodSignature")
        .bases("Declaration", "TSHasOptionalTypeParameters", "TSHasOptionalTypeAnnotation")
        .build("key", "parameters", "typeAnnotation")
        .field("key", def("Expression"))
        .field("computed", Boolean, defaults["false"])
        .field("optional", Boolean, defaults["false"])
        .field("parameters", ParametersType);
    def("TSTypePredicate")
        .bases("TSTypeAnnotation", "TSType")
        .build("parameterName", "typeAnnotation", "asserts")
        .field("parameterName", or(def("Identifier"), def("TSThisType")))
        .field("typeAnnotation", or(def("TSTypeAnnotation"), null), defaults["null"])
        .field("asserts", Boolean, defaults["false"]);
    ["TSCallSignatureDeclaration",
        "TSConstructSignatureDeclaration",
    ].forEach(function (typeName) {
        def(typeName)
            .bases("Declaration", "TSHasOptionalTypeParameters", "TSHasOptionalTypeAnnotation")
            .build("parameters", "typeAnnotation")
            .field("parameters", ParametersType);
    });
    def("TSEnumMember")
        .bases("Node")
        .build("id", "initializer")
        .field("id", or(def("Identifier"), StringLiteral))
        .field("initializer", or(def("Expression"), null), defaults["null"]);
    def("TSTypeQuery")
        .bases("TSType")
        .build("exprName")
        .field("exprName", or(TSEntityName, def("TSImportType")));
    // Inferred from Babylon's tsParseTypeMember method.
    var TSTypeMember = or(def("TSCallSignatureDeclaration"), def("TSConstructSignatureDeclaration"), def("TSIndexSignature"), def("TSMethodSignature"), def("TSPropertySignature"));
    def("TSTypeLiteral")
        .bases("TSType")
        .build("members")
        .field("members", [TSTypeMember]);
    def("TSTypeParameter")
        .bases("Identifier")
        .build("name", "constraint", "default")
        .field("name", String)
        .field("constraint", or(def("TSType"), void 0), defaults["undefined"])
        .field("default", or(def("TSType"), void 0), defaults["undefined"]);
    def("TSTypeAssertion")
        .bases("Expression", "Pattern")
        .build("typeAnnotation", "expression")
        .field("typeAnnotation", def("TSType"))
        .field("expression", def("Expression"))
        .field("extra", or({ parenthesized: Boolean }, null), defaults["null"]);
    def("TSTypeParameterDeclaration")
        .bases("Declaration")
        .build("params")
        .field("params", [def("TSTypeParameter")]);
    def("TSTypeParameterInstantiation")
        .bases("Node")
        .build("params")
        .field("params", [def("TSType")]);
    def("TSEnumDeclaration")
        .bases("Declaration")
        .build("id", "members")
        .field("id", def("Identifier"))
        .field("const", Boolean, defaults["false"])
        .field("declare", Boolean, defaults["false"])
        .field("members", [def("TSEnumMember")])
        .field("initializer", or(def("Expression"), null), defaults["null"]);
    def("TSTypeAliasDeclaration")
        .bases("Declaration", "TSHasOptionalTypeParameters")
        .build("id", "typeAnnotation")
        .field("id", def("Identifier"))
        .field("declare", Boolean, defaults["false"])
        .field("typeAnnotation", def("TSType"));
    def("TSModuleBlock")
        .bases("Node")
        .build("body")
        .field("body", [def("Statement")]);
    def("TSModuleDeclaration")
        .bases("Declaration")
        .build("id", "body")
        .field("id", or(StringLiteral, TSEntityName))
        .field("declare", Boolean, defaults["false"])
        .field("global", Boolean, defaults["false"])
        .field("body", or(def("TSModuleBlock"), def("TSModuleDeclaration"), null), defaults["null"]);
    def("TSImportType")
        .bases("TSType", "TSHasOptionalTypeParameterInstantiation")
        .build("argument", "qualifier", "typeParameters")
        .field("argument", StringLiteral)
        .field("qualifier", or(TSEntityName, void 0), defaults["undefined"]);
    def("TSImportEqualsDeclaration")
        .bases("Declaration")
        .build("id", "moduleReference")
        .field("id", def("Identifier"))
        .field("isExport", Boolean, defaults["false"])
        .field("moduleReference", or(TSEntityName, def("TSExternalModuleReference")));
    def("TSExternalModuleReference")
        .bases("Declaration")
        .build("expression")
        .field("expression", StringLiteral);
    def("TSExportAssignment")
        .bases("Statement")
        .build("expression")
        .field("expression", def("Expression"));
    def("TSNamespaceExportDeclaration")
        .bases("Declaration")
        .build("id")
        .field("id", def("Identifier"));
    def("TSInterfaceBody")
        .bases("Node")
        .build("body")
        .field("body", [TSTypeMember]);
    def("TSExpressionWithTypeArguments")
        .bases("TSType", "TSHasOptionalTypeParameterInstantiation")
        .build("expression", "typeParameters")
        .field("expression", TSEntityName);
    def("TSInterfaceDeclaration")
        .bases("Declaration", "TSHasOptionalTypeParameters")
        .build("id", "body")
        .field("id", TSEntityName)
        .field("declare", Boolean, defaults["false"])
        .field("extends", or([def("TSExpressionWithTypeArguments")], null), defaults["null"])
        .field("body", def("TSInterfaceBody"));
    def("TSParameterProperty")
        .bases("Pattern")
        .build("parameter")
        .field("accessibility", or("public", "private", "protected", void 0), defaults["undefined"])
        .field("readonly", Boolean, defaults["false"])
        .field("parameter", or(def("Identifier"), def("AssignmentPattern")));
    def("ClassProperty")
        .field("access", // Not "accessibility"?
    or("public", "private", "protected", void 0), defaults["undefined"]);
    // Defined already in es6 and babel-core.
    def("ClassBody")
        .field("body", [or(def("MethodDefinition"), def("VariableDeclarator"), def("ClassPropertyDefinition"), def("ClassProperty"), def("ClassPrivateProperty"), def("ClassMethod"), def("ClassPrivateMethod"), 
        // Just need to add these types:
        def("TSDeclareMethod"), TSTypeMember)]);
}
exports.default = default_1;
module.exports = exports["default"];

},{"../lib/shared":28,"../lib/types":29,"./babel-core":5,"./type-annotations":19,"tslib":31}],21:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var types_1 = tslib_1.__importDefault(require("./lib/types"));
var path_visitor_1 = tslib_1.__importDefault(require("./lib/path-visitor"));
var equiv_1 = tslib_1.__importDefault(require("./lib/equiv"));
var path_1 = tslib_1.__importDefault(require("./lib/path"));
var node_path_1 = tslib_1.__importDefault(require("./lib/node-path"));
function default_1(defs) {
    var fork = createFork();
    var types = fork.use(types_1.default);
    defs.forEach(fork.use);
    types.finalize();
    var PathVisitor = fork.use(path_visitor_1.default);
    return {
        Type: types.Type,
        builtInTypes: types.builtInTypes,
        namedTypes: types.namedTypes,
        builders: types.builders,
        defineMethod: types.defineMethod,
        getFieldNames: types.getFieldNames,
        getFieldValue: types.getFieldValue,
        eachField: types.eachField,
        someField: types.someField,
        getSupertypeNames: types.getSupertypeNames,
        getBuilderName: types.getBuilderName,
        astNodesAreEquivalent: fork.use(equiv_1.default),
        finalize: types.finalize,
        Path: fork.use(path_1.default),
        NodePath: fork.use(node_path_1.default),
        PathVisitor: PathVisitor,
        use: fork.use,
        visit: PathVisitor.visit,
    };
}
exports.default = default_1;
function createFork() {
    var used = [];
    var usedResult = [];
    function use(plugin) {
        var idx = used.indexOf(plugin);
        if (idx === -1) {
            idx = used.length;
            used.push(plugin);
            usedResult[idx] = plugin(fork);
        }
        return usedResult[idx];
    }
    var fork = { use: use };
    return fork;
}
module.exports = exports["default"];

},{"./lib/equiv":23,"./lib/node-path":24,"./lib/path":26,"./lib/path-visitor":25,"./lib/types":29,"tslib":31}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.namedTypes = void 0;
var namedTypes;
(function (namedTypes) {
})(namedTypes = exports.namedTypes || (exports.namedTypes = {}));

},{}],23:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var types_1 = tslib_1.__importDefault(require("./types"));
function default_1(fork) {
    var types = fork.use(types_1.default);
    var getFieldNames = types.getFieldNames;
    var getFieldValue = types.getFieldValue;
    var isArray = types.builtInTypes.array;
    var isObject = types.builtInTypes.object;
    var isDate = types.builtInTypes.Date;
    var isRegExp = types.builtInTypes.RegExp;
    var hasOwn = Object.prototype.hasOwnProperty;
    function astNodesAreEquivalent(a, b, problemPath) {
        if (isArray.check(problemPath)) {
            problemPath.length = 0;
        }
        else {
            problemPath = null;
        }
        return areEquivalent(a, b, problemPath);
    }
    astNodesAreEquivalent.assert = function (a, b) {
        var problemPath = [];
        if (!astNodesAreEquivalent(a, b, problemPath)) {
            if (problemPath.length === 0) {
                if (a !== b) {
                    throw new Error("Nodes must be equal");
                }
            }
            else {
                throw new Error("Nodes differ in the following path: " +
                    problemPath.map(subscriptForProperty).join(""));
            }
        }
    };
    function subscriptForProperty(property) {
        if (/[_$a-z][_$a-z0-9]*/i.test(property)) {
            return "." + property;
        }
        return "[" + JSON.stringify(property) + "]";
    }
    function areEquivalent(a, b, problemPath) {
        if (a === b) {
            return true;
        }
        if (isArray.check(a)) {
            return arraysAreEquivalent(a, b, problemPath);
        }
        if (isObject.check(a)) {
            return objectsAreEquivalent(a, b, problemPath);
        }
        if (isDate.check(a)) {
            return isDate.check(b) && (+a === +b);
        }
        if (isRegExp.check(a)) {
            return isRegExp.check(b) && (a.source === b.source &&
                a.global === b.global &&
                a.multiline === b.multiline &&
                a.ignoreCase === b.ignoreCase);
        }
        return a == b;
    }
    function arraysAreEquivalent(a, b, problemPath) {
        isArray.assert(a);
        var aLength = a.length;
        if (!isArray.check(b) || b.length !== aLength) {
            if (problemPath) {
                problemPath.push("length");
            }
            return false;
        }
        for (var i = 0; i < aLength; ++i) {
            if (problemPath) {
                problemPath.push(i);
            }
            if (i in a !== i in b) {
                return false;
            }
            if (!areEquivalent(a[i], b[i], problemPath)) {
                return false;
            }
            if (problemPath) {
                var problemPathTail = problemPath.pop();
                if (problemPathTail !== i) {
                    throw new Error("" + problemPathTail);
                }
            }
        }
        return true;
    }
    function objectsAreEquivalent(a, b, problemPath) {
        isObject.assert(a);
        if (!isObject.check(b)) {
            return false;
        }
        // Fast path for a common property of AST nodes.
        if (a.type !== b.type) {
            if (problemPath) {
                problemPath.push("type");
            }
            return false;
        }
        var aNames = getFieldNames(a);
        var aNameCount = aNames.length;
        var bNames = getFieldNames(b);
        var bNameCount = bNames.length;
        if (aNameCount === bNameCount) {
            for (var i = 0; i < aNameCount; ++i) {
                var name = aNames[i];
                var aChild = getFieldValue(a, name);
                var bChild = getFieldValue(b, name);
                if (problemPath) {
                    problemPath.push(name);
                }
                if (!areEquivalent(aChild, bChild, problemPath)) {
                    return false;
                }
                if (problemPath) {
                    var problemPathTail = problemPath.pop();
                    if (problemPathTail !== name) {
                        throw new Error("" + problemPathTail);
                    }
                }
            }
            return true;
        }
        if (!problemPath) {
            return false;
        }
        // Since aNameCount !== bNameCount, we need to find some name that's
        // missing in aNames but present in bNames, or vice-versa.
        var seenNames = Object.create(null);
        for (i = 0; i < aNameCount; ++i) {
            seenNames[aNames[i]] = true;
        }
        for (i = 0; i < bNameCount; ++i) {
            name = bNames[i];
            if (!hasOwn.call(seenNames, name)) {
                problemPath.push(name);
                return false;
            }
            delete seenNames[name];
        }
        for (name in seenNames) {
            problemPath.push(name);
            break;
        }
        return false;
    }
    return astNodesAreEquivalent;
}
exports.default = default_1;
module.exports = exports["default"];

},{"./types":29,"tslib":31}],24:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var types_1 = tslib_1.__importDefault(require("./types"));
var path_1 = tslib_1.__importDefault(require("./path"));
var scope_1 = tslib_1.__importDefault(require("./scope"));
function nodePathPlugin(fork) {
    var types = fork.use(types_1.default);
    var n = types.namedTypes;
    var b = types.builders;
    var isNumber = types.builtInTypes.number;
    var isArray = types.builtInTypes.array;
    var Path = fork.use(path_1.default);
    var Scope = fork.use(scope_1.default);
    var NodePath = function NodePath(value, parentPath, name) {
        if (!(this instanceof NodePath)) {
            throw new Error("NodePath constructor cannot be invoked without 'new'");
        }
        Path.call(this, value, parentPath, name);
    };
    var NPp = NodePath.prototype = Object.create(Path.prototype, {
        constructor: {
            value: NodePath,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
    Object.defineProperties(NPp, {
        node: {
            get: function () {
                Object.defineProperty(this, "node", {
                    configurable: true,
                    value: this._computeNode()
                });
                return this.node;
            }
        },
        parent: {
            get: function () {
                Object.defineProperty(this, "parent", {
                    configurable: true,
                    value: this._computeParent()
                });
                return this.parent;
            }
        },
        scope: {
            get: function () {
                Object.defineProperty(this, "scope", {
                    configurable: true,
                    value: this._computeScope()
                });
                return this.scope;
            }
        }
    });
    NPp.replace = function () {
        delete this.node;
        delete this.parent;
        delete this.scope;
        return Path.prototype.replace.apply(this, arguments);
    };
    NPp.prune = function () {
        var remainingNodePath = this.parent;
        this.replace();
        return cleanUpNodesAfterPrune(remainingNodePath);
    };
    // The value of the first ancestor Path whose value is a Node.
    NPp._computeNode = function () {
        var value = this.value;
        if (n.Node.check(value)) {
            return value;
        }
        var pp = this.parentPath;
        return pp && pp.node || null;
    };
    // The first ancestor Path whose value is a Node distinct from this.node.
    NPp._computeParent = function () {
        var value = this.value;
        var pp = this.parentPath;
        if (!n.Node.check(value)) {
            while (pp && !n.Node.check(pp.value)) {
                pp = pp.parentPath;
            }
            if (pp) {
                pp = pp.parentPath;
            }
        }
        while (pp && !n.Node.check(pp.value)) {
            pp = pp.parentPath;
        }
        return pp || null;
    };
    // The closest enclosing scope that governs this node.
    NPp._computeScope = function () {
        var value = this.value;
        var pp = this.parentPath;
        var scope = pp && pp.scope;
        if (n.Node.check(value) &&
            Scope.isEstablishedBy(value)) {
            scope = new Scope(this, scope);
        }
        return scope || null;
    };
    NPp.getValueProperty = function (name) {
        return types.getFieldValue(this.value, name);
    };
    /**
     * Determine whether this.node needs to be wrapped in parentheses in order
     * for a parser to reproduce the same local AST structure.
     *
     * For instance, in the expression `(1 + 2) * 3`, the BinaryExpression
     * whose operator is "+" needs parentheses, because `1 + 2 * 3` would
     * parse differently.
     *
     * If assumeExpressionContext === true, we don't worry about edge cases
     * like an anonymous FunctionExpression appearing lexically first in its
     * enclosing statement and thus needing parentheses to avoid being parsed
     * as a FunctionDeclaration with a missing name.
     */
    NPp.needsParens = function (assumeExpressionContext) {
        var pp = this.parentPath;
        if (!pp) {
            return false;
        }
        var node = this.value;
        // Only expressions need parentheses.
        if (!n.Expression.check(node)) {
            return false;
        }
        // Identifiers never need parentheses.
        if (node.type === "Identifier") {
            return false;
        }
        while (!n.Node.check(pp.value)) {
            pp = pp.parentPath;
            if (!pp) {
                return false;
            }
        }
        var parent = pp.value;
        switch (node.type) {
            case "UnaryExpression":
            case "SpreadElement":
            case "SpreadProperty":
                return parent.type === "MemberExpression"
                    && this.name === "object"
                    && parent.object === node;
            case "BinaryExpression":
            case "LogicalExpression":
                switch (parent.type) {
                    case "CallExpression":
                        return this.name === "callee"
                            && parent.callee === node;
                    case "UnaryExpression":
                    case "SpreadElement":
                    case "SpreadProperty":
                        return true;
                    case "MemberExpression":
                        return this.name === "object"
                            && parent.object === node;
                    case "BinaryExpression":
                    case "LogicalExpression": {
                        var n_1 = node;
                        var po = parent.operator;
                        var pp_1 = PRECEDENCE[po];
                        var no = n_1.operator;
                        var np = PRECEDENCE[no];
                        if (pp_1 > np) {
                            return true;
                        }
                        if (pp_1 === np && this.name === "right") {
                            if (parent.right !== n_1) {
                                throw new Error("Nodes must be equal");
                            }
                            return true;
                        }
                    }
                    default:
                        return false;
                }
            case "SequenceExpression":
                switch (parent.type) {
                    case "ForStatement":
                        // Although parentheses wouldn't hurt around sequence
                        // expressions in the head of for loops, traditional style
                        // dictates that e.g. i++, j++ should not be wrapped with
                        // parentheses.
                        return false;
                    case "ExpressionStatement":
                        return this.name !== "expression";
                    default:
                        // Otherwise err on the side of overparenthesization, adding
                        // explicit exceptions above if this proves overzealous.
                        return true;
                }
            case "YieldExpression":
                switch (parent.type) {
                    case "BinaryExpression":
                    case "LogicalExpression":
                    case "UnaryExpression":
                    case "SpreadElement":
                    case "SpreadProperty":
                    case "CallExpression":
                    case "MemberExpression":
                    case "NewExpression":
                    case "ConditionalExpression":
                    case "YieldExpression":
                        return true;
                    default:
                        return false;
                }
            case "Literal":
                return parent.type === "MemberExpression"
                    && isNumber.check(node.value)
                    && this.name === "object"
                    && parent.object === node;
            case "AssignmentExpression":
            case "ConditionalExpression":
                switch (parent.type) {
                    case "UnaryExpression":
                    case "SpreadElement":
                    case "SpreadProperty":
                    case "BinaryExpression":
                    case "LogicalExpression":
                        return true;
                    case "CallExpression":
                        return this.name === "callee"
                            && parent.callee === node;
                    case "ConditionalExpression":
                        return this.name === "test"
                            && parent.test === node;
                    case "MemberExpression":
                        return this.name === "object"
                            && parent.object === node;
                    default:
                        return false;
                }
            default:
                if (parent.type === "NewExpression" &&
                    this.name === "callee" &&
                    parent.callee === node) {
                    return containsCallExpression(node);
                }
        }
        if (assumeExpressionContext !== true &&
            !this.canBeFirstInStatement() &&
            this.firstInStatement())
            return true;
        return false;
    };
    function isBinary(node) {
        return n.BinaryExpression.check(node)
            || n.LogicalExpression.check(node);
    }
    // @ts-ignore 'isUnaryLike' is declared but its value is never read. [6133]
    function isUnaryLike(node) {
        return n.UnaryExpression.check(node)
            // I considered making SpreadElement and SpreadProperty subtypes
            // of UnaryExpression, but they're not really Expression nodes.
            || (n.SpreadElement && n.SpreadElement.check(node))
            || (n.SpreadProperty && n.SpreadProperty.check(node));
    }
    var PRECEDENCE = {};
    [["||"],
        ["&&"],
        ["|"],
        ["^"],
        ["&"],
        ["==", "===", "!=", "!=="],
        ["<", ">", "<=", ">=", "in", "instanceof"],
        [">>", "<<", ">>>"],
        ["+", "-"],
        ["*", "/", "%"]
    ].forEach(function (tier, i) {
        tier.forEach(function (op) {
            PRECEDENCE[op] = i;
        });
    });
    function containsCallExpression(node) {
        if (n.CallExpression.check(node)) {
            return true;
        }
        if (isArray.check(node)) {
            return node.some(containsCallExpression);
        }
        if (n.Node.check(node)) {
            return types.someField(node, function (_name, child) {
                return containsCallExpression(child);
            });
        }
        return false;
    }
    NPp.canBeFirstInStatement = function () {
        var node = this.node;
        return !n.FunctionExpression.check(node)
            && !n.ObjectExpression.check(node);
    };
    NPp.firstInStatement = function () {
        return firstInStatement(this);
    };
    function firstInStatement(path) {
        for (var node, parent; path.parent; path = path.parent) {
            node = path.node;
            parent = path.parent.node;
            if (n.BlockStatement.check(parent) &&
                path.parent.name === "body" &&
                path.name === 0) {
                if (parent.body[0] !== node) {
                    throw new Error("Nodes must be equal");
                }
                return true;
            }
            if (n.ExpressionStatement.check(parent) &&
                path.name === "expression") {
                if (parent.expression !== node) {
                    throw new Error("Nodes must be equal");
                }
                return true;
            }
            if (n.SequenceExpression.check(parent) &&
                path.parent.name === "expressions" &&
                path.name === 0) {
                if (parent.expressions[0] !== node) {
                    throw new Error("Nodes must be equal");
                }
                continue;
            }
            if (n.CallExpression.check(parent) &&
                path.name === "callee") {
                if (parent.callee !== node) {
                    throw new Error("Nodes must be equal");
                }
                continue;
            }
            if (n.MemberExpression.check(parent) &&
                path.name === "object") {
                if (parent.object !== node) {
                    throw new Error("Nodes must be equal");
                }
                continue;
            }
            if (n.ConditionalExpression.check(parent) &&
                path.name === "test") {
                if (parent.test !== node) {
                    throw new Error("Nodes must be equal");
                }
                continue;
            }
            if (isBinary(parent) &&
                path.name === "left") {
                if (parent.left !== node) {
                    throw new Error("Nodes must be equal");
                }
                continue;
            }
            if (n.UnaryExpression.check(parent) &&
                !parent.prefix &&
                path.name === "argument") {
                if (parent.argument !== node) {
                    throw new Error("Nodes must be equal");
                }
                continue;
            }
            return false;
        }
        return true;
    }
    /**
     * Pruning certain nodes will result in empty or incomplete nodes, here we clean those nodes up.
     */
    function cleanUpNodesAfterPrune(remainingNodePath) {
        if (n.VariableDeclaration.check(remainingNodePath.node)) {
            var declarations = remainingNodePath.get('declarations').value;
            if (!declarations || declarations.length === 0) {
                return remainingNodePath.prune();
            }
        }
        else if (n.ExpressionStatement.check(remainingNodePath.node)) {
            if (!remainingNodePath.get('expression').value) {
                return remainingNodePath.prune();
            }
        }
        else if (n.IfStatement.check(remainingNodePath.node)) {
            cleanUpIfStatementAfterPrune(remainingNodePath);
        }
        return remainingNodePath;
    }
    function cleanUpIfStatementAfterPrune(ifStatement) {
        var testExpression = ifStatement.get('test').value;
        var alternate = ifStatement.get('alternate').value;
        var consequent = ifStatement.get('consequent').value;
        if (!consequent && !alternate) {
            var testExpressionStatement = b.expressionStatement(testExpression);
            ifStatement.replace(testExpressionStatement);
        }
        else if (!consequent && alternate) {
            var negatedTestExpression = b.unaryExpression('!', testExpression, true);
            if (n.UnaryExpression.check(testExpression) && testExpression.operator === '!') {
                negatedTestExpression = testExpression.argument;
            }
            ifStatement.get("test").replace(negatedTestExpression);
            ifStatement.get("consequent").replace(alternate);
            ifStatement.get("alternate").replace();
        }
    }
    return NodePath;
}
exports.default = nodePathPlugin;
module.exports = exports["default"];

},{"./path":26,"./scope":27,"./types":29,"tslib":31}],25:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var types_1 = tslib_1.__importDefault(require("./types"));
var node_path_1 = tslib_1.__importDefault(require("./node-path"));
var hasOwn = Object.prototype.hasOwnProperty;
function pathVisitorPlugin(fork) {
    var types = fork.use(types_1.default);
    var NodePath = fork.use(node_path_1.default);
    var isArray = types.builtInTypes.array;
    var isObject = types.builtInTypes.object;
    var isFunction = types.builtInTypes.function;
    var undefined;
    var PathVisitor = function PathVisitor() {
        if (!(this instanceof PathVisitor)) {
            throw new Error("PathVisitor constructor cannot be invoked without 'new'");
        }
        // Permanent state.
        this._reusableContextStack = [];
        this._methodNameTable = computeMethodNameTable(this);
        this._shouldVisitComments =
            hasOwn.call(this._methodNameTable, "Block") ||
                hasOwn.call(this._methodNameTable, "Line");
        this.Context = makeContextConstructor(this);
        // State reset every time PathVisitor.prototype.visit is called.
        this._visiting = false;
        this._changeReported = false;
    };
    function computeMethodNameTable(visitor) {
        var typeNames = Object.create(null);
        for (var methodName in visitor) {
            if (/^visit[A-Z]/.test(methodName)) {
                typeNames[methodName.slice("visit".length)] = true;
            }
        }
        var supertypeTable = types.computeSupertypeLookupTable(typeNames);
        var methodNameTable = Object.create(null);
        var typeNameKeys = Object.keys(supertypeTable);
        var typeNameCount = typeNameKeys.length;
        for (var i = 0; i < typeNameCount; ++i) {
            var typeName = typeNameKeys[i];
            methodName = "visit" + supertypeTable[typeName];
            if (isFunction.check(visitor[methodName])) {
                methodNameTable[typeName] = methodName;
            }
        }
        return methodNameTable;
    }
    PathVisitor.fromMethodsObject = function fromMethodsObject(methods) {
        if (methods instanceof PathVisitor) {
            return methods;
        }
        if (!isObject.check(methods)) {
            // An empty visitor?
            return new PathVisitor;
        }
        var Visitor = function Visitor() {
            if (!(this instanceof Visitor)) {
                throw new Error("Visitor constructor cannot be invoked without 'new'");
            }
            PathVisitor.call(this);
        };
        var Vp = Visitor.prototype = Object.create(PVp);
        Vp.constructor = Visitor;
        extend(Vp, methods);
        extend(Visitor, PathVisitor);
        isFunction.assert(Visitor.fromMethodsObject);
        isFunction.assert(Visitor.visit);
        return new Visitor;
    };
    function extend(target, source) {
        for (var property in source) {
            if (hasOwn.call(source, property)) {
                target[property] = source[property];
            }
        }
        return target;
    }
    PathVisitor.visit = function visit(node, methods) {
        return PathVisitor.fromMethodsObject(methods).visit(node);
    };
    var PVp = PathVisitor.prototype;
    PVp.visit = function () {
        if (this._visiting) {
            throw new Error("Recursively calling visitor.visit(path) resets visitor state. " +
                "Try this.visit(path) or this.traverse(path) instead.");
        }
        // Private state that needs to be reset before every traversal.
        this._visiting = true;
        this._changeReported = false;
        this._abortRequested = false;
        var argc = arguments.length;
        var args = new Array(argc);
        for (var i = 0; i < argc; ++i) {
            args[i] = arguments[i];
        }
        if (!(args[0] instanceof NodePath)) {
            args[0] = new NodePath({ root: args[0] }).get("root");
        }
        // Called with the same arguments as .visit.
        this.reset.apply(this, args);
        var didNotThrow;
        try {
            var root = this.visitWithoutReset(args[0]);
            didNotThrow = true;
        }
        finally {
            this._visiting = false;
            if (!didNotThrow && this._abortRequested) {
                // If this.visitWithoutReset threw an exception and
                // this._abortRequested was set to true, return the root of
                // the AST instead of letting the exception propagate, so that
                // client code does not have to provide a try-catch block to
                // intercept the AbortRequest exception.  Other kinds of
                // exceptions will propagate without being intercepted and
                // rethrown by a catch block, so their stacks will accurately
                // reflect the original throwing context.
                return args[0].value;
            }
        }
        return root;
    };
    PVp.AbortRequest = function AbortRequest() { };
    PVp.abort = function () {
        var visitor = this;
        visitor._abortRequested = true;
        var request = new visitor.AbortRequest();
        // If you decide to catch this exception and stop it from propagating,
        // make sure to call its cancel method to avoid silencing other
        // exceptions that might be thrown later in the traversal.
        request.cancel = function () {
            visitor._abortRequested = false;
        };
        throw request;
    };
    PVp.reset = function (_path /*, additional arguments */) {
        // Empty stub; may be reassigned or overridden by subclasses.
    };
    PVp.visitWithoutReset = function (path) {
        if (this instanceof this.Context) {
            // Since this.Context.prototype === this, there's a chance we
            // might accidentally call context.visitWithoutReset. If that
            // happens, re-invoke the method against context.visitor.
            return this.visitor.visitWithoutReset(path);
        }
        if (!(path instanceof NodePath)) {
            throw new Error("");
        }
        var value = path.value;
        var methodName = value &&
            typeof value === "object" &&
            typeof value.type === "string" &&
            this._methodNameTable[value.type];
        if (methodName) {
            var context = this.acquireContext(path);
            try {
                return context.invokeVisitorMethod(methodName);
            }
            finally {
                this.releaseContext(context);
            }
        }
        else {
            // If there was no visitor method to call, visit the children of
            // this node generically.
            return visitChildren(path, this);
        }
    };
    function visitChildren(path, visitor) {
        if (!(path instanceof NodePath)) {
            throw new Error("");
        }
        if (!(visitor instanceof PathVisitor)) {
            throw new Error("");
        }
        var value = path.value;
        if (isArray.check(value)) {
            path.each(visitor.visitWithoutReset, visitor);
        }
        else if (!isObject.check(value)) {
            // No children to visit.
        }
        else {
            var childNames = types.getFieldNames(value);
            // The .comments field of the Node type is hidden, so we only
            // visit it if the visitor defines visitBlock or visitLine, and
            // value.comments is defined.
            if (visitor._shouldVisitComments &&
                value.comments &&
                childNames.indexOf("comments") < 0) {
                childNames.push("comments");
            }
            var childCount = childNames.length;
            var childPaths = [];
            for (var i = 0; i < childCount; ++i) {
                var childName = childNames[i];
                if (!hasOwn.call(value, childName)) {
                    value[childName] = types.getFieldValue(value, childName);
                }
                childPaths.push(path.get(childName));
            }
            for (var i = 0; i < childCount; ++i) {
                visitor.visitWithoutReset(childPaths[i]);
            }
        }
        return path.value;
    }
    PVp.acquireContext = function (path) {
        if (this._reusableContextStack.length === 0) {
            return new this.Context(path);
        }
        return this._reusableContextStack.pop().reset(path);
    };
    PVp.releaseContext = function (context) {
        if (!(context instanceof this.Context)) {
            throw new Error("");
        }
        this._reusableContextStack.push(context);
        context.currentPath = null;
    };
    PVp.reportChanged = function () {
        this._changeReported = true;
    };
    PVp.wasChangeReported = function () {
        return this._changeReported;
    };
    function makeContextConstructor(visitor) {
        function Context(path) {
            if (!(this instanceof Context)) {
                throw new Error("");
            }
            if (!(this instanceof PathVisitor)) {
                throw new Error("");
            }
            if (!(path instanceof NodePath)) {
                throw new Error("");
            }
            Object.defineProperty(this, "visitor", {
                value: visitor,
                writable: false,
                enumerable: true,
                configurable: false
            });
            this.currentPath = path;
            this.needToCallTraverse = true;
            Object.seal(this);
        }
        if (!(visitor instanceof PathVisitor)) {
            throw new Error("");
        }
        // Note that the visitor object is the prototype of Context.prototype,
        // so all visitor methods are inherited by context objects.
        var Cp = Context.prototype = Object.create(visitor);
        Cp.constructor = Context;
        extend(Cp, sharedContextProtoMethods);
        return Context;
    }
    // Every PathVisitor has a different this.Context constructor and
    // this.Context.prototype object, but those prototypes can all use the
    // same reset, invokeVisitorMethod, and traverse function objects.
    var sharedContextProtoMethods = Object.create(null);
    sharedContextProtoMethods.reset =
        function reset(path) {
            if (!(this instanceof this.Context)) {
                throw new Error("");
            }
            if (!(path instanceof NodePath)) {
                throw new Error("");
            }
            this.currentPath = path;
            this.needToCallTraverse = true;
            return this;
        };
    sharedContextProtoMethods.invokeVisitorMethod =
        function invokeVisitorMethod(methodName) {
            if (!(this instanceof this.Context)) {
                throw new Error("");
            }
            if (!(this.currentPath instanceof NodePath)) {
                throw new Error("");
            }
            var result = this.visitor[methodName].call(this, this.currentPath);
            if (result === false) {
                // Visitor methods return false to indicate that they have handled
                // their own traversal needs, and we should not complain if
                // this.needToCallTraverse is still true.
                this.needToCallTraverse = false;
            }
            else if (result !== undefined) {
                // Any other non-undefined value returned from the visitor method
                // is interpreted as a replacement value.
                this.currentPath = this.currentPath.replace(result)[0];
                if (this.needToCallTraverse) {
                    // If this.traverse still hasn't been called, visit the
                    // children of the replacement node.
                    this.traverse(this.currentPath);
                }
            }
            if (this.needToCallTraverse !== false) {
                throw new Error("Must either call this.traverse or return false in " + methodName);
            }
            var path = this.currentPath;
            return path && path.value;
        };
    sharedContextProtoMethods.traverse =
        function traverse(path, newVisitor) {
            if (!(this instanceof this.Context)) {
                throw new Error("");
            }
            if (!(path instanceof NodePath)) {
                throw new Error("");
            }
            if (!(this.currentPath instanceof NodePath)) {
                throw new Error("");
            }
            this.needToCallTraverse = false;
            return visitChildren(path, PathVisitor.fromMethodsObject(newVisitor || this.visitor));
        };
    sharedContextProtoMethods.visit =
        function visit(path, newVisitor) {
            if (!(this instanceof this.Context)) {
                throw new Error("");
            }
            if (!(path instanceof NodePath)) {
                throw new Error("");
            }
            if (!(this.currentPath instanceof NodePath)) {
                throw new Error("");
            }
            this.needToCallTraverse = false;
            return PathVisitor.fromMethodsObject(newVisitor || this.visitor).visitWithoutReset(path);
        };
    sharedContextProtoMethods.reportChanged = function reportChanged() {
        this.visitor.reportChanged();
    };
    sharedContextProtoMethods.abort = function abort() {
        this.needToCallTraverse = false;
        this.visitor.abort();
    };
    return PathVisitor;
}
exports.default = pathVisitorPlugin;
module.exports = exports["default"];

},{"./node-path":24,"./types":29,"tslib":31}],26:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var types_1 = tslib_1.__importDefault(require("./types"));
var Op = Object.prototype;
var hasOwn = Op.hasOwnProperty;
function pathPlugin(fork) {
    var types = fork.use(types_1.default);
    var isArray = types.builtInTypes.array;
    var isNumber = types.builtInTypes.number;
    var Path = function Path(value, parentPath, name) {
        if (!(this instanceof Path)) {
            throw new Error("Path constructor cannot be invoked without 'new'");
        }
        if (parentPath) {
            if (!(parentPath instanceof Path)) {
                throw new Error("");
            }
        }
        else {
            parentPath = null;
            name = null;
        }
        // The value encapsulated by this Path, generally equal to
        // parentPath.value[name] if we have a parentPath.
        this.value = value;
        // The immediate parent Path of this Path.
        this.parentPath = parentPath;
        // The name of the property of parentPath.value through which this
        // Path's value was reached.
        this.name = name;
        // Calling path.get("child") multiple times always returns the same
        // child Path object, for both performance and consistency reasons.
        this.__childCache = null;
    };
    var Pp = Path.prototype;
    function getChildCache(path) {
        // Lazily create the child cache. This also cheapens cache
        // invalidation, since you can just reset path.__childCache to null.
        return path.__childCache || (path.__childCache = Object.create(null));
    }
    function getChildPath(path, name) {
        var cache = getChildCache(path);
        var actualChildValue = path.getValueProperty(name);
        var childPath = cache[name];
        if (!hasOwn.call(cache, name) ||
            // Ensure consistency between cache and reality.
            childPath.value !== actualChildValue) {
            childPath = cache[name] = new path.constructor(actualChildValue, path, name);
        }
        return childPath;
    }
    // This method is designed to be overridden by subclasses that need to
    // handle missing properties, etc.
    Pp.getValueProperty = function getValueProperty(name) {
        return this.value[name];
    };
    Pp.get = function get() {
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i] = arguments[_i];
        }
        var path = this;
        var count = names.length;
        for (var i = 0; i < count; ++i) {
            path = getChildPath(path, names[i]);
        }
        return path;
    };
    Pp.each = function each(callback, context) {
        var childPaths = [];
        var len = this.value.length;
        var i = 0;
        // Collect all the original child paths before invoking the callback.
        for (var i = 0; i < len; ++i) {
            if (hasOwn.call(this.value, i)) {
                childPaths[i] = this.get(i);
            }
        }
        // Invoke the callback on just the original child paths, regardless of
        // any modifications made to the array by the callback. I chose these
        // semantics over cleverly invoking the callback on new elements because
        // this way is much easier to reason about.
        context = context || this;
        for (i = 0; i < len; ++i) {
            if (hasOwn.call(childPaths, i)) {
                callback.call(context, childPaths[i]);
            }
        }
    };
    Pp.map = function map(callback, context) {
        var result = [];
        this.each(function (childPath) {
            result.push(callback.call(this, childPath));
        }, context);
        return result;
    };
    Pp.filter = function filter(callback, context) {
        var result = [];
        this.each(function (childPath) {
            if (callback.call(this, childPath)) {
                result.push(childPath);
            }
        }, context);
        return result;
    };
    function emptyMoves() { }
    function getMoves(path, offset, start, end) {
        isArray.assert(path.value);
        if (offset === 0) {
            return emptyMoves;
        }
        var length = path.value.length;
        if (length < 1) {
            return emptyMoves;
        }
        var argc = arguments.length;
        if (argc === 2) {
            start = 0;
            end = length;
        }
        else if (argc === 3) {
            start = Math.max(start, 0);
            end = length;
        }
        else {
            start = Math.max(start, 0);
            end = Math.min(end, length);
        }
        isNumber.assert(start);
        isNumber.assert(end);
        var moves = Object.create(null);
        var cache = getChildCache(path);
        for (var i = start; i < end; ++i) {
            if (hasOwn.call(path.value, i)) {
                var childPath = path.get(i);
                if (childPath.name !== i) {
                    throw new Error("");
                }
                var newIndex = i + offset;
                childPath.name = newIndex;
                moves[newIndex] = childPath;
                delete cache[i];
            }
        }
        delete cache.length;
        return function () {
            for (var newIndex in moves) {
                var childPath = moves[newIndex];
                if (childPath.name !== +newIndex) {
                    throw new Error("");
                }
                cache[newIndex] = childPath;
                path.value[newIndex] = childPath.value;
            }
        };
    }
    Pp.shift = function shift() {
        var move = getMoves(this, -1);
        var result = this.value.shift();
        move();
        return result;
    };
    Pp.unshift = function unshift() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var move = getMoves(this, args.length);
        var result = this.value.unshift.apply(this.value, args);
        move();
        return result;
    };
    Pp.push = function push() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        isArray.assert(this.value);
        delete getChildCache(this).length;
        return this.value.push.apply(this.value, args);
    };
    Pp.pop = function pop() {
        isArray.assert(this.value);
        var cache = getChildCache(this);
        delete cache[this.value.length - 1];
        delete cache.length;
        return this.value.pop();
    };
    Pp.insertAt = function insertAt(index) {
        var argc = arguments.length;
        var move = getMoves(this, argc - 1, index);
        if (move === emptyMoves && argc <= 1) {
            return this;
        }
        index = Math.max(index, 0);
        for (var i = 1; i < argc; ++i) {
            this.value[index + i - 1] = arguments[i];
        }
        move();
        return this;
    };
    Pp.insertBefore = function insertBefore() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var pp = this.parentPath;
        var argc = args.length;
        var insertAtArgs = [this.name];
        for (var i = 0; i < argc; ++i) {
            insertAtArgs.push(args[i]);
        }
        return pp.insertAt.apply(pp, insertAtArgs);
    };
    Pp.insertAfter = function insertAfter() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var pp = this.parentPath;
        var argc = args.length;
        var insertAtArgs = [this.name + 1];
        for (var i = 0; i < argc; ++i) {
            insertAtArgs.push(args[i]);
        }
        return pp.insertAt.apply(pp, insertAtArgs);
    };
    function repairRelationshipWithParent(path) {
        if (!(path instanceof Path)) {
            throw new Error("");
        }
        var pp = path.parentPath;
        if (!pp) {
            // Orphan paths have no relationship to repair.
            return path;
        }
        var parentValue = pp.value;
        var parentCache = getChildCache(pp);
        // Make sure parentCache[path.name] is populated.
        if (parentValue[path.name] === path.value) {
            parentCache[path.name] = path;
        }
        else if (isArray.check(parentValue)) {
            // Something caused path.name to become out of date, so attempt to
            // recover by searching for path.value in parentValue.
            var i = parentValue.indexOf(path.value);
            if (i >= 0) {
                parentCache[path.name = i] = path;
            }
        }
        else {
            // If path.value disagrees with parentValue[path.name], and
            // path.name is not an array index, let path.value become the new
            // parentValue[path.name] and update parentCache accordingly.
            parentValue[path.name] = path.value;
            parentCache[path.name] = path;
        }
        if (parentValue[path.name] !== path.value) {
            throw new Error("");
        }
        if (path.parentPath.get(path.name) !== path) {
            throw new Error("");
        }
        return path;
    }
    Pp.replace = function replace(replacement) {
        var results = [];
        var parentValue = this.parentPath.value;
        var parentCache = getChildCache(this.parentPath);
        var count = arguments.length;
        repairRelationshipWithParent(this);
        if (isArray.check(parentValue)) {
            var originalLength = parentValue.length;
            var move = getMoves(this.parentPath, count - 1, this.name + 1);
            var spliceArgs = [this.name, 1];
            for (var i = 0; i < count; ++i) {
                spliceArgs.push(arguments[i]);
            }
            var splicedOut = parentValue.splice.apply(parentValue, spliceArgs);
            if (splicedOut[0] !== this.value) {
                throw new Error("");
            }
            if (parentValue.length !== (originalLength - 1 + count)) {
                throw new Error("");
            }
            move();
            if (count === 0) {
                delete this.value;
                delete parentCache[this.name];
                this.__childCache = null;
            }
            else {
                if (parentValue[this.name] !== replacement) {
                    throw new Error("");
                }
                if (this.value !== replacement) {
                    this.value = replacement;
                    this.__childCache = null;
                }
                for (i = 0; i < count; ++i) {
                    results.push(this.parentPath.get(this.name + i));
                }
                if (results[0] !== this) {
                    throw new Error("");
                }
            }
        }
        else if (count === 1) {
            if (this.value !== replacement) {
                this.__childCache = null;
            }
            this.value = parentValue[this.name] = replacement;
            results.push(this);
        }
        else if (count === 0) {
            delete parentValue[this.name];
            delete this.value;
            this.__childCache = null;
            // Leave this path cached as parentCache[this.name], even though
            // it no longer has a value defined.
        }
        else {
            throw new Error("Could not replace path");
        }
        return results;
    };
    return Path;
}
exports.default = pathPlugin;
module.exports = exports["default"];

},{"./types":29,"tslib":31}],27:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var types_1 = tslib_1.__importDefault(require("./types"));
var hasOwn = Object.prototype.hasOwnProperty;
function scopePlugin(fork) {
    var types = fork.use(types_1.default);
    var Type = types.Type;
    var namedTypes = types.namedTypes;
    var Node = namedTypes.Node;
    var Expression = namedTypes.Expression;
    var isArray = types.builtInTypes.array;
    var b = types.builders;
    var Scope = function Scope(path, parentScope) {
        if (!(this instanceof Scope)) {
            throw new Error("Scope constructor cannot be invoked without 'new'");
        }
        ScopeType.assert(path.value);
        var depth;
        if (parentScope) {
            if (!(parentScope instanceof Scope)) {
                throw new Error("");
            }
            depth = parentScope.depth + 1;
        }
        else {
            parentScope = null;
            depth = 0;
        }
        Object.defineProperties(this, {
            path: { value: path },
            node: { value: path.value },
            isGlobal: { value: !parentScope, enumerable: true },
            depth: { value: depth },
            parent: { value: parentScope },
            bindings: { value: {} },
            types: { value: {} },
        });
    };
    var scopeTypes = [
        // Program nodes introduce global scopes.
        namedTypes.Program,
        // Function is the supertype of FunctionExpression,
        // FunctionDeclaration, ArrowExpression, etc.
        namedTypes.Function,
        // In case you didn't know, the caught parameter shadows any variable
        // of the same name in an outer scope.
        namedTypes.CatchClause
    ];
    var ScopeType = Type.or.apply(Type, scopeTypes);
    Scope.isEstablishedBy = function (node) {
        return ScopeType.check(node);
    };
    var Sp = Scope.prototype;
    // Will be overridden after an instance lazily calls scanScope.
    Sp.didScan = false;
    Sp.declares = function (name) {
        this.scan();
        return hasOwn.call(this.bindings, name);
    };
    Sp.declaresType = function (name) {
        this.scan();
        return hasOwn.call(this.types, name);
    };
    Sp.declareTemporary = function (prefix) {
        if (prefix) {
            if (!/^[a-z$_]/i.test(prefix)) {
                throw new Error("");
            }
        }
        else {
            prefix = "t$";
        }
        // Include this.depth in the name to make sure the name does not
        // collide with any variables in nested/enclosing scopes.
        prefix += this.depth.toString(36) + "$";
        this.scan();
        var index = 0;
        while (this.declares(prefix + index)) {
            ++index;
        }
        var name = prefix + index;
        return this.bindings[name] = types.builders.identifier(name);
    };
    Sp.injectTemporary = function (identifier, init) {
        identifier || (identifier = this.declareTemporary());
        var bodyPath = this.path.get("body");
        if (namedTypes.BlockStatement.check(bodyPath.value)) {
            bodyPath = bodyPath.get("body");
        }
        bodyPath.unshift(b.variableDeclaration("var", [b.variableDeclarator(identifier, init || null)]));
        return identifier;
    };
    Sp.scan = function (force) {
        if (force || !this.didScan) {
            for (var name in this.bindings) {
                // Empty out this.bindings, just in cases.
                delete this.bindings[name];
            }
            scanScope(this.path, this.bindings, this.types);
            this.didScan = true;
        }
    };
    Sp.getBindings = function () {
        this.scan();
        return this.bindings;
    };
    Sp.getTypes = function () {
        this.scan();
        return this.types;
    };
    function scanScope(path, bindings, scopeTypes) {
        var node = path.value;
        ScopeType.assert(node);
        if (namedTypes.CatchClause.check(node)) {
            // A catch clause establishes a new scope but the only variable
            // bound in that scope is the catch parameter. Any other
            // declarations create bindings in the outer scope.
            var param = path.get("param");
            if (param.value) {
                addPattern(param, bindings);
            }
        }
        else {
            recursiveScanScope(path, bindings, scopeTypes);
        }
    }
    function recursiveScanScope(path, bindings, scopeTypes) {
        var node = path.value;
        if (path.parent &&
            namedTypes.FunctionExpression.check(path.parent.node) &&
            path.parent.node.id) {
            addPattern(path.parent.get("id"), bindings);
        }
        if (!node) {
            // None of the remaining cases matter if node is falsy.
        }
        else if (isArray.check(node)) {
            path.each(function (childPath) {
                recursiveScanChild(childPath, bindings, scopeTypes);
            });
        }
        else if (namedTypes.Function.check(node)) {
            path.get("params").each(function (paramPath) {
                addPattern(paramPath, bindings);
            });
            recursiveScanChild(path.get("body"), bindings, scopeTypes);
        }
        else if ((namedTypes.TypeAlias && namedTypes.TypeAlias.check(node)) ||
            (namedTypes.InterfaceDeclaration && namedTypes.InterfaceDeclaration.check(node)) ||
            (namedTypes.TSTypeAliasDeclaration && namedTypes.TSTypeAliasDeclaration.check(node)) ||
            (namedTypes.TSInterfaceDeclaration && namedTypes.TSInterfaceDeclaration.check(node))) {
            addTypePattern(path.get("id"), scopeTypes);
        }
        else if (namedTypes.VariableDeclarator.check(node)) {
            addPattern(path.get("id"), bindings);
            recursiveScanChild(path.get("init"), bindings, scopeTypes);
        }
        else if (node.type === "ImportSpecifier" ||
            node.type === "ImportNamespaceSpecifier" ||
            node.type === "ImportDefaultSpecifier") {
            addPattern(
            // Esprima used to use the .name field to refer to the local
            // binding identifier for ImportSpecifier nodes, but .id for
            // ImportNamespaceSpecifier and ImportDefaultSpecifier nodes.
            // ESTree/Acorn/ESpree use .local for all three node types.
            path.get(node.local ? "local" :
                node.name ? "name" : "id"), bindings);
        }
        else if (Node.check(node) && !Expression.check(node)) {
            types.eachField(node, function (name, child) {
                var childPath = path.get(name);
                if (!pathHasValue(childPath, child)) {
                    throw new Error("");
                }
                recursiveScanChild(childPath, bindings, scopeTypes);
            });
        }
    }
    function pathHasValue(path, value) {
        if (path.value === value) {
            return true;
        }
        // Empty arrays are probably produced by defaults.emptyArray, in which
        // case is makes sense to regard them as equivalent, if not ===.
        if (Array.isArray(path.value) &&
            path.value.length === 0 &&
            Array.isArray(value) &&
            value.length === 0) {
            return true;
        }
        return false;
    }
    function recursiveScanChild(path, bindings, scopeTypes) {
        var node = path.value;
        if (!node || Expression.check(node)) {
            // Ignore falsy values and Expressions.
        }
        else if (namedTypes.FunctionDeclaration.check(node) &&
            node.id !== null) {
            addPattern(path.get("id"), bindings);
        }
        else if (namedTypes.ClassDeclaration &&
            namedTypes.ClassDeclaration.check(node)) {
            addPattern(path.get("id"), bindings);
        }
        else if (ScopeType.check(node)) {
            if (namedTypes.CatchClause.check(node) &&
                // TODO Broaden this to accept any pattern.
                namedTypes.Identifier.check(node.param)) {
                var catchParamName = node.param.name;
                var hadBinding = hasOwn.call(bindings, catchParamName);
                // Any declarations that occur inside the catch body that do
                // not have the same name as the catch parameter should count
                // as bindings in the outer scope.
                recursiveScanScope(path.get("body"), bindings, scopeTypes);
                // If a new binding matching the catch parameter name was
                // created while scanning the catch body, ignore it because it
                // actually refers to the catch parameter and not the outer
                // scope that we're currently scanning.
                if (!hadBinding) {
                    delete bindings[catchParamName];
                }
            }
        }
        else {
            recursiveScanScope(path, bindings, scopeTypes);
        }
    }
    function addPattern(patternPath, bindings) {
        var pattern = patternPath.value;
        namedTypes.Pattern.assert(pattern);
        if (namedTypes.Identifier.check(pattern)) {
            if (hasOwn.call(bindings, pattern.name)) {
                bindings[pattern.name].push(patternPath);
            }
            else {
                bindings[pattern.name] = [patternPath];
            }
        }
        else if (namedTypes.AssignmentPattern &&
            namedTypes.AssignmentPattern.check(pattern)) {
            addPattern(patternPath.get('left'), bindings);
        }
        else if (namedTypes.ObjectPattern &&
            namedTypes.ObjectPattern.check(pattern)) {
            patternPath.get('properties').each(function (propertyPath) {
                var property = propertyPath.value;
                if (namedTypes.Pattern.check(property)) {
                    addPattern(propertyPath, bindings);
                }
                else if (namedTypes.Property.check(property)) {
                    addPattern(propertyPath.get('value'), bindings);
                }
                else if (namedTypes.SpreadProperty &&
                    namedTypes.SpreadProperty.check(property)) {
                    addPattern(propertyPath.get('argument'), bindings);
                }
            });
        }
        else if (namedTypes.ArrayPattern &&
            namedTypes.ArrayPattern.check(pattern)) {
            patternPath.get('elements').each(function (elementPath) {
                var element = elementPath.value;
                if (namedTypes.Pattern.check(element)) {
                    addPattern(elementPath, bindings);
                }
                else if (namedTypes.SpreadElement &&
                    namedTypes.SpreadElement.check(element)) {
                    addPattern(elementPath.get("argument"), bindings);
                }
            });
        }
        else if (namedTypes.PropertyPattern &&
            namedTypes.PropertyPattern.check(pattern)) {
            addPattern(patternPath.get('pattern'), bindings);
        }
        else if ((namedTypes.SpreadElementPattern &&
            namedTypes.SpreadElementPattern.check(pattern)) ||
            (namedTypes.RestElement &&
                namedTypes.RestElement.check(pattern)) ||
            (namedTypes.SpreadPropertyPattern &&
                namedTypes.SpreadPropertyPattern.check(pattern))) {
            addPattern(patternPath.get('argument'), bindings);
        }
    }
    function addTypePattern(patternPath, types) {
        var pattern = patternPath.value;
        namedTypes.Pattern.assert(pattern);
        if (namedTypes.Identifier.check(pattern)) {
            if (hasOwn.call(types, pattern.name)) {
                types[pattern.name].push(patternPath);
            }
            else {
                types[pattern.name] = [patternPath];
            }
        }
    }
    Sp.lookup = function (name) {
        for (var scope = this; scope; scope = scope.parent)
            if (scope.declares(name))
                break;
        return scope;
    };
    Sp.lookupType = function (name) {
        for (var scope = this; scope; scope = scope.parent)
            if (scope.declaresType(name))
                break;
        return scope;
    };
    Sp.getGlobalScope = function () {
        var scope = this;
        while (!scope.isGlobal)
            scope = scope.parent;
        return scope;
    };
    return Scope;
}
exports.default = scopePlugin;
module.exports = exports["default"];

},{"./types":29,"tslib":31}],28:[function(require,module,exports){
"use strict";;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var types_1 = tslib_1.__importDefault(require("./types"));
function default_1(fork) {
    var types = fork.use(types_1.default);
    var Type = types.Type;
    var builtin = types.builtInTypes;
    var isNumber = builtin.number;
    // An example of constructing a new type with arbitrary constraints from
    // an existing type.
    function geq(than) {
        return Type.from(function (value) { return isNumber.check(value) && value >= than; }, isNumber + " >= " + than);
    }
    ;
    // Default value-returning functions that may optionally be passed as a
    // third argument to Def.prototype.field.
    var defaults = {
        // Functions were used because (among other reasons) that's the most
        // elegant way to allow for the emptyArray one always to give a new
        // array instance.
        "null": function () { return null; },
        "emptyArray": function () { return []; },
        "false": function () { return false; },
        "true": function () { return true; },
        "undefined": function () { },
        "use strict": function () { return "use strict"; }
    };
    var naiveIsPrimitive = Type.or(builtin.string, builtin.number, builtin.boolean, builtin.null, builtin.undefined);
    var isPrimitive = Type.from(function (value) {
        if (value === null)
            return true;
        var type = typeof value;
        if (type === "object" ||
            type === "function") {
            return false;
        }
        return true;
    }, naiveIsPrimitive.toString());
    return {
        geq: geq,
        defaults: defaults,
        isPrimitive: isPrimitive,
    };
}
exports.default = default_1;
module.exports = exports["default"];

},{"./types":29,"tslib":31}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Def = void 0;
var tslib_1 = require("tslib");
var Op = Object.prototype;
var objToStr = Op.toString;
var hasOwn = Op.hasOwnProperty;
var BaseType = /** @class */ (function () {
    function BaseType() {
    }
    BaseType.prototype.assert = function (value, deep) {
        if (!this.check(value, deep)) {
            var str = shallowStringify(value);
            throw new Error(str + " does not match type " + this);
        }
        return true;
    };
    BaseType.prototype.arrayOf = function () {
        var elemType = this;
        return new ArrayType(elemType);
    };
    return BaseType;
}());
var ArrayType = /** @class */ (function (_super) {
    tslib_1.__extends(ArrayType, _super);
    function ArrayType(elemType) {
        var _this = _super.call(this) || this;
        _this.elemType = elemType;
        _this.kind = "ArrayType";
        return _this;
    }
    ArrayType.prototype.toString = function () {
        return "[" + this.elemType + "]";
    };
    ArrayType.prototype.check = function (value, deep) {
        var _this = this;
        return Array.isArray(value) && value.every(function (elem) { return _this.elemType.check(elem, deep); });
    };
    return ArrayType;
}(BaseType));
var IdentityType = /** @class */ (function (_super) {
    tslib_1.__extends(IdentityType, _super);
    function IdentityType(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        _this.kind = "IdentityType";
        return _this;
    }
    IdentityType.prototype.toString = function () {
        return String(this.value);
    };
    IdentityType.prototype.check = function (value, deep) {
        var result = value === this.value;
        if (!result && typeof deep === "function") {
            deep(this, value);
        }
        return result;
    };
    return IdentityType;
}(BaseType));
var ObjectType = /** @class */ (function (_super) {
    tslib_1.__extends(ObjectType, _super);
    function ObjectType(fields) {
        var _this = _super.call(this) || this;
        _this.fields = fields;
        _this.kind = "ObjectType";
        return _this;
    }
    ObjectType.prototype.toString = function () {
        return "{ " + this.fields.join(", ") + " }";
    };
    ObjectType.prototype.check = function (value, deep) {
        return (objToStr.call(value) === objToStr.call({}) &&
            this.fields.every(function (field) {
                return field.type.check(value[field.name], deep);
            }));
    };
    return ObjectType;
}(BaseType));
var OrType = /** @class */ (function (_super) {
    tslib_1.__extends(OrType, _super);
    function OrType(types) {
        var _this = _super.call(this) || this;
        _this.types = types;
        _this.kind = "OrType";
        return _this;
    }
    OrType.prototype.toString = function () {
        return this.types.join(" | ");
    };
    OrType.prototype.check = function (value, deep) {
        return this.types.some(function (type) {
            return type.check(value, deep);
        });
    };
    return OrType;
}(BaseType));
var PredicateType = /** @class */ (function (_super) {
    tslib_1.__extends(PredicateType, _super);
    function PredicateType(name, predicate) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.predicate = predicate;
        _this.kind = "PredicateType";
        return _this;
    }
    PredicateType.prototype.toString = function () {
        return this.name;
    };
    PredicateType.prototype.check = function (value, deep) {
        var result = this.predicate(value, deep);
        if (!result && typeof deep === "function") {
            deep(this, value);
        }
        return result;
    };
    return PredicateType;
}(BaseType));
var Def = /** @class */ (function () {
    function Def(type, typeName) {
        this.type = type;
        this.typeName = typeName;
        this.baseNames = [];
        this.ownFields = Object.create(null);
        // Includes own typeName. Populated during finalization.
        this.allSupertypes = Object.create(null);
        // Linear inheritance hierarchy. Populated during finalization.
        this.supertypeList = [];
        // Includes inherited fields.
        this.allFields = Object.create(null);
        // Non-hidden keys of allFields.
        this.fieldNames = [];
        // This property will be overridden as true by individual Def instances
        // when they are finalized.
        this.finalized = false;
        // False by default until .build(...) is called on an instance.
        this.buildable = false;
        this.buildParams = [];
    }
    Def.prototype.isSupertypeOf = function (that) {
        if (that instanceof Def) {
            if (this.finalized !== true ||
                that.finalized !== true) {
                throw new Error("");
            }
            return hasOwn.call(that.allSupertypes, this.typeName);
        }
        else {
            throw new Error(that + " is not a Def");
        }
    };
    Def.prototype.checkAllFields = function (value, deep) {
        var allFields = this.allFields;
        if (this.finalized !== true) {
            throw new Error("" + this.typeName);
        }
        function checkFieldByName(name) {
            var field = allFields[name];
            var type = field.type;
            var child = field.getValue(value);
            return type.check(child, deep);
        }
        return value !== null &&
            typeof value === "object" &&
            Object.keys(allFields).every(checkFieldByName);
    };
    Def.prototype.bases = function () {
        var supertypeNames = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            supertypeNames[_i] = arguments[_i];
        }
        var bases = this.baseNames;
        if (this.finalized) {
            if (supertypeNames.length !== bases.length) {
                throw new Error("");
            }
            for (var i = 0; i < supertypeNames.length; i++) {
                if (supertypeNames[i] !== bases[i]) {
                    throw new Error("");
                }
            }
            return this;
        }
        supertypeNames.forEach(function (baseName) {
            // This indexOf lookup may be O(n), but the typical number of base
            // names is very small, and indexOf is a native Array method.
            if (bases.indexOf(baseName) < 0) {
                bases.push(baseName);
            }
        });
        return this; // For chaining.
    };
    return Def;
}());
exports.Def = Def;
var Field = /** @class */ (function () {
    function Field(name, type, defaultFn, hidden) {
        this.name = name;
        this.type = type;
        this.defaultFn = defaultFn;
        this.hidden = !!hidden;
    }
    Field.prototype.toString = function () {
        return JSON.stringify(this.name) + ": " + this.type;
    };
    Field.prototype.getValue = function (obj) {
        var value = obj[this.name];
        if (typeof value !== "undefined") {
            return value;
        }
        if (typeof this.defaultFn === "function") {
            value = this.defaultFn.call(obj);
        }
        return value;
    };
    return Field;
}());
function shallowStringify(value) {
    if (Array.isArray(value)) {
        return "[" + value.map(shallowStringify).join(", ") + "]";
    }
    if (value && typeof value === "object") {
        return "{ " + Object.keys(value).map(function (key) {
            return key + ": " + value[key];
        }).join(", ") + " }";
    }
    return JSON.stringify(value);
}
function typesPlugin(_fork) {
    var Type = {
        or: function () {
            var types = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                types[_i] = arguments[_i];
            }
            return new OrType(types.map(function (type) { return Type.from(type); }));
        },
        from: function (value, name) {
            if (value instanceof ArrayType ||
                value instanceof IdentityType ||
                value instanceof ObjectType ||
                value instanceof OrType ||
                value instanceof PredicateType) {
                return value;
            }
            // The Def type is used as a helper for constructing compound
            // interface types for AST nodes.
            if (value instanceof Def) {
                return value.type;
            }
            // Support [ElemType] syntax.
            if (isArray.check(value)) {
                if (value.length !== 1) {
                    throw new Error("only one element type is permitted for typed arrays");
                }
                return new ArrayType(Type.from(value[0]));
            }
            // Support { someField: FieldType, ... } syntax.
            if (isObject.check(value)) {
                return new ObjectType(Object.keys(value).map(function (name) {
                    return new Field(name, Type.from(value[name], name));
                }));
            }
            if (typeof value === "function") {
                var bicfIndex = builtInCtorFns.indexOf(value);
                if (bicfIndex >= 0) {
                    return builtInCtorTypes[bicfIndex];
                }
                if (typeof name !== "string") {
                    throw new Error("missing name");
                }
                return new PredicateType(name, value);
            }
            // As a last resort, toType returns a type that matches any value that
            // is === from. This is primarily useful for literal values like
            // toType(null), but it has the additional advantage of allowing
            // toType to be a total function.
            return new IdentityType(value);
        },
        // Define a type whose name is registered in a namespace (the defCache) so
        // that future definitions will return the same type given the same name.
        // In particular, this system allows for circular and forward definitions.
        // The Def object d returned from Type.def may be used to configure the
        // type d.type by calling methods such as d.bases, d.build, and d.field.
        def: function (typeName) {
            return hasOwn.call(defCache, typeName)
                ? defCache[typeName]
                : defCache[typeName] = new DefImpl(typeName);
        },
        hasDef: function (typeName) {
            return hasOwn.call(defCache, typeName);
        }
    };
    var builtInCtorFns = [];
    var builtInCtorTypes = [];
    function defBuiltInType(name, example) {
        var objStr = objToStr.call(example);
        var type = new PredicateType(name, function (value) { return objToStr.call(value) === objStr; });
        if (example && typeof example.constructor === "function") {
            builtInCtorFns.push(example.constructor);
            builtInCtorTypes.push(type);
        }
        return type;
    }
    // These types check the underlying [[Class]] attribute of the given
    // value, rather than using the problematic typeof operator. Note however
    // that no subtyping is considered; so, for instance, isObject.check
    // returns false for [], /./, new Date, and null.
    var isString = defBuiltInType("string", "truthy");
    var isFunction = defBuiltInType("function", function () { });
    var isArray = defBuiltInType("array", []);
    var isObject = defBuiltInType("object", {});
    var isRegExp = defBuiltInType("RegExp", /./);
    var isDate = defBuiltInType("Date", new Date());
    var isNumber = defBuiltInType("number", 3);
    var isBoolean = defBuiltInType("boolean", true);
    var isNull = defBuiltInType("null", null);
    var isUndefined = defBuiltInType("undefined", undefined);
    var builtInTypes = {
        string: isString,
        function: isFunction,
        array: isArray,
        object: isObject,
        RegExp: isRegExp,
        Date: isDate,
        number: isNumber,
        boolean: isBoolean,
        null: isNull,
        undefined: isUndefined,
    };
    // In order to return the same Def instance every time Type.def is called
    // with a particular name, those instances need to be stored in a cache.
    var defCache = Object.create(null);
    function defFromValue(value) {
        if (value && typeof value === "object") {
            var type = value.type;
            if (typeof type === "string" &&
                hasOwn.call(defCache, type)) {
                var d = defCache[type];
                if (d.finalized) {
                    return d;
                }
            }
        }
        return null;
    }
    var DefImpl = /** @class */ (function (_super) {
        tslib_1.__extends(DefImpl, _super);
        function DefImpl(typeName) {
            var _this = _super.call(this, new PredicateType(typeName, function (value, deep) { return _this.check(value, deep); }), typeName) || this;
            return _this;
        }
        DefImpl.prototype.check = function (value, deep) {
            if (this.finalized !== true) {
                throw new Error("prematurely checking unfinalized type " + this.typeName);
            }
            // A Def type can only match an object value.
            if (value === null || typeof value !== "object") {
                return false;
            }
            var vDef = defFromValue(value);
            if (!vDef) {
                // If we couldn't infer the Def associated with the given value,
                // and we expected it to be a SourceLocation or a Position, it was
                // probably just missing a "type" field (because Esprima does not
                // assign a type property to such nodes). Be optimistic and let
                // this.checkAllFields make the final decision.
                if (this.typeName === "SourceLocation" ||
                    this.typeName === "Position") {
                    return this.checkAllFields(value, deep);
                }
                // Calling this.checkAllFields for any other type of node is both
                // bad for performance and way too forgiving.
                return false;
            }
            // If checking deeply and vDef === this, then we only need to call
            // checkAllFields once. Calling checkAllFields is too strict when deep
            // is false, because then we only care about this.isSupertypeOf(vDef).
            if (deep && vDef === this) {
                return this.checkAllFields(value, deep);
            }
            // In most cases we rely exclusively on isSupertypeOf to make O(1)
            // subtyping determinations. This suffices in most situations outside
            // of unit tests, since interface conformance is checked whenever new
            // instances are created using builder functions.
            if (!this.isSupertypeOf(vDef)) {
                return false;
            }
            // The exception is when deep is true; then, we recursively check all
            // fields.
            if (!deep) {
                return true;
            }
            // Use the more specific Def (vDef) to perform the deep check, but
            // shallow-check fields defined by the less specific Def (this).
            return vDef.checkAllFields(value, deep)
                && this.checkAllFields(value, false);
        };
        DefImpl.prototype.build = function () {
            var _this = this;
            var buildParams = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                buildParams[_i] = arguments[_i];
            }
            // Calling Def.prototype.build multiple times has the effect of merely
            // redefining this property.
            this.buildParams = buildParams;
            if (this.buildable) {
                // If this Def is already buildable, update self.buildParams and
                // continue using the old builder function.
                return this;
            }
            // Every buildable type will have its "type" field filled in
            // automatically. This includes types that are not subtypes of Node,
            // like SourceLocation, but that seems harmless (TODO?).
            this.field("type", String, function () { return _this.typeName; });
            // Override Dp.buildable for this Def instance.
            this.buildable = true;
            var addParam = function (built, param, arg, isArgAvailable) {
                if (hasOwn.call(built, param))
                    return;
                var all = _this.allFields;
                if (!hasOwn.call(all, param)) {
                    throw new Error("" + param);
                }
                var field = all[param];
                var type = field.type;
                var value;
                if (isArgAvailable) {
                    value = arg;
                }
                else if (field.defaultFn) {
                    // Expose the partially-built object to the default
                    // function as its `this` object.
                    value = field.defaultFn.call(built);
                }
                else {
                    var message = "no value or default function given for field " +
                        JSON.stringify(param) + " of " + _this.typeName + "(" +
                        _this.buildParams.map(function (name) {
                            return all[name];
                        }).join(", ") + ")";
                    throw new Error(message);
                }
                if (!type.check(value)) {
                    throw new Error(shallowStringify(value) +
                        " does not match field " + field +
                        " of type " + _this.typeName);
                }
                built[param] = value;
            };
            // Calling the builder function will construct an instance of the Def,
            // with positional arguments mapped to the fields original passed to .build.
            // If not enough arguments are provided, the default value for the remaining fields
            // will be used.
            var builder = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var argc = args.length;
                if (!_this.finalized) {
                    throw new Error("attempting to instantiate unfinalized type " +
                        _this.typeName);
                }
                var built = Object.create(nodePrototype);
                _this.buildParams.forEach(function (param, i) {
                    if (i < argc) {
                        addParam(built, param, args[i], true);
                    }
                    else {
                        addParam(built, param, null, false);
                    }
                });
                Object.keys(_this.allFields).forEach(function (param) {
                    // Use the default value.
                    addParam(built, param, null, false);
                });
                // Make sure that the "type" field was filled automatically.
                if (built.type !== _this.typeName) {
                    throw new Error("");
                }
                return built;
            };
            // Calling .from on the builder function will construct an instance of the Def,
            // using field values from the passed object. For fields missing from the passed object,
            // their default value will be used.
            builder.from = function (obj) {
                if (!_this.finalized) {
                    throw new Error("attempting to instantiate unfinalized type " +
                        _this.typeName);
                }
                var built = Object.create(nodePrototype);
                Object.keys(_this.allFields).forEach(function (param) {
                    if (hasOwn.call(obj, param)) {
                        addParam(built, param, obj[param], true);
                    }
                    else {
                        addParam(built, param, null, false);
                    }
                });
                // Make sure that the "type" field was filled automatically.
                if (built.type !== _this.typeName) {
                    throw new Error("");
                }
                return built;
            };
            Object.defineProperty(builders, getBuilderName(this.typeName), {
                enumerable: true,
                value: builder
            });
            return this;
        };
        // The reason fields are specified using .field(...) instead of an object
        // literal syntax is somewhat subtle: the object literal syntax would
        // support only one key and one value, but with .field(...) we can pass
        // any number of arguments to specify the field.
        DefImpl.prototype.field = function (name, type, defaultFn, hidden) {
            if (this.finalized) {
                console.error("Ignoring attempt to redefine field " +
                    JSON.stringify(name) + " of finalized type " +
                    JSON.stringify(this.typeName));
                return this;
            }
            this.ownFields[name] = new Field(name, Type.from(type), defaultFn, hidden);
            return this; // For chaining.
        };
        DefImpl.prototype.finalize = function () {
            var _this = this;
            // It's not an error to finalize a type more than once, but only the
            // first call to .finalize does anything.
            if (!this.finalized) {
                var allFields = this.allFields;
                var allSupertypes = this.allSupertypes;
                this.baseNames.forEach(function (name) {
                    var def = defCache[name];
                    if (def instanceof Def) {
                        def.finalize();
                        extend(allFields, def.allFields);
                        extend(allSupertypes, def.allSupertypes);
                    }
                    else {
                        var message = "unknown supertype name " +
                            JSON.stringify(name) +
                            " for subtype " +
                            JSON.stringify(_this.typeName);
                        throw new Error(message);
                    }
                });
                // TODO Warn if fields are overridden with incompatible types.
                extend(allFields, this.ownFields);
                allSupertypes[this.typeName] = this;
                this.fieldNames.length = 0;
                for (var fieldName in allFields) {
                    if (hasOwn.call(allFields, fieldName) &&
                        !allFields[fieldName].hidden) {
                        this.fieldNames.push(fieldName);
                    }
                }
                // Types are exported only once they have been finalized.
                Object.defineProperty(namedTypes, this.typeName, {
                    enumerable: true,
                    value: this.type
                });
                this.finalized = true;
                // A linearization of the inheritance hierarchy.
                populateSupertypeList(this.typeName, this.supertypeList);
                if (this.buildable &&
                    this.supertypeList.lastIndexOf("Expression") >= 0) {
                    wrapExpressionBuilderWithStatement(this.typeName);
                }
            }
        };
        return DefImpl;
    }(Def));
    // Note that the list returned by this function is a copy of the internal
    // supertypeList, *without* the typeName itself as the first element.
    function getSupertypeNames(typeName) {
        if (!hasOwn.call(defCache, typeName)) {
            throw new Error("");
        }
        var d = defCache[typeName];
        if (d.finalized !== true) {
            throw new Error("");
        }
        return d.supertypeList.slice(1);
    }
    // Returns an object mapping from every known type in the defCache to the
    // most specific supertype whose name is an own property of the candidates
    // object.
    function computeSupertypeLookupTable(candidates) {
        var table = {};
        var typeNames = Object.keys(defCache);
        var typeNameCount = typeNames.length;
        for (var i = 0; i < typeNameCount; ++i) {
            var typeName = typeNames[i];
            var d = defCache[typeName];
            if (d.finalized !== true) {
                throw new Error("" + typeName);
            }
            for (var j = 0; j < d.supertypeList.length; ++j) {
                var superTypeName = d.supertypeList[j];
                if (hasOwn.call(candidates, superTypeName)) {
                    table[typeName] = superTypeName;
                    break;
                }
            }
        }
        return table;
    }
    var builders = Object.create(null);
    // This object is used as prototype for any node created by a builder.
    var nodePrototype = {};
    // Call this function to define a new method to be shared by all AST
    // nodes. The replaced method (if any) is returned for easy wrapping.
    function defineMethod(name, func) {
        var old = nodePrototype[name];
        // Pass undefined as func to delete nodePrototype[name].
        if (isUndefined.check(func)) {
            delete nodePrototype[name];
        }
        else {
            isFunction.assert(func);
            Object.defineProperty(nodePrototype, name, {
                enumerable: true,
                configurable: true,
                value: func
            });
        }
        return old;
    }
    function getBuilderName(typeName) {
        return typeName.replace(/^[A-Z]+/, function (upperCasePrefix) {
            var len = upperCasePrefix.length;
            switch (len) {
                case 0: return "";
                // If there's only one initial capital letter, just lower-case it.
                case 1: return upperCasePrefix.toLowerCase();
                default:
                    // If there's more than one initial capital letter, lower-case
                    // all but the last one, so that XMLDefaultDeclaration (for
                    // example) becomes xmlDefaultDeclaration.
                    return upperCasePrefix.slice(0, len - 1).toLowerCase() +
                        upperCasePrefix.charAt(len - 1);
            }
        });
    }
    function getStatementBuilderName(typeName) {
        typeName = getBuilderName(typeName);
        return typeName.replace(/(Expression)?$/, "Statement");
    }
    var namedTypes = {};
    // Like Object.keys, but aware of what fields each AST type should have.
    function getFieldNames(object) {
        var d = defFromValue(object);
        if (d) {
            return d.fieldNames.slice(0);
        }
        if ("type" in object) {
            throw new Error("did not recognize object of type " +
                JSON.stringify(object.type));
        }
        return Object.keys(object);
    }
    // Get the value of an object property, taking object.type and default
    // functions into account.
    function getFieldValue(object, fieldName) {
        var d = defFromValue(object);
        if (d) {
            var field = d.allFields[fieldName];
            if (field) {
                return field.getValue(object);
            }
        }
        return object && object[fieldName];
    }
    // Iterate over all defined fields of an object, including those missing
    // or undefined, passing each field name and effective value (as returned
    // by getFieldValue) to the callback. If the object has no corresponding
    // Def, the callback will never be called.
    function eachField(object, callback, context) {
        getFieldNames(object).forEach(function (name) {
            callback.call(this, name, getFieldValue(object, name));
        }, context);
    }
    // Similar to eachField, except that iteration stops as soon as the
    // callback returns a truthy value. Like Array.prototype.some, the final
    // result is either true or false to indicates whether the callback
    // returned true for any element or not.
    function someField(object, callback, context) {
        return getFieldNames(object).some(function (name) {
            return callback.call(this, name, getFieldValue(object, name));
        }, context);
    }
    // Adds an additional builder for Expression subtypes
    // that wraps the built Expression in an ExpressionStatements.
    function wrapExpressionBuilderWithStatement(typeName) {
        var wrapperName = getStatementBuilderName(typeName);
        // skip if the builder already exists
        if (builders[wrapperName])
            return;
        // the builder function to wrap with builders.ExpressionStatement
        var wrapped = builders[getBuilderName(typeName)];
        // skip if there is nothing to wrap
        if (!wrapped)
            return;
        var builder = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return builders.expressionStatement(wrapped.apply(builders, args));
        };
        builder.from = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return builders.expressionStatement(wrapped.from.apply(builders, args));
        };
        builders[wrapperName] = builder;
    }
    function populateSupertypeList(typeName, list) {
        list.length = 0;
        list.push(typeName);
        var lastSeen = Object.create(null);
        for (var pos = 0; pos < list.length; ++pos) {
            typeName = list[pos];
            var d = defCache[typeName];
            if (d.finalized !== true) {
                throw new Error("");
            }
            // If we saw typeName earlier in the breadth-first traversal,
            // delete the last-seen occurrence.
            if (hasOwn.call(lastSeen, typeName)) {
                delete list[lastSeen[typeName]];
            }
            // Record the new index of the last-seen occurrence of typeName.
            lastSeen[typeName] = pos;
            // Enqueue the base names of this type.
            list.push.apply(list, d.baseNames);
        }
        // Compaction loop to remove array holes.
        for (var to = 0, from = to, len = list.length; from < len; ++from) {
            if (hasOwn.call(list, from)) {
                list[to++] = list[from];
            }
        }
        list.length = to;
    }
    function extend(into, from) {
        Object.keys(from).forEach(function (name) {
            into[name] = from[name];
        });
        return into;
    }
    function finalize() {
        Object.keys(defCache).forEach(function (name) {
            defCache[name].finalize();
        });
    }
    return {
        Type: Type,
        builtInTypes: builtInTypes,
        getSupertypeNames: getSupertypeNames,
        computeSupertypeLookupTable: computeSupertypeLookupTable,
        builders: builders,
        defineMethod: defineMethod,
        getBuilderName: getBuilderName,
        getStatementBuilderName: getStatementBuilderName,
        namedTypes: namedTypes,
        getFieldNames: getFieldNames,
        getFieldValue: getFieldValue,
        eachField: eachField,
        someField: someField,
        finalize: finalize,
    };
}
exports.default = typesPlugin;
;

},{"tslib":31}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visit = exports.use = exports.Type = exports.someField = exports.PathVisitor = exports.Path = exports.NodePath = exports.namedTypes = exports.getSupertypeNames = exports.getFieldValue = exports.getFieldNames = exports.getBuilderName = exports.finalize = exports.eachField = exports.defineMethod = exports.builtInTypes = exports.builders = exports.astNodesAreEquivalent = void 0;
var tslib_1 = require("tslib");
var fork_1 = tslib_1.__importDefault(require("./fork"));
var core_1 = tslib_1.__importDefault(require("./def/core"));
var es6_1 = tslib_1.__importDefault(require("./def/es6"));
var es2016_1 = tslib_1.__importDefault(require("./def/es2016"));
var es2017_1 = tslib_1.__importDefault(require("./def/es2017"));
var es2018_1 = tslib_1.__importDefault(require("./def/es2018"));
var es2019_1 = tslib_1.__importDefault(require("./def/es2019"));
var es2020_1 = tslib_1.__importDefault(require("./def/es2020"));
var jsx_1 = tslib_1.__importDefault(require("./def/jsx"));
var flow_1 = tslib_1.__importDefault(require("./def/flow"));
var esprima_1 = tslib_1.__importDefault(require("./def/esprima"));
var babel_1 = tslib_1.__importDefault(require("./def/babel"));
var typescript_1 = tslib_1.__importDefault(require("./def/typescript"));
var es_proposals_1 = tslib_1.__importDefault(require("./def/es-proposals"));
var namedTypes_1 = require("./gen/namedTypes");
Object.defineProperty(exports, "namedTypes", { enumerable: true, get: function () { return namedTypes_1.namedTypes; } });
var _a = fork_1.default([
    // This core module of AST types captures ES5 as it is parsed today by
    // git://github.com/ariya/esprima.git#master.
    core_1.default,
    // Feel free to add to or remove from this list of extension modules to
    // configure the precise type hierarchy that you need.
    es6_1.default,
    es2016_1.default,
    es2017_1.default,
    es2018_1.default,
    es2019_1.default,
    es2020_1.default,
    jsx_1.default,
    flow_1.default,
    esprima_1.default,
    babel_1.default,
    typescript_1.default,
    es_proposals_1.default,
]), astNodesAreEquivalent = _a.astNodesAreEquivalent, builders = _a.builders, builtInTypes = _a.builtInTypes, defineMethod = _a.defineMethod, eachField = _a.eachField, finalize = _a.finalize, getBuilderName = _a.getBuilderName, getFieldNames = _a.getFieldNames, getFieldValue = _a.getFieldValue, getSupertypeNames = _a.getSupertypeNames, n = _a.namedTypes, NodePath = _a.NodePath, Path = _a.Path, PathVisitor = _a.PathVisitor, someField = _a.someField, Type = _a.Type, use = _a.use, visit = _a.visit;
exports.astNodesAreEquivalent = astNodesAreEquivalent;
exports.builders = builders;
exports.builtInTypes = builtInTypes;
exports.defineMethod = defineMethod;
exports.eachField = eachField;
exports.finalize = finalize;
exports.getBuilderName = getBuilderName;
exports.getFieldNames = getFieldNames;
exports.getFieldValue = getFieldValue;
exports.getSupertypeNames = getSupertypeNames;
exports.NodePath = NodePath;
exports.Path = Path;
exports.PathVisitor = PathVisitor;
exports.someField = someField;
exports.Type = Type;
exports.use = use;
exports.visit = visit;
// Populate the exported fields of the namedTypes namespace, while still
// retaining its member types.
Object.assign(namedTypes_1.namedTypes, n);

},{"./def/babel":6,"./def/core":8,"./def/es-proposals":9,"./def/es2016":10,"./def/es2017":11,"./def/es2018":12,"./def/es2019":13,"./def/es2020":14,"./def/es6":15,"./def/esprima":16,"./def/flow":17,"./def/jsx":18,"./def/typescript":20,"./fork":21,"./gen/namedTypes":22,"tslib":31}],31:[function(require,module,exports){
(function (global){(function (){
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global global, define, System, Reflect, Promise */
var __extends;
var __assign;
var __rest;
var __decorate;
var __param;
var __metadata;
var __awaiter;
var __generator;
var __exportStar;
var __values;
var __read;
var __spread;
var __spreadArrays;
var __spreadArray;
var __await;
var __asyncGenerator;
var __asyncDelegator;
var __asyncValues;
var __makeTemplateObject;
var __importStar;
var __importDefault;
var __classPrivateFieldGet;
var __classPrivateFieldSet;
var __createBinding;
(function (factory) {
    var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : {};
    if (typeof define === "function" && define.amd) {
        define("tslib", ["exports"], function (exports) { factory(createExporter(root, createExporter(exports))); });
    }
    else if (typeof module === "object" && typeof module.exports === "object") {
        factory(createExporter(root, createExporter(module.exports)));
    }
    else {
        factory(createExporter(root));
    }
    function createExporter(exports, previous) {
        if (exports !== root) {
            if (typeof Object.create === "function") {
                Object.defineProperty(exports, "__esModule", { value: true });
            }
            else {
                exports.__esModule = true;
            }
        }
        return function (id, v) { return exports[id] = previous ? previous(id, v) : v; };
    }
})
(function (exporter) {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };

    __extends = function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };

    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };

    __rest = function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    };

    __decorate = function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };

    __param = function (paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    };

    __metadata = function (metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    };

    __awaiter = function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    __generator = function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };

    __exportStar = function(m, o) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
    };

    __createBinding = Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    });

    __values = function (o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };

    __read = function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };

    /** @deprecated */
    __spread = function () {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    };

    /** @deprecated */
    __spreadArrays = function () {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    };

    __spreadArray = function (to, from) {
        for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
            to[j] = from[i];
        return to;
    };

    __await = function (v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    };

    __asyncGenerator = function (thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    };

    __asyncDelegator = function (o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    };

    __asyncValues = function (o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    };

    __makeTemplateObject = function (cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    var __setModuleDefault = Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    };

    __importStar = function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };

    __importDefault = function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };

    __classPrivateFieldGet = function (receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to get private field on non-instance");
        }
        return privateMap.get(receiver);
    };

    __classPrivateFieldSet = function (receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to set private field on non-instance");
        }
        privateMap.set(receiver, value);
        return value;
    };

    exporter("__extends", __extends);
    exporter("__assign", __assign);
    exporter("__rest", __rest);
    exporter("__decorate", __decorate);
    exporter("__param", __param);
    exporter("__metadata", __metadata);
    exporter("__awaiter", __awaiter);
    exporter("__generator", __generator);
    exporter("__exportStar", __exportStar);
    exporter("__createBinding", __createBinding);
    exporter("__values", __values);
    exporter("__read", __read);
    exporter("__spread", __spread);
    exporter("__spreadArrays", __spreadArrays);
    exporter("__spreadArray", __spreadArray);
    exporter("__await", __await);
    exporter("__asyncGenerator", __asyncGenerator);
    exporter("__asyncDelegator", __asyncDelegator);
    exporter("__asyncValues", __asyncValues);
    exporter("__makeTemplateObject", __makeTemplateObject);
    exporter("__importStar", __importStar);
    exporter("__importDefault", __importDefault);
    exporter("__classPrivateFieldGet", __classPrivateFieldGet);
    exporter("__classPrivateFieldSet", __classPrivateFieldSet);
});

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],32:[function(require,module,exports){

},{}],33:[function(require,module,exports){
(function webpackUniversalModuleDefinition(root, factory) {
/* istanbul ignore next */
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
/* istanbul ignore next */
	else if(typeof exports === 'object')
		exports["esprima"] = factory();
	else
		root["esprima"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/* istanbul ignore if */
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/*
	  Copyright JS Foundation and other contributors, https://js.foundation/

	  Redistribution and use in source and binary forms, with or without
	  modification, are permitted provided that the following conditions are met:

	    * Redistributions of source code must retain the above copyright
	      notice, this list of conditions and the following disclaimer.
	    * Redistributions in binary form must reproduce the above copyright
	      notice, this list of conditions and the following disclaimer in the
	      documentation and/or other materials provided with the distribution.

	  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	var comment_handler_1 = __webpack_require__(1);
	var jsx_parser_1 = __webpack_require__(3);
	var parser_1 = __webpack_require__(8);
	var tokenizer_1 = __webpack_require__(15);
	function parse(code, options, delegate) {
	    var commentHandler = null;
	    var proxyDelegate = function (node, metadata) {
	        if (delegate) {
	            delegate(node, metadata);
	        }
	        if (commentHandler) {
	            commentHandler.visit(node, metadata);
	        }
	    };
	    var parserDelegate = (typeof delegate === 'function') ? proxyDelegate : null;
	    var collectComment = false;
	    if (options) {
	        collectComment = (typeof options.comment === 'boolean' && options.comment);
	        var attachComment = (typeof options.attachComment === 'boolean' && options.attachComment);
	        if (collectComment || attachComment) {
	            commentHandler = new comment_handler_1.CommentHandler();
	            commentHandler.attach = attachComment;
	            options.comment = true;
	            parserDelegate = proxyDelegate;
	        }
	    }
	    var isModule = false;
	    if (options && typeof options.sourceType === 'string') {
	        isModule = (options.sourceType === 'module');
	    }
	    var parser;
	    if (options && typeof options.jsx === 'boolean' && options.jsx) {
	        parser = new jsx_parser_1.JSXParser(code, options, parserDelegate);
	    }
	    else {
	        parser = new parser_1.Parser(code, options, parserDelegate);
	    }
	    var program = isModule ? parser.parseModule() : parser.parseScript();
	    var ast = program;
	    if (collectComment && commentHandler) {
	        ast.comments = commentHandler.comments;
	    }
	    if (parser.config.tokens) {
	        ast.tokens = parser.tokens;
	    }
	    if (parser.config.tolerant) {
	        ast.errors = parser.errorHandler.errors;
	    }
	    return ast;
	}
	exports.parse = parse;
	function parseModule(code, options, delegate) {
	    var parsingOptions = options || {};
	    parsingOptions.sourceType = 'module';
	    return parse(code, parsingOptions, delegate);
	}
	exports.parseModule = parseModule;
	function parseScript(code, options, delegate) {
	    var parsingOptions = options || {};
	    parsingOptions.sourceType = 'script';
	    return parse(code, parsingOptions, delegate);
	}
	exports.parseScript = parseScript;
	function tokenize(code, options, delegate) {
	    var tokenizer = new tokenizer_1.Tokenizer(code, options);
	    var tokens;
	    tokens = [];
	    try {
	        while (true) {
	            var token = tokenizer.getNextToken();
	            if (!token) {
	                break;
	            }
	            if (delegate) {
	                token = delegate(token);
	            }
	            tokens.push(token);
	        }
	    }
	    catch (e) {
	        tokenizer.errorHandler.tolerate(e);
	    }
	    if (tokenizer.errorHandler.tolerant) {
	        tokens.errors = tokenizer.errors();
	    }
	    return tokens;
	}
	exports.tokenize = tokenize;
	var syntax_1 = __webpack_require__(2);
	exports.Syntax = syntax_1.Syntax;
	// Sync with *.json manifests.
	exports.version = '4.0.1';


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var syntax_1 = __webpack_require__(2);
	var CommentHandler = (function () {
	    function CommentHandler() {
	        this.attach = false;
	        this.comments = [];
	        this.stack = [];
	        this.leading = [];
	        this.trailing = [];
	    }
	    CommentHandler.prototype.insertInnerComments = function (node, metadata) {
	        //  innnerComments for properties empty block
	        //  `function a() {/** comments **\/}`
	        if (node.type === syntax_1.Syntax.BlockStatement && node.body.length === 0) {
	            var innerComments = [];
	            for (var i = this.leading.length - 1; i >= 0; --i) {
	                var entry = this.leading[i];
	                if (metadata.end.offset >= entry.start) {
	                    innerComments.unshift(entry.comment);
	                    this.leading.splice(i, 1);
	                    this.trailing.splice(i, 1);
	                }
	            }
	            if (innerComments.length) {
	                node.innerComments = innerComments;
	            }
	        }
	    };
	    CommentHandler.prototype.findTrailingComments = function (metadata) {
	        var trailingComments = [];
	        if (this.trailing.length > 0) {
	            for (var i = this.trailing.length - 1; i >= 0; --i) {
	                var entry_1 = this.trailing[i];
	                if (entry_1.start >= metadata.end.offset) {
	                    trailingComments.unshift(entry_1.comment);
	                }
	            }
	            this.trailing.length = 0;
	            return trailingComments;
	        }
	        var entry = this.stack[this.stack.length - 1];
	        if (entry && entry.node.trailingComments) {
	            var firstComment = entry.node.trailingComments[0];
	            if (firstComment && firstComment.range[0] >= metadata.end.offset) {
	                trailingComments = entry.node.trailingComments;
	                delete entry.node.trailingComments;
	            }
	        }
	        return trailingComments;
	    };
	    CommentHandler.prototype.findLeadingComments = function (metadata) {
	        var leadingComments = [];
	        var target;
	        while (this.stack.length > 0) {
	            var entry = this.stack[this.stack.length - 1];
	            if (entry && entry.start >= metadata.start.offset) {
	                target = entry.node;
	                this.stack.pop();
	            }
	            else {
	                break;
	            }
	        }
	        if (target) {
	            var count = target.leadingComments ? target.leadingComments.length : 0;
	            for (var i = count - 1; i >= 0; --i) {
	                var comment = target.leadingComments[i];
	                if (comment.range[1] <= metadata.start.offset) {
	                    leadingComments.unshift(comment);
	                    target.leadingComments.splice(i, 1);
	                }
	            }
	            if (target.leadingComments && target.leadingComments.length === 0) {
	                delete target.leadingComments;
	            }
	            return leadingComments;
	        }
	        for (var i = this.leading.length - 1; i >= 0; --i) {
	            var entry = this.leading[i];
	            if (entry.start <= metadata.start.offset) {
	                leadingComments.unshift(entry.comment);
	                this.leading.splice(i, 1);
	            }
	        }
	        return leadingComments;
	    };
	    CommentHandler.prototype.visitNode = function (node, metadata) {
	        if (node.type === syntax_1.Syntax.Program && node.body.length > 0) {
	            return;
	        }
	        this.insertInnerComments(node, metadata);
	        var trailingComments = this.findTrailingComments(metadata);
	        var leadingComments = this.findLeadingComments(metadata);
	        if (leadingComments.length > 0) {
	            node.leadingComments = leadingComments;
	        }
	        if (trailingComments.length > 0) {
	            node.trailingComments = trailingComments;
	        }
	        this.stack.push({
	            node: node,
	            start: metadata.start.offset
	        });
	    };
	    CommentHandler.prototype.visitComment = function (node, metadata) {
	        var type = (node.type[0] === 'L') ? 'Line' : 'Block';
	        var comment = {
	            type: type,
	            value: node.value
	        };
	        if (node.range) {
	            comment.range = node.range;
	        }
	        if (node.loc) {
	            comment.loc = node.loc;
	        }
	        this.comments.push(comment);
	        if (this.attach) {
	            var entry = {
	                comment: {
	                    type: type,
	                    value: node.value,
	                    range: [metadata.start.offset, metadata.end.offset]
	                },
	                start: metadata.start.offset
	            };
	            if (node.loc) {
	                entry.comment.loc = node.loc;
	            }
	            node.type = type;
	            this.leading.push(entry);
	            this.trailing.push(entry);
	        }
	    };
	    CommentHandler.prototype.visit = function (node, metadata) {
	        if (node.type === 'LineComment') {
	            this.visitComment(node, metadata);
	        }
	        else if (node.type === 'BlockComment') {
	            this.visitComment(node, metadata);
	        }
	        else if (this.attach) {
	            this.visitNode(node, metadata);
	        }
	    };
	    return CommentHandler;
	}());
	exports.CommentHandler = CommentHandler;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Syntax = {
	    AssignmentExpression: 'AssignmentExpression',
	    AssignmentPattern: 'AssignmentPattern',
	    ArrayExpression: 'ArrayExpression',
	    ArrayPattern: 'ArrayPattern',
	    ArrowFunctionExpression: 'ArrowFunctionExpression',
	    AwaitExpression: 'AwaitExpression',
	    BlockStatement: 'BlockStatement',
	    BinaryExpression: 'BinaryExpression',
	    BreakStatement: 'BreakStatement',
	    CallExpression: 'CallExpression',
	    CatchClause: 'CatchClause',
	    ClassBody: 'ClassBody',
	    ClassDeclaration: 'ClassDeclaration',
	    ClassExpression: 'ClassExpression',
	    ConditionalExpression: 'ConditionalExpression',
	    ContinueStatement: 'ContinueStatement',
	    DoWhileStatement: 'DoWhileStatement',
	    DebuggerStatement: 'DebuggerStatement',
	    EmptyStatement: 'EmptyStatement',
	    ExportAllDeclaration: 'ExportAllDeclaration',
	    ExportDefaultDeclaration: 'ExportDefaultDeclaration',
	    ExportNamedDeclaration: 'ExportNamedDeclaration',
	    ExportSpecifier: 'ExportSpecifier',
	    ExpressionStatement: 'ExpressionStatement',
	    ForStatement: 'ForStatement',
	    ForOfStatement: 'ForOfStatement',
	    ForInStatement: 'ForInStatement',
	    FunctionDeclaration: 'FunctionDeclaration',
	    FunctionExpression: 'FunctionExpression',
	    Identifier: 'Identifier',
	    IfStatement: 'IfStatement',
	    ImportDeclaration: 'ImportDeclaration',
	    ImportDefaultSpecifier: 'ImportDefaultSpecifier',
	    ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
	    ImportSpecifier: 'ImportSpecifier',
	    Literal: 'Literal',
	    LabeledStatement: 'LabeledStatement',
	    LogicalExpression: 'LogicalExpression',
	    MemberExpression: 'MemberExpression',
	    MetaProperty: 'MetaProperty',
	    MethodDefinition: 'MethodDefinition',
	    NewExpression: 'NewExpression',
	    ObjectExpression: 'ObjectExpression',
	    ObjectPattern: 'ObjectPattern',
	    Program: 'Program',
	    Property: 'Property',
	    RestElement: 'RestElement',
	    ReturnStatement: 'ReturnStatement',
	    SequenceExpression: 'SequenceExpression',
	    SpreadElement: 'SpreadElement',
	    Super: 'Super',
	    SwitchCase: 'SwitchCase',
	    SwitchStatement: 'SwitchStatement',
	    TaggedTemplateExpression: 'TaggedTemplateExpression',
	    TemplateElement: 'TemplateElement',
	    TemplateLiteral: 'TemplateLiteral',
	    ThisExpression: 'ThisExpression',
	    ThrowStatement: 'ThrowStatement',
	    TryStatement: 'TryStatement',
	    UnaryExpression: 'UnaryExpression',
	    UpdateExpression: 'UpdateExpression',
	    VariableDeclaration: 'VariableDeclaration',
	    VariableDeclarator: 'VariableDeclarator',
	    WhileStatement: 'WhileStatement',
	    WithStatement: 'WithStatement',
	    YieldExpression: 'YieldExpression'
	};


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
/* istanbul ignore next */
	var __extends = (this && this.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	var character_1 = __webpack_require__(4);
	var JSXNode = __webpack_require__(5);
	var jsx_syntax_1 = __webpack_require__(6);
	var Node = __webpack_require__(7);
	var parser_1 = __webpack_require__(8);
	var token_1 = __webpack_require__(13);
	var xhtml_entities_1 = __webpack_require__(14);
	token_1.TokenName[100 /* Identifier */] = 'JSXIdentifier';
	token_1.TokenName[101 /* Text */] = 'JSXText';
	// Fully qualified element name, e.g. <svg:path> returns "svg:path"
	function getQualifiedElementName(elementName) {
	    var qualifiedName;
	    switch (elementName.type) {
	        case jsx_syntax_1.JSXSyntax.JSXIdentifier:
	            var id = elementName;
	            qualifiedName = id.name;
	            break;
	        case jsx_syntax_1.JSXSyntax.JSXNamespacedName:
	            var ns = elementName;
	            qualifiedName = getQualifiedElementName(ns.namespace) + ':' +
	                getQualifiedElementName(ns.name);
	            break;
	        case jsx_syntax_1.JSXSyntax.JSXMemberExpression:
	            var expr = elementName;
	            qualifiedName = getQualifiedElementName(expr.object) + '.' +
	                getQualifiedElementName(expr.property);
	            break;
	        /* istanbul ignore next */
	        default:
	            break;
	    }
	    return qualifiedName;
	}
	var JSXParser = (function (_super) {
	    __extends(JSXParser, _super);
	    function JSXParser(code, options, delegate) {
	        return _super.call(this, code, options, delegate) || this;
	    }
	    JSXParser.prototype.parsePrimaryExpression = function () {
	        return this.match('<') ? this.parseJSXRoot() : _super.prototype.parsePrimaryExpression.call(this);
	    };
	    JSXParser.prototype.startJSX = function () {
	        // Unwind the scanner before the lookahead token.
	        this.scanner.index = this.startMarker.index;
	        this.scanner.lineNumber = this.startMarker.line;
	        this.scanner.lineStart = this.startMarker.index - this.startMarker.column;
	    };
	    JSXParser.prototype.finishJSX = function () {
	        // Prime the next lookahead.
	        this.nextToken();
	    };
	    JSXParser.prototype.reenterJSX = function () {
	        this.startJSX();
	        this.expectJSX('}');
	        // Pop the closing '}' added from the lookahead.
	        if (this.config.tokens) {
	            this.tokens.pop();
	        }
	    };
	    JSXParser.prototype.createJSXNode = function () {
	        this.collectComments();
	        return {
	            index: this.scanner.index,
	            line: this.scanner.lineNumber,
	            column: this.scanner.index - this.scanner.lineStart
	        };
	    };
	    JSXParser.prototype.createJSXChildNode = function () {
	        return {
	            index: this.scanner.index,
	            line: this.scanner.lineNumber,
	            column: this.scanner.index - this.scanner.lineStart
	        };
	    };
	    JSXParser.prototype.scanXHTMLEntity = function (quote) {
	        var result = '&';
	        var valid = true;
	        var terminated = false;
	        var numeric = false;
	        var hex = false;
	        while (!this.scanner.eof() && valid && !terminated) {
	            var ch = this.scanner.source[this.scanner.index];
	            if (ch === quote) {
	                break;
	            }
	            terminated = (ch === ';');
	            result += ch;
	            ++this.scanner.index;
	            if (!terminated) {
	                switch (result.length) {
	                    case 2:
	                        // e.g. '&#123;'
	                        numeric = (ch === '#');
	                        break;
	                    case 3:
	                        if (numeric) {
	                            // e.g. '&#x41;'
	                            hex = (ch === 'x');
	                            valid = hex || character_1.Character.isDecimalDigit(ch.charCodeAt(0));
	                            numeric = numeric && !hex;
	                        }
	                        break;
	                    default:
	                        valid = valid && !(numeric && !character_1.Character.isDecimalDigit(ch.charCodeAt(0)));
	                        valid = valid && !(hex && !character_1.Character.isHexDigit(ch.charCodeAt(0)));
	                        break;
	                }
	            }
	        }
	        if (valid && terminated && result.length > 2) {
	            // e.g. '&#x41;' becomes just '#x41'
	            var str = result.substr(1, result.length - 2);
	            if (numeric && str.length > 1) {
	                result = String.fromCharCode(parseInt(str.substr(1), 10));
	            }
	            else if (hex && str.length > 2) {
	                result = String.fromCharCode(parseInt('0' + str.substr(1), 16));
	            }
	            else if (!numeric && !hex && xhtml_entities_1.XHTMLEntities[str]) {
	                result = xhtml_entities_1.XHTMLEntities[str];
	            }
	        }
	        return result;
	    };
	    // Scan the next JSX token. This replaces Scanner#lex when in JSX mode.
	    JSXParser.prototype.lexJSX = function () {
	        var cp = this.scanner.source.charCodeAt(this.scanner.index);
	        // < > / : = { }
	        if (cp === 60 || cp === 62 || cp === 47 || cp === 58 || cp === 61 || cp === 123 || cp === 125) {
	            var value = this.scanner.source[this.scanner.index++];
	            return {
	                type: 7 /* Punctuator */,
	                value: value,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: this.scanner.index - 1,
	                end: this.scanner.index
	            };
	        }
	        // " '
	        if (cp === 34 || cp === 39) {
	            var start = this.scanner.index;
	            var quote = this.scanner.source[this.scanner.index++];
	            var str = '';
	            while (!this.scanner.eof()) {
	                var ch = this.scanner.source[this.scanner.index++];
	                if (ch === quote) {
	                    break;
	                }
	                else if (ch === '&') {
	                    str += this.scanXHTMLEntity(quote);
	                }
	                else {
	                    str += ch;
	                }
	            }
	            return {
	                type: 8 /* StringLiteral */,
	                value: str,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: start,
	                end: this.scanner.index
	            };
	        }
	        // ... or .
	        if (cp === 46) {
	            var n1 = this.scanner.source.charCodeAt(this.scanner.index + 1);
	            var n2 = this.scanner.source.charCodeAt(this.scanner.index + 2);
	            var value = (n1 === 46 && n2 === 46) ? '...' : '.';
	            var start = this.scanner.index;
	            this.scanner.index += value.length;
	            return {
	                type: 7 /* Punctuator */,
	                value: value,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: start,
	                end: this.scanner.index
	            };
	        }
	        // `
	        if (cp === 96) {
	            // Only placeholder, since it will be rescanned as a real assignment expression.
	            return {
	                type: 10 /* Template */,
	                value: '',
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: this.scanner.index,
	                end: this.scanner.index
	            };
	        }
	        // Identifer can not contain backslash (char code 92).
	        if (character_1.Character.isIdentifierStart(cp) && (cp !== 92)) {
	            var start = this.scanner.index;
	            ++this.scanner.index;
	            while (!this.scanner.eof()) {
	                var ch = this.scanner.source.charCodeAt(this.scanner.index);
	                if (character_1.Character.isIdentifierPart(ch) && (ch !== 92)) {
	                    ++this.scanner.index;
	                }
	                else if (ch === 45) {
	                    // Hyphen (char code 45) can be part of an identifier.
	                    ++this.scanner.index;
	                }
	                else {
	                    break;
	                }
	            }
	            var id = this.scanner.source.slice(start, this.scanner.index);
	            return {
	                type: 100 /* Identifier */,
	                value: id,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: start,
	                end: this.scanner.index
	            };
	        }
	        return this.scanner.lex();
	    };
	    JSXParser.prototype.nextJSXToken = function () {
	        this.collectComments();
	        this.startMarker.index = this.scanner.index;
	        this.startMarker.line = this.scanner.lineNumber;
	        this.startMarker.column = this.scanner.index - this.scanner.lineStart;
	        var token = this.lexJSX();
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        if (this.config.tokens) {
	            this.tokens.push(this.convertToken(token));
	        }
	        return token;
	    };
	    JSXParser.prototype.nextJSXText = function () {
	        this.startMarker.index = this.scanner.index;
	        this.startMarker.line = this.scanner.lineNumber;
	        this.startMarker.column = this.scanner.index - this.scanner.lineStart;
	        var start = this.scanner.index;
	        var text = '';
	        while (!this.scanner.eof()) {
	            var ch = this.scanner.source[this.scanner.index];
	            if (ch === '{' || ch === '<') {
	                break;
	            }
	            ++this.scanner.index;
	            text += ch;
	            if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                ++this.scanner.lineNumber;
	                if (ch === '\r' && this.scanner.source[this.scanner.index] === '\n') {
	                    ++this.scanner.index;
	                }
	                this.scanner.lineStart = this.scanner.index;
	            }
	        }
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        var token = {
	            type: 101 /* Text */,
	            value: text,
	            lineNumber: this.scanner.lineNumber,
	            lineStart: this.scanner.lineStart,
	            start: start,
	            end: this.scanner.index
	        };
	        if ((text.length > 0) && this.config.tokens) {
	            this.tokens.push(this.convertToken(token));
	        }
	        return token;
	    };
	    JSXParser.prototype.peekJSXToken = function () {
	        var state = this.scanner.saveState();
	        this.scanner.scanComments();
	        var next = this.lexJSX();
	        this.scanner.restoreState(state);
	        return next;
	    };
	    // Expect the next JSX token to match the specified punctuator.
	    // If not, an exception will be thrown.
	    JSXParser.prototype.expectJSX = function (value) {
	        var token = this.nextJSXToken();
	        if (token.type !== 7 /* Punctuator */ || token.value !== value) {
	            this.throwUnexpectedToken(token);
	        }
	    };
	    // Return true if the next JSX token matches the specified punctuator.
	    JSXParser.prototype.matchJSX = function (value) {
	        var next = this.peekJSXToken();
	        return next.type === 7 /* Punctuator */ && next.value === value;
	    };
	    JSXParser.prototype.parseJSXIdentifier = function () {
	        var node = this.createJSXNode();
	        var token = this.nextJSXToken();
	        if (token.type !== 100 /* Identifier */) {
	            this.throwUnexpectedToken(token);
	        }
	        return this.finalize(node, new JSXNode.JSXIdentifier(token.value));
	    };
	    JSXParser.prototype.parseJSXElementName = function () {
	        var node = this.createJSXNode();
	        var elementName = this.parseJSXIdentifier();
	        if (this.matchJSX(':')) {
	            var namespace = elementName;
	            this.expectJSX(':');
	            var name_1 = this.parseJSXIdentifier();
	            elementName = this.finalize(node, new JSXNode.JSXNamespacedName(namespace, name_1));
	        }
	        else if (this.matchJSX('.')) {
	            while (this.matchJSX('.')) {
	                var object = elementName;
	                this.expectJSX('.');
	                var property = this.parseJSXIdentifier();
	                elementName = this.finalize(node, new JSXNode.JSXMemberExpression(object, property));
	            }
	        }
	        return elementName;
	    };
	    JSXParser.prototype.parseJSXAttributeName = function () {
	        var node = this.createJSXNode();
	        var attributeName;
	        var identifier = this.parseJSXIdentifier();
	        if (this.matchJSX(':')) {
	            var namespace = identifier;
	            this.expectJSX(':');
	            var name_2 = this.parseJSXIdentifier();
	            attributeName = this.finalize(node, new JSXNode.JSXNamespacedName(namespace, name_2));
	        }
	        else {
	            attributeName = identifier;
	        }
	        return attributeName;
	    };
	    JSXParser.prototype.parseJSXStringLiteralAttribute = function () {
	        var node = this.createJSXNode();
	        var token = this.nextJSXToken();
	        if (token.type !== 8 /* StringLiteral */) {
	            this.throwUnexpectedToken(token);
	        }
	        var raw = this.getTokenRaw(token);
	        return this.finalize(node, new Node.Literal(token.value, raw));
	    };
	    JSXParser.prototype.parseJSXExpressionAttribute = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('{');
	        this.finishJSX();
	        if (this.match('}')) {
	            this.tolerateError('JSX attributes must only be assigned a non-empty expression');
	        }
	        var expression = this.parseAssignmentExpression();
	        this.reenterJSX();
	        return this.finalize(node, new JSXNode.JSXExpressionContainer(expression));
	    };
	    JSXParser.prototype.parseJSXAttributeValue = function () {
	        return this.matchJSX('{') ? this.parseJSXExpressionAttribute() :
	            this.matchJSX('<') ? this.parseJSXElement() : this.parseJSXStringLiteralAttribute();
	    };
	    JSXParser.prototype.parseJSXNameValueAttribute = function () {
	        var node = this.createJSXNode();
	        var name = this.parseJSXAttributeName();
	        var value = null;
	        if (this.matchJSX('=')) {
	            this.expectJSX('=');
	            value = this.parseJSXAttributeValue();
	        }
	        return this.finalize(node, new JSXNode.JSXAttribute(name, value));
	    };
	    JSXParser.prototype.parseJSXSpreadAttribute = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('{');
	        this.expectJSX('...');
	        this.finishJSX();
	        var argument = this.parseAssignmentExpression();
	        this.reenterJSX();
	        return this.finalize(node, new JSXNode.JSXSpreadAttribute(argument));
	    };
	    JSXParser.prototype.parseJSXAttributes = function () {
	        var attributes = [];
	        while (!this.matchJSX('/') && !this.matchJSX('>')) {
	            var attribute = this.matchJSX('{') ? this.parseJSXSpreadAttribute() :
	                this.parseJSXNameValueAttribute();
	            attributes.push(attribute);
	        }
	        return attributes;
	    };
	    JSXParser.prototype.parseJSXOpeningElement = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('<');
	        var name = this.parseJSXElementName();
	        var attributes = this.parseJSXAttributes();
	        var selfClosing = this.matchJSX('/');
	        if (selfClosing) {
	            this.expectJSX('/');
	        }
	        this.expectJSX('>');
	        return this.finalize(node, new JSXNode.JSXOpeningElement(name, selfClosing, attributes));
	    };
	    JSXParser.prototype.parseJSXBoundaryElement = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('<');
	        if (this.matchJSX('/')) {
	            this.expectJSX('/');
	            var name_3 = this.parseJSXElementName();
	            this.expectJSX('>');
	            return this.finalize(node, new JSXNode.JSXClosingElement(name_3));
	        }
	        var name = this.parseJSXElementName();
	        var attributes = this.parseJSXAttributes();
	        var selfClosing = this.matchJSX('/');
	        if (selfClosing) {
	            this.expectJSX('/');
	        }
	        this.expectJSX('>');
	        return this.finalize(node, new JSXNode.JSXOpeningElement(name, selfClosing, attributes));
	    };
	    JSXParser.prototype.parseJSXEmptyExpression = function () {
	        var node = this.createJSXChildNode();
	        this.collectComments();
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        return this.finalize(node, new JSXNode.JSXEmptyExpression());
	    };
	    JSXParser.prototype.parseJSXExpressionContainer = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('{');
	        var expression;
	        if (this.matchJSX('}')) {
	            expression = this.parseJSXEmptyExpression();
	            this.expectJSX('}');
	        }
	        else {
	            this.finishJSX();
	            expression = this.parseAssignmentExpression();
	            this.reenterJSX();
	        }
	        return this.finalize(node, new JSXNode.JSXExpressionContainer(expression));
	    };
	    JSXParser.prototype.parseJSXChildren = function () {
	        var children = [];
	        while (!this.scanner.eof()) {
	            var node = this.createJSXChildNode();
	            var token = this.nextJSXText();
	            if (token.start < token.end) {
	                var raw = this.getTokenRaw(token);
	                var child = this.finalize(node, new JSXNode.JSXText(token.value, raw));
	                children.push(child);
	            }
	            if (this.scanner.source[this.scanner.index] === '{') {
	                var container = this.parseJSXExpressionContainer();
	                children.push(container);
	            }
	            else {
	                break;
	            }
	        }
	        return children;
	    };
	    JSXParser.prototype.parseComplexJSXElement = function (el) {
	        var stack = [];
	        while (!this.scanner.eof()) {
	            el.children = el.children.concat(this.parseJSXChildren());
	            var node = this.createJSXChildNode();
	            var element = this.parseJSXBoundaryElement();
	            if (element.type === jsx_syntax_1.JSXSyntax.JSXOpeningElement) {
	                var opening = element;
	                if (opening.selfClosing) {
	                    var child = this.finalize(node, new JSXNode.JSXElement(opening, [], null));
	                    el.children.push(child);
	                }
	                else {
	                    stack.push(el);
	                    el = { node: node, opening: opening, closing: null, children: [] };
	                }
	            }
	            if (element.type === jsx_syntax_1.JSXSyntax.JSXClosingElement) {
	                el.closing = element;
	                var open_1 = getQualifiedElementName(el.opening.name);
	                var close_1 = getQualifiedElementName(el.closing.name);
	                if (open_1 !== close_1) {
	                    this.tolerateError('Expected corresponding JSX closing tag for %0', open_1);
	                }
	                if (stack.length > 0) {
	                    var child = this.finalize(el.node, new JSXNode.JSXElement(el.opening, el.children, el.closing));
	                    el = stack[stack.length - 1];
	                    el.children.push(child);
	                    stack.pop();
	                }
	                else {
	                    break;
	                }
	            }
	        }
	        return el;
	    };
	    JSXParser.prototype.parseJSXElement = function () {
	        var node = this.createJSXNode();
	        var opening = this.parseJSXOpeningElement();
	        var children = [];
	        var closing = null;
	        if (!opening.selfClosing) {
	            var el = this.parseComplexJSXElement({ node: node, opening: opening, closing: closing, children: children });
	            children = el.children;
	            closing = el.closing;
	        }
	        return this.finalize(node, new JSXNode.JSXElement(opening, children, closing));
	    };
	    JSXParser.prototype.parseJSXRoot = function () {
	        // Pop the opening '<' added from the lookahead.
	        if (this.config.tokens) {
	            this.tokens.pop();
	        }
	        this.startJSX();
	        var element = this.parseJSXElement();
	        this.finishJSX();
	        return element;
	    };
	    JSXParser.prototype.isStartOfExpression = function () {
	        return _super.prototype.isStartOfExpression.call(this) || this.match('<');
	    };
	    return JSXParser;
	}(parser_1.Parser));
	exports.JSXParser = JSXParser;


/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	// See also tools/generate-unicode-regex.js.
	var Regex = {
	    // Unicode v8.0.0 NonAsciiIdentifierStart:
	    NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/,
	    // Unicode v8.0.0 NonAsciiIdentifierPart:
	    NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
	};
	exports.Character = {
	    /* tslint:disable:no-bitwise */
	    fromCodePoint: function (cp) {
	        return (cp < 0x10000) ? String.fromCharCode(cp) :
	            String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10)) +
	                String.fromCharCode(0xDC00 + ((cp - 0x10000) & 1023));
	    },
	    // https://tc39.github.io/ecma262/#sec-white-space
	    isWhiteSpace: function (cp) {
	        return (cp === 0x20) || (cp === 0x09) || (cp === 0x0B) || (cp === 0x0C) || (cp === 0xA0) ||
	            (cp >= 0x1680 && [0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(cp) >= 0);
	    },
	    // https://tc39.github.io/ecma262/#sec-line-terminators
	    isLineTerminator: function (cp) {
	        return (cp === 0x0A) || (cp === 0x0D) || (cp === 0x2028) || (cp === 0x2029);
	    },
	    // https://tc39.github.io/ecma262/#sec-names-and-keywords
	    isIdentifierStart: function (cp) {
	        return (cp === 0x24) || (cp === 0x5F) ||
	            (cp >= 0x41 && cp <= 0x5A) ||
	            (cp >= 0x61 && cp <= 0x7A) ||
	            (cp === 0x5C) ||
	            ((cp >= 0x80) && Regex.NonAsciiIdentifierStart.test(exports.Character.fromCodePoint(cp)));
	    },
	    isIdentifierPart: function (cp) {
	        return (cp === 0x24) || (cp === 0x5F) ||
	            (cp >= 0x41 && cp <= 0x5A) ||
	            (cp >= 0x61 && cp <= 0x7A) ||
	            (cp >= 0x30 && cp <= 0x39) ||
	            (cp === 0x5C) ||
	            ((cp >= 0x80) && Regex.NonAsciiIdentifierPart.test(exports.Character.fromCodePoint(cp)));
	    },
	    // https://tc39.github.io/ecma262/#sec-literals-numeric-literals
	    isDecimalDigit: function (cp) {
	        return (cp >= 0x30 && cp <= 0x39); // 0..9
	    },
	    isHexDigit: function (cp) {
	        return (cp >= 0x30 && cp <= 0x39) ||
	            (cp >= 0x41 && cp <= 0x46) ||
	            (cp >= 0x61 && cp <= 0x66); // a..f
	    },
	    isOctalDigit: function (cp) {
	        return (cp >= 0x30 && cp <= 0x37); // 0..7
	    }
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var jsx_syntax_1 = __webpack_require__(6);
	/* tslint:disable:max-classes-per-file */
	var JSXClosingElement = (function () {
	    function JSXClosingElement(name) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXClosingElement;
	        this.name = name;
	    }
	    return JSXClosingElement;
	}());
	exports.JSXClosingElement = JSXClosingElement;
	var JSXElement = (function () {
	    function JSXElement(openingElement, children, closingElement) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXElement;
	        this.openingElement = openingElement;
	        this.children = children;
	        this.closingElement = closingElement;
	    }
	    return JSXElement;
	}());
	exports.JSXElement = JSXElement;
	var JSXEmptyExpression = (function () {
	    function JSXEmptyExpression() {
	        this.type = jsx_syntax_1.JSXSyntax.JSXEmptyExpression;
	    }
	    return JSXEmptyExpression;
	}());
	exports.JSXEmptyExpression = JSXEmptyExpression;
	var JSXExpressionContainer = (function () {
	    function JSXExpressionContainer(expression) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXExpressionContainer;
	        this.expression = expression;
	    }
	    return JSXExpressionContainer;
	}());
	exports.JSXExpressionContainer = JSXExpressionContainer;
	var JSXIdentifier = (function () {
	    function JSXIdentifier(name) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXIdentifier;
	        this.name = name;
	    }
	    return JSXIdentifier;
	}());
	exports.JSXIdentifier = JSXIdentifier;
	var JSXMemberExpression = (function () {
	    function JSXMemberExpression(object, property) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXMemberExpression;
	        this.object = object;
	        this.property = property;
	    }
	    return JSXMemberExpression;
	}());
	exports.JSXMemberExpression = JSXMemberExpression;
	var JSXAttribute = (function () {
	    function JSXAttribute(name, value) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXAttribute;
	        this.name = name;
	        this.value = value;
	    }
	    return JSXAttribute;
	}());
	exports.JSXAttribute = JSXAttribute;
	var JSXNamespacedName = (function () {
	    function JSXNamespacedName(namespace, name) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXNamespacedName;
	        this.namespace = namespace;
	        this.name = name;
	    }
	    return JSXNamespacedName;
	}());
	exports.JSXNamespacedName = JSXNamespacedName;
	var JSXOpeningElement = (function () {
	    function JSXOpeningElement(name, selfClosing, attributes) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXOpeningElement;
	        this.name = name;
	        this.selfClosing = selfClosing;
	        this.attributes = attributes;
	    }
	    return JSXOpeningElement;
	}());
	exports.JSXOpeningElement = JSXOpeningElement;
	var JSXSpreadAttribute = (function () {
	    function JSXSpreadAttribute(argument) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXSpreadAttribute;
	        this.argument = argument;
	    }
	    return JSXSpreadAttribute;
	}());
	exports.JSXSpreadAttribute = JSXSpreadAttribute;
	var JSXText = (function () {
	    function JSXText(value, raw) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXText;
	        this.value = value;
	        this.raw = raw;
	    }
	    return JSXText;
	}());
	exports.JSXText = JSXText;


/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.JSXSyntax = {
	    JSXAttribute: 'JSXAttribute',
	    JSXClosingElement: 'JSXClosingElement',
	    JSXElement: 'JSXElement',
	    JSXEmptyExpression: 'JSXEmptyExpression',
	    JSXExpressionContainer: 'JSXExpressionContainer',
	    JSXIdentifier: 'JSXIdentifier',
	    JSXMemberExpression: 'JSXMemberExpression',
	    JSXNamespacedName: 'JSXNamespacedName',
	    JSXOpeningElement: 'JSXOpeningElement',
	    JSXSpreadAttribute: 'JSXSpreadAttribute',
	    JSXText: 'JSXText'
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var syntax_1 = __webpack_require__(2);
	/* tslint:disable:max-classes-per-file */
	var ArrayExpression = (function () {
	    function ArrayExpression(elements) {
	        this.type = syntax_1.Syntax.ArrayExpression;
	        this.elements = elements;
	    }
	    return ArrayExpression;
	}());
	exports.ArrayExpression = ArrayExpression;
	var ArrayPattern = (function () {
	    function ArrayPattern(elements) {
	        this.type = syntax_1.Syntax.ArrayPattern;
	        this.elements = elements;
	    }
	    return ArrayPattern;
	}());
	exports.ArrayPattern = ArrayPattern;
	var ArrowFunctionExpression = (function () {
	    function ArrowFunctionExpression(params, body, expression) {
	        this.type = syntax_1.Syntax.ArrowFunctionExpression;
	        this.id = null;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = expression;
	        this.async = false;
	    }
	    return ArrowFunctionExpression;
	}());
	exports.ArrowFunctionExpression = ArrowFunctionExpression;
	var AssignmentExpression = (function () {
	    function AssignmentExpression(operator, left, right) {
	        this.type = syntax_1.Syntax.AssignmentExpression;
	        this.operator = operator;
	        this.left = left;
	        this.right = right;
	    }
	    return AssignmentExpression;
	}());
	exports.AssignmentExpression = AssignmentExpression;
	var AssignmentPattern = (function () {
	    function AssignmentPattern(left, right) {
	        this.type = syntax_1.Syntax.AssignmentPattern;
	        this.left = left;
	        this.right = right;
	    }
	    return AssignmentPattern;
	}());
	exports.AssignmentPattern = AssignmentPattern;
	var AsyncArrowFunctionExpression = (function () {
	    function AsyncArrowFunctionExpression(params, body, expression) {
	        this.type = syntax_1.Syntax.ArrowFunctionExpression;
	        this.id = null;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = expression;
	        this.async = true;
	    }
	    return AsyncArrowFunctionExpression;
	}());
	exports.AsyncArrowFunctionExpression = AsyncArrowFunctionExpression;
	var AsyncFunctionDeclaration = (function () {
	    function AsyncFunctionDeclaration(id, params, body) {
	        this.type = syntax_1.Syntax.FunctionDeclaration;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = false;
	        this.async = true;
	    }
	    return AsyncFunctionDeclaration;
	}());
	exports.AsyncFunctionDeclaration = AsyncFunctionDeclaration;
	var AsyncFunctionExpression = (function () {
	    function AsyncFunctionExpression(id, params, body) {
	        this.type = syntax_1.Syntax.FunctionExpression;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = false;
	        this.async = true;
	    }
	    return AsyncFunctionExpression;
	}());
	exports.AsyncFunctionExpression = AsyncFunctionExpression;
	var AwaitExpression = (function () {
	    function AwaitExpression(argument) {
	        this.type = syntax_1.Syntax.AwaitExpression;
	        this.argument = argument;
	    }
	    return AwaitExpression;
	}());
	exports.AwaitExpression = AwaitExpression;
	var BinaryExpression = (function () {
	    function BinaryExpression(operator, left, right) {
	        var logical = (operator === '||' || operator === '&&');
	        this.type = logical ? syntax_1.Syntax.LogicalExpression : syntax_1.Syntax.BinaryExpression;
	        this.operator = operator;
	        this.left = left;
	        this.right = right;
	    }
	    return BinaryExpression;
	}());
	exports.BinaryExpression = BinaryExpression;
	var BlockStatement = (function () {
	    function BlockStatement(body) {
	        this.type = syntax_1.Syntax.BlockStatement;
	        this.body = body;
	    }
	    return BlockStatement;
	}());
	exports.BlockStatement = BlockStatement;
	var BreakStatement = (function () {
	    function BreakStatement(label) {
	        this.type = syntax_1.Syntax.BreakStatement;
	        this.label = label;
	    }
	    return BreakStatement;
	}());
	exports.BreakStatement = BreakStatement;
	var CallExpression = (function () {
	    function CallExpression(callee, args) {
	        this.type = syntax_1.Syntax.CallExpression;
	        this.callee = callee;
	        this.arguments = args;
	    }
	    return CallExpression;
	}());
	exports.CallExpression = CallExpression;
	var CatchClause = (function () {
	    function CatchClause(param, body) {
	        this.type = syntax_1.Syntax.CatchClause;
	        this.param = param;
	        this.body = body;
	    }
	    return CatchClause;
	}());
	exports.CatchClause = CatchClause;
	var ClassBody = (function () {
	    function ClassBody(body) {
	        this.type = syntax_1.Syntax.ClassBody;
	        this.body = body;
	    }
	    return ClassBody;
	}());
	exports.ClassBody = ClassBody;
	var ClassDeclaration = (function () {
	    function ClassDeclaration(id, superClass, body) {
	        this.type = syntax_1.Syntax.ClassDeclaration;
	        this.id = id;
	        this.superClass = superClass;
	        this.body = body;
	    }
	    return ClassDeclaration;
	}());
	exports.ClassDeclaration = ClassDeclaration;
	var ClassExpression = (function () {
	    function ClassExpression(id, superClass, body) {
	        this.type = syntax_1.Syntax.ClassExpression;
	        this.id = id;
	        this.superClass = superClass;
	        this.body = body;
	    }
	    return ClassExpression;
	}());
	exports.ClassExpression = ClassExpression;
	var ComputedMemberExpression = (function () {
	    function ComputedMemberExpression(object, property) {
	        this.type = syntax_1.Syntax.MemberExpression;
	        this.computed = true;
	        this.object = object;
	        this.property = property;
	    }
	    return ComputedMemberExpression;
	}());
	exports.ComputedMemberExpression = ComputedMemberExpression;
	var ConditionalExpression = (function () {
	    function ConditionalExpression(test, consequent, alternate) {
	        this.type = syntax_1.Syntax.ConditionalExpression;
	        this.test = test;
	        this.consequent = consequent;
	        this.alternate = alternate;
	    }
	    return ConditionalExpression;
	}());
	exports.ConditionalExpression = ConditionalExpression;
	var ContinueStatement = (function () {
	    function ContinueStatement(label) {
	        this.type = syntax_1.Syntax.ContinueStatement;
	        this.label = label;
	    }
	    return ContinueStatement;
	}());
	exports.ContinueStatement = ContinueStatement;
	var DebuggerStatement = (function () {
	    function DebuggerStatement() {
	        this.type = syntax_1.Syntax.DebuggerStatement;
	    }
	    return DebuggerStatement;
	}());
	exports.DebuggerStatement = DebuggerStatement;
	var Directive = (function () {
	    function Directive(expression, directive) {
	        this.type = syntax_1.Syntax.ExpressionStatement;
	        this.expression = expression;
	        this.directive = directive;
	    }
	    return Directive;
	}());
	exports.Directive = Directive;
	var DoWhileStatement = (function () {
	    function DoWhileStatement(body, test) {
	        this.type = syntax_1.Syntax.DoWhileStatement;
	        this.body = body;
	        this.test = test;
	    }
	    return DoWhileStatement;
	}());
	exports.DoWhileStatement = DoWhileStatement;
	var EmptyStatement = (function () {
	    function EmptyStatement() {
	        this.type = syntax_1.Syntax.EmptyStatement;
	    }
	    return EmptyStatement;
	}());
	exports.EmptyStatement = EmptyStatement;
	var ExportAllDeclaration = (function () {
	    function ExportAllDeclaration(source) {
	        this.type = syntax_1.Syntax.ExportAllDeclaration;
	        this.source = source;
	    }
	    return ExportAllDeclaration;
	}());
	exports.ExportAllDeclaration = ExportAllDeclaration;
	var ExportDefaultDeclaration = (function () {
	    function ExportDefaultDeclaration(declaration) {
	        this.type = syntax_1.Syntax.ExportDefaultDeclaration;
	        this.declaration = declaration;
	    }
	    return ExportDefaultDeclaration;
	}());
	exports.ExportDefaultDeclaration = ExportDefaultDeclaration;
	var ExportNamedDeclaration = (function () {
	    function ExportNamedDeclaration(declaration, specifiers, source) {
	        this.type = syntax_1.Syntax.ExportNamedDeclaration;
	        this.declaration = declaration;
	        this.specifiers = specifiers;
	        this.source = source;
	    }
	    return ExportNamedDeclaration;
	}());
	exports.ExportNamedDeclaration = ExportNamedDeclaration;
	var ExportSpecifier = (function () {
	    function ExportSpecifier(local, exported) {
	        this.type = syntax_1.Syntax.ExportSpecifier;
	        this.exported = exported;
	        this.local = local;
	    }
	    return ExportSpecifier;
	}());
	exports.ExportSpecifier = ExportSpecifier;
	var ExpressionStatement = (function () {
	    function ExpressionStatement(expression) {
	        this.type = syntax_1.Syntax.ExpressionStatement;
	        this.expression = expression;
	    }
	    return ExpressionStatement;
	}());
	exports.ExpressionStatement = ExpressionStatement;
	var ForInStatement = (function () {
	    function ForInStatement(left, right, body) {
	        this.type = syntax_1.Syntax.ForInStatement;
	        this.left = left;
	        this.right = right;
	        this.body = body;
	        this.each = false;
	    }
	    return ForInStatement;
	}());
	exports.ForInStatement = ForInStatement;
	var ForOfStatement = (function () {
	    function ForOfStatement(left, right, body) {
	        this.type = syntax_1.Syntax.ForOfStatement;
	        this.left = left;
	        this.right = right;
	        this.body = body;
	    }
	    return ForOfStatement;
	}());
	exports.ForOfStatement = ForOfStatement;
	var ForStatement = (function () {
	    function ForStatement(init, test, update, body) {
	        this.type = syntax_1.Syntax.ForStatement;
	        this.init = init;
	        this.test = test;
	        this.update = update;
	        this.body = body;
	    }
	    return ForStatement;
	}());
	exports.ForStatement = ForStatement;
	var FunctionDeclaration = (function () {
	    function FunctionDeclaration(id, params, body, generator) {
	        this.type = syntax_1.Syntax.FunctionDeclaration;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = generator;
	        this.expression = false;
	        this.async = false;
	    }
	    return FunctionDeclaration;
	}());
	exports.FunctionDeclaration = FunctionDeclaration;
	var FunctionExpression = (function () {
	    function FunctionExpression(id, params, body, generator) {
	        this.type = syntax_1.Syntax.FunctionExpression;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = generator;
	        this.expression = false;
	        this.async = false;
	    }
	    return FunctionExpression;
	}());
	exports.FunctionExpression = FunctionExpression;
	var Identifier = (function () {
	    function Identifier(name) {
	        this.type = syntax_1.Syntax.Identifier;
	        this.name = name;
	    }
	    return Identifier;
	}());
	exports.Identifier = Identifier;
	var IfStatement = (function () {
	    function IfStatement(test, consequent, alternate) {
	        this.type = syntax_1.Syntax.IfStatement;
	        this.test = test;
	        this.consequent = consequent;
	        this.alternate = alternate;
	    }
	    return IfStatement;
	}());
	exports.IfStatement = IfStatement;
	var ImportDeclaration = (function () {
	    function ImportDeclaration(specifiers, source) {
	        this.type = syntax_1.Syntax.ImportDeclaration;
	        this.specifiers = specifiers;
	        this.source = source;
	    }
	    return ImportDeclaration;
	}());
	exports.ImportDeclaration = ImportDeclaration;
	var ImportDefaultSpecifier = (function () {
	    function ImportDefaultSpecifier(local) {
	        this.type = syntax_1.Syntax.ImportDefaultSpecifier;
	        this.local = local;
	    }
	    return ImportDefaultSpecifier;
	}());
	exports.ImportDefaultSpecifier = ImportDefaultSpecifier;
	var ImportNamespaceSpecifier = (function () {
	    function ImportNamespaceSpecifier(local) {
	        this.type = syntax_1.Syntax.ImportNamespaceSpecifier;
	        this.local = local;
	    }
	    return ImportNamespaceSpecifier;
	}());
	exports.ImportNamespaceSpecifier = ImportNamespaceSpecifier;
	var ImportSpecifier = (function () {
	    function ImportSpecifier(local, imported) {
	        this.type = syntax_1.Syntax.ImportSpecifier;
	        this.local = local;
	        this.imported = imported;
	    }
	    return ImportSpecifier;
	}());
	exports.ImportSpecifier = ImportSpecifier;
	var LabeledStatement = (function () {
	    function LabeledStatement(label, body) {
	        this.type = syntax_1.Syntax.LabeledStatement;
	        this.label = label;
	        this.body = body;
	    }
	    return LabeledStatement;
	}());
	exports.LabeledStatement = LabeledStatement;
	var Literal = (function () {
	    function Literal(value, raw) {
	        this.type = syntax_1.Syntax.Literal;
	        this.value = value;
	        this.raw = raw;
	    }
	    return Literal;
	}());
	exports.Literal = Literal;
	var MetaProperty = (function () {
	    function MetaProperty(meta, property) {
	        this.type = syntax_1.Syntax.MetaProperty;
	        this.meta = meta;
	        this.property = property;
	    }
	    return MetaProperty;
	}());
	exports.MetaProperty = MetaProperty;
	var MethodDefinition = (function () {
	    function MethodDefinition(key, computed, value, kind, isStatic) {
	        this.type = syntax_1.Syntax.MethodDefinition;
	        this.key = key;
	        this.computed = computed;
	        this.value = value;
	        this.kind = kind;
	        this.static = isStatic;
	    }
	    return MethodDefinition;
	}());
	exports.MethodDefinition = MethodDefinition;
	var Module = (function () {
	    function Module(body) {
	        this.type = syntax_1.Syntax.Program;
	        this.body = body;
	        this.sourceType = 'module';
	    }
	    return Module;
	}());
	exports.Module = Module;
	var NewExpression = (function () {
	    function NewExpression(callee, args) {
	        this.type = syntax_1.Syntax.NewExpression;
	        this.callee = callee;
	        this.arguments = args;
	    }
	    return NewExpression;
	}());
	exports.NewExpression = NewExpression;
	var ObjectExpression = (function () {
	    function ObjectExpression(properties) {
	        this.type = syntax_1.Syntax.ObjectExpression;
	        this.properties = properties;
	    }
	    return ObjectExpression;
	}());
	exports.ObjectExpression = ObjectExpression;
	var ObjectPattern = (function () {
	    function ObjectPattern(properties) {
	        this.type = syntax_1.Syntax.ObjectPattern;
	        this.properties = properties;
	    }
	    return ObjectPattern;
	}());
	exports.ObjectPattern = ObjectPattern;
	var Property = (function () {
	    function Property(kind, key, computed, value, method, shorthand) {
	        this.type = syntax_1.Syntax.Property;
	        this.key = key;
	        this.computed = computed;
	        this.value = value;
	        this.kind = kind;
	        this.method = method;
	        this.shorthand = shorthand;
	    }
	    return Property;
	}());
	exports.Property = Property;
	var RegexLiteral = (function () {
	    function RegexLiteral(value, raw, pattern, flags) {
	        this.type = syntax_1.Syntax.Literal;
	        this.value = value;
	        this.raw = raw;
	        this.regex = { pattern: pattern, flags: flags };
	    }
	    return RegexLiteral;
	}());
	exports.RegexLiteral = RegexLiteral;
	var RestElement = (function () {
	    function RestElement(argument) {
	        this.type = syntax_1.Syntax.RestElement;
	        this.argument = argument;
	    }
	    return RestElement;
	}());
	exports.RestElement = RestElement;
	var ReturnStatement = (function () {
	    function ReturnStatement(argument) {
	        this.type = syntax_1.Syntax.ReturnStatement;
	        this.argument = argument;
	    }
	    return ReturnStatement;
	}());
	exports.ReturnStatement = ReturnStatement;
	var Script = (function () {
	    function Script(body) {
	        this.type = syntax_1.Syntax.Program;
	        this.body = body;
	        this.sourceType = 'script';
	    }
	    return Script;
	}());
	exports.Script = Script;
	var SequenceExpression = (function () {
	    function SequenceExpression(expressions) {
	        this.type = syntax_1.Syntax.SequenceExpression;
	        this.expressions = expressions;
	    }
	    return SequenceExpression;
	}());
	exports.SequenceExpression = SequenceExpression;
	var SpreadElement = (function () {
	    function SpreadElement(argument) {
	        this.type = syntax_1.Syntax.SpreadElement;
	        this.argument = argument;
	    }
	    return SpreadElement;
	}());
	exports.SpreadElement = SpreadElement;
	var StaticMemberExpression = (function () {
	    function StaticMemberExpression(object, property) {
	        this.type = syntax_1.Syntax.MemberExpression;
	        this.computed = false;
	        this.object = object;
	        this.property = property;
	    }
	    return StaticMemberExpression;
	}());
	exports.StaticMemberExpression = StaticMemberExpression;
	var Super = (function () {
	    function Super() {
	        this.type = syntax_1.Syntax.Super;
	    }
	    return Super;
	}());
	exports.Super = Super;
	var SwitchCase = (function () {
	    function SwitchCase(test, consequent) {
	        this.type = syntax_1.Syntax.SwitchCase;
	        this.test = test;
	        this.consequent = consequent;
	    }
	    return SwitchCase;
	}());
	exports.SwitchCase = SwitchCase;
	var SwitchStatement = (function () {
	    function SwitchStatement(discriminant, cases) {
	        this.type = syntax_1.Syntax.SwitchStatement;
	        this.discriminant = discriminant;
	        this.cases = cases;
	    }
	    return SwitchStatement;
	}());
	exports.SwitchStatement = SwitchStatement;
	var TaggedTemplateExpression = (function () {
	    function TaggedTemplateExpression(tag, quasi) {
	        this.type = syntax_1.Syntax.TaggedTemplateExpression;
	        this.tag = tag;
	        this.quasi = quasi;
	    }
	    return TaggedTemplateExpression;
	}());
	exports.TaggedTemplateExpression = TaggedTemplateExpression;
	var TemplateElement = (function () {
	    function TemplateElement(value, tail) {
	        this.type = syntax_1.Syntax.TemplateElement;
	        this.value = value;
	        this.tail = tail;
	    }
	    return TemplateElement;
	}());
	exports.TemplateElement = TemplateElement;
	var TemplateLiteral = (function () {
	    function TemplateLiteral(quasis, expressions) {
	        this.type = syntax_1.Syntax.TemplateLiteral;
	        this.quasis = quasis;
	        this.expressions = expressions;
	    }
	    return TemplateLiteral;
	}());
	exports.TemplateLiteral = TemplateLiteral;
	var ThisExpression = (function () {
	    function ThisExpression() {
	        this.type = syntax_1.Syntax.ThisExpression;
	    }
	    return ThisExpression;
	}());
	exports.ThisExpression = ThisExpression;
	var ThrowStatement = (function () {
	    function ThrowStatement(argument) {
	        this.type = syntax_1.Syntax.ThrowStatement;
	        this.argument = argument;
	    }
	    return ThrowStatement;
	}());
	exports.ThrowStatement = ThrowStatement;
	var TryStatement = (function () {
	    function TryStatement(block, handler, finalizer) {
	        this.type = syntax_1.Syntax.TryStatement;
	        this.block = block;
	        this.handler = handler;
	        this.finalizer = finalizer;
	    }
	    return TryStatement;
	}());
	exports.TryStatement = TryStatement;
	var UnaryExpression = (function () {
	    function UnaryExpression(operator, argument) {
	        this.type = syntax_1.Syntax.UnaryExpression;
	        this.operator = operator;
	        this.argument = argument;
	        this.prefix = true;
	    }
	    return UnaryExpression;
	}());
	exports.UnaryExpression = UnaryExpression;
	var UpdateExpression = (function () {
	    function UpdateExpression(operator, argument, prefix) {
	        this.type = syntax_1.Syntax.UpdateExpression;
	        this.operator = operator;
	        this.argument = argument;
	        this.prefix = prefix;
	    }
	    return UpdateExpression;
	}());
	exports.UpdateExpression = UpdateExpression;
	var VariableDeclaration = (function () {
	    function VariableDeclaration(declarations, kind) {
	        this.type = syntax_1.Syntax.VariableDeclaration;
	        this.declarations = declarations;
	        this.kind = kind;
	    }
	    return VariableDeclaration;
	}());
	exports.VariableDeclaration = VariableDeclaration;
	var VariableDeclarator = (function () {
	    function VariableDeclarator(id, init) {
	        this.type = syntax_1.Syntax.VariableDeclarator;
	        this.id = id;
	        this.init = init;
	    }
	    return VariableDeclarator;
	}());
	exports.VariableDeclarator = VariableDeclarator;
	var WhileStatement = (function () {
	    function WhileStatement(test, body) {
	        this.type = syntax_1.Syntax.WhileStatement;
	        this.test = test;
	        this.body = body;
	    }
	    return WhileStatement;
	}());
	exports.WhileStatement = WhileStatement;
	var WithStatement = (function () {
	    function WithStatement(object, body) {
	        this.type = syntax_1.Syntax.WithStatement;
	        this.object = object;
	        this.body = body;
	    }
	    return WithStatement;
	}());
	exports.WithStatement = WithStatement;
	var YieldExpression = (function () {
	    function YieldExpression(argument, delegate) {
	        this.type = syntax_1.Syntax.YieldExpression;
	        this.argument = argument;
	        this.delegate = delegate;
	    }
	    return YieldExpression;
	}());
	exports.YieldExpression = YieldExpression;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var assert_1 = __webpack_require__(9);
	var error_handler_1 = __webpack_require__(10);
	var messages_1 = __webpack_require__(11);
	var Node = __webpack_require__(7);
	var scanner_1 = __webpack_require__(12);
	var syntax_1 = __webpack_require__(2);
	var token_1 = __webpack_require__(13);
	var ArrowParameterPlaceHolder = 'ArrowParameterPlaceHolder';
	var Parser = (function () {
	    function Parser(code, options, delegate) {
	        if (options === void 0) { options = {}; }
	        this.config = {
	            range: (typeof options.range === 'boolean') && options.range,
	            loc: (typeof options.loc === 'boolean') && options.loc,
	            source: null,
	            tokens: (typeof options.tokens === 'boolean') && options.tokens,
	            comment: (typeof options.comment === 'boolean') && options.comment,
	            tolerant: (typeof options.tolerant === 'boolean') && options.tolerant
	        };
	        if (this.config.loc && options.source && options.source !== null) {
	            this.config.source = String(options.source);
	        }
	        this.delegate = delegate;
	        this.errorHandler = new error_handler_1.ErrorHandler();
	        this.errorHandler.tolerant = this.config.tolerant;
	        this.scanner = new scanner_1.Scanner(code, this.errorHandler);
	        this.scanner.trackComment = this.config.comment;
	        this.operatorPrecedence = {
	            ')': 0,
	            ';': 0,
	            ',': 0,
	            '=': 0,
	            ']': 0,
	            '||': 1,
	            '&&': 2,
	            '|': 3,
	            '^': 4,
	            '&': 5,
	            '==': 6,
	            '!=': 6,
	            '===': 6,
	            '!==': 6,
	            '<': 7,
	            '>': 7,
	            '<=': 7,
	            '>=': 7,
	            '<<': 8,
	            '>>': 8,
	            '>>>': 8,
	            '+': 9,
	            '-': 9,
	            '*': 11,
	            '/': 11,
	            '%': 11
	        };
	        this.lookahead = {
	            type: 2 /* EOF */,
	            value: '',
	            lineNumber: this.scanner.lineNumber,
	            lineStart: 0,
	            start: 0,
	            end: 0
	        };
	        this.hasLineTerminator = false;
	        this.context = {
	            isModule: false,
	            await: false,
	            allowIn: true,
	            allowStrictDirective: true,
	            allowYield: true,
	            firstCoverInitializedNameError: null,
	            isAssignmentTarget: false,
	            isBindingElement: false,
	            inFunctionBody: false,
	            inIteration: false,
	            inSwitch: false,
	            labelSet: {},
	            strict: false
	        };
	        this.tokens = [];
	        this.startMarker = {
	            index: 0,
	            line: this.scanner.lineNumber,
	            column: 0
	        };
	        this.lastMarker = {
	            index: 0,
	            line: this.scanner.lineNumber,
	            column: 0
	        };
	        this.nextToken();
	        this.lastMarker = {
	            index: this.scanner.index,
	            line: this.scanner.lineNumber,
	            column: this.scanner.index - this.scanner.lineStart
	        };
	    }
	    Parser.prototype.throwError = function (messageFormat) {
	        var values = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            values[_i - 1] = arguments[_i];
	        }
	        var args = Array.prototype.slice.call(arguments, 1);
	        var msg = messageFormat.replace(/%(\d)/g, function (whole, idx) {
	            assert_1.assert(idx < args.length, 'Message reference must be in range');
	            return args[idx];
	        });
	        var index = this.lastMarker.index;
	        var line = this.lastMarker.line;
	        var column = this.lastMarker.column + 1;
	        throw this.errorHandler.createError(index, line, column, msg);
	    };
	    Parser.prototype.tolerateError = function (messageFormat) {
	        var values = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            values[_i - 1] = arguments[_i];
	        }
	        var args = Array.prototype.slice.call(arguments, 1);
	        var msg = messageFormat.replace(/%(\d)/g, function (whole, idx) {
	            assert_1.assert(idx < args.length, 'Message reference must be in range');
	            return args[idx];
	        });
	        var index = this.lastMarker.index;
	        var line = this.scanner.lineNumber;
	        var column = this.lastMarker.column + 1;
	        this.errorHandler.tolerateError(index, line, column, msg);
	    };
	    // Throw an exception because of the token.
	    Parser.prototype.unexpectedTokenError = function (token, message) {
	        var msg = message || messages_1.Messages.UnexpectedToken;
	        var value;
	        if (token) {
	            if (!message) {
	                msg = (token.type === 2 /* EOF */) ? messages_1.Messages.UnexpectedEOS :
	                    (token.type === 3 /* Identifier */) ? messages_1.Messages.UnexpectedIdentifier :
	                        (token.type === 6 /* NumericLiteral */) ? messages_1.Messages.UnexpectedNumber :
	                            (token.type === 8 /* StringLiteral */) ? messages_1.Messages.UnexpectedString :
	                                (token.type === 10 /* Template */) ? messages_1.Messages.UnexpectedTemplate :
	                                    messages_1.Messages.UnexpectedToken;
	                if (token.type === 4 /* Keyword */) {
	                    if (this.scanner.isFutureReservedWord(token.value)) {
	                        msg = messages_1.Messages.UnexpectedReserved;
	                    }
	                    else if (this.context.strict && this.scanner.isStrictModeReservedWord(token.value)) {
	                        msg = messages_1.Messages.StrictReservedWord;
	                    }
	                }
	            }
	            value = token.value;
	        }
	        else {
	            value = 'ILLEGAL';
	        }
	        msg = msg.replace('%0', value);
	        if (token && typeof token.lineNumber === 'number') {
	            var index = token.start;
	            var line = token.lineNumber;
	            var lastMarkerLineStart = this.lastMarker.index - this.lastMarker.column;
	            var column = token.start - lastMarkerLineStart + 1;
	            return this.errorHandler.createError(index, line, column, msg);
	        }
	        else {
	            var index = this.lastMarker.index;
	            var line = this.lastMarker.line;
	            var column = this.lastMarker.column + 1;
	            return this.errorHandler.createError(index, line, column, msg);
	        }
	    };
	    Parser.prototype.throwUnexpectedToken = function (token, message) {
	        throw this.unexpectedTokenError(token, message);
	    };
	    Parser.prototype.tolerateUnexpectedToken = function (token, message) {
	        this.errorHandler.tolerate(this.unexpectedTokenError(token, message));
	    };
	    Parser.prototype.collectComments = function () {
	        if (!this.config.comment) {
	            this.scanner.scanComments();
	        }
	        else {
	            var comments = this.scanner.scanComments();
	            if (comments.length > 0 && this.delegate) {
	                for (var i = 0; i < comments.length; ++i) {
	                    var e = comments[i];
	                    var node = void 0;
	                    node = {
	                        type: e.multiLine ? 'BlockComment' : 'LineComment',
	                        value: this.scanner.source.slice(e.slice[0], e.slice[1])
	                    };
	                    if (this.config.range) {
	                        node.range = e.range;
	                    }
	                    if (this.config.loc) {
	                        node.loc = e.loc;
	                    }
	                    var metadata = {
	                        start: {
	                            line: e.loc.start.line,
	                            column: e.loc.start.column,
	                            offset: e.range[0]
	                        },
	                        end: {
	                            line: e.loc.end.line,
	                            column: e.loc.end.column,
	                            offset: e.range[1]
	                        }
	                    };
	                    this.delegate(node, metadata);
	                }
	            }
	        }
	    };
	    // From internal representation to an external structure
	    Parser.prototype.getTokenRaw = function (token) {
	        return this.scanner.source.slice(token.start, token.end);
	    };
	    Parser.prototype.convertToken = function (token) {
	        var t = {
	            type: token_1.TokenName[token.type],
	            value: this.getTokenRaw(token)
	        };
	        if (this.config.range) {
	            t.range = [token.start, token.end];
	        }
	        if (this.config.loc) {
	            t.loc = {
	                start: {
	                    line: this.startMarker.line,
	                    column: this.startMarker.column
	                },
	                end: {
	                    line: this.scanner.lineNumber,
	                    column: this.scanner.index - this.scanner.lineStart
	                }
	            };
	        }
	        if (token.type === 9 /* RegularExpression */) {
	            var pattern = token.pattern;
	            var flags = token.flags;
	            t.regex = { pattern: pattern, flags: flags };
	        }
	        return t;
	    };
	    Parser.prototype.nextToken = function () {
	        var token = this.lookahead;
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        this.collectComments();
	        if (this.scanner.index !== this.startMarker.index) {
	            this.startMarker.index = this.scanner.index;
	            this.startMarker.line = this.scanner.lineNumber;
	            this.startMarker.column = this.scanner.index - this.scanner.lineStart;
	        }
	        var next = this.scanner.lex();
	        this.hasLineTerminator = (token.lineNumber !== next.lineNumber);
	        if (next && this.context.strict && next.type === 3 /* Identifier */) {
	            if (this.scanner.isStrictModeReservedWord(next.value)) {
	                next.type = 4 /* Keyword */;
	            }
	        }
	        this.lookahead = next;
	        if (this.config.tokens && next.type !== 2 /* EOF */) {
	            this.tokens.push(this.convertToken(next));
	        }
	        return token;
	    };
	    Parser.prototype.nextRegexToken = function () {
	        this.collectComments();
	        var token = this.scanner.scanRegExp();
	        if (this.config.tokens) {
	            // Pop the previous token, '/' or '/='
	            // This is added from the lookahead token.
	            this.tokens.pop();
	            this.tokens.push(this.convertToken(token));
	        }
	        // Prime the next lookahead.
	        this.lookahead = token;
	        this.nextToken();
	        return token;
	    };
	    Parser.prototype.createNode = function () {
	        return {
	            index: this.startMarker.index,
	            line: this.startMarker.line,
	            column: this.startMarker.column
	        };
	    };
	    Parser.prototype.startNode = function (token, lastLineStart) {
	        if (lastLineStart === void 0) { lastLineStart = 0; }
	        var column = token.start - token.lineStart;
	        var line = token.lineNumber;
	        if (column < 0) {
	            column += lastLineStart;
	            line--;
	        }
	        return {
	            index: token.start,
	            line: line,
	            column: column
	        };
	    };
	    Parser.prototype.finalize = function (marker, node) {
	        if (this.config.range) {
	            node.range = [marker.index, this.lastMarker.index];
	        }
	        if (this.config.loc) {
	            node.loc = {
	                start: {
	                    line: marker.line,
	                    column: marker.column,
	                },
	                end: {
	                    line: this.lastMarker.line,
	                    column: this.lastMarker.column
	                }
	            };
	            if (this.config.source) {
	                node.loc.source = this.config.source;
	            }
	        }
	        if (this.delegate) {
	            var metadata = {
	                start: {
	                    line: marker.line,
	                    column: marker.column,
	                    offset: marker.index
	                },
	                end: {
	                    line: this.lastMarker.line,
	                    column: this.lastMarker.column,
	                    offset: this.lastMarker.index
	                }
	            };
	            this.delegate(node, metadata);
	        }
	        return node;
	    };
	    // Expect the next token to match the specified punctuator.
	    // If not, an exception will be thrown.
	    Parser.prototype.expect = function (value) {
	        var token = this.nextToken();
	        if (token.type !== 7 /* Punctuator */ || token.value !== value) {
	            this.throwUnexpectedToken(token);
	        }
	    };
	    // Quietly expect a comma when in tolerant mode, otherwise delegates to expect().
	    Parser.prototype.expectCommaSeparator = function () {
	        if (this.config.tolerant) {
	            var token = this.lookahead;
	            if (token.type === 7 /* Punctuator */ && token.value === ',') {
	                this.nextToken();
	            }
	            else if (token.type === 7 /* Punctuator */ && token.value === ';') {
	                this.nextToken();
	                this.tolerateUnexpectedToken(token);
	            }
	            else {
	                this.tolerateUnexpectedToken(token, messages_1.Messages.UnexpectedToken);
	            }
	        }
	        else {
	            this.expect(',');
	        }
	    };
	    // Expect the next token to match the specified keyword.
	    // If not, an exception will be thrown.
	    Parser.prototype.expectKeyword = function (keyword) {
	        var token = this.nextToken();
	        if (token.type !== 4 /* Keyword */ || token.value !== keyword) {
	            this.throwUnexpectedToken(token);
	        }
	    };
	    // Return true if the next token matches the specified punctuator.
	    Parser.prototype.match = function (value) {
	        return this.lookahead.type === 7 /* Punctuator */ && this.lookahead.value === value;
	    };
	    // Return true if the next token matches the specified keyword
	    Parser.prototype.matchKeyword = function (keyword) {
	        return this.lookahead.type === 4 /* Keyword */ && this.lookahead.value === keyword;
	    };
	    // Return true if the next token matches the specified contextual keyword
	    // (where an identifier is sometimes a keyword depending on the context)
	    Parser.prototype.matchContextualKeyword = function (keyword) {
	        return this.lookahead.type === 3 /* Identifier */ && this.lookahead.value === keyword;
	    };
	    // Return true if the next token is an assignment operator
	    Parser.prototype.matchAssign = function () {
	        if (this.lookahead.type !== 7 /* Punctuator */) {
	            return false;
	        }
	        var op = this.lookahead.value;
	        return op === '=' ||
	            op === '*=' ||
	            op === '**=' ||
	            op === '/=' ||
	            op === '%=' ||
	            op === '+=' ||
	            op === '-=' ||
	            op === '<<=' ||
	            op === '>>=' ||
	            op === '>>>=' ||
	            op === '&=' ||
	            op === '^=' ||
	            op === '|=';
	    };
	    // Cover grammar support.
	    //
	    // When an assignment expression position starts with an left parenthesis, the determination of the type
	    // of the syntax is to be deferred arbitrarily long until the end of the parentheses pair (plus a lookahead)
	    // or the first comma. This situation also defers the determination of all the expressions nested in the pair.
	    //
	    // There are three productions that can be parsed in a parentheses pair that needs to be determined
	    // after the outermost pair is closed. They are:
	    //
	    //   1. AssignmentExpression
	    //   2. BindingElements
	    //   3. AssignmentTargets
	    //
	    // In order to avoid exponential backtracking, we use two flags to denote if the production can be
	    // binding element or assignment target.
	    //
	    // The three productions have the relationship:
	    //
	    //   BindingElements ⊆ AssignmentTargets ⊆ AssignmentExpression
	    //
	    // with a single exception that CoverInitializedName when used directly in an Expression, generates
	    // an early error. Therefore, we need the third state, firstCoverInitializedNameError, to track the
	    // first usage of CoverInitializedName and report it when we reached the end of the parentheses pair.
	    //
	    // isolateCoverGrammar function runs the given parser function with a new cover grammar context, and it does not
	    // effect the current flags. This means the production the parser parses is only used as an expression. Therefore
	    // the CoverInitializedName check is conducted.
	    //
	    // inheritCoverGrammar function runs the given parse function with a new cover grammar context, and it propagates
	    // the flags outside of the parser. This means the production the parser parses is used as a part of a potential
	    // pattern. The CoverInitializedName check is deferred.
	    Parser.prototype.isolateCoverGrammar = function (parseFunction) {
	        var previousIsBindingElement = this.context.isBindingElement;
	        var previousIsAssignmentTarget = this.context.isAssignmentTarget;
	        var previousFirstCoverInitializedNameError = this.context.firstCoverInitializedNameError;
	        this.context.isBindingElement = true;
	        this.context.isAssignmentTarget = true;
	        this.context.firstCoverInitializedNameError = null;
	        var result = parseFunction.call(this);
	        if (this.context.firstCoverInitializedNameError !== null) {
	            this.throwUnexpectedToken(this.context.firstCoverInitializedNameError);
	        }
	        this.context.isBindingElement = previousIsBindingElement;
	        this.context.isAssignmentTarget = previousIsAssignmentTarget;
	        this.context.firstCoverInitializedNameError = previousFirstCoverInitializedNameError;
	        return result;
	    };
	    Parser.prototype.inheritCoverGrammar = function (parseFunction) {
	        var previousIsBindingElement = this.context.isBindingElement;
	        var previousIsAssignmentTarget = this.context.isAssignmentTarget;
	        var previousFirstCoverInitializedNameError = this.context.firstCoverInitializedNameError;
	        this.context.isBindingElement = true;
	        this.context.isAssignmentTarget = true;
	        this.context.firstCoverInitializedNameError = null;
	        var result = parseFunction.call(this);
	        this.context.isBindingElement = this.context.isBindingElement && previousIsBindingElement;
	        this.context.isAssignmentTarget = this.context.isAssignmentTarget && previousIsAssignmentTarget;
	        this.context.firstCoverInitializedNameError = previousFirstCoverInitializedNameError || this.context.firstCoverInitializedNameError;
	        return result;
	    };
	    Parser.prototype.consumeSemicolon = function () {
	        if (this.match(';')) {
	            this.nextToken();
	        }
	        else if (!this.hasLineTerminator) {
	            if (this.lookahead.type !== 2 /* EOF */ && !this.match('}')) {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	            this.lastMarker.index = this.startMarker.index;
	            this.lastMarker.line = this.startMarker.line;
	            this.lastMarker.column = this.startMarker.column;
	        }
	    };
	    // https://tc39.github.io/ecma262/#sec-primary-expression
	    Parser.prototype.parsePrimaryExpression = function () {
	        var node = this.createNode();
	        var expr;
	        var token, raw;
	        switch (this.lookahead.type) {
	            case 3 /* Identifier */:
	                if ((this.context.isModule || this.context.await) && this.lookahead.value === 'await') {
	                    this.tolerateUnexpectedToken(this.lookahead);
	                }
	                expr = this.matchAsyncFunction() ? this.parseFunctionExpression() : this.finalize(node, new Node.Identifier(this.nextToken().value));
	                break;
	            case 6 /* NumericLiteral */:
	            case 8 /* StringLiteral */:
	                if (this.context.strict && this.lookahead.octal) {
	                    this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.StrictOctalLiteral);
	                }
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                token = this.nextToken();
	                raw = this.getTokenRaw(token);
	                expr = this.finalize(node, new Node.Literal(token.value, raw));
	                break;
	            case 1 /* BooleanLiteral */:
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                token = this.nextToken();
	                raw = this.getTokenRaw(token);
	                expr = this.finalize(node, new Node.Literal(token.value === 'true', raw));
	                break;
	            case 5 /* NullLiteral */:
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                token = this.nextToken();
	                raw = this.getTokenRaw(token);
	                expr = this.finalize(node, new Node.Literal(null, raw));
	                break;
	            case 10 /* Template */:
	                expr = this.parseTemplateLiteral();
	                break;
	            case 7 /* Punctuator */:
	                switch (this.lookahead.value) {
	                    case '(':
	                        this.context.isBindingElement = false;
	                        expr = this.inheritCoverGrammar(this.parseGroupExpression);
	                        break;
	                    case '[':
	                        expr = this.inheritCoverGrammar(this.parseArrayInitializer);
	                        break;
	                    case '{':
	                        expr = this.inheritCoverGrammar(this.parseObjectInitializer);
	                        break;
	                    case '/':
	                    case '/=':
	                        this.context.isAssignmentTarget = false;
	                        this.context.isBindingElement = false;
	                        this.scanner.index = this.startMarker.index;
	                        token = this.nextRegexToken();
	                        raw = this.getTokenRaw(token);
	                        expr = this.finalize(node, new Node.RegexLiteral(token.regex, raw, token.pattern, token.flags));
	                        break;
	                    default:
	                        expr = this.throwUnexpectedToken(this.nextToken());
	                }
	                break;
	            case 4 /* Keyword */:
	                if (!this.context.strict && this.context.allowYield && this.matchKeyword('yield')) {
	                    expr = this.parseIdentifierName();
	                }
	                else if (!this.context.strict && this.matchKeyword('let')) {
	                    expr = this.finalize(node, new Node.Identifier(this.nextToken().value));
	                }
	                else {
	                    this.context.isAssignmentTarget = false;
	                    this.context.isBindingElement = false;
	                    if (this.matchKeyword('function')) {
	                        expr = this.parseFunctionExpression();
	                    }
	                    else if (this.matchKeyword('this')) {
	                        this.nextToken();
	                        expr = this.finalize(node, new Node.ThisExpression());
	                    }
	                    else if (this.matchKeyword('class')) {
	                        expr = this.parseClassExpression();
	                    }
	                    else {
	                        expr = this.throwUnexpectedToken(this.nextToken());
	                    }
	                }
	                break;
	            default:
	                expr = this.throwUnexpectedToken(this.nextToken());
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-array-initializer
	    Parser.prototype.parseSpreadElement = function () {
	        var node = this.createNode();
	        this.expect('...');
	        var arg = this.inheritCoverGrammar(this.parseAssignmentExpression);
	        return this.finalize(node, new Node.SpreadElement(arg));
	    };
	    Parser.prototype.parseArrayInitializer = function () {
	        var node = this.createNode();
	        var elements = [];
	        this.expect('[');
	        while (!this.match(']')) {
	            if (this.match(',')) {
	                this.nextToken();
	                elements.push(null);
	            }
	            else if (this.match('...')) {
	                var element = this.parseSpreadElement();
	                if (!this.match(']')) {
	                    this.context.isAssignmentTarget = false;
	                    this.context.isBindingElement = false;
	                    this.expect(',');
	                }
	                elements.push(element);
	            }
	            else {
	                elements.push(this.inheritCoverGrammar(this.parseAssignmentExpression));
	                if (!this.match(']')) {
	                    this.expect(',');
	                }
	            }
	        }
	        this.expect(']');
	        return this.finalize(node, new Node.ArrayExpression(elements));
	    };
	    // https://tc39.github.io/ecma262/#sec-object-initializer
	    Parser.prototype.parsePropertyMethod = function (params) {
	        this.context.isAssignmentTarget = false;
	        this.context.isBindingElement = false;
	        var previousStrict = this.context.strict;
	        var previousAllowStrictDirective = this.context.allowStrictDirective;
	        this.context.allowStrictDirective = params.simple;
	        var body = this.isolateCoverGrammar(this.parseFunctionSourceElements);
	        if (this.context.strict && params.firstRestricted) {
	            this.tolerateUnexpectedToken(params.firstRestricted, params.message);
	        }
	        if (this.context.strict && params.stricted) {
	            this.tolerateUnexpectedToken(params.stricted, params.message);
	        }
	        this.context.strict = previousStrict;
	        this.context.allowStrictDirective = previousAllowStrictDirective;
	        return body;
	    };
	    Parser.prototype.parsePropertyMethodFunction = function () {
	        var isGenerator = false;
	        var node = this.createNode();
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = true;
	        var params = this.parseFormalParameters();
	        var method = this.parsePropertyMethod(params);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, params.params, method, isGenerator));
	    };
	    Parser.prototype.parsePropertyMethodAsyncFunction = function () {
	        var node = this.createNode();
	        var previousAllowYield = this.context.allowYield;
	        var previousAwait = this.context.await;
	        this.context.allowYield = false;
	        this.context.await = true;
	        var params = this.parseFormalParameters();
	        var method = this.parsePropertyMethod(params);
	        this.context.allowYield = previousAllowYield;
	        this.context.await = previousAwait;
	        return this.finalize(node, new Node.AsyncFunctionExpression(null, params.params, method));
	    };
	    Parser.prototype.parseObjectPropertyKey = function () {
	        var node = this.createNode();
	        var token = this.nextToken();
	        var key;
	        switch (token.type) {
	            case 8 /* StringLiteral */:
	            case 6 /* NumericLiteral */:
	                if (this.context.strict && token.octal) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictOctalLiteral);
	                }
	                var raw = this.getTokenRaw(token);
	                key = this.finalize(node, new Node.Literal(token.value, raw));
	                break;
	            case 3 /* Identifier */:
	            case 1 /* BooleanLiteral */:
	            case 5 /* NullLiteral */:
	            case 4 /* Keyword */:
	                key = this.finalize(node, new Node.Identifier(token.value));
	                break;
	            case 7 /* Punctuator */:
	                if (token.value === '[') {
	                    key = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    this.expect(']');
	                }
	                else {
	                    key = this.throwUnexpectedToken(token);
	                }
	                break;
	            default:
	                key = this.throwUnexpectedToken(token);
	        }
	        return key;
	    };
	    Parser.prototype.isPropertyKey = function (key, value) {
	        return (key.type === syntax_1.Syntax.Identifier && key.name === value) ||
	            (key.type === syntax_1.Syntax.Literal && key.value === value);
	    };
	    Parser.prototype.parseObjectProperty = function (hasProto) {
	        var node = this.createNode();
	        var token = this.lookahead;
	        var kind;
	        var key = null;
	        var value = null;
	        var computed = false;
	        var method = false;
	        var shorthand = false;
	        var isAsync = false;
	        if (token.type === 3 /* Identifier */) {
	            var id = token.value;
	            this.nextToken();
	            computed = this.match('[');
	            isAsync = !this.hasLineTerminator && (id === 'async') &&
	                !this.match(':') && !this.match('(') && !this.match('*') && !this.match(',');
	            key = isAsync ? this.parseObjectPropertyKey() : this.finalize(node, new Node.Identifier(id));
	        }
	        else if (this.match('*')) {
	            this.nextToken();
	        }
	        else {
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	        }
	        var lookaheadPropertyKey = this.qualifiedPropertyName(this.lookahead);
	        if (token.type === 3 /* Identifier */ && !isAsync && token.value === 'get' && lookaheadPropertyKey) {
	            kind = 'get';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            this.context.allowYield = false;
	            value = this.parseGetterMethod();
	        }
	        else if (token.type === 3 /* Identifier */ && !isAsync && token.value === 'set' && lookaheadPropertyKey) {
	            kind = 'set';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            value = this.parseSetterMethod();
	        }
	        else if (token.type === 7 /* Punctuator */ && token.value === '*' && lookaheadPropertyKey) {
	            kind = 'init';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            value = this.parseGeneratorMethod();
	            method = true;
	        }
	        else {
	            if (!key) {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	            kind = 'init';
	            if (this.match(':') && !isAsync) {
	                if (!computed && this.isPropertyKey(key, '__proto__')) {
	                    if (hasProto.value) {
	                        this.tolerateError(messages_1.Messages.DuplicateProtoProperty);
	                    }
	                    hasProto.value = true;
	                }
	                this.nextToken();
	                value = this.inheritCoverGrammar(this.parseAssignmentExpression);
	            }
	            else if (this.match('(')) {
	                value = isAsync ? this.parsePropertyMethodAsyncFunction() : this.parsePropertyMethodFunction();
	                method = true;
	            }
	            else if (token.type === 3 /* Identifier */) {
	                var id = this.finalize(node, new Node.Identifier(token.value));
	                if (this.match('=')) {
	                    this.context.firstCoverInitializedNameError = this.lookahead;
	                    this.nextToken();
	                    shorthand = true;
	                    var init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    value = this.finalize(node, new Node.AssignmentPattern(id, init));
	                }
	                else {
	                    shorthand = true;
	                    value = id;
	                }
	            }
	            else {
	                this.throwUnexpectedToken(this.nextToken());
	            }
	        }
	        return this.finalize(node, new Node.Property(kind, key, computed, value, method, shorthand));
	    };
	    Parser.prototype.parseObjectInitializer = function () {
	        var node = this.createNode();
	        this.expect('{');
	        var properties = [];
	        var hasProto = { value: false };
	        while (!this.match('}')) {
	            properties.push(this.parseObjectProperty(hasProto));
	            if (!this.match('}')) {
	                this.expectCommaSeparator();
	            }
	        }
	        this.expect('}');
	        return this.finalize(node, new Node.ObjectExpression(properties));
	    };
	    // https://tc39.github.io/ecma262/#sec-template-literals
	    Parser.prototype.parseTemplateHead = function () {
	        assert_1.assert(this.lookahead.head, 'Template literal must start with a template head');
	        var node = this.createNode();
	        var token = this.nextToken();
	        var raw = token.value;
	        var cooked = token.cooked;
	        return this.finalize(node, new Node.TemplateElement({ raw: raw, cooked: cooked }, token.tail));
	    };
	    Parser.prototype.parseTemplateElement = function () {
	        if (this.lookahead.type !== 10 /* Template */) {
	            this.throwUnexpectedToken();
	        }
	        var node = this.createNode();
	        var token = this.nextToken();
	        var raw = token.value;
	        var cooked = token.cooked;
	        return this.finalize(node, new Node.TemplateElement({ raw: raw, cooked: cooked }, token.tail));
	    };
	    Parser.prototype.parseTemplateLiteral = function () {
	        var node = this.createNode();
	        var expressions = [];
	        var quasis = [];
	        var quasi = this.parseTemplateHead();
	        quasis.push(quasi);
	        while (!quasi.tail) {
	            expressions.push(this.parseExpression());
	            quasi = this.parseTemplateElement();
	            quasis.push(quasi);
	        }
	        return this.finalize(node, new Node.TemplateLiteral(quasis, expressions));
	    };
	    // https://tc39.github.io/ecma262/#sec-grouping-operator
	    Parser.prototype.reinterpretExpressionAsPattern = function (expr) {
	        switch (expr.type) {
	            case syntax_1.Syntax.Identifier:
	            case syntax_1.Syntax.MemberExpression:
	            case syntax_1.Syntax.RestElement:
	            case syntax_1.Syntax.AssignmentPattern:
	                break;
	            case syntax_1.Syntax.SpreadElement:
	                expr.type = syntax_1.Syntax.RestElement;
	                this.reinterpretExpressionAsPattern(expr.argument);
	                break;
	            case syntax_1.Syntax.ArrayExpression:
	                expr.type = syntax_1.Syntax.ArrayPattern;
	                for (var i = 0; i < expr.elements.length; i++) {
	                    if (expr.elements[i] !== null) {
	                        this.reinterpretExpressionAsPattern(expr.elements[i]);
	                    }
	                }
	                break;
	            case syntax_1.Syntax.ObjectExpression:
	                expr.type = syntax_1.Syntax.ObjectPattern;
	                for (var i = 0; i < expr.properties.length; i++) {
	                    this.reinterpretExpressionAsPattern(expr.properties[i].value);
	                }
	                break;
	            case syntax_1.Syntax.AssignmentExpression:
	                expr.type = syntax_1.Syntax.AssignmentPattern;
	                delete expr.operator;
	                this.reinterpretExpressionAsPattern(expr.left);
	                break;
	            default:
	                // Allow other node type for tolerant parsing.
	                break;
	        }
	    };
	    Parser.prototype.parseGroupExpression = function () {
	        var expr;
	        this.expect('(');
	        if (this.match(')')) {
	            this.nextToken();
	            if (!this.match('=>')) {
	                this.expect('=>');
	            }
	            expr = {
	                type: ArrowParameterPlaceHolder,
	                params: [],
	                async: false
	            };
	        }
	        else {
	            var startToken = this.lookahead;
	            var params = [];
	            if (this.match('...')) {
	                expr = this.parseRestElement(params);
	                this.expect(')');
	                if (!this.match('=>')) {
	                    this.expect('=>');
	                }
	                expr = {
	                    type: ArrowParameterPlaceHolder,
	                    params: [expr],
	                    async: false
	                };
	            }
	            else {
	                var arrow = false;
	                this.context.isBindingElement = true;
	                expr = this.inheritCoverGrammar(this.parseAssignmentExpression);
	                if (this.match(',')) {
	                    var expressions = [];
	                    this.context.isAssignmentTarget = false;
	                    expressions.push(expr);
	                    while (this.lookahead.type !== 2 /* EOF */) {
	                        if (!this.match(',')) {
	                            break;
	                        }
	                        this.nextToken();
	                        if (this.match(')')) {
	                            this.nextToken();
	                            for (var i = 0; i < expressions.length; i++) {
	                                this.reinterpretExpressionAsPattern(expressions[i]);
	                            }
	                            arrow = true;
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: expressions,
	                                async: false
	                            };
	                        }
	                        else if (this.match('...')) {
	                            if (!this.context.isBindingElement) {
	                                this.throwUnexpectedToken(this.lookahead);
	                            }
	                            expressions.push(this.parseRestElement(params));
	                            this.expect(')');
	                            if (!this.match('=>')) {
	                                this.expect('=>');
	                            }
	                            this.context.isBindingElement = false;
	                            for (var i = 0; i < expressions.length; i++) {
	                                this.reinterpretExpressionAsPattern(expressions[i]);
	                            }
	                            arrow = true;
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: expressions,
	                                async: false
	                            };
	                        }
	                        else {
	                            expressions.push(this.inheritCoverGrammar(this.parseAssignmentExpression));
	                        }
	                        if (arrow) {
	                            break;
	                        }
	                    }
	                    if (!arrow) {
	                        expr = this.finalize(this.startNode(startToken), new Node.SequenceExpression(expressions));
	                    }
	                }
	                if (!arrow) {
	                    this.expect(')');
	                    if (this.match('=>')) {
	                        if (expr.type === syntax_1.Syntax.Identifier && expr.name === 'yield') {
	                            arrow = true;
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: [expr],
	                                async: false
	                            };
	                        }
	                        if (!arrow) {
	                            if (!this.context.isBindingElement) {
	                                this.throwUnexpectedToken(this.lookahead);
	                            }
	                            if (expr.type === syntax_1.Syntax.SequenceExpression) {
	                                for (var i = 0; i < expr.expressions.length; i++) {
	                                    this.reinterpretExpressionAsPattern(expr.expressions[i]);
	                                }
	                            }
	                            else {
	                                this.reinterpretExpressionAsPattern(expr);
	                            }
	                            var parameters = (expr.type === syntax_1.Syntax.SequenceExpression ? expr.expressions : [expr]);
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: parameters,
	                                async: false
	                            };
	                        }
	                    }
	                    this.context.isBindingElement = false;
	                }
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-left-hand-side-expressions
	    Parser.prototype.parseArguments = function () {
	        this.expect('(');
	        var args = [];
	        if (!this.match(')')) {
	            while (true) {
	                var expr = this.match('...') ? this.parseSpreadElement() :
	                    this.isolateCoverGrammar(this.parseAssignmentExpression);
	                args.push(expr);
	                if (this.match(')')) {
	                    break;
	                }
	                this.expectCommaSeparator();
	                if (this.match(')')) {
	                    break;
	                }
	            }
	        }
	        this.expect(')');
	        return args;
	    };
	    Parser.prototype.isIdentifierName = function (token) {
	        return token.type === 3 /* Identifier */ ||
	            token.type === 4 /* Keyword */ ||
	            token.type === 1 /* BooleanLiteral */ ||
	            token.type === 5 /* NullLiteral */;
	    };
	    Parser.prototype.parseIdentifierName = function () {
	        var node = this.createNode();
	        var token = this.nextToken();
	        if (!this.isIdentifierName(token)) {
	            this.throwUnexpectedToken(token);
	        }
	        return this.finalize(node, new Node.Identifier(token.value));
	    };
	    Parser.prototype.parseNewExpression = function () {
	        var node = this.createNode();
	        var id = this.parseIdentifierName();
	        assert_1.assert(id.name === 'new', 'New expression must start with `new`');
	        var expr;
	        if (this.match('.')) {
	            this.nextToken();
	            if (this.lookahead.type === 3 /* Identifier */ && this.context.inFunctionBody && this.lookahead.value === 'target') {
	                var property = this.parseIdentifierName();
	                expr = new Node.MetaProperty(id, property);
	            }
	            else {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	        }
	        else {
	            var callee = this.isolateCoverGrammar(this.parseLeftHandSideExpression);
	            var args = this.match('(') ? this.parseArguments() : [];
	            expr = new Node.NewExpression(callee, args);
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        return this.finalize(node, expr);
	    };
	    Parser.prototype.parseAsyncArgument = function () {
	        var arg = this.parseAssignmentExpression();
	        this.context.firstCoverInitializedNameError = null;
	        return arg;
	    };
	    Parser.prototype.parseAsyncArguments = function () {
	        this.expect('(');
	        var args = [];
	        if (!this.match(')')) {
	            while (true) {
	                var expr = this.match('...') ? this.parseSpreadElement() :
	                    this.isolateCoverGrammar(this.parseAsyncArgument);
	                args.push(expr);
	                if (this.match(')')) {
	                    break;
	                }
	                this.expectCommaSeparator();
	                if (this.match(')')) {
	                    break;
	                }
	            }
	        }
	        this.expect(')');
	        return args;
	    };
	    Parser.prototype.parseLeftHandSideExpressionAllowCall = function () {
	        var startToken = this.lookahead;
	        var maybeAsync = this.matchContextualKeyword('async');
	        var previousAllowIn = this.context.allowIn;
	        this.context.allowIn = true;
	        var expr;
	        if (this.matchKeyword('super') && this.context.inFunctionBody) {
	            expr = this.createNode();
	            this.nextToken();
	            expr = this.finalize(expr, new Node.Super());
	            if (!this.match('(') && !this.match('.') && !this.match('[')) {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	        }
	        else {
	            expr = this.inheritCoverGrammar(this.matchKeyword('new') ? this.parseNewExpression : this.parsePrimaryExpression);
	        }
	        while (true) {
	            if (this.match('.')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('.');
	                var property = this.parseIdentifierName();
	                expr = this.finalize(this.startNode(startToken), new Node.StaticMemberExpression(expr, property));
	            }
	            else if (this.match('(')) {
	                var asyncArrow = maybeAsync && (startToken.lineNumber === this.lookahead.lineNumber);
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = false;
	                var args = asyncArrow ? this.parseAsyncArguments() : this.parseArguments();
	                expr = this.finalize(this.startNode(startToken), new Node.CallExpression(expr, args));
	                if (asyncArrow && this.match('=>')) {
	                    for (var i = 0; i < args.length; ++i) {
	                        this.reinterpretExpressionAsPattern(args[i]);
	                    }
	                    expr = {
	                        type: ArrowParameterPlaceHolder,
	                        params: args,
	                        async: true
	                    };
	                }
	            }
	            else if (this.match('[')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('[');
	                var property = this.isolateCoverGrammar(this.parseExpression);
	                this.expect(']');
	                expr = this.finalize(this.startNode(startToken), new Node.ComputedMemberExpression(expr, property));
	            }
	            else if (this.lookahead.type === 10 /* Template */ && this.lookahead.head) {
	                var quasi = this.parseTemplateLiteral();
	                expr = this.finalize(this.startNode(startToken), new Node.TaggedTemplateExpression(expr, quasi));
	            }
	            else {
	                break;
	            }
	        }
	        this.context.allowIn = previousAllowIn;
	        return expr;
	    };
	    Parser.prototype.parseSuper = function () {
	        var node = this.createNode();
	        this.expectKeyword('super');
	        if (!this.match('[') && !this.match('.')) {
	            this.throwUnexpectedToken(this.lookahead);
	        }
	        return this.finalize(node, new Node.Super());
	    };
	    Parser.prototype.parseLeftHandSideExpression = function () {
	        assert_1.assert(this.context.allowIn, 'callee of new expression always allow in keyword.');
	        var node = this.startNode(this.lookahead);
	        var expr = (this.matchKeyword('super') && this.context.inFunctionBody) ? this.parseSuper() :
	            this.inheritCoverGrammar(this.matchKeyword('new') ? this.parseNewExpression : this.parsePrimaryExpression);
	        while (true) {
	            if (this.match('[')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('[');
	                var property = this.isolateCoverGrammar(this.parseExpression);
	                this.expect(']');
	                expr = this.finalize(node, new Node.ComputedMemberExpression(expr, property));
	            }
	            else if (this.match('.')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('.');
	                var property = this.parseIdentifierName();
	                expr = this.finalize(node, new Node.StaticMemberExpression(expr, property));
	            }
	            else if (this.lookahead.type === 10 /* Template */ && this.lookahead.head) {
	                var quasi = this.parseTemplateLiteral();
	                expr = this.finalize(node, new Node.TaggedTemplateExpression(expr, quasi));
	            }
	            else {
	                break;
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-update-expressions
	    Parser.prototype.parseUpdateExpression = function () {
	        var expr;
	        var startToken = this.lookahead;
	        if (this.match('++') || this.match('--')) {
	            var node = this.startNode(startToken);
	            var token = this.nextToken();
	            expr = this.inheritCoverGrammar(this.parseUnaryExpression);
	            if (this.context.strict && expr.type === syntax_1.Syntax.Identifier && this.scanner.isRestrictedWord(expr.name)) {
	                this.tolerateError(messages_1.Messages.StrictLHSPrefix);
	            }
	            if (!this.context.isAssignmentTarget) {
	                this.tolerateError(messages_1.Messages.InvalidLHSInAssignment);
	            }
	            var prefix = true;
	            expr = this.finalize(node, new Node.UpdateExpression(token.value, expr, prefix));
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        else {
	            expr = this.inheritCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
	            if (!this.hasLineTerminator && this.lookahead.type === 7 /* Punctuator */) {
	                if (this.match('++') || this.match('--')) {
	                    if (this.context.strict && expr.type === syntax_1.Syntax.Identifier && this.scanner.isRestrictedWord(expr.name)) {
	                        this.tolerateError(messages_1.Messages.StrictLHSPostfix);
	                    }
	                    if (!this.context.isAssignmentTarget) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInAssignment);
	                    }
	                    this.context.isAssignmentTarget = false;
	                    this.context.isBindingElement = false;
	                    var operator = this.nextToken().value;
	                    var prefix = false;
	                    expr = this.finalize(this.startNode(startToken), new Node.UpdateExpression(operator, expr, prefix));
	                }
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-unary-operators
	    Parser.prototype.parseAwaitExpression = function () {
	        var node = this.createNode();
	        this.nextToken();
	        var argument = this.parseUnaryExpression();
	        return this.finalize(node, new Node.AwaitExpression(argument));
	    };
	    Parser.prototype.parseUnaryExpression = function () {
	        var expr;
	        if (this.match('+') || this.match('-') || this.match('~') || this.match('!') ||
	            this.matchKeyword('delete') || this.matchKeyword('void') || this.matchKeyword('typeof')) {
	            var node = this.startNode(this.lookahead);
	            var token = this.nextToken();
	            expr = this.inheritCoverGrammar(this.parseUnaryExpression);
	            expr = this.finalize(node, new Node.UnaryExpression(token.value, expr));
	            if (this.context.strict && expr.operator === 'delete' && expr.argument.type === syntax_1.Syntax.Identifier) {
	                this.tolerateError(messages_1.Messages.StrictDelete);
	            }
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        else if (this.context.await && this.matchContextualKeyword('await')) {
	            expr = this.parseAwaitExpression();
	        }
	        else {
	            expr = this.parseUpdateExpression();
	        }
	        return expr;
	    };
	    Parser.prototype.parseExponentiationExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.inheritCoverGrammar(this.parseUnaryExpression);
	        if (expr.type !== syntax_1.Syntax.UnaryExpression && this.match('**')) {
	            this.nextToken();
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	            var left = expr;
	            var right = this.isolateCoverGrammar(this.parseExponentiationExpression);
	            expr = this.finalize(this.startNode(startToken), new Node.BinaryExpression('**', left, right));
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-exp-operator
	    // https://tc39.github.io/ecma262/#sec-multiplicative-operators
	    // https://tc39.github.io/ecma262/#sec-additive-operators
	    // https://tc39.github.io/ecma262/#sec-bitwise-shift-operators
	    // https://tc39.github.io/ecma262/#sec-relational-operators
	    // https://tc39.github.io/ecma262/#sec-equality-operators
	    // https://tc39.github.io/ecma262/#sec-binary-bitwise-operators
	    // https://tc39.github.io/ecma262/#sec-binary-logical-operators
	    Parser.prototype.binaryPrecedence = function (token) {
	        var op = token.value;
	        var precedence;
	        if (token.type === 7 /* Punctuator */) {
	            precedence = this.operatorPrecedence[op] || 0;
	        }
	        else if (token.type === 4 /* Keyword */) {
	            precedence = (op === 'instanceof' || (this.context.allowIn && op === 'in')) ? 7 : 0;
	        }
	        else {
	            precedence = 0;
	        }
	        return precedence;
	    };
	    Parser.prototype.parseBinaryExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.inheritCoverGrammar(this.parseExponentiationExpression);
	        var token = this.lookahead;
	        var prec = this.binaryPrecedence(token);
	        if (prec > 0) {
	            this.nextToken();
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	            var markers = [startToken, this.lookahead];
	            var left = expr;
	            var right = this.isolateCoverGrammar(this.parseExponentiationExpression);
	            var stack = [left, token.value, right];
	            var precedences = [prec];
	            while (true) {
	                prec = this.binaryPrecedence(this.lookahead);
	                if (prec <= 0) {
	                    break;
	                }
	                // Reduce: make a binary expression from the three topmost entries.
	                while ((stack.length > 2) && (prec <= precedences[precedences.length - 1])) {
	                    right = stack.pop();
	                    var operator = stack.pop();
	                    precedences.pop();
	                    left = stack.pop();
	                    markers.pop();
	                    var node = this.startNode(markers[markers.length - 1]);
	                    stack.push(this.finalize(node, new Node.BinaryExpression(operator, left, right)));
	                }
	                // Shift.
	                stack.push(this.nextToken().value);
	                precedences.push(prec);
	                markers.push(this.lookahead);
	                stack.push(this.isolateCoverGrammar(this.parseExponentiationExpression));
	            }
	            // Final reduce to clean-up the stack.
	            var i = stack.length - 1;
	            expr = stack[i];
	            var lastMarker = markers.pop();
	            while (i > 1) {
	                var marker = markers.pop();
	                var lastLineStart = lastMarker && lastMarker.lineStart;
	                var node = this.startNode(marker, lastLineStart);
	                var operator = stack[i - 1];
	                expr = this.finalize(node, new Node.BinaryExpression(operator, stack[i - 2], expr));
	                i -= 2;
	                lastMarker = marker;
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-conditional-operator
	    Parser.prototype.parseConditionalExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.inheritCoverGrammar(this.parseBinaryExpression);
	        if (this.match('?')) {
	            this.nextToken();
	            var previousAllowIn = this.context.allowIn;
	            this.context.allowIn = true;
	            var consequent = this.isolateCoverGrammar(this.parseAssignmentExpression);
	            this.context.allowIn = previousAllowIn;
	            this.expect(':');
	            var alternate = this.isolateCoverGrammar(this.parseAssignmentExpression);
	            expr = this.finalize(this.startNode(startToken), new Node.ConditionalExpression(expr, consequent, alternate));
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-assignment-operators
	    Parser.prototype.checkPatternParam = function (options, param) {
	        switch (param.type) {
	            case syntax_1.Syntax.Identifier:
	                this.validateParam(options, param, param.name);
	                break;
	            case syntax_1.Syntax.RestElement:
	                this.checkPatternParam(options, param.argument);
	                break;
	            case syntax_1.Syntax.AssignmentPattern:
	                this.checkPatternParam(options, param.left);
	                break;
	            case syntax_1.Syntax.ArrayPattern:
	                for (var i = 0; i < param.elements.length; i++) {
	                    if (param.elements[i] !== null) {
	                        this.checkPatternParam(options, param.elements[i]);
	                    }
	                }
	                break;
	            case syntax_1.Syntax.ObjectPattern:
	                for (var i = 0; i < param.properties.length; i++) {
	                    this.checkPatternParam(options, param.properties[i].value);
	                }
	                break;
	            default:
	                break;
	        }
	        options.simple = options.simple && (param instanceof Node.Identifier);
	    };
	    Parser.prototype.reinterpretAsCoverFormalsList = function (expr) {
	        var params = [expr];
	        var options;
	        var asyncArrow = false;
	        switch (expr.type) {
	            case syntax_1.Syntax.Identifier:
	                break;
	            case ArrowParameterPlaceHolder:
	                params = expr.params;
	                asyncArrow = expr.async;
	                break;
	            default:
	                return null;
	        }
	        options = {
	            simple: true,
	            paramSet: {}
	        };
	        for (var i = 0; i < params.length; ++i) {
	            var param = params[i];
	            if (param.type === syntax_1.Syntax.AssignmentPattern) {
	                if (param.right.type === syntax_1.Syntax.YieldExpression) {
	                    if (param.right.argument) {
	                        this.throwUnexpectedToken(this.lookahead);
	                    }
	                    param.right.type = syntax_1.Syntax.Identifier;
	                    param.right.name = 'yield';
	                    delete param.right.argument;
	                    delete param.right.delegate;
	                }
	            }
	            else if (asyncArrow && param.type === syntax_1.Syntax.Identifier && param.name === 'await') {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	            this.checkPatternParam(options, param);
	            params[i] = param;
	        }
	        if (this.context.strict || !this.context.allowYield) {
	            for (var i = 0; i < params.length; ++i) {
	                var param = params[i];
	                if (param.type === syntax_1.Syntax.YieldExpression) {
	                    this.throwUnexpectedToken(this.lookahead);
	                }
	            }
	        }
	        if (options.message === messages_1.Messages.StrictParamDupe) {
	            var token = this.context.strict ? options.stricted : options.firstRestricted;
	            this.throwUnexpectedToken(token, options.message);
	        }
	        return {
	            simple: options.simple,
	            params: params,
	            stricted: options.stricted,
	            firstRestricted: options.firstRestricted,
	            message: options.message
	        };
	    };
	    Parser.prototype.parseAssignmentExpression = function () {
	        var expr;
	        if (!this.context.allowYield && this.matchKeyword('yield')) {
	            expr = this.parseYieldExpression();
	        }
	        else {
	            var startToken = this.lookahead;
	            var token = startToken;
	            expr = this.parseConditionalExpression();
	            if (token.type === 3 /* Identifier */ && (token.lineNumber === this.lookahead.lineNumber) && token.value === 'async') {
	                if (this.lookahead.type === 3 /* Identifier */ || this.matchKeyword('yield')) {
	                    var arg = this.parsePrimaryExpression();
	                    this.reinterpretExpressionAsPattern(arg);
	                    expr = {
	                        type: ArrowParameterPlaceHolder,
	                        params: [arg],
	                        async: true
	                    };
	                }
	            }
	            if (expr.type === ArrowParameterPlaceHolder || this.match('=>')) {
	                // https://tc39.github.io/ecma262/#sec-arrow-function-definitions
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                var isAsync = expr.async;
	                var list = this.reinterpretAsCoverFormalsList(expr);
	                if (list) {
	                    if (this.hasLineTerminator) {
	                        this.tolerateUnexpectedToken(this.lookahead);
	                    }
	                    this.context.firstCoverInitializedNameError = null;
	                    var previousStrict = this.context.strict;
	                    var previousAllowStrictDirective = this.context.allowStrictDirective;
	                    this.context.allowStrictDirective = list.simple;
	                    var previousAllowYield = this.context.allowYield;
	                    var previousAwait = this.context.await;
	                    this.context.allowYield = true;
	                    this.context.await = isAsync;
	                    var node = this.startNode(startToken);
	                    this.expect('=>');
	                    var body = void 0;
	                    if (this.match('{')) {
	                        var previousAllowIn = this.context.allowIn;
	                        this.context.allowIn = true;
	                        body = this.parseFunctionSourceElements();
	                        this.context.allowIn = previousAllowIn;
	                    }
	                    else {
	                        body = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    }
	                    var expression = body.type !== syntax_1.Syntax.BlockStatement;
	                    if (this.context.strict && list.firstRestricted) {
	                        this.throwUnexpectedToken(list.firstRestricted, list.message);
	                    }
	                    if (this.context.strict && list.stricted) {
	                        this.tolerateUnexpectedToken(list.stricted, list.message);
	                    }
	                    expr = isAsync ? this.finalize(node, new Node.AsyncArrowFunctionExpression(list.params, body, expression)) :
	                        this.finalize(node, new Node.ArrowFunctionExpression(list.params, body, expression));
	                    this.context.strict = previousStrict;
	                    this.context.allowStrictDirective = previousAllowStrictDirective;
	                    this.context.allowYield = previousAllowYield;
	                    this.context.await = previousAwait;
	                }
	            }
	            else {
	                if (this.matchAssign()) {
	                    if (!this.context.isAssignmentTarget) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInAssignment);
	                    }
	                    if (this.context.strict && expr.type === syntax_1.Syntax.Identifier) {
	                        var id = expr;
	                        if (this.scanner.isRestrictedWord(id.name)) {
	                            this.tolerateUnexpectedToken(token, messages_1.Messages.StrictLHSAssignment);
	                        }
	                        if (this.scanner.isStrictModeReservedWord(id.name)) {
	                            this.tolerateUnexpectedToken(token, messages_1.Messages.StrictReservedWord);
	                        }
	                    }
	                    if (!this.match('=')) {
	                        this.context.isAssignmentTarget = false;
	                        this.context.isBindingElement = false;
	                    }
	                    else {
	                        this.reinterpretExpressionAsPattern(expr);
	                    }
	                    token = this.nextToken();
	                    var operator = token.value;
	                    var right = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    expr = this.finalize(this.startNode(startToken), new Node.AssignmentExpression(operator, expr, right));
	                    this.context.firstCoverInitializedNameError = null;
	                }
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-comma-operator
	    Parser.prototype.parseExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.isolateCoverGrammar(this.parseAssignmentExpression);
	        if (this.match(',')) {
	            var expressions = [];
	            expressions.push(expr);
	            while (this.lookahead.type !== 2 /* EOF */) {
	                if (!this.match(',')) {
	                    break;
	                }
	                this.nextToken();
	                expressions.push(this.isolateCoverGrammar(this.parseAssignmentExpression));
	            }
	            expr = this.finalize(this.startNode(startToken), new Node.SequenceExpression(expressions));
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-block
	    Parser.prototype.parseStatementListItem = function () {
	        var statement;
	        this.context.isAssignmentTarget = true;
	        this.context.isBindingElement = true;
	        if (this.lookahead.type === 4 /* Keyword */) {
	            switch (this.lookahead.value) {
	                case 'export':
	                    if (!this.context.isModule) {
	                        this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.IllegalExportDeclaration);
	                    }
	                    statement = this.parseExportDeclaration();
	                    break;
	                case 'import':
	                    if (!this.context.isModule) {
	                        this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.IllegalImportDeclaration);
	                    }
	                    statement = this.parseImportDeclaration();
	                    break;
	                case 'const':
	                    statement = this.parseLexicalDeclaration({ inFor: false });
	                    break;
	                case 'function':
	                    statement = this.parseFunctionDeclaration();
	                    break;
	                case 'class':
	                    statement = this.parseClassDeclaration();
	                    break;
	                case 'let':
	                    statement = this.isLexicalDeclaration() ? this.parseLexicalDeclaration({ inFor: false }) : this.parseStatement();
	                    break;
	                default:
	                    statement = this.parseStatement();
	                    break;
	            }
	        }
	        else {
	            statement = this.parseStatement();
	        }
	        return statement;
	    };
	    Parser.prototype.parseBlock = function () {
	        var node = this.createNode();
	        this.expect('{');
	        var block = [];
	        while (true) {
	            if (this.match('}')) {
	                break;
	            }
	            block.push(this.parseStatementListItem());
	        }
	        this.expect('}');
	        return this.finalize(node, new Node.BlockStatement(block));
	    };
	    // https://tc39.github.io/ecma262/#sec-let-and-const-declarations
	    Parser.prototype.parseLexicalBinding = function (kind, options) {
	        var node = this.createNode();
	        var params = [];
	        var id = this.parsePattern(params, kind);
	        if (this.context.strict && id.type === syntax_1.Syntax.Identifier) {
	            if (this.scanner.isRestrictedWord(id.name)) {
	                this.tolerateError(messages_1.Messages.StrictVarName);
	            }
	        }
	        var init = null;
	        if (kind === 'const') {
	            if (!this.matchKeyword('in') && !this.matchContextualKeyword('of')) {
	                if (this.match('=')) {
	                    this.nextToken();
	                    init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                }
	                else {
	                    this.throwError(messages_1.Messages.DeclarationMissingInitializer, 'const');
	                }
	            }
	        }
	        else if ((!options.inFor && id.type !== syntax_1.Syntax.Identifier) || this.match('=')) {
	            this.expect('=');
	            init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	        }
	        return this.finalize(node, new Node.VariableDeclarator(id, init));
	    };
	    Parser.prototype.parseBindingList = function (kind, options) {
	        var list = [this.parseLexicalBinding(kind, options)];
	        while (this.match(',')) {
	            this.nextToken();
	            list.push(this.parseLexicalBinding(kind, options));
	        }
	        return list;
	    };
	    Parser.prototype.isLexicalDeclaration = function () {
	        var state = this.scanner.saveState();
	        this.scanner.scanComments();
	        var next = this.scanner.lex();
	        this.scanner.restoreState(state);
	        return (next.type === 3 /* Identifier */) ||
	            (next.type === 7 /* Punctuator */ && next.value === '[') ||
	            (next.type === 7 /* Punctuator */ && next.value === '{') ||
	            (next.type === 4 /* Keyword */ && next.value === 'let') ||
	            (next.type === 4 /* Keyword */ && next.value === 'yield');
	    };
	    Parser.prototype.parseLexicalDeclaration = function (options) {
	        var node = this.createNode();
	        var kind = this.nextToken().value;
	        assert_1.assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');
	        var declarations = this.parseBindingList(kind, options);
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.VariableDeclaration(declarations, kind));
	    };
	    // https://tc39.github.io/ecma262/#sec-destructuring-binding-patterns
	    Parser.prototype.parseBindingRestElement = function (params, kind) {
	        var node = this.createNode();
	        this.expect('...');
	        var arg = this.parsePattern(params, kind);
	        return this.finalize(node, new Node.RestElement(arg));
	    };
	    Parser.prototype.parseArrayPattern = function (params, kind) {
	        var node = this.createNode();
	        this.expect('[');
	        var elements = [];
	        while (!this.match(']')) {
	            if (this.match(',')) {
	                this.nextToken();
	                elements.push(null);
	            }
	            else {
	                if (this.match('...')) {
	                    elements.push(this.parseBindingRestElement(params, kind));
	                    break;
	                }
	                else {
	                    elements.push(this.parsePatternWithDefault(params, kind));
	                }
	                if (!this.match(']')) {
	                    this.expect(',');
	                }
	            }
	        }
	        this.expect(']');
	        return this.finalize(node, new Node.ArrayPattern(elements));
	    };
	    Parser.prototype.parsePropertyPattern = function (params, kind) {
	        var node = this.createNode();
	        var computed = false;
	        var shorthand = false;
	        var method = false;
	        var key;
	        var value;
	        if (this.lookahead.type === 3 /* Identifier */) {
	            var keyToken = this.lookahead;
	            key = this.parseVariableIdentifier();
	            var init = this.finalize(node, new Node.Identifier(keyToken.value));
	            if (this.match('=')) {
	                params.push(keyToken);
	                shorthand = true;
	                this.nextToken();
	                var expr = this.parseAssignmentExpression();
	                value = this.finalize(this.startNode(keyToken), new Node.AssignmentPattern(init, expr));
	            }
	            else if (!this.match(':')) {
	                params.push(keyToken);
	                shorthand = true;
	                value = init;
	            }
	            else {
	                this.expect(':');
	                value = this.parsePatternWithDefault(params, kind);
	            }
	        }
	        else {
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            this.expect(':');
	            value = this.parsePatternWithDefault(params, kind);
	        }
	        return this.finalize(node, new Node.Property('init', key, computed, value, method, shorthand));
	    };
	    Parser.prototype.parseObjectPattern = function (params, kind) {
	        var node = this.createNode();
	        var properties = [];
	        this.expect('{');
	        while (!this.match('}')) {
	            properties.push(this.parsePropertyPattern(params, kind));
	            if (!this.match('}')) {
	                this.expect(',');
	            }
	        }
	        this.expect('}');
	        return this.finalize(node, new Node.ObjectPattern(properties));
	    };
	    Parser.prototype.parsePattern = function (params, kind) {
	        var pattern;
	        if (this.match('[')) {
	            pattern = this.parseArrayPattern(params, kind);
	        }
	        else if (this.match('{')) {
	            pattern = this.parseObjectPattern(params, kind);
	        }
	        else {
	            if (this.matchKeyword('let') && (kind === 'const' || kind === 'let')) {
	                this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.LetInLexicalBinding);
	            }
	            params.push(this.lookahead);
	            pattern = this.parseVariableIdentifier(kind);
	        }
	        return pattern;
	    };
	    Parser.prototype.parsePatternWithDefault = function (params, kind) {
	        var startToken = this.lookahead;
	        var pattern = this.parsePattern(params, kind);
	        if (this.match('=')) {
	            this.nextToken();
	            var previousAllowYield = this.context.allowYield;
	            this.context.allowYield = true;
	            var right = this.isolateCoverGrammar(this.parseAssignmentExpression);
	            this.context.allowYield = previousAllowYield;
	            pattern = this.finalize(this.startNode(startToken), new Node.AssignmentPattern(pattern, right));
	        }
	        return pattern;
	    };
	    // https://tc39.github.io/ecma262/#sec-variable-statement
	    Parser.prototype.parseVariableIdentifier = function (kind) {
	        var node = this.createNode();
	        var token = this.nextToken();
	        if (token.type === 4 /* Keyword */ && token.value === 'yield') {
	            if (this.context.strict) {
	                this.tolerateUnexpectedToken(token, messages_1.Messages.StrictReservedWord);
	            }
	            else if (!this.context.allowYield) {
	                this.throwUnexpectedToken(token);
	            }
	        }
	        else if (token.type !== 3 /* Identifier */) {
	            if (this.context.strict && token.type === 4 /* Keyword */ && this.scanner.isStrictModeReservedWord(token.value)) {
	                this.tolerateUnexpectedToken(token, messages_1.Messages.StrictReservedWord);
	            }
	            else {
	                if (this.context.strict || token.value !== 'let' || kind !== 'var') {
	                    this.throwUnexpectedToken(token);
	                }
	            }
	        }
	        else if ((this.context.isModule || this.context.await) && token.type === 3 /* Identifier */ && token.value === 'await') {
	            this.tolerateUnexpectedToken(token);
	        }
	        return this.finalize(node, new Node.Identifier(token.value));
	    };
	    Parser.prototype.parseVariableDeclaration = function (options) {
	        var node = this.createNode();
	        var params = [];
	        var id = this.parsePattern(params, 'var');
	        if (this.context.strict && id.type === syntax_1.Syntax.Identifier) {
	            if (this.scanner.isRestrictedWord(id.name)) {
	                this.tolerateError(messages_1.Messages.StrictVarName);
	            }
	        }
	        var init = null;
	        if (this.match('=')) {
	            this.nextToken();
	            init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	        }
	        else if (id.type !== syntax_1.Syntax.Identifier && !options.inFor) {
	            this.expect('=');
	        }
	        return this.finalize(node, new Node.VariableDeclarator(id, init));
	    };
	    Parser.prototype.parseVariableDeclarationList = function (options) {
	        var opt = { inFor: options.inFor };
	        var list = [];
	        list.push(this.parseVariableDeclaration(opt));
	        while (this.match(',')) {
	            this.nextToken();
	            list.push(this.parseVariableDeclaration(opt));
	        }
	        return list;
	    };
	    Parser.prototype.parseVariableStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('var');
	        var declarations = this.parseVariableDeclarationList({ inFor: false });
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.VariableDeclaration(declarations, 'var'));
	    };
	    // https://tc39.github.io/ecma262/#sec-empty-statement
	    Parser.prototype.parseEmptyStatement = function () {
	        var node = this.createNode();
	        this.expect(';');
	        return this.finalize(node, new Node.EmptyStatement());
	    };
	    // https://tc39.github.io/ecma262/#sec-expression-statement
	    Parser.prototype.parseExpressionStatement = function () {
	        var node = this.createNode();
	        var expr = this.parseExpression();
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ExpressionStatement(expr));
	    };
	    // https://tc39.github.io/ecma262/#sec-if-statement
	    Parser.prototype.parseIfClause = function () {
	        if (this.context.strict && this.matchKeyword('function')) {
	            this.tolerateError(messages_1.Messages.StrictFunction);
	        }
	        return this.parseStatement();
	    };
	    Parser.prototype.parseIfStatement = function () {
	        var node = this.createNode();
	        var consequent;
	        var alternate = null;
	        this.expectKeyword('if');
	        this.expect('(');
	        var test = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            consequent = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            consequent = this.parseIfClause();
	            if (this.matchKeyword('else')) {
	                this.nextToken();
	                alternate = this.parseIfClause();
	            }
	        }
	        return this.finalize(node, new Node.IfStatement(test, consequent, alternate));
	    };
	    // https://tc39.github.io/ecma262/#sec-do-while-statement
	    Parser.prototype.parseDoWhileStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('do');
	        var previousInIteration = this.context.inIteration;
	        this.context.inIteration = true;
	        var body = this.parseStatement();
	        this.context.inIteration = previousInIteration;
	        this.expectKeyword('while');
	        this.expect('(');
	        var test = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	        }
	        else {
	            this.expect(')');
	            if (this.match(';')) {
	                this.nextToken();
	            }
	        }
	        return this.finalize(node, new Node.DoWhileStatement(body, test));
	    };
	    // https://tc39.github.io/ecma262/#sec-while-statement
	    Parser.prototype.parseWhileStatement = function () {
	        var node = this.createNode();
	        var body;
	        this.expectKeyword('while');
	        this.expect('(');
	        var test = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            body = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            var previousInIteration = this.context.inIteration;
	            this.context.inIteration = true;
	            body = this.parseStatement();
	            this.context.inIteration = previousInIteration;
	        }
	        return this.finalize(node, new Node.WhileStatement(test, body));
	    };
	    // https://tc39.github.io/ecma262/#sec-for-statement
	    // https://tc39.github.io/ecma262/#sec-for-in-and-for-of-statements
	    Parser.prototype.parseForStatement = function () {
	        var init = null;
	        var test = null;
	        var update = null;
	        var forIn = true;
	        var left, right;
	        var node = this.createNode();
	        this.expectKeyword('for');
	        this.expect('(');
	        if (this.match(';')) {
	            this.nextToken();
	        }
	        else {
	            if (this.matchKeyword('var')) {
	                init = this.createNode();
	                this.nextToken();
	                var previousAllowIn = this.context.allowIn;
	                this.context.allowIn = false;
	                var declarations = this.parseVariableDeclarationList({ inFor: true });
	                this.context.allowIn = previousAllowIn;
	                if (declarations.length === 1 && this.matchKeyword('in')) {
	                    var decl = declarations[0];
	                    if (decl.init && (decl.id.type === syntax_1.Syntax.ArrayPattern || decl.id.type === syntax_1.Syntax.ObjectPattern || this.context.strict)) {
	                        this.tolerateError(messages_1.Messages.ForInOfLoopInitializer, 'for-in');
	                    }
	                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
	                    this.nextToken();
	                    left = init;
	                    right = this.parseExpression();
	                    init = null;
	                }
	                else if (declarations.length === 1 && declarations[0].init === null && this.matchContextualKeyword('of')) {
	                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
	                    this.nextToken();
	                    left = init;
	                    right = this.parseAssignmentExpression();
	                    init = null;
	                    forIn = false;
	                }
	                else {
	                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
	                    this.expect(';');
	                }
	            }
	            else if (this.matchKeyword('const') || this.matchKeyword('let')) {
	                init = this.createNode();
	                var kind = this.nextToken().value;
	                if (!this.context.strict && this.lookahead.value === 'in') {
	                    init = this.finalize(init, new Node.Identifier(kind));
	                    this.nextToken();
	                    left = init;
	                    right = this.parseExpression();
	                    init = null;
	                }
	                else {
	                    var previousAllowIn = this.context.allowIn;
	                    this.context.allowIn = false;
	                    var declarations = this.parseBindingList(kind, { inFor: true });
	                    this.context.allowIn = previousAllowIn;
	                    if (declarations.length === 1 && declarations[0].init === null && this.matchKeyword('in')) {
	                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
	                        this.nextToken();
	                        left = init;
	                        right = this.parseExpression();
	                        init = null;
	                    }
	                    else if (declarations.length === 1 && declarations[0].init === null && this.matchContextualKeyword('of')) {
	                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
	                        this.nextToken();
	                        left = init;
	                        right = this.parseAssignmentExpression();
	                        init = null;
	                        forIn = false;
	                    }
	                    else {
	                        this.consumeSemicolon();
	                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
	                    }
	                }
	            }
	            else {
	                var initStartToken = this.lookahead;
	                var previousAllowIn = this.context.allowIn;
	                this.context.allowIn = false;
	                init = this.inheritCoverGrammar(this.parseAssignmentExpression);
	                this.context.allowIn = previousAllowIn;
	                if (this.matchKeyword('in')) {
	                    if (!this.context.isAssignmentTarget || init.type === syntax_1.Syntax.AssignmentExpression) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInForIn);
	                    }
	                    this.nextToken();
	                    this.reinterpretExpressionAsPattern(init);
	                    left = init;
	                    right = this.parseExpression();
	                    init = null;
	                }
	                else if (this.matchContextualKeyword('of')) {
	                    if (!this.context.isAssignmentTarget || init.type === syntax_1.Syntax.AssignmentExpression) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInForLoop);
	                    }
	                    this.nextToken();
	                    this.reinterpretExpressionAsPattern(init);
	                    left = init;
	                    right = this.parseAssignmentExpression();
	                    init = null;
	                    forIn = false;
	                }
	                else {
	                    if (this.match(',')) {
	                        var initSeq = [init];
	                        while (this.match(',')) {
	                            this.nextToken();
	                            initSeq.push(this.isolateCoverGrammar(this.parseAssignmentExpression));
	                        }
	                        init = this.finalize(this.startNode(initStartToken), new Node.SequenceExpression(initSeq));
	                    }
	                    this.expect(';');
	                }
	            }
	        }
	        if (typeof left === 'undefined') {
	            if (!this.match(';')) {
	                test = this.parseExpression();
	            }
	            this.expect(';');
	            if (!this.match(')')) {
	                update = this.parseExpression();
	            }
	        }
	        var body;
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            body = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            var previousInIteration = this.context.inIteration;
	            this.context.inIteration = true;
	            body = this.isolateCoverGrammar(this.parseStatement);
	            this.context.inIteration = previousInIteration;
	        }
	        return (typeof left === 'undefined') ?
	            this.finalize(node, new Node.ForStatement(init, test, update, body)) :
	            forIn ? this.finalize(node, new Node.ForInStatement(left, right, body)) :
	                this.finalize(node, new Node.ForOfStatement(left, right, body));
	    };
	    // https://tc39.github.io/ecma262/#sec-continue-statement
	    Parser.prototype.parseContinueStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('continue');
	        var label = null;
	        if (this.lookahead.type === 3 /* Identifier */ && !this.hasLineTerminator) {
	            var id = this.parseVariableIdentifier();
	            label = id;
	            var key = '$' + id.name;
	            if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
	                this.throwError(messages_1.Messages.UnknownLabel, id.name);
	            }
	        }
	        this.consumeSemicolon();
	        if (label === null && !this.context.inIteration) {
	            this.throwError(messages_1.Messages.IllegalContinue);
	        }
	        return this.finalize(node, new Node.ContinueStatement(label));
	    };
	    // https://tc39.github.io/ecma262/#sec-break-statement
	    Parser.prototype.parseBreakStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('break');
	        var label = null;
	        if (this.lookahead.type === 3 /* Identifier */ && !this.hasLineTerminator) {
	            var id = this.parseVariableIdentifier();
	            var key = '$' + id.name;
	            if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
	                this.throwError(messages_1.Messages.UnknownLabel, id.name);
	            }
	            label = id;
	        }
	        this.consumeSemicolon();
	        if (label === null && !this.context.inIteration && !this.context.inSwitch) {
	            this.throwError(messages_1.Messages.IllegalBreak);
	        }
	        return this.finalize(node, new Node.BreakStatement(label));
	    };
	    // https://tc39.github.io/ecma262/#sec-return-statement
	    Parser.prototype.parseReturnStatement = function () {
	        if (!this.context.inFunctionBody) {
	            this.tolerateError(messages_1.Messages.IllegalReturn);
	        }
	        var node = this.createNode();
	        this.expectKeyword('return');
	        var hasArgument = (!this.match(';') && !this.match('}') &&
	            !this.hasLineTerminator && this.lookahead.type !== 2 /* EOF */) ||
	            this.lookahead.type === 8 /* StringLiteral */ ||
	            this.lookahead.type === 10 /* Template */;
	        var argument = hasArgument ? this.parseExpression() : null;
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ReturnStatement(argument));
	    };
	    // https://tc39.github.io/ecma262/#sec-with-statement
	    Parser.prototype.parseWithStatement = function () {
	        if (this.context.strict) {
	            this.tolerateError(messages_1.Messages.StrictModeWith);
	        }
	        var node = this.createNode();
	        var body;
	        this.expectKeyword('with');
	        this.expect('(');
	        var object = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            body = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            body = this.parseStatement();
	        }
	        return this.finalize(node, new Node.WithStatement(object, body));
	    };
	    // https://tc39.github.io/ecma262/#sec-switch-statement
	    Parser.prototype.parseSwitchCase = function () {
	        var node = this.createNode();
	        var test;
	        if (this.matchKeyword('default')) {
	            this.nextToken();
	            test = null;
	        }
	        else {
	            this.expectKeyword('case');
	            test = this.parseExpression();
	        }
	        this.expect(':');
	        var consequent = [];
	        while (true) {
	            if (this.match('}') || this.matchKeyword('default') || this.matchKeyword('case')) {
	                break;
	            }
	            consequent.push(this.parseStatementListItem());
	        }
	        return this.finalize(node, new Node.SwitchCase(test, consequent));
	    };
	    Parser.prototype.parseSwitchStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('switch');
	        this.expect('(');
	        var discriminant = this.parseExpression();
	        this.expect(')');
	        var previousInSwitch = this.context.inSwitch;
	        this.context.inSwitch = true;
	        var cases = [];
	        var defaultFound = false;
	        this.expect('{');
	        while (true) {
	            if (this.match('}')) {
	                break;
	            }
	            var clause = this.parseSwitchCase();
	            if (clause.test === null) {
	                if (defaultFound) {
	                    this.throwError(messages_1.Messages.MultipleDefaultsInSwitch);
	                }
	                defaultFound = true;
	            }
	            cases.push(clause);
	        }
	        this.expect('}');
	        this.context.inSwitch = previousInSwitch;
	        return this.finalize(node, new Node.SwitchStatement(discriminant, cases));
	    };
	    // https://tc39.github.io/ecma262/#sec-labelled-statements
	    Parser.prototype.parseLabelledStatement = function () {
	        var node = this.createNode();
	        var expr = this.parseExpression();
	        var statement;
	        if ((expr.type === syntax_1.Syntax.Identifier) && this.match(':')) {
	            this.nextToken();
	            var id = expr;
	            var key = '$' + id.name;
	            if (Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
	                this.throwError(messages_1.Messages.Redeclaration, 'Label', id.name);
	            }
	            this.context.labelSet[key] = true;
	            var body = void 0;
	            if (this.matchKeyword('class')) {
	                this.tolerateUnexpectedToken(this.lookahead);
	                body = this.parseClassDeclaration();
	            }
	            else if (this.matchKeyword('function')) {
	                var token = this.lookahead;
	                var declaration = this.parseFunctionDeclaration();
	                if (this.context.strict) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictFunction);
	                }
	                else if (declaration.generator) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.GeneratorInLegacyContext);
	                }
	                body = declaration;
	            }
	            else {
	                body = this.parseStatement();
	            }
	            delete this.context.labelSet[key];
	            statement = new Node.LabeledStatement(id, body);
	        }
	        else {
	            this.consumeSemicolon();
	            statement = new Node.ExpressionStatement(expr);
	        }
	        return this.finalize(node, statement);
	    };
	    // https://tc39.github.io/ecma262/#sec-throw-statement
	    Parser.prototype.parseThrowStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('throw');
	        if (this.hasLineTerminator) {
	            this.throwError(messages_1.Messages.NewlineAfterThrow);
	        }
	        var argument = this.parseExpression();
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ThrowStatement(argument));
	    };
	    // https://tc39.github.io/ecma262/#sec-try-statement
	    Parser.prototype.parseCatchClause = function () {
	        var node = this.createNode();
	        this.expectKeyword('catch');
	        this.expect('(');
	        if (this.match(')')) {
	            this.throwUnexpectedToken(this.lookahead);
	        }
	        var params = [];
	        var param = this.parsePattern(params);
	        var paramMap = {};
	        for (var i = 0; i < params.length; i++) {
	            var key = '$' + params[i].value;
	            if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
	                this.tolerateError(messages_1.Messages.DuplicateBinding, params[i].value);
	            }
	            paramMap[key] = true;
	        }
	        if (this.context.strict && param.type === syntax_1.Syntax.Identifier) {
	            if (this.scanner.isRestrictedWord(param.name)) {
	                this.tolerateError(messages_1.Messages.StrictCatchVariable);
	            }
	        }
	        this.expect(')');
	        var body = this.parseBlock();
	        return this.finalize(node, new Node.CatchClause(param, body));
	    };
	    Parser.prototype.parseFinallyClause = function () {
	        this.expectKeyword('finally');
	        return this.parseBlock();
	    };
	    Parser.prototype.parseTryStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('try');
	        var block = this.parseBlock();
	        var handler = this.matchKeyword('catch') ? this.parseCatchClause() : null;
	        var finalizer = this.matchKeyword('finally') ? this.parseFinallyClause() : null;
	        if (!handler && !finalizer) {
	            this.throwError(messages_1.Messages.NoCatchOrFinally);
	        }
	        return this.finalize(node, new Node.TryStatement(block, handler, finalizer));
	    };
	    // https://tc39.github.io/ecma262/#sec-debugger-statement
	    Parser.prototype.parseDebuggerStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('debugger');
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.DebuggerStatement());
	    };
	    // https://tc39.github.io/ecma262/#sec-ecmascript-language-statements-and-declarations
	    Parser.prototype.parseStatement = function () {
	        var statement;
	        switch (this.lookahead.type) {
	            case 1 /* BooleanLiteral */:
	            case 5 /* NullLiteral */:
	            case 6 /* NumericLiteral */:
	            case 8 /* StringLiteral */:
	            case 10 /* Template */:
	            case 9 /* RegularExpression */:
	                statement = this.parseExpressionStatement();
	                break;
	            case 7 /* Punctuator */:
	                var value = this.lookahead.value;
	                if (value === '{') {
	                    statement = this.parseBlock();
	                }
	                else if (value === '(') {
	                    statement = this.parseExpressionStatement();
	                }
	                else if (value === ';') {
	                    statement = this.parseEmptyStatement();
	                }
	                else {
	                    statement = this.parseExpressionStatement();
	                }
	                break;
	            case 3 /* Identifier */:
	                statement = this.matchAsyncFunction() ? this.parseFunctionDeclaration() : this.parseLabelledStatement();
	                break;
	            case 4 /* Keyword */:
	                switch (this.lookahead.value) {
	                    case 'break':
	                        statement = this.parseBreakStatement();
	                        break;
	                    case 'continue':
	                        statement = this.parseContinueStatement();
	                        break;
	                    case 'debugger':
	                        statement = this.parseDebuggerStatement();
	                        break;
	                    case 'do':
	                        statement = this.parseDoWhileStatement();
	                        break;
	                    case 'for':
	                        statement = this.parseForStatement();
	                        break;
	                    case 'function':
	                        statement = this.parseFunctionDeclaration();
	                        break;
	                    case 'if':
	                        statement = this.parseIfStatement();
	                        break;
	                    case 'return':
	                        statement = this.parseReturnStatement();
	                        break;
	                    case 'switch':
	                        statement = this.parseSwitchStatement();
	                        break;
	                    case 'throw':
	                        statement = this.parseThrowStatement();
	                        break;
	                    case 'try':
	                        statement = this.parseTryStatement();
	                        break;
	                    case 'var':
	                        statement = this.parseVariableStatement();
	                        break;
	                    case 'while':
	                        statement = this.parseWhileStatement();
	                        break;
	                    case 'with':
	                        statement = this.parseWithStatement();
	                        break;
	                    default:
	                        statement = this.parseExpressionStatement();
	                        break;
	                }
	                break;
	            default:
	                statement = this.throwUnexpectedToken(this.lookahead);
	        }
	        return statement;
	    };
	    // https://tc39.github.io/ecma262/#sec-function-definitions
	    Parser.prototype.parseFunctionSourceElements = function () {
	        var node = this.createNode();
	        this.expect('{');
	        var body = this.parseDirectivePrologues();
	        var previousLabelSet = this.context.labelSet;
	        var previousInIteration = this.context.inIteration;
	        var previousInSwitch = this.context.inSwitch;
	        var previousInFunctionBody = this.context.inFunctionBody;
	        this.context.labelSet = {};
	        this.context.inIteration = false;
	        this.context.inSwitch = false;
	        this.context.inFunctionBody = true;
	        while (this.lookahead.type !== 2 /* EOF */) {
	            if (this.match('}')) {
	                break;
	            }
	            body.push(this.parseStatementListItem());
	        }
	        this.expect('}');
	        this.context.labelSet = previousLabelSet;
	        this.context.inIteration = previousInIteration;
	        this.context.inSwitch = previousInSwitch;
	        this.context.inFunctionBody = previousInFunctionBody;
	        return this.finalize(node, new Node.BlockStatement(body));
	    };
	    Parser.prototype.validateParam = function (options, param, name) {
	        var key = '$' + name;
	        if (this.context.strict) {
	            if (this.scanner.isRestrictedWord(name)) {
	                options.stricted = param;
	                options.message = messages_1.Messages.StrictParamName;
	            }
	            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
	                options.stricted = param;
	                options.message = messages_1.Messages.StrictParamDupe;
	            }
	        }
	        else if (!options.firstRestricted) {
	            if (this.scanner.isRestrictedWord(name)) {
	                options.firstRestricted = param;
	                options.message = messages_1.Messages.StrictParamName;
	            }
	            else if (this.scanner.isStrictModeReservedWord(name)) {
	                options.firstRestricted = param;
	                options.message = messages_1.Messages.StrictReservedWord;
	            }
	            else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
	                options.stricted = param;
	                options.message = messages_1.Messages.StrictParamDupe;
	            }
	        }
	        /* istanbul ignore next */
	        if (typeof Object.defineProperty === 'function') {
	            Object.defineProperty(options.paramSet, key, { value: true, enumerable: true, writable: true, configurable: true });
	        }
	        else {
	            options.paramSet[key] = true;
	        }
	    };
	    Parser.prototype.parseRestElement = function (params) {
	        var node = this.createNode();
	        this.expect('...');
	        var arg = this.parsePattern(params);
	        if (this.match('=')) {
	            this.throwError(messages_1.Messages.DefaultRestParameter);
	        }
	        if (!this.match(')')) {
	            this.throwError(messages_1.Messages.ParameterAfterRestParameter);
	        }
	        return this.finalize(node, new Node.RestElement(arg));
	    };
	    Parser.prototype.parseFormalParameter = function (options) {
	        var params = [];
	        var param = this.match('...') ? this.parseRestElement(params) : this.parsePatternWithDefault(params);
	        for (var i = 0; i < params.length; i++) {
	            this.validateParam(options, params[i], params[i].value);
	        }
	        options.simple = options.simple && (param instanceof Node.Identifier);
	        options.params.push(param);
	    };
	    Parser.prototype.parseFormalParameters = function (firstRestricted) {
	        var options;
	        options = {
	            simple: true,
	            params: [],
	            firstRestricted: firstRestricted
	        };
	        this.expect('(');
	        if (!this.match(')')) {
	            options.paramSet = {};
	            while (this.lookahead.type !== 2 /* EOF */) {
	                this.parseFormalParameter(options);
	                if (this.match(')')) {
	                    break;
	                }
	                this.expect(',');
	                if (this.match(')')) {
	                    break;
	                }
	            }
	        }
	        this.expect(')');
	        return {
	            simple: options.simple,
	            params: options.params,
	            stricted: options.stricted,
	            firstRestricted: options.firstRestricted,
	            message: options.message
	        };
	    };
	    Parser.prototype.matchAsyncFunction = function () {
	        var match = this.matchContextualKeyword('async');
	        if (match) {
	            var state = this.scanner.saveState();
	            this.scanner.scanComments();
	            var next = this.scanner.lex();
	            this.scanner.restoreState(state);
	            match = (state.lineNumber === next.lineNumber) && (next.type === 4 /* Keyword */) && (next.value === 'function');
	        }
	        return match;
	    };
	    Parser.prototype.parseFunctionDeclaration = function (identifierIsOptional) {
	        var node = this.createNode();
	        var isAsync = this.matchContextualKeyword('async');
	        if (isAsync) {
	            this.nextToken();
	        }
	        this.expectKeyword('function');
	        var isGenerator = isAsync ? false : this.match('*');
	        if (isGenerator) {
	            this.nextToken();
	        }
	        var message;
	        var id = null;
	        var firstRestricted = null;
	        if (!identifierIsOptional || !this.match('(')) {
	            var token = this.lookahead;
	            id = this.parseVariableIdentifier();
	            if (this.context.strict) {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictFunctionName);
	                }
	            }
	            else {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictFunctionName;
	                }
	                else if (this.scanner.isStrictModeReservedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictReservedWord;
	                }
	            }
	        }
	        var previousAllowAwait = this.context.await;
	        var previousAllowYield = this.context.allowYield;
	        this.context.await = isAsync;
	        this.context.allowYield = !isGenerator;
	        var formalParameters = this.parseFormalParameters(firstRestricted);
	        var params = formalParameters.params;
	        var stricted = formalParameters.stricted;
	        firstRestricted = formalParameters.firstRestricted;
	        if (formalParameters.message) {
	            message = formalParameters.message;
	        }
	        var previousStrict = this.context.strict;
	        var previousAllowStrictDirective = this.context.allowStrictDirective;
	        this.context.allowStrictDirective = formalParameters.simple;
	        var body = this.parseFunctionSourceElements();
	        if (this.context.strict && firstRestricted) {
	            this.throwUnexpectedToken(firstRestricted, message);
	        }
	        if (this.context.strict && stricted) {
	            this.tolerateUnexpectedToken(stricted, message);
	        }
	        this.context.strict = previousStrict;
	        this.context.allowStrictDirective = previousAllowStrictDirective;
	        this.context.await = previousAllowAwait;
	        this.context.allowYield = previousAllowYield;
	        return isAsync ? this.finalize(node, new Node.AsyncFunctionDeclaration(id, params, body)) :
	            this.finalize(node, new Node.FunctionDeclaration(id, params, body, isGenerator));
	    };
	    Parser.prototype.parseFunctionExpression = function () {
	        var node = this.createNode();
	        var isAsync = this.matchContextualKeyword('async');
	        if (isAsync) {
	            this.nextToken();
	        }
	        this.expectKeyword('function');
	        var isGenerator = isAsync ? false : this.match('*');
	        if (isGenerator) {
	            this.nextToken();
	        }
	        var message;
	        var id = null;
	        var firstRestricted;
	        var previousAllowAwait = this.context.await;
	        var previousAllowYield = this.context.allowYield;
	        this.context.await = isAsync;
	        this.context.allowYield = !isGenerator;
	        if (!this.match('(')) {
	            var token = this.lookahead;
	            id = (!this.context.strict && !isGenerator && this.matchKeyword('yield')) ? this.parseIdentifierName() : this.parseVariableIdentifier();
	            if (this.context.strict) {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictFunctionName);
	                }
	            }
	            else {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictFunctionName;
	                }
	                else if (this.scanner.isStrictModeReservedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictReservedWord;
	                }
	            }
	        }
	        var formalParameters = this.parseFormalParameters(firstRestricted);
	        var params = formalParameters.params;
	        var stricted = formalParameters.stricted;
	        firstRestricted = formalParameters.firstRestricted;
	        if (formalParameters.message) {
	            message = formalParameters.message;
	        }
	        var previousStrict = this.context.strict;
	        var previousAllowStrictDirective = this.context.allowStrictDirective;
	        this.context.allowStrictDirective = formalParameters.simple;
	        var body = this.parseFunctionSourceElements();
	        if (this.context.strict && firstRestricted) {
	            this.throwUnexpectedToken(firstRestricted, message);
	        }
	        if (this.context.strict && stricted) {
	            this.tolerateUnexpectedToken(stricted, message);
	        }
	        this.context.strict = previousStrict;
	        this.context.allowStrictDirective = previousAllowStrictDirective;
	        this.context.await = previousAllowAwait;
	        this.context.allowYield = previousAllowYield;
	        return isAsync ? this.finalize(node, new Node.AsyncFunctionExpression(id, params, body)) :
	            this.finalize(node, new Node.FunctionExpression(id, params, body, isGenerator));
	    };
	    // https://tc39.github.io/ecma262/#sec-directive-prologues-and-the-use-strict-directive
	    Parser.prototype.parseDirective = function () {
	        var token = this.lookahead;
	        var node = this.createNode();
	        var expr = this.parseExpression();
	        var directive = (expr.type === syntax_1.Syntax.Literal) ? this.getTokenRaw(token).slice(1, -1) : null;
	        this.consumeSemicolon();
	        return this.finalize(node, directive ? new Node.Directive(expr, directive) : new Node.ExpressionStatement(expr));
	    };
	    Parser.prototype.parseDirectivePrologues = function () {
	        var firstRestricted = null;
	        var body = [];
	        while (true) {
	            var token = this.lookahead;
	            if (token.type !== 8 /* StringLiteral */) {
	                break;
	            }
	            var statement = this.parseDirective();
	            body.push(statement);
	            var directive = statement.directive;
	            if (typeof directive !== 'string') {
	                break;
	            }
	            if (directive === 'use strict') {
	                this.context.strict = true;
	                if (firstRestricted) {
	                    this.tolerateUnexpectedToken(firstRestricted, messages_1.Messages.StrictOctalLiteral);
	                }
	                if (!this.context.allowStrictDirective) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.IllegalLanguageModeDirective);
	                }
	            }
	            else {
	                if (!firstRestricted && token.octal) {
	                    firstRestricted = token;
	                }
	            }
	        }
	        return body;
	    };
	    // https://tc39.github.io/ecma262/#sec-method-definitions
	    Parser.prototype.qualifiedPropertyName = function (token) {
	        switch (token.type) {
	            case 3 /* Identifier */:
	            case 8 /* StringLiteral */:
	            case 1 /* BooleanLiteral */:
	            case 5 /* NullLiteral */:
	            case 6 /* NumericLiteral */:
	            case 4 /* Keyword */:
	                return true;
	            case 7 /* Punctuator */:
	                return token.value === '[';
	            default:
	                break;
	        }
	        return false;
	    };
	    Parser.prototype.parseGetterMethod = function () {
	        var node = this.createNode();
	        var isGenerator = false;
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = !isGenerator;
	        var formalParameters = this.parseFormalParameters();
	        if (formalParameters.params.length > 0) {
	            this.tolerateError(messages_1.Messages.BadGetterArity);
	        }
	        var method = this.parsePropertyMethod(formalParameters);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, formalParameters.params, method, isGenerator));
	    };
	    Parser.prototype.parseSetterMethod = function () {
	        var node = this.createNode();
	        var isGenerator = false;
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = !isGenerator;
	        var formalParameters = this.parseFormalParameters();
	        if (formalParameters.params.length !== 1) {
	            this.tolerateError(messages_1.Messages.BadSetterArity);
	        }
	        else if (formalParameters.params[0] instanceof Node.RestElement) {
	            this.tolerateError(messages_1.Messages.BadSetterRestParameter);
	        }
	        var method = this.parsePropertyMethod(formalParameters);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, formalParameters.params, method, isGenerator));
	    };
	    Parser.prototype.parseGeneratorMethod = function () {
	        var node = this.createNode();
	        var isGenerator = true;
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = true;
	        var params = this.parseFormalParameters();
	        this.context.allowYield = false;
	        var method = this.parsePropertyMethod(params);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, params.params, method, isGenerator));
	    };
	    // https://tc39.github.io/ecma262/#sec-generator-function-definitions
	    Parser.prototype.isStartOfExpression = function () {
	        var start = true;
	        var value = this.lookahead.value;
	        switch (this.lookahead.type) {
	            case 7 /* Punctuator */:
	                start = (value === '[') || (value === '(') || (value === '{') ||
	                    (value === '+') || (value === '-') ||
	                    (value === '!') || (value === '~') ||
	                    (value === '++') || (value === '--') ||
	                    (value === '/') || (value === '/='); // regular expression literal
	                break;
	            case 4 /* Keyword */:
	                start = (value === 'class') || (value === 'delete') ||
	                    (value === 'function') || (value === 'let') || (value === 'new') ||
	                    (value === 'super') || (value === 'this') || (value === 'typeof') ||
	                    (value === 'void') || (value === 'yield');
	                break;
	            default:
	                break;
	        }
	        return start;
	    };
	    Parser.prototype.parseYieldExpression = function () {
	        var node = this.createNode();
	        this.expectKeyword('yield');
	        var argument = null;
	        var delegate = false;
	        if (!this.hasLineTerminator) {
	            var previousAllowYield = this.context.allowYield;
	            this.context.allowYield = false;
	            delegate = this.match('*');
	            if (delegate) {
	                this.nextToken();
	                argument = this.parseAssignmentExpression();
	            }
	            else if (this.isStartOfExpression()) {
	                argument = this.parseAssignmentExpression();
	            }
	            this.context.allowYield = previousAllowYield;
	        }
	        return this.finalize(node, new Node.YieldExpression(argument, delegate));
	    };
	    // https://tc39.github.io/ecma262/#sec-class-definitions
	    Parser.prototype.parseClassElement = function (hasConstructor) {
	        var token = this.lookahead;
	        var node = this.createNode();
	        var kind = '';
	        var key = null;
	        var value = null;
	        var computed = false;
	        var method = false;
	        var isStatic = false;
	        var isAsync = false;
	        if (this.match('*')) {
	            this.nextToken();
	        }
	        else {
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            var id = key;
	            if (id.name === 'static' && (this.qualifiedPropertyName(this.lookahead) || this.match('*'))) {
	                token = this.lookahead;
	                isStatic = true;
	                computed = this.match('[');
	                if (this.match('*')) {
	                    this.nextToken();
	                }
	                else {
	                    key = this.parseObjectPropertyKey();
	                }
	            }
	            if ((token.type === 3 /* Identifier */) && !this.hasLineTerminator && (token.value === 'async')) {
	                var punctuator = this.lookahead.value;
	                if (punctuator !== ':' && punctuator !== '(' && punctuator !== '*') {
	                    isAsync = true;
	                    token = this.lookahead;
	                    key = this.parseObjectPropertyKey();
	                    if (token.type === 3 /* Identifier */ && token.value === 'constructor') {
	                        this.tolerateUnexpectedToken(token, messages_1.Messages.ConstructorIsAsync);
	                    }
	                }
	            }
	        }
	        var lookaheadPropertyKey = this.qualifiedPropertyName(this.lookahead);
	        if (token.type === 3 /* Identifier */) {
	            if (token.value === 'get' && lookaheadPropertyKey) {
	                kind = 'get';
	                computed = this.match('[');
	                key = this.parseObjectPropertyKey();
	                this.context.allowYield = false;
	                value = this.parseGetterMethod();
	            }
	            else if (token.value === 'set' && lookaheadPropertyKey) {
	                kind = 'set';
	                computed = this.match('[');
	                key = this.parseObjectPropertyKey();
	                value = this.parseSetterMethod();
	            }
	        }
	        else if (token.type === 7 /* Punctuator */ && token.value === '*' && lookaheadPropertyKey) {
	            kind = 'init';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            value = this.parseGeneratorMethod();
	            method = true;
	        }
	        if (!kind && key && this.match('(')) {
	            kind = 'init';
	            value = isAsync ? this.parsePropertyMethodAsyncFunction() : this.parsePropertyMethodFunction();
	            method = true;
	        }
	        if (!kind) {
	            this.throwUnexpectedToken(this.lookahead);
	        }
	        if (kind === 'init') {
	            kind = 'method';
	        }
	        if (!computed) {
	            if (isStatic && this.isPropertyKey(key, 'prototype')) {
	                this.throwUnexpectedToken(token, messages_1.Messages.StaticPrototype);
	            }
	            if (!isStatic && this.isPropertyKey(key, 'constructor')) {
	                if (kind !== 'method' || !method || (value && value.generator)) {
	                    this.throwUnexpectedToken(token, messages_1.Messages.ConstructorSpecialMethod);
	                }
	                if (hasConstructor.value) {
	                    this.throwUnexpectedToken(token, messages_1.Messages.DuplicateConstructor);
	                }
	                else {
	                    hasConstructor.value = true;
	                }
	                kind = 'constructor';
	            }
	        }
	        return this.finalize(node, new Node.MethodDefinition(key, computed, value, kind, isStatic));
	    };
	    Parser.prototype.parseClassElementList = function () {
	        var body = [];
	        var hasConstructor = { value: false };
	        this.expect('{');
	        while (!this.match('}')) {
	            if (this.match(';')) {
	                this.nextToken();
	            }
	            else {
	                body.push(this.parseClassElement(hasConstructor));
	            }
	        }
	        this.expect('}');
	        return body;
	    };
	    Parser.prototype.parseClassBody = function () {
	        var node = this.createNode();
	        var elementList = this.parseClassElementList();
	        return this.finalize(node, new Node.ClassBody(elementList));
	    };
	    Parser.prototype.parseClassDeclaration = function (identifierIsOptional) {
	        var node = this.createNode();
	        var previousStrict = this.context.strict;
	        this.context.strict = true;
	        this.expectKeyword('class');
	        var id = (identifierIsOptional && (this.lookahead.type !== 3 /* Identifier */)) ? null : this.parseVariableIdentifier();
	        var superClass = null;
	        if (this.matchKeyword('extends')) {
	            this.nextToken();
	            superClass = this.isolateCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
	        }
	        var classBody = this.parseClassBody();
	        this.context.strict = previousStrict;
	        return this.finalize(node, new Node.ClassDeclaration(id, superClass, classBody));
	    };
	    Parser.prototype.parseClassExpression = function () {
	        var node = this.createNode();
	        var previousStrict = this.context.strict;
	        this.context.strict = true;
	        this.expectKeyword('class');
	        var id = (this.lookahead.type === 3 /* Identifier */) ? this.parseVariableIdentifier() : null;
	        var superClass = null;
	        if (this.matchKeyword('extends')) {
	            this.nextToken();
	            superClass = this.isolateCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
	        }
	        var classBody = this.parseClassBody();
	        this.context.strict = previousStrict;
	        return this.finalize(node, new Node.ClassExpression(id, superClass, classBody));
	    };
	    // https://tc39.github.io/ecma262/#sec-scripts
	    // https://tc39.github.io/ecma262/#sec-modules
	    Parser.prototype.parseModule = function () {
	        this.context.strict = true;
	        this.context.isModule = true;
	        this.scanner.isModule = true;
	        var node = this.createNode();
	        var body = this.parseDirectivePrologues();
	        while (this.lookahead.type !== 2 /* EOF */) {
	            body.push(this.parseStatementListItem());
	        }
	        return this.finalize(node, new Node.Module(body));
	    };
	    Parser.prototype.parseScript = function () {
	        var node = this.createNode();
	        var body = this.parseDirectivePrologues();
	        while (this.lookahead.type !== 2 /* EOF */) {
	            body.push(this.parseStatementListItem());
	        }
	        return this.finalize(node, new Node.Script(body));
	    };
	    // https://tc39.github.io/ecma262/#sec-imports
	    Parser.prototype.parseModuleSpecifier = function () {
	        var node = this.createNode();
	        if (this.lookahead.type !== 8 /* StringLiteral */) {
	            this.throwError(messages_1.Messages.InvalidModuleSpecifier);
	        }
	        var token = this.nextToken();
	        var raw = this.getTokenRaw(token);
	        return this.finalize(node, new Node.Literal(token.value, raw));
	    };
	    // import {<foo as bar>} ...;
	    Parser.prototype.parseImportSpecifier = function () {
	        var node = this.createNode();
	        var imported;
	        var local;
	        if (this.lookahead.type === 3 /* Identifier */) {
	            imported = this.parseVariableIdentifier();
	            local = imported;
	            if (this.matchContextualKeyword('as')) {
	                this.nextToken();
	                local = this.parseVariableIdentifier();
	            }
	        }
	        else {
	            imported = this.parseIdentifierName();
	            local = imported;
	            if (this.matchContextualKeyword('as')) {
	                this.nextToken();
	                local = this.parseVariableIdentifier();
	            }
	            else {
	                this.throwUnexpectedToken(this.nextToken());
	            }
	        }
	        return this.finalize(node, new Node.ImportSpecifier(local, imported));
	    };
	    // {foo, bar as bas}
	    Parser.prototype.parseNamedImports = function () {
	        this.expect('{');
	        var specifiers = [];
	        while (!this.match('}')) {
	            specifiers.push(this.parseImportSpecifier());
	            if (!this.match('}')) {
	                this.expect(',');
	            }
	        }
	        this.expect('}');
	        return specifiers;
	    };
	    // import <foo> ...;
	    Parser.prototype.parseImportDefaultSpecifier = function () {
	        var node = this.createNode();
	        var local = this.parseIdentifierName();
	        return this.finalize(node, new Node.ImportDefaultSpecifier(local));
	    };
	    // import <* as foo> ...;
	    Parser.prototype.parseImportNamespaceSpecifier = function () {
	        var node = this.createNode();
	        this.expect('*');
	        if (!this.matchContextualKeyword('as')) {
	            this.throwError(messages_1.Messages.NoAsAfterImportNamespace);
	        }
	        this.nextToken();
	        var local = this.parseIdentifierName();
	        return this.finalize(node, new Node.ImportNamespaceSpecifier(local));
	    };
	    Parser.prototype.parseImportDeclaration = function () {
	        if (this.context.inFunctionBody) {
	            this.throwError(messages_1.Messages.IllegalImportDeclaration);
	        }
	        var node = this.createNode();
	        this.expectKeyword('import');
	        var src;
	        var specifiers = [];
	        if (this.lookahead.type === 8 /* StringLiteral */) {
	            // import 'foo';
	            src = this.parseModuleSpecifier();
	        }
	        else {
	            if (this.match('{')) {
	                // import {bar}
	                specifiers = specifiers.concat(this.parseNamedImports());
	            }
	            else if (this.match('*')) {
	                // import * as foo
	                specifiers.push(this.parseImportNamespaceSpecifier());
	            }
	            else if (this.isIdentifierName(this.lookahead) && !this.matchKeyword('default')) {
	                // import foo
	                specifiers.push(this.parseImportDefaultSpecifier());
	                if (this.match(',')) {
	                    this.nextToken();
	                    if (this.match('*')) {
	                        // import foo, * as foo
	                        specifiers.push(this.parseImportNamespaceSpecifier());
	                    }
	                    else if (this.match('{')) {
	                        // import foo, {bar}
	                        specifiers = specifiers.concat(this.parseNamedImports());
	                    }
	                    else {
	                        this.throwUnexpectedToken(this.lookahead);
	                    }
	                }
	            }
	            else {
	                this.throwUnexpectedToken(this.nextToken());
	            }
	            if (!this.matchContextualKeyword('from')) {
	                var message = this.lookahead.value ? messages_1.Messages.UnexpectedToken : messages_1.Messages.MissingFromClause;
	                this.throwError(message, this.lookahead.value);
	            }
	            this.nextToken();
	            src = this.parseModuleSpecifier();
	        }
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ImportDeclaration(specifiers, src));
	    };
	    // https://tc39.github.io/ecma262/#sec-exports
	    Parser.prototype.parseExportSpecifier = function () {
	        var node = this.createNode();
	        var local = this.parseIdentifierName();
	        var exported = local;
	        if (this.matchContextualKeyword('as')) {
	            this.nextToken();
	            exported = this.parseIdentifierName();
	        }
	        return this.finalize(node, new Node.ExportSpecifier(local, exported));
	    };
	    Parser.prototype.parseExportDeclaration = function () {
	        if (this.context.inFunctionBody) {
	            this.throwError(messages_1.Messages.IllegalExportDeclaration);
	        }
	        var node = this.createNode();
	        this.expectKeyword('export');
	        var exportDeclaration;
	        if (this.matchKeyword('default')) {
	            // export default ...
	            this.nextToken();
	            if (this.matchKeyword('function')) {
	                // export default function foo () {}
	                // export default function () {}
	                var declaration = this.parseFunctionDeclaration(true);
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	            else if (this.matchKeyword('class')) {
	                // export default class foo {}
	                var declaration = this.parseClassDeclaration(true);
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	            else if (this.matchContextualKeyword('async')) {
	                // export default async function f () {}
	                // export default async function () {}
	                // export default async x => x
	                var declaration = this.matchAsyncFunction() ? this.parseFunctionDeclaration(true) : this.parseAssignmentExpression();
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	            else {
	                if (this.matchContextualKeyword('from')) {
	                    this.throwError(messages_1.Messages.UnexpectedToken, this.lookahead.value);
	                }
	                // export default {};
	                // export default [];
	                // export default (1 + 2);
	                var declaration = this.match('{') ? this.parseObjectInitializer() :
	                    this.match('[') ? this.parseArrayInitializer() : this.parseAssignmentExpression();
	                this.consumeSemicolon();
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	        }
	        else if (this.match('*')) {
	            // export * from 'foo';
	            this.nextToken();
	            if (!this.matchContextualKeyword('from')) {
	                var message = this.lookahead.value ? messages_1.Messages.UnexpectedToken : messages_1.Messages.MissingFromClause;
	                this.throwError(message, this.lookahead.value);
	            }
	            this.nextToken();
	            var src = this.parseModuleSpecifier();
	            this.consumeSemicolon();
	            exportDeclaration = this.finalize(node, new Node.ExportAllDeclaration(src));
	        }
	        else if (this.lookahead.type === 4 /* Keyword */) {
	            // export var f = 1;
	            var declaration = void 0;
	            switch (this.lookahead.value) {
	                case 'let':
	                case 'const':
	                    declaration = this.parseLexicalDeclaration({ inFor: false });
	                    break;
	                case 'var':
	                case 'class':
	                case 'function':
	                    declaration = this.parseStatementListItem();
	                    break;
	                default:
	                    this.throwUnexpectedToken(this.lookahead);
	            }
	            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(declaration, [], null));
	        }
	        else if (this.matchAsyncFunction()) {
	            var declaration = this.parseFunctionDeclaration();
	            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(declaration, [], null));
	        }
	        else {
	            var specifiers = [];
	            var source = null;
	            var isExportFromIdentifier = false;
	            this.expect('{');
	            while (!this.match('}')) {
	                isExportFromIdentifier = isExportFromIdentifier || this.matchKeyword('default');
	                specifiers.push(this.parseExportSpecifier());
	                if (!this.match('}')) {
	                    this.expect(',');
	                }
	            }
	            this.expect('}');
	            if (this.matchContextualKeyword('from')) {
	                // export {default} from 'foo';
	                // export {foo} from 'foo';
	                this.nextToken();
	                source = this.parseModuleSpecifier();
	                this.consumeSemicolon();
	            }
	            else if (isExportFromIdentifier) {
	                // export {default}; // missing fromClause
	                var message = this.lookahead.value ? messages_1.Messages.UnexpectedToken : messages_1.Messages.MissingFromClause;
	                this.throwError(message, this.lookahead.value);
	            }
	            else {
	                // export {foo};
	                this.consumeSemicolon();
	            }
	            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(null, specifiers, source));
	        }
	        return exportDeclaration;
	    };
	    return Parser;
	}());
	exports.Parser = Parser;


/***/ },
/* 9 */
/***/ function(module, exports) {

	"use strict";
	// Ensure the condition is true, otherwise throw an error.
	// This is only to have a better contract semantic, i.e. another safety net
	// to catch a logic error. The condition shall be fulfilled in normal case.
	// Do NOT use this to enforce a certain condition on any user input.
	Object.defineProperty(exports, "__esModule", { value: true });
	function assert(condition, message) {
	    /* istanbul ignore if */
	    if (!condition) {
	        throw new Error('ASSERT: ' + message);
	    }
	}
	exports.assert = assert;


/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	/* tslint:disable:max-classes-per-file */
	Object.defineProperty(exports, "__esModule", { value: true });
	var ErrorHandler = (function () {
	    function ErrorHandler() {
	        this.errors = [];
	        this.tolerant = false;
	    }
	    ErrorHandler.prototype.recordError = function (error) {
	        this.errors.push(error);
	    };
	    ErrorHandler.prototype.tolerate = function (error) {
	        if (this.tolerant) {
	            this.recordError(error);
	        }
	        else {
	            throw error;
	        }
	    };
	    ErrorHandler.prototype.constructError = function (msg, column) {
	        var error = new Error(msg);
	        try {
	            throw error;
	        }
	        catch (base) {
	            /* istanbul ignore else */
	            if (Object.create && Object.defineProperty) {
	                error = Object.create(base);
	                Object.defineProperty(error, 'column', { value: column });
	            }
	        }
	        /* istanbul ignore next */
	        return error;
	    };
	    ErrorHandler.prototype.createError = function (index, line, col, description) {
	        var msg = 'Line ' + line + ': ' + description;
	        var error = this.constructError(msg, col);
	        error.index = index;
	        error.lineNumber = line;
	        error.description = description;
	        return error;
	    };
	    ErrorHandler.prototype.throwError = function (index, line, col, description) {
	        throw this.createError(index, line, col, description);
	    };
	    ErrorHandler.prototype.tolerateError = function (index, line, col, description) {
	        var error = this.createError(index, line, col, description);
	        if (this.tolerant) {
	            this.recordError(error);
	        }
	        else {
	            throw error;
	        }
	    };
	    return ErrorHandler;
	}());
	exports.ErrorHandler = ErrorHandler;


/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	// Error messages should be identical to V8.
	exports.Messages = {
	    BadGetterArity: 'Getter must not have any formal parameters',
	    BadSetterArity: 'Setter must have exactly one formal parameter',
	    BadSetterRestParameter: 'Setter function argument must not be a rest parameter',
	    ConstructorIsAsync: 'Class constructor may not be an async method',
	    ConstructorSpecialMethod: 'Class constructor may not be an accessor',
	    DeclarationMissingInitializer: 'Missing initializer in %0 declaration',
	    DefaultRestParameter: 'Unexpected token =',
	    DuplicateBinding: 'Duplicate binding %0',
	    DuplicateConstructor: 'A class may only have one constructor',
	    DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
	    ForInOfLoopInitializer: '%0 loop variable declaration may not have an initializer',
	    GeneratorInLegacyContext: 'Generator declarations are not allowed in legacy contexts',
	    IllegalBreak: 'Illegal break statement',
	    IllegalContinue: 'Illegal continue statement',
	    IllegalExportDeclaration: 'Unexpected token',
	    IllegalImportDeclaration: 'Unexpected token',
	    IllegalLanguageModeDirective: 'Illegal \'use strict\' directive in function with non-simple parameter list',
	    IllegalReturn: 'Illegal return statement',
	    InvalidEscapedReservedWord: 'Keyword must not contain escaped characters',
	    InvalidHexEscapeSequence: 'Invalid hexadecimal escape sequence',
	    InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
	    InvalidLHSInForIn: 'Invalid left-hand side in for-in',
	    InvalidLHSInForLoop: 'Invalid left-hand side in for-loop',
	    InvalidModuleSpecifier: 'Unexpected token',
	    InvalidRegExp: 'Invalid regular expression',
	    LetInLexicalBinding: 'let is disallowed as a lexically bound name',
	    MissingFromClause: 'Unexpected token',
	    MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
	    NewlineAfterThrow: 'Illegal newline after throw',
	    NoAsAfterImportNamespace: 'Unexpected token',
	    NoCatchOrFinally: 'Missing catch or finally after try',
	    ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
	    Redeclaration: '%0 \'%1\' has already been declared',
	    StaticPrototype: 'Classes may not have static property named prototype',
	    StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
	    StrictDelete: 'Delete of an unqualified identifier in strict mode.',
	    StrictFunction: 'In strict mode code, functions can only be declared at top level or inside a block',
	    StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
	    StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
	    StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
	    StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
	    StrictModeWith: 'Strict mode code may not include a with statement',
	    StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
	    StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
	    StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
	    StrictReservedWord: 'Use of future reserved word in strict mode',
	    StrictVarName: 'Variable name may not be eval or arguments in strict mode',
	    TemplateOctalLiteral: 'Octal literals are not allowed in template strings.',
	    UnexpectedEOS: 'Unexpected end of input',
	    UnexpectedIdentifier: 'Unexpected identifier',
	    UnexpectedNumber: 'Unexpected number',
	    UnexpectedReserved: 'Unexpected reserved word',
	    UnexpectedString: 'Unexpected string',
	    UnexpectedTemplate: 'Unexpected quasi %0',
	    UnexpectedToken: 'Unexpected token %0',
	    UnexpectedTokenIllegal: 'Unexpected token ILLEGAL',
	    UnknownLabel: 'Undefined label \'%0\'',
	    UnterminatedRegExp: 'Invalid regular expression: missing /'
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var assert_1 = __webpack_require__(9);
	var character_1 = __webpack_require__(4);
	var messages_1 = __webpack_require__(11);
	function hexValue(ch) {
	    return '0123456789abcdef'.indexOf(ch.toLowerCase());
	}
	function octalValue(ch) {
	    return '01234567'.indexOf(ch);
	}
	var Scanner = (function () {
	    function Scanner(code, handler) {
	        this.source = code;
	        this.errorHandler = handler;
	        this.trackComment = false;
	        this.isModule = false;
	        this.length = code.length;
	        this.index = 0;
	        this.lineNumber = (code.length > 0) ? 1 : 0;
	        this.lineStart = 0;
	        this.curlyStack = [];
	    }
	    Scanner.prototype.saveState = function () {
	        return {
	            index: this.index,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart
	        };
	    };
	    Scanner.prototype.restoreState = function (state) {
	        this.index = state.index;
	        this.lineNumber = state.lineNumber;
	        this.lineStart = state.lineStart;
	    };
	    Scanner.prototype.eof = function () {
	        return this.index >= this.length;
	    };
	    Scanner.prototype.throwUnexpectedToken = function (message) {
	        if (message === void 0) { message = messages_1.Messages.UnexpectedTokenIllegal; }
	        return this.errorHandler.throwError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
	    };
	    Scanner.prototype.tolerateUnexpectedToken = function (message) {
	        if (message === void 0) { message = messages_1.Messages.UnexpectedTokenIllegal; }
	        this.errorHandler.tolerateError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
	    };
	    // https://tc39.github.io/ecma262/#sec-comments
	    Scanner.prototype.skipSingleLineComment = function (offset) {
	        var comments = [];
	        var start, loc;
	        if (this.trackComment) {
	            comments = [];
	            start = this.index - offset;
	            loc = {
	                start: {
	                    line: this.lineNumber,
	                    column: this.index - this.lineStart - offset
	                },
	                end: {}
	            };
	        }
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            ++this.index;
	            if (character_1.Character.isLineTerminator(ch)) {
	                if (this.trackComment) {
	                    loc.end = {
	                        line: this.lineNumber,
	                        column: this.index - this.lineStart - 1
	                    };
	                    var entry = {
	                        multiLine: false,
	                        slice: [start + offset, this.index - 1],
	                        range: [start, this.index - 1],
	                        loc: loc
	                    };
	                    comments.push(entry);
	                }
	                if (ch === 13 && this.source.charCodeAt(this.index) === 10) {
	                    ++this.index;
	                }
	                ++this.lineNumber;
	                this.lineStart = this.index;
	                return comments;
	            }
	        }
	        if (this.trackComment) {
	            loc.end = {
	                line: this.lineNumber,
	                column: this.index - this.lineStart
	            };
	            var entry = {
	                multiLine: false,
	                slice: [start + offset, this.index],
	                range: [start, this.index],
	                loc: loc
	            };
	            comments.push(entry);
	        }
	        return comments;
	    };
	    Scanner.prototype.skipMultiLineComment = function () {
	        var comments = [];
	        var start, loc;
	        if (this.trackComment) {
	            comments = [];
	            start = this.index - 2;
	            loc = {
	                start: {
	                    line: this.lineNumber,
	                    column: this.index - this.lineStart - 2
	                },
	                end: {}
	            };
	        }
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            if (character_1.Character.isLineTerminator(ch)) {
	                if (ch === 0x0D && this.source.charCodeAt(this.index + 1) === 0x0A) {
	                    ++this.index;
	                }
	                ++this.lineNumber;
	                ++this.index;
	                this.lineStart = this.index;
	            }
	            else if (ch === 0x2A) {
	                // Block comment ends with '*/'.
	                if (this.source.charCodeAt(this.index + 1) === 0x2F) {
	                    this.index += 2;
	                    if (this.trackComment) {
	                        loc.end = {
	                            line: this.lineNumber,
	                            column: this.index - this.lineStart
	                        };
	                        var entry = {
	                            multiLine: true,
	                            slice: [start + 2, this.index - 2],
	                            range: [start, this.index],
	                            loc: loc
	                        };
	                        comments.push(entry);
	                    }
	                    return comments;
	                }
	                ++this.index;
	            }
	            else {
	                ++this.index;
	            }
	        }
	        // Ran off the end of the file - the whole thing is a comment
	        if (this.trackComment) {
	            loc.end = {
	                line: this.lineNumber,
	                column: this.index - this.lineStart
	            };
	            var entry = {
	                multiLine: true,
	                slice: [start + 2, this.index],
	                range: [start, this.index],
	                loc: loc
	            };
	            comments.push(entry);
	        }
	        this.tolerateUnexpectedToken();
	        return comments;
	    };
	    Scanner.prototype.scanComments = function () {
	        var comments;
	        if (this.trackComment) {
	            comments = [];
	        }
	        var start = (this.index === 0);
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            if (character_1.Character.isWhiteSpace(ch)) {
	                ++this.index;
	            }
	            else if (character_1.Character.isLineTerminator(ch)) {
	                ++this.index;
	                if (ch === 0x0D && this.source.charCodeAt(this.index) === 0x0A) {
	                    ++this.index;
	                }
	                ++this.lineNumber;
	                this.lineStart = this.index;
	                start = true;
	            }
	            else if (ch === 0x2F) {
	                ch = this.source.charCodeAt(this.index + 1);
	                if (ch === 0x2F) {
	                    this.index += 2;
	                    var comment = this.skipSingleLineComment(2);
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                    start = true;
	                }
	                else if (ch === 0x2A) {
	                    this.index += 2;
	                    var comment = this.skipMultiLineComment();
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                }
	                else {
	                    break;
	                }
	            }
	            else if (start && ch === 0x2D) {
	                // U+003E is '>'
	                if ((this.source.charCodeAt(this.index + 1) === 0x2D) && (this.source.charCodeAt(this.index + 2) === 0x3E)) {
	                    // '-->' is a single-line comment
	                    this.index += 3;
	                    var comment = this.skipSingleLineComment(3);
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                }
	                else {
	                    break;
	                }
	            }
	            else if (ch === 0x3C && !this.isModule) {
	                if (this.source.slice(this.index + 1, this.index + 4) === '!--') {
	                    this.index += 4; // `<!--`
	                    var comment = this.skipSingleLineComment(4);
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                }
	                else {
	                    break;
	                }
	            }
	            else {
	                break;
	            }
	        }
	        return comments;
	    };
	    // https://tc39.github.io/ecma262/#sec-future-reserved-words
	    Scanner.prototype.isFutureReservedWord = function (id) {
	        switch (id) {
	            case 'enum':
	            case 'export':
	            case 'import':
	            case 'super':
	                return true;
	            default:
	                return false;
	        }
	    };
	    Scanner.prototype.isStrictModeReservedWord = function (id) {
	        switch (id) {
	            case 'implements':
	            case 'interface':
	            case 'package':
	            case 'private':
	            case 'protected':
	            case 'public':
	            case 'static':
	            case 'yield':
	            case 'let':
	                return true;
	            default:
	                return false;
	        }
	    };
	    Scanner.prototype.isRestrictedWord = function (id) {
	        return id === 'eval' || id === 'arguments';
	    };
	    // https://tc39.github.io/ecma262/#sec-keywords
	    Scanner.prototype.isKeyword = function (id) {
	        switch (id.length) {
	            case 2:
	                return (id === 'if') || (id === 'in') || (id === 'do');
	            case 3:
	                return (id === 'var') || (id === 'for') || (id === 'new') ||
	                    (id === 'try') || (id === 'let');
	            case 4:
	                return (id === 'this') || (id === 'else') || (id === 'case') ||
	                    (id === 'void') || (id === 'with') || (id === 'enum');
	            case 5:
	                return (id === 'while') || (id === 'break') || (id === 'catch') ||
	                    (id === 'throw') || (id === 'const') || (id === 'yield') ||
	                    (id === 'class') || (id === 'super');
	            case 6:
	                return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
	                    (id === 'switch') || (id === 'export') || (id === 'import');
	            case 7:
	                return (id === 'default') || (id === 'finally') || (id === 'extends');
	            case 8:
	                return (id === 'function') || (id === 'continue') || (id === 'debugger');
	            case 10:
	                return (id === 'instanceof');
	            default:
	                return false;
	        }
	    };
	    Scanner.prototype.codePointAt = function (i) {
	        var cp = this.source.charCodeAt(i);
	        if (cp >= 0xD800 && cp <= 0xDBFF) {
	            var second = this.source.charCodeAt(i + 1);
	            if (second >= 0xDC00 && second <= 0xDFFF) {
	                var first = cp;
	                cp = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
	            }
	        }
	        return cp;
	    };
	    Scanner.prototype.scanHexEscape = function (prefix) {
	        var len = (prefix === 'u') ? 4 : 2;
	        var code = 0;
	        for (var i = 0; i < len; ++i) {
	            if (!this.eof() && character_1.Character.isHexDigit(this.source.charCodeAt(this.index))) {
	                code = code * 16 + hexValue(this.source[this.index++]);
	            }
	            else {
	                return null;
	            }
	        }
	        return String.fromCharCode(code);
	    };
	    Scanner.prototype.scanUnicodeCodePointEscape = function () {
	        var ch = this.source[this.index];
	        var code = 0;
	        // At least, one hex digit is required.
	        if (ch === '}') {
	            this.throwUnexpectedToken();
	        }
	        while (!this.eof()) {
	            ch = this.source[this.index++];
	            if (!character_1.Character.isHexDigit(ch.charCodeAt(0))) {
	                break;
	            }
	            code = code * 16 + hexValue(ch);
	        }
	        if (code > 0x10FFFF || ch !== '}') {
	            this.throwUnexpectedToken();
	        }
	        return character_1.Character.fromCodePoint(code);
	    };
	    Scanner.prototype.getIdentifier = function () {
	        var start = this.index++;
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            if (ch === 0x5C) {
	                // Blackslash (U+005C) marks Unicode escape sequence.
	                this.index = start;
	                return this.getComplexIdentifier();
	            }
	            else if (ch >= 0xD800 && ch < 0xDFFF) {
	                // Need to handle surrogate pairs.
	                this.index = start;
	                return this.getComplexIdentifier();
	            }
	            if (character_1.Character.isIdentifierPart(ch)) {
	                ++this.index;
	            }
	            else {
	                break;
	            }
	        }
	        return this.source.slice(start, this.index);
	    };
	    Scanner.prototype.getComplexIdentifier = function () {
	        var cp = this.codePointAt(this.index);
	        var id = character_1.Character.fromCodePoint(cp);
	        this.index += id.length;
	        // '\u' (U+005C, U+0075) denotes an escaped character.
	        var ch;
	        if (cp === 0x5C) {
	            if (this.source.charCodeAt(this.index) !== 0x75) {
	                this.throwUnexpectedToken();
	            }
	            ++this.index;
	            if (this.source[this.index] === '{') {
	                ++this.index;
	                ch = this.scanUnicodeCodePointEscape();
	            }
	            else {
	                ch = this.scanHexEscape('u');
	                if (ch === null || ch === '\\' || !character_1.Character.isIdentifierStart(ch.charCodeAt(0))) {
	                    this.throwUnexpectedToken();
	                }
	            }
	            id = ch;
	        }
	        while (!this.eof()) {
	            cp = this.codePointAt(this.index);
	            if (!character_1.Character.isIdentifierPart(cp)) {
	                break;
	            }
	            ch = character_1.Character.fromCodePoint(cp);
	            id += ch;
	            this.index += ch.length;
	            // '\u' (U+005C, U+0075) denotes an escaped character.
	            if (cp === 0x5C) {
	                id = id.substr(0, id.length - 1);
	                if (this.source.charCodeAt(this.index) !== 0x75) {
	                    this.throwUnexpectedToken();
	                }
	                ++this.index;
	                if (this.source[this.index] === '{') {
	                    ++this.index;
	                    ch = this.scanUnicodeCodePointEscape();
	                }
	                else {
	                    ch = this.scanHexEscape('u');
	                    if (ch === null || ch === '\\' || !character_1.Character.isIdentifierPart(ch.charCodeAt(0))) {
	                        this.throwUnexpectedToken();
	                    }
	                }
	                id += ch;
	            }
	        }
	        return id;
	    };
	    Scanner.prototype.octalToDecimal = function (ch) {
	        // \0 is not octal escape sequence
	        var octal = (ch !== '0');
	        var code = octalValue(ch);
	        if (!this.eof() && character_1.Character.isOctalDigit(this.source.charCodeAt(this.index))) {
	            octal = true;
	            code = code * 8 + octalValue(this.source[this.index++]);
	            // 3 digits are only allowed when string starts
	            // with 0, 1, 2, 3
	            if ('0123'.indexOf(ch) >= 0 && !this.eof() && character_1.Character.isOctalDigit(this.source.charCodeAt(this.index))) {
	                code = code * 8 + octalValue(this.source[this.index++]);
	            }
	        }
	        return {
	            code: code,
	            octal: octal
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-names-and-keywords
	    Scanner.prototype.scanIdentifier = function () {
	        var type;
	        var start = this.index;
	        // Backslash (U+005C) starts an escaped character.
	        var id = (this.source.charCodeAt(start) === 0x5C) ? this.getComplexIdentifier() : this.getIdentifier();
	        // There is no keyword or literal with only one character.
	        // Thus, it must be an identifier.
	        if (id.length === 1) {
	            type = 3 /* Identifier */;
	        }
	        else if (this.isKeyword(id)) {
	            type = 4 /* Keyword */;
	        }
	        else if (id === 'null') {
	            type = 5 /* NullLiteral */;
	        }
	        else if (id === 'true' || id === 'false') {
	            type = 1 /* BooleanLiteral */;
	        }
	        else {
	            type = 3 /* Identifier */;
	        }
	        if (type !== 3 /* Identifier */ && (start + id.length !== this.index)) {
	            var restore = this.index;
	            this.index = start;
	            this.tolerateUnexpectedToken(messages_1.Messages.InvalidEscapedReservedWord);
	            this.index = restore;
	        }
	        return {
	            type: type,
	            value: id,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-punctuators
	    Scanner.prototype.scanPunctuator = function () {
	        var start = this.index;
	        // Check for most common single-character punctuators.
	        var str = this.source[this.index];
	        switch (str) {
	            case '(':
	            case '{':
	                if (str === '{') {
	                    this.curlyStack.push('{');
	                }
	                ++this.index;
	                break;
	            case '.':
	                ++this.index;
	                if (this.source[this.index] === '.' && this.source[this.index + 1] === '.') {
	                    // Spread operator: ...
	                    this.index += 2;
	                    str = '...';
	                }
	                break;
	            case '}':
	                ++this.index;
	                this.curlyStack.pop();
	                break;
	            case ')':
	            case ';':
	            case ',':
	            case '[':
	            case ']':
	            case ':':
	            case '?':
	            case '~':
	                ++this.index;
	                break;
	            default:
	                // 4-character punctuator.
	                str = this.source.substr(this.index, 4);
	                if (str === '>>>=') {
	                    this.index += 4;
	                }
	                else {
	                    // 3-character punctuators.
	                    str = str.substr(0, 3);
	                    if (str === '===' || str === '!==' || str === '>>>' ||
	                        str === '<<=' || str === '>>=' || str === '**=') {
	                        this.index += 3;
	                    }
	                    else {
	                        // 2-character punctuators.
	                        str = str.substr(0, 2);
	                        if (str === '&&' || str === '||' || str === '==' || str === '!=' ||
	                            str === '+=' || str === '-=' || str === '*=' || str === '/=' ||
	                            str === '++' || str === '--' || str === '<<' || str === '>>' ||
	                            str === '&=' || str === '|=' || str === '^=' || str === '%=' ||
	                            str === '<=' || str === '>=' || str === '=>' || str === '**') {
	                            this.index += 2;
	                        }
	                        else {
	                            // 1-character punctuators.
	                            str = this.source[this.index];
	                            if ('<>=!+-*%&|^/'.indexOf(str) >= 0) {
	                                ++this.index;
	                            }
	                        }
	                    }
	                }
	        }
	        if (this.index === start) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 7 /* Punctuator */,
	            value: str,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-literals-numeric-literals
	    Scanner.prototype.scanHexLiteral = function (start) {
	        var num = '';
	        while (!this.eof()) {
	            if (!character_1.Character.isHexDigit(this.source.charCodeAt(this.index))) {
	                break;
	            }
	            num += this.source[this.index++];
	        }
	        if (num.length === 0) {
	            this.throwUnexpectedToken();
	        }
	        if (character_1.Character.isIdentifierStart(this.source.charCodeAt(this.index))) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseInt('0x' + num, 16),
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.scanBinaryLiteral = function (start) {
	        var num = '';
	        var ch;
	        while (!this.eof()) {
	            ch = this.source[this.index];
	            if (ch !== '0' && ch !== '1') {
	                break;
	            }
	            num += this.source[this.index++];
	        }
	        if (num.length === 0) {
	            // only 0b or 0B
	            this.throwUnexpectedToken();
	        }
	        if (!this.eof()) {
	            ch = this.source.charCodeAt(this.index);
	            /* istanbul ignore else */
	            if (character_1.Character.isIdentifierStart(ch) || character_1.Character.isDecimalDigit(ch)) {
	                this.throwUnexpectedToken();
	            }
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseInt(num, 2),
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.scanOctalLiteral = function (prefix, start) {
	        var num = '';
	        var octal = false;
	        if (character_1.Character.isOctalDigit(prefix.charCodeAt(0))) {
	            octal = true;
	            num = '0' + this.source[this.index++];
	        }
	        else {
	            ++this.index;
	        }
	        while (!this.eof()) {
	            if (!character_1.Character.isOctalDigit(this.source.charCodeAt(this.index))) {
	                break;
	            }
	            num += this.source[this.index++];
	        }
	        if (!octal && num.length === 0) {
	            // only 0o or 0O
	            this.throwUnexpectedToken();
	        }
	        if (character_1.Character.isIdentifierStart(this.source.charCodeAt(this.index)) || character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseInt(num, 8),
	            octal: octal,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.isImplicitOctalLiteral = function () {
	        // Implicit octal, unless there is a non-octal digit.
	        // (Annex B.1.1 on Numeric Literals)
	        for (var i = this.index + 1; i < this.length; ++i) {
	            var ch = this.source[i];
	            if (ch === '8' || ch === '9') {
	                return false;
	            }
	            if (!character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                return true;
	            }
	        }
	        return true;
	    };
	    Scanner.prototype.scanNumericLiteral = function () {
	        var start = this.index;
	        var ch = this.source[start];
	        assert_1.assert(character_1.Character.isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'), 'Numeric literal must start with a decimal digit or a decimal point');
	        var num = '';
	        if (ch !== '.') {
	            num = this.source[this.index++];
	            ch = this.source[this.index];
	            // Hex number starts with '0x'.
	            // Octal number starts with '0'.
	            // Octal number in ES6 starts with '0o'.
	            // Binary number in ES6 starts with '0b'.
	            if (num === '0') {
	                if (ch === 'x' || ch === 'X') {
	                    ++this.index;
	                    return this.scanHexLiteral(start);
	                }
	                if (ch === 'b' || ch === 'B') {
	                    ++this.index;
	                    return this.scanBinaryLiteral(start);
	                }
	                if (ch === 'o' || ch === 'O') {
	                    return this.scanOctalLiteral(ch, start);
	                }
	                if (ch && character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                    if (this.isImplicitOctalLiteral()) {
	                        return this.scanOctalLiteral(ch, start);
	                    }
	                }
	            }
	            while (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                num += this.source[this.index++];
	            }
	            ch = this.source[this.index];
	        }
	        if (ch === '.') {
	            num += this.source[this.index++];
	            while (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                num += this.source[this.index++];
	            }
	            ch = this.source[this.index];
	        }
	        if (ch === 'e' || ch === 'E') {
	            num += this.source[this.index++];
	            ch = this.source[this.index];
	            if (ch === '+' || ch === '-') {
	                num += this.source[this.index++];
	            }
	            if (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                while (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                    num += this.source[this.index++];
	                }
	            }
	            else {
	                this.throwUnexpectedToken();
	            }
	        }
	        if (character_1.Character.isIdentifierStart(this.source.charCodeAt(this.index))) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseFloat(num),
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-literals-string-literals
	    Scanner.prototype.scanStringLiteral = function () {
	        var start = this.index;
	        var quote = this.source[start];
	        assert_1.assert((quote === '\'' || quote === '"'), 'String literal must starts with a quote');
	        ++this.index;
	        var octal = false;
	        var str = '';
	        while (!this.eof()) {
	            var ch = this.source[this.index++];
	            if (ch === quote) {
	                quote = '';
	                break;
	            }
	            else if (ch === '\\') {
	                ch = this.source[this.index++];
	                if (!ch || !character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                    switch (ch) {
	                        case 'u':
	                            if (this.source[this.index] === '{') {
	                                ++this.index;
	                                str += this.scanUnicodeCodePointEscape();
	                            }
	                            else {
	                                var unescaped_1 = this.scanHexEscape(ch);
	                                if (unescaped_1 === null) {
	                                    this.throwUnexpectedToken();
	                                }
	                                str += unescaped_1;
	                            }
	                            break;
	                        case 'x':
	                            var unescaped = this.scanHexEscape(ch);
	                            if (unescaped === null) {
	                                this.throwUnexpectedToken(messages_1.Messages.InvalidHexEscapeSequence);
	                            }
	                            str += unescaped;
	                            break;
	                        case 'n':
	                            str += '\n';
	                            break;
	                        case 'r':
	                            str += '\r';
	                            break;
	                        case 't':
	                            str += '\t';
	                            break;
	                        case 'b':
	                            str += '\b';
	                            break;
	                        case 'f':
	                            str += '\f';
	                            break;
	                        case 'v':
	                            str += '\x0B';
	                            break;
	                        case '8':
	                        case '9':
	                            str += ch;
	                            this.tolerateUnexpectedToken();
	                            break;
	                        default:
	                            if (ch && character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                                var octToDec = this.octalToDecimal(ch);
	                                octal = octToDec.octal || octal;
	                                str += String.fromCharCode(octToDec.code);
	                            }
	                            else {
	                                str += ch;
	                            }
	                            break;
	                    }
	                }
	                else {
	                    ++this.lineNumber;
	                    if (ch === '\r' && this.source[this.index] === '\n') {
	                        ++this.index;
	                    }
	                    this.lineStart = this.index;
	                }
	            }
	            else if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                break;
	            }
	            else {
	                str += ch;
	            }
	        }
	        if (quote !== '') {
	            this.index = start;
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 8 /* StringLiteral */,
	            value: str,
	            octal: octal,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-template-literal-lexical-components
	    Scanner.prototype.scanTemplate = function () {
	        var cooked = '';
	        var terminated = false;
	        var start = this.index;
	        var head = (this.source[start] === '`');
	        var tail = false;
	        var rawOffset = 2;
	        ++this.index;
	        while (!this.eof()) {
	            var ch = this.source[this.index++];
	            if (ch === '`') {
	                rawOffset = 1;
	                tail = true;
	                terminated = true;
	                break;
	            }
	            else if (ch === '$') {
	                if (this.source[this.index] === '{') {
	                    this.curlyStack.push('${');
	                    ++this.index;
	                    terminated = true;
	                    break;
	                }
	                cooked += ch;
	            }
	            else if (ch === '\\') {
	                ch = this.source[this.index++];
	                if (!character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                    switch (ch) {
	                        case 'n':
	                            cooked += '\n';
	                            break;
	                        case 'r':
	                            cooked += '\r';
	                            break;
	                        case 't':
	                            cooked += '\t';
	                            break;
	                        case 'u':
	                            if (this.source[this.index] === '{') {
	                                ++this.index;
	                                cooked += this.scanUnicodeCodePointEscape();
	                            }
	                            else {
	                                var restore = this.index;
	                                var unescaped_2 = this.scanHexEscape(ch);
	                                if (unescaped_2 !== null) {
	                                    cooked += unescaped_2;
	                                }
	                                else {
	                                    this.index = restore;
	                                    cooked += ch;
	                                }
	                            }
	                            break;
	                        case 'x':
	                            var unescaped = this.scanHexEscape(ch);
	                            if (unescaped === null) {
	                                this.throwUnexpectedToken(messages_1.Messages.InvalidHexEscapeSequence);
	                            }
	                            cooked += unescaped;
	                            break;
	                        case 'b':
	                            cooked += '\b';
	                            break;
	                        case 'f':
	                            cooked += '\f';
	                            break;
	                        case 'v':
	                            cooked += '\v';
	                            break;
	                        default:
	                            if (ch === '0') {
	                                if (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                                    // Illegal: \01 \02 and so on
	                                    this.throwUnexpectedToken(messages_1.Messages.TemplateOctalLiteral);
	                                }
	                                cooked += '\0';
	                            }
	                            else if (character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                                // Illegal: \1 \2
	                                this.throwUnexpectedToken(messages_1.Messages.TemplateOctalLiteral);
	                            }
	                            else {
	                                cooked += ch;
	                            }
	                            break;
	                    }
	                }
	                else {
	                    ++this.lineNumber;
	                    if (ch === '\r' && this.source[this.index] === '\n') {
	                        ++this.index;
	                    }
	                    this.lineStart = this.index;
	                }
	            }
	            else if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                ++this.lineNumber;
	                if (ch === '\r' && this.source[this.index] === '\n') {
	                    ++this.index;
	                }
	                this.lineStart = this.index;
	                cooked += '\n';
	            }
	            else {
	                cooked += ch;
	            }
	        }
	        if (!terminated) {
	            this.throwUnexpectedToken();
	        }
	        if (!head) {
	            this.curlyStack.pop();
	        }
	        return {
	            type: 10 /* Template */,
	            value: this.source.slice(start + 1, this.index - rawOffset),
	            cooked: cooked,
	            head: head,
	            tail: tail,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-literals-regular-expression-literals
	    Scanner.prototype.testRegExp = function (pattern, flags) {
	        // The BMP character to use as a replacement for astral symbols when
	        // translating an ES6 "u"-flagged pattern to an ES5-compatible
	        // approximation.
	        // Note: replacing with '\uFFFF' enables false positives in unlikely
	        // scenarios. For example, `[\u{1044f}-\u{10440}]` is an invalid
	        // pattern that would not be detected by this substitution.
	        var astralSubstitute = '\uFFFF';
	        var tmp = pattern;
	        var self = this;
	        if (flags.indexOf('u') >= 0) {
	            tmp = tmp
	                .replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g, function ($0, $1, $2) {
	                var codePoint = parseInt($1 || $2, 16);
	                if (codePoint > 0x10FFFF) {
	                    self.throwUnexpectedToken(messages_1.Messages.InvalidRegExp);
	                }
	                if (codePoint <= 0xFFFF) {
	                    return String.fromCharCode(codePoint);
	                }
	                return astralSubstitute;
	            })
	                .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, astralSubstitute);
	        }
	        // First, detect invalid regular expressions.
	        try {
	            RegExp(tmp);
	        }
	        catch (e) {
	            this.throwUnexpectedToken(messages_1.Messages.InvalidRegExp);
	        }
	        // Return a regular expression object for this pattern-flag pair, or
	        // `null` in case the current environment doesn't support the flags it
	        // uses.
	        try {
	            return new RegExp(pattern, flags);
	        }
	        catch (exception) {
	            /* istanbul ignore next */
	            return null;
	        }
	    };
	    Scanner.prototype.scanRegExpBody = function () {
	        var ch = this.source[this.index];
	        assert_1.assert(ch === '/', 'Regular expression literal must start with a slash');
	        var str = this.source[this.index++];
	        var classMarker = false;
	        var terminated = false;
	        while (!this.eof()) {
	            ch = this.source[this.index++];
	            str += ch;
	            if (ch === '\\') {
	                ch = this.source[this.index++];
	                // https://tc39.github.io/ecma262/#sec-literals-regular-expression-literals
	                if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                    this.throwUnexpectedToken(messages_1.Messages.UnterminatedRegExp);
	                }
	                str += ch;
	            }
	            else if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                this.throwUnexpectedToken(messages_1.Messages.UnterminatedRegExp);
	            }
	            else if (classMarker) {
	                if (ch === ']') {
	                    classMarker = false;
	                }
	            }
	            else {
	                if (ch === '/') {
	                    terminated = true;
	                    break;
	                }
	                else if (ch === '[') {
	                    classMarker = true;
	                }
	            }
	        }
	        if (!terminated) {
	            this.throwUnexpectedToken(messages_1.Messages.UnterminatedRegExp);
	        }
	        // Exclude leading and trailing slash.
	        return str.substr(1, str.length - 2);
	    };
	    Scanner.prototype.scanRegExpFlags = function () {
	        var str = '';
	        var flags = '';
	        while (!this.eof()) {
	            var ch = this.source[this.index];
	            if (!character_1.Character.isIdentifierPart(ch.charCodeAt(0))) {
	                break;
	            }
	            ++this.index;
	            if (ch === '\\' && !this.eof()) {
	                ch = this.source[this.index];
	                if (ch === 'u') {
	                    ++this.index;
	                    var restore = this.index;
	                    var char = this.scanHexEscape('u');
	                    if (char !== null) {
	                        flags += char;
	                        for (str += '\\u'; restore < this.index; ++restore) {
	                            str += this.source[restore];
	                        }
	                    }
	                    else {
	                        this.index = restore;
	                        flags += 'u';
	                        str += '\\u';
	                    }
	                    this.tolerateUnexpectedToken();
	                }
	                else {
	                    str += '\\';
	                    this.tolerateUnexpectedToken();
	                }
	            }
	            else {
	                flags += ch;
	                str += ch;
	            }
	        }
	        return flags;
	    };
	    Scanner.prototype.scanRegExp = function () {
	        var start = this.index;
	        var pattern = this.scanRegExpBody();
	        var flags = this.scanRegExpFlags();
	        var value = this.testRegExp(pattern, flags);
	        return {
	            type: 9 /* RegularExpression */,
	            value: '',
	            pattern: pattern,
	            flags: flags,
	            regex: value,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.lex = function () {
	        if (this.eof()) {
	            return {
	                type: 2 /* EOF */,
	                value: '',
	                lineNumber: this.lineNumber,
	                lineStart: this.lineStart,
	                start: this.index,
	                end: this.index
	            };
	        }
	        var cp = this.source.charCodeAt(this.index);
	        if (character_1.Character.isIdentifierStart(cp)) {
	            return this.scanIdentifier();
	        }
	        // Very common: ( and ) and ;
	        if (cp === 0x28 || cp === 0x29 || cp === 0x3B) {
	            return this.scanPunctuator();
	        }
	        // String literal starts with single quote (U+0027) or double quote (U+0022).
	        if (cp === 0x27 || cp === 0x22) {
	            return this.scanStringLiteral();
	        }
	        // Dot (.) U+002E can also start a floating-point number, hence the need
	        // to check the next character.
	        if (cp === 0x2E) {
	            if (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index + 1))) {
	                return this.scanNumericLiteral();
	            }
	            return this.scanPunctuator();
	        }
	        if (character_1.Character.isDecimalDigit(cp)) {
	            return this.scanNumericLiteral();
	        }
	        // Template literals start with ` (U+0060) for template head
	        // or } (U+007D) for template middle or template tail.
	        if (cp === 0x60 || (cp === 0x7D && this.curlyStack[this.curlyStack.length - 1] === '${')) {
	            return this.scanTemplate();
	        }
	        // Possible identifier start in a surrogate pair.
	        if (cp >= 0xD800 && cp < 0xDFFF) {
	            if (character_1.Character.isIdentifierStart(this.codePointAt(this.index))) {
	                return this.scanIdentifier();
	            }
	        }
	        return this.scanPunctuator();
	    };
	    return Scanner;
	}());
	exports.Scanner = Scanner;


/***/ },
/* 13 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TokenName = {};
	exports.TokenName[1 /* BooleanLiteral */] = 'Boolean';
	exports.TokenName[2 /* EOF */] = '<end>';
	exports.TokenName[3 /* Identifier */] = 'Identifier';
	exports.TokenName[4 /* Keyword */] = 'Keyword';
	exports.TokenName[5 /* NullLiteral */] = 'Null';
	exports.TokenName[6 /* NumericLiteral */] = 'Numeric';
	exports.TokenName[7 /* Punctuator */] = 'Punctuator';
	exports.TokenName[8 /* StringLiteral */] = 'String';
	exports.TokenName[9 /* RegularExpression */] = 'RegularExpression';
	exports.TokenName[10 /* Template */] = 'Template';


/***/ },
/* 14 */
/***/ function(module, exports) {

	"use strict";
	// Generated by generate-xhtml-entities.js. DO NOT MODIFY!
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.XHTMLEntities = {
	    quot: '\u0022',
	    amp: '\u0026',
	    apos: '\u0027',
	    gt: '\u003E',
	    nbsp: '\u00A0',
	    iexcl: '\u00A1',
	    cent: '\u00A2',
	    pound: '\u00A3',
	    curren: '\u00A4',
	    yen: '\u00A5',
	    brvbar: '\u00A6',
	    sect: '\u00A7',
	    uml: '\u00A8',
	    copy: '\u00A9',
	    ordf: '\u00AA',
	    laquo: '\u00AB',
	    not: '\u00AC',
	    shy: '\u00AD',
	    reg: '\u00AE',
	    macr: '\u00AF',
	    deg: '\u00B0',
	    plusmn: '\u00B1',
	    sup2: '\u00B2',
	    sup3: '\u00B3',
	    acute: '\u00B4',
	    micro: '\u00B5',
	    para: '\u00B6',
	    middot: '\u00B7',
	    cedil: '\u00B8',
	    sup1: '\u00B9',
	    ordm: '\u00BA',
	    raquo: '\u00BB',
	    frac14: '\u00BC',
	    frac12: '\u00BD',
	    frac34: '\u00BE',
	    iquest: '\u00BF',
	    Agrave: '\u00C0',
	    Aacute: '\u00C1',
	    Acirc: '\u00C2',
	    Atilde: '\u00C3',
	    Auml: '\u00C4',
	    Aring: '\u00C5',
	    AElig: '\u00C6',
	    Ccedil: '\u00C7',
	    Egrave: '\u00C8',
	    Eacute: '\u00C9',
	    Ecirc: '\u00CA',
	    Euml: '\u00CB',
	    Igrave: '\u00CC',
	    Iacute: '\u00CD',
	    Icirc: '\u00CE',
	    Iuml: '\u00CF',
	    ETH: '\u00D0',
	    Ntilde: '\u00D1',
	    Ograve: '\u00D2',
	    Oacute: '\u00D3',
	    Ocirc: '\u00D4',
	    Otilde: '\u00D5',
	    Ouml: '\u00D6',
	    times: '\u00D7',
	    Oslash: '\u00D8',
	    Ugrave: '\u00D9',
	    Uacute: '\u00DA',
	    Ucirc: '\u00DB',
	    Uuml: '\u00DC',
	    Yacute: '\u00DD',
	    THORN: '\u00DE',
	    szlig: '\u00DF',
	    agrave: '\u00E0',
	    aacute: '\u00E1',
	    acirc: '\u00E2',
	    atilde: '\u00E3',
	    auml: '\u00E4',
	    aring: '\u00E5',
	    aelig: '\u00E6',
	    ccedil: '\u00E7',
	    egrave: '\u00E8',
	    eacute: '\u00E9',
	    ecirc: '\u00EA',
	    euml: '\u00EB',
	    igrave: '\u00EC',
	    iacute: '\u00ED',
	    icirc: '\u00EE',
	    iuml: '\u00EF',
	    eth: '\u00F0',
	    ntilde: '\u00F1',
	    ograve: '\u00F2',
	    oacute: '\u00F3',
	    ocirc: '\u00F4',
	    otilde: '\u00F5',
	    ouml: '\u00F6',
	    divide: '\u00F7',
	    oslash: '\u00F8',
	    ugrave: '\u00F9',
	    uacute: '\u00FA',
	    ucirc: '\u00FB',
	    uuml: '\u00FC',
	    yacute: '\u00FD',
	    thorn: '\u00FE',
	    yuml: '\u00FF',
	    OElig: '\u0152',
	    oelig: '\u0153',
	    Scaron: '\u0160',
	    scaron: '\u0161',
	    Yuml: '\u0178',
	    fnof: '\u0192',
	    circ: '\u02C6',
	    tilde: '\u02DC',
	    Alpha: '\u0391',
	    Beta: '\u0392',
	    Gamma: '\u0393',
	    Delta: '\u0394',
	    Epsilon: '\u0395',
	    Zeta: '\u0396',
	    Eta: '\u0397',
	    Theta: '\u0398',
	    Iota: '\u0399',
	    Kappa: '\u039A',
	    Lambda: '\u039B',
	    Mu: '\u039C',
	    Nu: '\u039D',
	    Xi: '\u039E',
	    Omicron: '\u039F',
	    Pi: '\u03A0',
	    Rho: '\u03A1',
	    Sigma: '\u03A3',
	    Tau: '\u03A4',
	    Upsilon: '\u03A5',
	    Phi: '\u03A6',
	    Chi: '\u03A7',
	    Psi: '\u03A8',
	    Omega: '\u03A9',
	    alpha: '\u03B1',
	    beta: '\u03B2',
	    gamma: '\u03B3',
	    delta: '\u03B4',
	    epsilon: '\u03B5',
	    zeta: '\u03B6',
	    eta: '\u03B7',
	    theta: '\u03B8',
	    iota: '\u03B9',
	    kappa: '\u03BA',
	    lambda: '\u03BB',
	    mu: '\u03BC',
	    nu: '\u03BD',
	    xi: '\u03BE',
	    omicron: '\u03BF',
	    pi: '\u03C0',
	    rho: '\u03C1',
	    sigmaf: '\u03C2',
	    sigma: '\u03C3',
	    tau: '\u03C4',
	    upsilon: '\u03C5',
	    phi: '\u03C6',
	    chi: '\u03C7',
	    psi: '\u03C8',
	    omega: '\u03C9',
	    thetasym: '\u03D1',
	    upsih: '\u03D2',
	    piv: '\u03D6',
	    ensp: '\u2002',
	    emsp: '\u2003',
	    thinsp: '\u2009',
	    zwnj: '\u200C',
	    zwj: '\u200D',
	    lrm: '\u200E',
	    rlm: '\u200F',
	    ndash: '\u2013',
	    mdash: '\u2014',
	    lsquo: '\u2018',
	    rsquo: '\u2019',
	    sbquo: '\u201A',
	    ldquo: '\u201C',
	    rdquo: '\u201D',
	    bdquo: '\u201E',
	    dagger: '\u2020',
	    Dagger: '\u2021',
	    bull: '\u2022',
	    hellip: '\u2026',
	    permil: '\u2030',
	    prime: '\u2032',
	    Prime: '\u2033',
	    lsaquo: '\u2039',
	    rsaquo: '\u203A',
	    oline: '\u203E',
	    frasl: '\u2044',
	    euro: '\u20AC',
	    image: '\u2111',
	    weierp: '\u2118',
	    real: '\u211C',
	    trade: '\u2122',
	    alefsym: '\u2135',
	    larr: '\u2190',
	    uarr: '\u2191',
	    rarr: '\u2192',
	    darr: '\u2193',
	    harr: '\u2194',
	    crarr: '\u21B5',
	    lArr: '\u21D0',
	    uArr: '\u21D1',
	    rArr: '\u21D2',
	    dArr: '\u21D3',
	    hArr: '\u21D4',
	    forall: '\u2200',
	    part: '\u2202',
	    exist: '\u2203',
	    empty: '\u2205',
	    nabla: '\u2207',
	    isin: '\u2208',
	    notin: '\u2209',
	    ni: '\u220B',
	    prod: '\u220F',
	    sum: '\u2211',
	    minus: '\u2212',
	    lowast: '\u2217',
	    radic: '\u221A',
	    prop: '\u221D',
	    infin: '\u221E',
	    ang: '\u2220',
	    and: '\u2227',
	    or: '\u2228',
	    cap: '\u2229',
	    cup: '\u222A',
	    int: '\u222B',
	    there4: '\u2234',
	    sim: '\u223C',
	    cong: '\u2245',
	    asymp: '\u2248',
	    ne: '\u2260',
	    equiv: '\u2261',
	    le: '\u2264',
	    ge: '\u2265',
	    sub: '\u2282',
	    sup: '\u2283',
	    nsub: '\u2284',
	    sube: '\u2286',
	    supe: '\u2287',
	    oplus: '\u2295',
	    otimes: '\u2297',
	    perp: '\u22A5',
	    sdot: '\u22C5',
	    lceil: '\u2308',
	    rceil: '\u2309',
	    lfloor: '\u230A',
	    rfloor: '\u230B',
	    loz: '\u25CA',
	    spades: '\u2660',
	    clubs: '\u2663',
	    hearts: '\u2665',
	    diams: '\u2666',
	    lang: '\u27E8',
	    rang: '\u27E9'
	};


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var error_handler_1 = __webpack_require__(10);
	var scanner_1 = __webpack_require__(12);
	var token_1 = __webpack_require__(13);
	var Reader = (function () {
	    function Reader() {
	        this.values = [];
	        this.curly = this.paren = -1;
	    }
	    // A function following one of those tokens is an expression.
	    Reader.prototype.beforeFunctionExpression = function (t) {
	        return ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
	            'return', 'case', 'delete', 'throw', 'void',
	            // assignment operators
	            '=', '+=', '-=', '*=', '**=', '/=', '%=', '<<=', '>>=', '>>>=',
	            '&=', '|=', '^=', ',',
	            // binary/unary operators
	            '+', '-', '*', '**', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
	            '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
	            '<=', '<', '>', '!=', '!=='].indexOf(t) >= 0;
	    };
	    // Determine if forward slash (/) is an operator or part of a regular expression
	    // https://github.com/mozilla/sweet.js/wiki/design
	    Reader.prototype.isRegexStart = function () {
	        var previous = this.values[this.values.length - 1];
	        var regex = (previous !== null);
	        switch (previous) {
	            case 'this':
	            case ']':
	                regex = false;
	                break;
	            case ')':
	                var keyword = this.values[this.paren - 1];
	                regex = (keyword === 'if' || keyword === 'while' || keyword === 'for' || keyword === 'with');
	                break;
	            case '}':
	                // Dividing a function by anything makes little sense,
	                // but we have to check for that.
	                regex = false;
	                if (this.values[this.curly - 3] === 'function') {
	                    // Anonymous function, e.g. function(){} /42
	                    var check = this.values[this.curly - 4];
	                    regex = check ? !this.beforeFunctionExpression(check) : false;
	                }
	                else if (this.values[this.curly - 4] === 'function') {
	                    // Named function, e.g. function f(){} /42/
	                    var check = this.values[this.curly - 5];
	                    regex = check ? !this.beforeFunctionExpression(check) : true;
	                }
	                break;
	            default:
	                break;
	        }
	        return regex;
	    };
	    Reader.prototype.push = function (token) {
	        if (token.type === 7 /* Punctuator */ || token.type === 4 /* Keyword */) {
	            if (token.value === '{') {
	                this.curly = this.values.length;
	            }
	            else if (token.value === '(') {
	                this.paren = this.values.length;
	            }
	            this.values.push(token.value);
	        }
	        else {
	            this.values.push(null);
	        }
	    };
	    return Reader;
	}());
	var Tokenizer = (function () {
	    function Tokenizer(code, config) {
	        this.errorHandler = new error_handler_1.ErrorHandler();
	        this.errorHandler.tolerant = config ? (typeof config.tolerant === 'boolean' && config.tolerant) : false;
	        this.scanner = new scanner_1.Scanner(code, this.errorHandler);
	        this.scanner.trackComment = config ? (typeof config.comment === 'boolean' && config.comment) : false;
	        this.trackRange = config ? (typeof config.range === 'boolean' && config.range) : false;
	        this.trackLoc = config ? (typeof config.loc === 'boolean' && config.loc) : false;
	        this.buffer = [];
	        this.reader = new Reader();
	    }
	    Tokenizer.prototype.errors = function () {
	        return this.errorHandler.errors;
	    };
	    Tokenizer.prototype.getNextToken = function () {
	        if (this.buffer.length === 0) {
	            var comments = this.scanner.scanComments();
	            if (this.scanner.trackComment) {
	                for (var i = 0; i < comments.length; ++i) {
	                    var e = comments[i];
	                    var value = this.scanner.source.slice(e.slice[0], e.slice[1]);
	                    var comment = {
	                        type: e.multiLine ? 'BlockComment' : 'LineComment',
	                        value: value
	                    };
	                    if (this.trackRange) {
	                        comment.range = e.range;
	                    }
	                    if (this.trackLoc) {
	                        comment.loc = e.loc;
	                    }
	                    this.buffer.push(comment);
	                }
	            }
	            if (!this.scanner.eof()) {
	                var loc = void 0;
	                if (this.trackLoc) {
	                    loc = {
	                        start: {
	                            line: this.scanner.lineNumber,
	                            column: this.scanner.index - this.scanner.lineStart
	                        },
	                        end: {}
	                    };
	                }
	                var startRegex = (this.scanner.source[this.scanner.index] === '/') && this.reader.isRegexStart();
	                var token = startRegex ? this.scanner.scanRegExp() : this.scanner.lex();
	                this.reader.push(token);
	                var entry = {
	                    type: token_1.TokenName[token.type],
	                    value: this.scanner.source.slice(token.start, token.end)
	                };
	                if (this.trackRange) {
	                    entry.range = [token.start, token.end];
	                }
	                if (this.trackLoc) {
	                    loc.end = {
	                        line: this.scanner.lineNumber,
	                        column: this.scanner.index - this.scanner.lineStart
	                    };
	                    entry.loc = loc;
	                }
	                if (token.type === 9 /* RegularExpression */) {
	                    var pattern = token.pattern;
	                    var flags = token.flags;
	                    entry.regex = { pattern: pattern, flags: flags };
	                }
	                this.buffer.push(entry);
	            }
	        }
	        return this.buffer.shift();
	    };
	    return Tokenizer;
	}());
	exports.Tokenizer = Tokenizer;


/***/ }
/******/ ])
});
;
},{}],34:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],35:[function(require,module,exports){
exports.endianness = function () { return 'LE' };

exports.hostname = function () {
    if (typeof location !== 'undefined') {
        return location.hostname
    }
    else return '';
};

exports.loadavg = function () { return [] };

exports.uptime = function () { return 0 };

exports.freemem = function () {
    return Number.MAX_VALUE;
};

exports.totalmem = function () {
    return Number.MAX_VALUE;
};

exports.cpus = function () { return [] };

exports.type = function () { return 'Browser' };

exports.release = function () {
    if (typeof navigator !== 'undefined') {
        return navigator.appVersion;
    }
    return '';
};

exports.networkInterfaces
= exports.getNetworkInterfaces
= function () { return {} };

exports.arch = function () { return 'javascript' };

exports.platform = function () { return 'browser' };

exports.tmpdir = exports.tmpDir = function () {
    return '/tmp';
};

exports.EOL = '\n';

exports.homedir = function () {
	return '/'
};

},{}],36:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printComments = exports.attach = void 0;
var tslib_1 = require("tslib");
var assert_1 = tslib_1.__importDefault(require("assert"));
var types = tslib_1.__importStar(require("ast-types"));
var n = types.namedTypes;
var isArray = types.builtInTypes.array;
var isObject = types.builtInTypes.object;
var lines_1 = require("./lines");
var util_1 = require("./util");
var childNodesCache = new WeakMap();
// TODO Move a non-caching implementation of this function into ast-types,
// and implement a caching wrapper function here.
function getSortedChildNodes(node, lines, resultArray) {
    if (!node) {
        return resultArray;
    }
    // The .loc checks below are sensitive to some of the problems that
    // are fixed by this utility function. Specifically, if it decides to
    // set node.loc to null, indicating that the node's .loc information
    // is unreliable, then we don't want to add node to the resultArray.
    util_1.fixFaultyLocations(node, lines);
    if (resultArray) {
        if (n.Node.check(node) && n.SourceLocation.check(node.loc)) {
            // This reverse insertion sort almost always takes constant
            // time because we almost always (maybe always?) append the
            // nodes in order anyway.
            var i = resultArray.length - 1;
            for (; i >= 0; --i) {
                var child = resultArray[i];
                if (child &&
                    child.loc &&
                    util_1.comparePos(child.loc.end, node.loc.start) <= 0) {
                    break;
                }
            }
            resultArray.splice(i + 1, 0, node);
            return resultArray;
        }
    }
    else {
        var childNodes = childNodesCache.get(node);
        if (childNodes) {
            return childNodes;
        }
    }
    var names;
    if (isArray.check(node)) {
        names = Object.keys(node);
    }
    else if (isObject.check(node)) {
        names = types.getFieldNames(node);
    }
    else {
        return resultArray;
    }
    if (!resultArray) {
        childNodesCache.set(node, (resultArray = []));
    }
    for (var i = 0, nameCount = names.length; i < nameCount; ++i) {
        getSortedChildNodes(node[names[i]], lines, resultArray);
    }
    return resultArray;
}
// As efficiently as possible, decorate the comment object with
// .precedingNode, .enclosingNode, and/or .followingNode properties, at
// least one of which is guaranteed to be defined.
function decorateComment(node, comment, lines) {
    var childNodes = getSortedChildNodes(node, lines);
    // Time to dust off the old binary search robes and wizard hat.
    var left = 0;
    var right = childNodes && childNodes.length;
    var precedingNode;
    var followingNode;
    while (typeof right === "number" && left < right) {
        var middle = (left + right) >> 1;
        var child = childNodes[middle];
        if (util_1.comparePos(child.loc.start, comment.loc.start) <= 0 &&
            util_1.comparePos(comment.loc.end, child.loc.end) <= 0) {
            // The comment is completely contained by this child node.
            decorateComment((comment.enclosingNode = child), comment, lines);
            return; // Abandon the binary search at this level.
        }
        if (util_1.comparePos(child.loc.end, comment.loc.start) <= 0) {
            // This child node falls completely before the comment.
            // Because we will never consider this node or any nodes
            // before it again, this node must be the closest preceding
            // node we have encountered so far.
            precedingNode = child;
            left = middle + 1;
            continue;
        }
        if (util_1.comparePos(comment.loc.end, child.loc.start) <= 0) {
            // This child node falls completely after the comment.
            // Because we will never consider this node or any nodes after
            // it again, this node must be the closest following node we
            // have encountered so far.
            followingNode = child;
            right = middle;
            continue;
        }
        throw new Error("Comment location overlaps with node location");
    }
    if (precedingNode) {
        comment.precedingNode = precedingNode;
    }
    if (followingNode) {
        comment.followingNode = followingNode;
    }
}
function attach(comments, ast, lines) {
    if (!isArray.check(comments)) {
        return;
    }
    var tiesToBreak = [];
    comments.forEach(function (comment) {
        comment.loc.lines = lines;
        decorateComment(ast, comment, lines);
        var pn = comment.precedingNode;
        var en = comment.enclosingNode;
        var fn = comment.followingNode;
        if (pn && fn) {
            var tieCount = tiesToBreak.length;
            if (tieCount > 0) {
                var lastTie = tiesToBreak[tieCount - 1];
                assert_1.default.strictEqual(lastTie.precedingNode === comment.precedingNode, lastTie.followingNode === comment.followingNode);
                if (lastTie.followingNode !== comment.followingNode) {
                    breakTies(tiesToBreak, lines);
                }
            }
            tiesToBreak.push(comment);
        }
        else if (pn) {
            // No contest: we have a trailing comment.
            breakTies(tiesToBreak, lines);
            addTrailingComment(pn, comment);
        }
        else if (fn) {
            // No contest: we have a leading comment.
            breakTies(tiesToBreak, lines);
            addLeadingComment(fn, comment);
        }
        else if (en) {
            // The enclosing node has no child nodes at all, so what we
            // have here is a dangling comment, e.g. [/* crickets */].
            breakTies(tiesToBreak, lines);
            addDanglingComment(en, comment);
        }
        else {
            throw new Error("AST contains no nodes at all?");
        }
    });
    breakTies(tiesToBreak, lines);
    comments.forEach(function (comment) {
        // These node references were useful for breaking ties, but we
        // don't need them anymore, and they create cycles in the AST that
        // may lead to infinite recursion if we don't delete them here.
        delete comment.precedingNode;
        delete comment.enclosingNode;
        delete comment.followingNode;
    });
}
exports.attach = attach;
function breakTies(tiesToBreak, lines) {
    var tieCount = tiesToBreak.length;
    if (tieCount === 0) {
        return;
    }
    var pn = tiesToBreak[0].precedingNode;
    var fn = tiesToBreak[0].followingNode;
    var gapEndPos = fn.loc.start;
    // Iterate backwards through tiesToBreak, examining the gaps
    // between the tied comments. In order to qualify as leading, a
    // comment must be separated from fn by an unbroken series of
    // whitespace-only gaps (or other comments).
    var indexOfFirstLeadingComment = tieCount;
    var comment;
    for (; indexOfFirstLeadingComment > 0; --indexOfFirstLeadingComment) {
        comment = tiesToBreak[indexOfFirstLeadingComment - 1];
        assert_1.default.strictEqual(comment.precedingNode, pn);
        assert_1.default.strictEqual(comment.followingNode, fn);
        var gap = lines.sliceString(comment.loc.end, gapEndPos);
        if (/\S/.test(gap)) {
            // The gap string contained something other than whitespace.
            break;
        }
        gapEndPos = comment.loc.start;
    }
    while (indexOfFirstLeadingComment <= tieCount &&
        (comment = tiesToBreak[indexOfFirstLeadingComment]) &&
        // If the comment is a //-style comment and indented more
        // deeply than the node itself, reconsider it as trailing.
        (comment.type === "Line" || comment.type === "CommentLine") &&
        comment.loc.start.column > fn.loc.start.column) {
        ++indexOfFirstLeadingComment;
    }
    tiesToBreak.forEach(function (comment, i) {
        if (i < indexOfFirstLeadingComment) {
            addTrailingComment(pn, comment);
        }
        else {
            addLeadingComment(fn, comment);
        }
    });
    tiesToBreak.length = 0;
}
function addCommentHelper(node, comment) {
    var comments = node.comments || (node.comments = []);
    comments.push(comment);
}
function addLeadingComment(node, comment) {
    comment.leading = true;
    comment.trailing = false;
    addCommentHelper(node, comment);
}
function addDanglingComment(node, comment) {
    comment.leading = false;
    comment.trailing = false;
    addCommentHelper(node, comment);
}
function addTrailingComment(node, comment) {
    comment.leading = false;
    comment.trailing = true;
    addCommentHelper(node, comment);
}
function printLeadingComment(commentPath, print) {
    var comment = commentPath.getValue();
    n.Comment.assert(comment);
    var loc = comment.loc;
    var lines = loc && loc.lines;
    var parts = [print(commentPath)];
    if (comment.trailing) {
        // When we print trailing comments as leading comments, we don't
        // want to bring any trailing spaces along.
        parts.push("\n");
    }
    else if (lines instanceof lines_1.Lines) {
        var trailingSpace = lines.slice(loc.end, lines.skipSpaces(loc.end) || lines.lastPos());
        if (trailingSpace.length === 1) {
            // If the trailing space contains no newlines, then we want to
            // preserve it exactly as we found it.
            parts.push(trailingSpace);
        }
        else {
            // If the trailing space contains newlines, then replace it
            // with just that many newlines, with all other spaces removed.
            parts.push(new Array(trailingSpace.length).join("\n"));
        }
    }
    else {
        parts.push("\n");
    }
    return lines_1.concat(parts);
}
function printTrailingComment(commentPath, print) {
    var comment = commentPath.getValue(commentPath);
    n.Comment.assert(comment);
    var loc = comment.loc;
    var lines = loc && loc.lines;
    var parts = [];
    if (lines instanceof lines_1.Lines) {
        var fromPos = lines.skipSpaces(loc.start, true) || lines.firstPos();
        var leadingSpace = lines.slice(fromPos, loc.start);
        if (leadingSpace.length === 1) {
            // If the leading space contains no newlines, then we want to
            // preserve it exactly as we found it.
            parts.push(leadingSpace);
        }
        else {
            // If the leading space contains newlines, then replace it
            // with just that many newlines, sans all other spaces.
            parts.push(new Array(leadingSpace.length).join("\n"));
        }
    }
    parts.push(print(commentPath));
    return lines_1.concat(parts);
}
function printComments(path, print) {
    var value = path.getValue();
    var innerLines = print(path);
    var comments = n.Node.check(value) && types.getFieldValue(value, "comments");
    if (!comments || comments.length === 0) {
        return innerLines;
    }
    var leadingParts = [];
    var trailingParts = [innerLines];
    path.each(function (commentPath) {
        var comment = commentPath.getValue();
        var leading = types.getFieldValue(comment, "leading");
        var trailing = types.getFieldValue(comment, "trailing");
        if (leading ||
            (trailing &&
                !(n.Statement.check(value) ||
                    comment.type === "Block" ||
                    comment.type === "CommentBlock"))) {
            leadingParts.push(printLeadingComment(commentPath, print));
        }
        else if (trailing) {
            trailingParts.push(printTrailingComment(commentPath, print));
        }
    }, "comments");
    leadingParts.push.apply(leadingParts, trailingParts);
    return lines_1.concat(leadingParts);
}
exports.printComments = printComments;

},{"./lines":39,"./util":45,"assert":1,"ast-types":30,"tslib":47}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var assert_1 = tslib_1.__importDefault(require("assert"));
var types = tslib_1.__importStar(require("ast-types"));
var util = tslib_1.__importStar(require("./util"));
var n = types.namedTypes;
var isArray = types.builtInTypes.array;
var isNumber = types.builtInTypes.number;
var PRECEDENCE = {};
[
    ["||"],
    ["&&"],
    ["|"],
    ["^"],
    ["&"],
    ["==", "===", "!=", "!=="],
    ["<", ">", "<=", ">=", "in", "instanceof"],
    [">>", "<<", ">>>"],
    ["+", "-"],
    ["*", "/", "%"],
    ["**"],
].forEach(function (tier, i) {
    tier.forEach(function (op) {
        PRECEDENCE[op] = i;
    });
});
var FastPath = function FastPath(value) {
    assert_1.default.ok(this instanceof FastPath);
    this.stack = [value];
};
var FPp = FastPath.prototype;
// Static convenience function for coercing a value to a FastPath.
FastPath.from = function (obj) {
    if (obj instanceof FastPath) {
        // Return a defensive copy of any existing FastPath instances.
        return obj.copy();
    }
    if (obj instanceof types.NodePath) {
        // For backwards compatibility, unroll NodePath instances into
        // lightweight FastPath [..., name, value] stacks.
        var copy = Object.create(FastPath.prototype);
        var stack = [obj.value];
        for (var pp = void 0; (pp = obj.parentPath); obj = pp)
            stack.push(obj.name, pp.value);
        copy.stack = stack.reverse();
        return copy;
    }
    // Otherwise use obj as the value of the new FastPath instance.
    return new FastPath(obj);
};
FPp.copy = function copy() {
    var copy = Object.create(FastPath.prototype);
    copy.stack = this.stack.slice(0);
    return copy;
};
// The name of the current property is always the penultimate element of
// this.stack, and always a String.
FPp.getName = function getName() {
    var s = this.stack;
    var len = s.length;
    if (len > 1) {
        return s[len - 2];
    }
    // Since the name is always a string, null is a safe sentinel value to
    // return if we do not know the name of the (root) value.
    return null;
};
// The value of the current property is always the final element of
// this.stack.
FPp.getValue = function getValue() {
    var s = this.stack;
    return s[s.length - 1];
};
FPp.valueIsDuplicate = function () {
    var s = this.stack;
    var valueIndex = s.length - 1;
    return s.lastIndexOf(s[valueIndex], valueIndex - 1) >= 0;
};
function getNodeHelper(path, count) {
    var s = path.stack;
    for (var i = s.length - 1; i >= 0; i -= 2) {
        var value = s[i];
        if (n.Node.check(value) && --count < 0) {
            return value;
        }
    }
    return null;
}
FPp.getNode = function getNode(count) {
    if (count === void 0) { count = 0; }
    return getNodeHelper(this, ~~count);
};
FPp.getParentNode = function getParentNode(count) {
    if (count === void 0) { count = 0; }
    return getNodeHelper(this, ~~count + 1);
};
// The length of the stack can be either even or odd, depending on whether
// or not we have a name for the root value. The difference between the
// index of the root value and the index of the final value is always
// even, though, which allows us to return the root value in constant time
// (i.e. without iterating backwards through the stack).
FPp.getRootValue = function getRootValue() {
    var s = this.stack;
    if (s.length % 2 === 0) {
        return s[1];
    }
    return s[0];
};
// Temporarily push properties named by string arguments given after the
// callback function onto this.stack, then call the callback with a
// reference to this (modified) FastPath object. Note that the stack will
// be restored to its original state after the callback is finished, so it
// is probably a mistake to retain a reference to the path.
FPp.call = function call(callback /*, name1, name2, ... */) {
    var s = this.stack;
    var origLen = s.length;
    var value = s[origLen - 1];
    var argc = arguments.length;
    for (var i = 1; i < argc; ++i) {
        var name = arguments[i];
        value = value[name];
        s.push(name, value);
    }
    var result = callback(this);
    s.length = origLen;
    return result;
};
// Similar to FastPath.prototype.call, except that the value obtained by
// accessing this.getValue()[name1][name2]... should be array-like. The
// callback will be called with a reference to this path object for each
// element of the array.
FPp.each = function each(callback /*, name1, name2, ... */) {
    var s = this.stack;
    var origLen = s.length;
    var value = s[origLen - 1];
    var argc = arguments.length;
    for (var i = 1; i < argc; ++i) {
        var name = arguments[i];
        value = value[name];
        s.push(name, value);
    }
    for (var i = 0; i < value.length; ++i) {
        if (i in value) {
            s.push(i, value[i]);
            // If the callback needs to know the value of i, call
            // path.getName(), assuming path is the parameter name.
            callback(this);
            s.length -= 2;
        }
    }
    s.length = origLen;
};
// Similar to FastPath.prototype.each, except that the results of the
// callback function invocations are stored in an array and returned at
// the end of the iteration.
FPp.map = function map(callback /*, name1, name2, ... */) {
    var s = this.stack;
    var origLen = s.length;
    var value = s[origLen - 1];
    var argc = arguments.length;
    for (var i = 1; i < argc; ++i) {
        var name = arguments[i];
        value = value[name];
        s.push(name, value);
    }
    var result = new Array(value.length);
    for (var i = 0; i < value.length; ++i) {
        if (i in value) {
            s.push(i, value[i]);
            result[i] = callback(this, i);
            s.length -= 2;
        }
    }
    s.length = origLen;
    return result;
};
// Returns true if the node at the tip of the path is wrapped with
// parentheses, OR if the only reason the node needed parentheses was that
// it couldn't be the first expression in the enclosing statement (see
// FastPath#canBeFirstInStatement), and it has an opening `(` character.
// For example, the FunctionExpression in `(function(){}())` appears to
// need parentheses only because it's the first expression in the AST, but
// since it happens to be preceded by a `(` (which is not apparent from
// the AST but can be determined using FastPath#getPrevToken), there is no
// ambiguity about how to parse it, so it counts as having parentheses,
// even though it is not immediately followed by a `)`.
FPp.hasParens = function () {
    var node = this.getNode();
    var prevToken = this.getPrevToken(node);
    if (!prevToken) {
        return false;
    }
    var nextToken = this.getNextToken(node);
    if (!nextToken) {
        return false;
    }
    if (prevToken.value === "(") {
        if (nextToken.value === ")") {
            // If the node preceded by a `(` token and followed by a `)` token,
            // then of course it has parentheses.
            return true;
        }
        // If this is one of the few Expression types that can't come first in
        // the enclosing statement because of parsing ambiguities (namely,
        // FunctionExpression, ObjectExpression, and ClassExpression) and
        // this.firstInStatement() returns true, and the node would not need
        // parentheses in an expression context because this.needsParens(true)
        // returns false, then it just needs an opening parenthesis to resolve
        // the parsing ambiguity that made it appear to need parentheses.
        var justNeedsOpeningParen = !this.canBeFirstInStatement() &&
            this.firstInStatement() &&
            !this.needsParens(true);
        if (justNeedsOpeningParen) {
            return true;
        }
    }
    return false;
};
FPp.getPrevToken = function (node) {
    node = node || this.getNode();
    var loc = node && node.loc;
    var tokens = loc && loc.tokens;
    if (tokens && loc.start.token > 0) {
        var token = tokens[loc.start.token - 1];
        if (token) {
            // Do not return tokens that fall outside the root subtree.
            var rootLoc = this.getRootValue().loc;
            if (util.comparePos(rootLoc.start, token.loc.start) <= 0) {
                return token;
            }
        }
    }
    return null;
};
FPp.getNextToken = function (node) {
    node = node || this.getNode();
    var loc = node && node.loc;
    var tokens = loc && loc.tokens;
    if (tokens && loc.end.token < tokens.length) {
        var token = tokens[loc.end.token];
        if (token) {
            // Do not return tokens that fall outside the root subtree.
            var rootLoc = this.getRootValue().loc;
            if (util.comparePos(token.loc.end, rootLoc.end) <= 0) {
                return token;
            }
        }
    }
    return null;
};
// Inspired by require("ast-types").NodePath.prototype.needsParens, but
// more efficient because we're iterating backwards through a stack.
FPp.needsParens = function (assumeExpressionContext) {
    var node = this.getNode();
    // This needs to come before `if (!parent) { return false }` because
    // an object destructuring assignment requires parens for
    // correctness even when it's the topmost expression.
    if (node.type === "AssignmentExpression" &&
        node.left.type === "ObjectPattern") {
        return true;
    }
    var parent = this.getParentNode();
    if (!parent) {
        return false;
    }
    var name = this.getName();
    // If the value of this path is some child of a Node and not a Node
    // itself, then it doesn't need parentheses. Only Node objects (in fact,
    // only Expression nodes) need parentheses.
    if (this.getValue() !== node) {
        return false;
    }
    // Only statements don't need parentheses.
    if (n.Statement.check(node)) {
        return false;
    }
    // Identifiers never need parentheses.
    if (node.type === "Identifier") {
        return false;
    }
    if (parent.type === "ParenthesizedExpression" ||
        (node.extra && node.extra.parenthesized)) {
        return false;
    }
    switch (node.type) {
        case "UnaryExpression":
        case "SpreadElement":
        case "SpreadProperty":
            return (parent.type === "MemberExpression" &&
                name === "object" &&
                parent.object === node);
        case "BinaryExpression":
        case "LogicalExpression":
            switch (parent.type) {
                case "CallExpression":
                    return name === "callee" && parent.callee === node;
                case "UnaryExpression":
                case "SpreadElement":
                case "SpreadProperty":
                    return true;
                case "MemberExpression":
                    return name === "object" && parent.object === node;
                case "BinaryExpression":
                case "LogicalExpression": {
                    var po = parent.operator;
                    var pp = PRECEDENCE[po];
                    var no = node.operator;
                    var np = PRECEDENCE[no];
                    if (pp > np) {
                        return true;
                    }
                    if (pp === np && name === "right") {
                        assert_1.default.strictEqual(parent.right, node);
                        return true;
                    }
                    break;
                }
                default:
                    return false;
            }
            break;
        case "SequenceExpression":
            switch (parent.type) {
                case "ReturnStatement":
                    return false;
                case "ForStatement":
                    // Although parentheses wouldn't hurt around sequence expressions in
                    // the head of for loops, traditional style dictates that e.g. i++,
                    // j++ should not be wrapped with parentheses.
                    return false;
                case "ExpressionStatement":
                    return name !== "expression";
                default:
                    // Otherwise err on the side of overparenthesization, adding
                    // explicit exceptions above if this proves overzealous.
                    return true;
            }
        case "IntersectionTypeAnnotation":
        case "UnionTypeAnnotation":
            return parent.type === "NullableTypeAnnotation";
        case "Literal":
            return (parent.type === "MemberExpression" &&
                isNumber.check(node.value) &&
                name === "object" &&
                parent.object === node);
        // Babel 6 Literal split
        case "NumericLiteral":
            return (parent.type === "MemberExpression" &&
                name === "object" &&
                parent.object === node);
        case "YieldExpression":
        case "AwaitExpression":
        case "AssignmentExpression":
        case "ConditionalExpression":
            switch (parent.type) {
                case "UnaryExpression":
                case "SpreadElement":
                case "SpreadProperty":
                case "BinaryExpression":
                case "LogicalExpression":
                    return true;
                case "CallExpression":
                case "NewExpression":
                    return name === "callee" && parent.callee === node;
                case "ConditionalExpression":
                    return name === "test" && parent.test === node;
                case "MemberExpression":
                    return name === "object" && parent.object === node;
                default:
                    return false;
            }
        case "ArrowFunctionExpression":
            if (n.CallExpression.check(parent) &&
                name === "callee" &&
                parent.callee === node) {
                return true;
            }
            if (n.MemberExpression.check(parent) &&
                name === "object" &&
                parent.object === node) {
                return true;
            }
            if (n.TSAsExpression &&
                n.TSAsExpression.check(parent) &&
                name === "expression" &&
                parent.expression === node) {
                return true;
            }
            return isBinary(parent);
        case "ObjectExpression":
            if (parent.type === "ArrowFunctionExpression" &&
                name === "body" &&
                parent.body === node) {
                return true;
            }
            break;
        case "TSAsExpression":
            if (parent.type === "ArrowFunctionExpression" &&
                name === "body" &&
                parent.body === node &&
                node.expression.type === "ObjectExpression") {
                return true;
            }
            break;
        case "CallExpression":
            if (name === "declaration" &&
                n.ExportDefaultDeclaration.check(parent) &&
                n.FunctionExpression.check(node.callee)) {
                return true;
            }
    }
    if (parent.type === "NewExpression" &&
        name === "callee" &&
        parent.callee === node) {
        return containsCallExpression(node);
    }
    if (assumeExpressionContext !== true &&
        !this.canBeFirstInStatement() &&
        this.firstInStatement()) {
        return true;
    }
    return false;
};
function isBinary(node) {
    return n.BinaryExpression.check(node) || n.LogicalExpression.check(node);
}
// @ts-ignore 'isUnaryLike' is declared but its value is never read. [6133]
function isUnaryLike(node) {
    return (n.UnaryExpression.check(node) ||
        // I considered making SpreadElement and SpreadProperty subtypes of
        // UnaryExpression, but they're not really Expression nodes.
        (n.SpreadElement && n.SpreadElement.check(node)) ||
        (n.SpreadProperty && n.SpreadProperty.check(node)));
}
function containsCallExpression(node) {
    if (n.CallExpression.check(node)) {
        return true;
    }
    if (isArray.check(node)) {
        return node.some(containsCallExpression);
    }
    if (n.Node.check(node)) {
        return types.someField(node, function (_name, child) {
            return containsCallExpression(child);
        });
    }
    return false;
}
FPp.canBeFirstInStatement = function () {
    var node = this.getNode();
    if (n.FunctionExpression.check(node)) {
        return false;
    }
    if (n.ObjectExpression.check(node)) {
        return false;
    }
    if (n.ClassExpression.check(node)) {
        return false;
    }
    return true;
};
FPp.firstInStatement = function () {
    var s = this.stack;
    var parentName, parent;
    var childName, child;
    for (var i = s.length - 1; i >= 0; i -= 2) {
        if (n.Node.check(s[i])) {
            childName = parentName;
            child = parent;
            parentName = s[i - 1];
            parent = s[i];
        }
        if (!parent || !child) {
            continue;
        }
        if (n.BlockStatement.check(parent) &&
            parentName === "body" &&
            childName === 0) {
            assert_1.default.strictEqual(parent.body[0], child);
            return true;
        }
        if (n.ExpressionStatement.check(parent) && childName === "expression") {
            assert_1.default.strictEqual(parent.expression, child);
            return true;
        }
        if (n.AssignmentExpression.check(parent) && childName === "left") {
            assert_1.default.strictEqual(parent.left, child);
            return true;
        }
        if (n.ArrowFunctionExpression.check(parent) && childName === "body") {
            assert_1.default.strictEqual(parent.body, child);
            return true;
        }
        if (n.SequenceExpression.check(parent) &&
            parentName === "expressions" &&
            childName === 0) {
            assert_1.default.strictEqual(parent.expressions[0], child);
            continue;
        }
        if (n.CallExpression.check(parent) && childName === "callee") {
            assert_1.default.strictEqual(parent.callee, child);
            continue;
        }
        if (n.MemberExpression.check(parent) && childName === "object") {
            assert_1.default.strictEqual(parent.object, child);
            continue;
        }
        if (n.ConditionalExpression.check(parent) && childName === "test") {
            assert_1.default.strictEqual(parent.test, child);
            continue;
        }
        if (isBinary(parent) && childName === "left") {
            assert_1.default.strictEqual(parent.left, child);
            continue;
        }
        if (n.UnaryExpression.check(parent) &&
            !parent.prefix &&
            childName === "argument") {
            assert_1.default.strictEqual(parent.argument, child);
            continue;
        }
        return false;
    }
    return true;
};
exports.default = FastPath;

},{"./util":45,"assert":1,"ast-types":30,"tslib":47}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concat = exports.fromString = exports.countSpaces = exports.Lines = void 0;
var tslib_1 = require("tslib");
var assert_1 = tslib_1.__importDefault(require("assert"));
var source_map_1 = tslib_1.__importDefault(require("source-map"));
var options_1 = require("./options");
var util_1 = require("./util");
var mapping_1 = tslib_1.__importDefault(require("./mapping"));
var Lines = /** @class */ (function () {
    function Lines(infos, sourceFileName) {
        if (sourceFileName === void 0) { sourceFileName = null; }
        this.infos = infos;
        this.mappings = [];
        this.cachedSourceMap = null;
        this.cachedTabWidth = void 0;
        assert_1.default.ok(infos.length > 0);
        this.length = infos.length;
        this.name = sourceFileName || null;
        if (this.name) {
            this.mappings.push(new mapping_1.default(this, {
                start: this.firstPos(),
                end: this.lastPos(),
            }));
        }
    }
    Lines.prototype.toString = function (options) {
        return this.sliceString(this.firstPos(), this.lastPos(), options);
    };
    Lines.prototype.getSourceMap = function (sourceMapName, sourceRoot) {
        if (!sourceMapName) {
            // Although we could make up a name or generate an anonymous
            // source map, instead we assume that any consumer who does not
            // provide a name does not actually want a source map.
            return null;
        }
        var targetLines = this;
        function updateJSON(json) {
            json = json || {};
            json.file = sourceMapName;
            if (sourceRoot) {
                json.sourceRoot = sourceRoot;
            }
            return json;
        }
        if (targetLines.cachedSourceMap) {
            // Since Lines objects are immutable, we can reuse any source map
            // that was previously generated. Nevertheless, we return a new
            // JSON object here to protect the cached source map from outside
            // modification.
            return updateJSON(targetLines.cachedSourceMap.toJSON());
        }
        var smg = new source_map_1.default.SourceMapGenerator(updateJSON());
        var sourcesToContents = {};
        targetLines.mappings.forEach(function (mapping) {
            var sourceCursor = mapping.sourceLines.skipSpaces(mapping.sourceLoc.start) ||
                mapping.sourceLines.lastPos();
            var targetCursor = targetLines.skipSpaces(mapping.targetLoc.start) ||
                targetLines.lastPos();
            while (util_1.comparePos(sourceCursor, mapping.sourceLoc.end) < 0 &&
                util_1.comparePos(targetCursor, mapping.targetLoc.end) < 0) {
                var sourceChar = mapping.sourceLines.charAt(sourceCursor);
                var targetChar = targetLines.charAt(targetCursor);
                assert_1.default.strictEqual(sourceChar, targetChar);
                var sourceName = mapping.sourceLines.name;
                // Add mappings one character at a time for maximum resolution.
                smg.addMapping({
                    source: sourceName,
                    original: { line: sourceCursor.line, column: sourceCursor.column },
                    generated: { line: targetCursor.line, column: targetCursor.column },
                });
                if (!hasOwn.call(sourcesToContents, sourceName)) {
                    var sourceContent = mapping.sourceLines.toString();
                    smg.setSourceContent(sourceName, sourceContent);
                    sourcesToContents[sourceName] = sourceContent;
                }
                targetLines.nextPos(targetCursor, true);
                mapping.sourceLines.nextPos(sourceCursor, true);
            }
        });
        targetLines.cachedSourceMap = smg;
        return smg.toJSON();
    };
    Lines.prototype.bootstrapCharAt = function (pos) {
        assert_1.default.strictEqual(typeof pos, "object");
        assert_1.default.strictEqual(typeof pos.line, "number");
        assert_1.default.strictEqual(typeof pos.column, "number");
        var line = pos.line, column = pos.column, strings = this.toString().split(lineTerminatorSeqExp), string = strings[line - 1];
        if (typeof string === "undefined")
            return "";
        if (column === string.length && line < strings.length)
            return "\n";
        if (column >= string.length)
            return "";
        return string.charAt(column);
    };
    Lines.prototype.charAt = function (pos) {
        assert_1.default.strictEqual(typeof pos, "object");
        assert_1.default.strictEqual(typeof pos.line, "number");
        assert_1.default.strictEqual(typeof pos.column, "number");
        var line = pos.line, column = pos.column, secret = this, infos = secret.infos, info = infos[line - 1], c = column;
        if (typeof info === "undefined" || c < 0)
            return "";
        var indent = this.getIndentAt(line);
        if (c < indent)
            return " ";
        c += info.sliceStart - indent;
        if (c === info.sliceEnd && line < this.length)
            return "\n";
        if (c >= info.sliceEnd)
            return "";
        return info.line.charAt(c);
    };
    Lines.prototype.stripMargin = function (width, skipFirstLine) {
        if (width === 0)
            return this;
        assert_1.default.ok(width > 0, "negative margin: " + width);
        if (skipFirstLine && this.length === 1)
            return this;
        var lines = new Lines(this.infos.map(function (info, i) {
            if (info.line && (i > 0 || !skipFirstLine)) {
                info = tslib_1.__assign(tslib_1.__assign({}, info), { indent: Math.max(0, info.indent - width) });
            }
            return info;
        }));
        if (this.mappings.length > 0) {
            var newMappings_1 = lines.mappings;
            assert_1.default.strictEqual(newMappings_1.length, 0);
            this.mappings.forEach(function (mapping) {
                newMappings_1.push(mapping.indent(width, skipFirstLine, true));
            });
        }
        return lines;
    };
    Lines.prototype.indent = function (by) {
        if (by === 0) {
            return this;
        }
        var lines = new Lines(this.infos.map(function (info) {
            if (info.line && !info.locked) {
                info = tslib_1.__assign(tslib_1.__assign({}, info), { indent: info.indent + by });
            }
            return info;
        }));
        if (this.mappings.length > 0) {
            var newMappings_2 = lines.mappings;
            assert_1.default.strictEqual(newMappings_2.length, 0);
            this.mappings.forEach(function (mapping) {
                newMappings_2.push(mapping.indent(by));
            });
        }
        return lines;
    };
    Lines.prototype.indentTail = function (by) {
        if (by === 0) {
            return this;
        }
        if (this.length < 2) {
            return this;
        }
        var lines = new Lines(this.infos.map(function (info, i) {
            if (i > 0 && info.line && !info.locked) {
                info = tslib_1.__assign(tslib_1.__assign({}, info), { indent: info.indent + by });
            }
            return info;
        }));
        if (this.mappings.length > 0) {
            var newMappings_3 = lines.mappings;
            assert_1.default.strictEqual(newMappings_3.length, 0);
            this.mappings.forEach(function (mapping) {
                newMappings_3.push(mapping.indent(by, true));
            });
        }
        return lines;
    };
    Lines.prototype.lockIndentTail = function () {
        if (this.length < 2) {
            return this;
        }
        return new Lines(this.infos.map(function (info, i) { return (tslib_1.__assign(tslib_1.__assign({}, info), { locked: i > 0 })); }));
    };
    Lines.prototype.getIndentAt = function (line) {
        assert_1.default.ok(line >= 1, "no line " + line + " (line numbers start from 1)");
        return Math.max(this.infos[line - 1].indent, 0);
    };
    Lines.prototype.guessTabWidth = function () {
        if (typeof this.cachedTabWidth === "number") {
            return this.cachedTabWidth;
        }
        var counts = []; // Sparse array.
        var lastIndent = 0;
        for (var line = 1, last = this.length; line <= last; ++line) {
            var info = this.infos[line - 1];
            var sliced = info.line.slice(info.sliceStart, info.sliceEnd);
            // Whitespace-only lines don't tell us much about the likely tab
            // width of this code.
            if (isOnlyWhitespace(sliced)) {
                continue;
            }
            var diff = Math.abs(info.indent - lastIndent);
            counts[diff] = ~~counts[diff] + 1;
            lastIndent = info.indent;
        }
        var maxCount = -1;
        var result = 2;
        for (var tabWidth = 1; tabWidth < counts.length; tabWidth += 1) {
            if (hasOwn.call(counts, tabWidth) && counts[tabWidth] > maxCount) {
                maxCount = counts[tabWidth];
                result = tabWidth;
            }
        }
        return (this.cachedTabWidth = result);
    };
    // Determine if the list of lines has a first line that starts with a //
    // or /* comment. If this is the case, the code may need to be wrapped in
    // parens to avoid ASI issues.
    Lines.prototype.startsWithComment = function () {
        if (this.infos.length === 0) {
            return false;
        }
        var firstLineInfo = this.infos[0], sliceStart = firstLineInfo.sliceStart, sliceEnd = firstLineInfo.sliceEnd, firstLine = firstLineInfo.line.slice(sliceStart, sliceEnd).trim();
        return (firstLine.length === 0 ||
            firstLine.slice(0, 2) === "//" ||
            firstLine.slice(0, 2) === "/*");
    };
    Lines.prototype.isOnlyWhitespace = function () {
        return isOnlyWhitespace(this.toString());
    };
    Lines.prototype.isPrecededOnlyByWhitespace = function (pos) {
        var info = this.infos[pos.line - 1];
        var indent = Math.max(info.indent, 0);
        var diff = pos.column - indent;
        if (diff <= 0) {
            // If pos.column does not exceed the indentation amount, then
            // there must be only whitespace before it.
            return true;
        }
        var start = info.sliceStart;
        var end = Math.min(start + diff, info.sliceEnd);
        var prefix = info.line.slice(start, end);
        return isOnlyWhitespace(prefix);
    };
    Lines.prototype.getLineLength = function (line) {
        var info = this.infos[line - 1];
        return this.getIndentAt(line) + info.sliceEnd - info.sliceStart;
    };
    Lines.prototype.nextPos = function (pos, skipSpaces) {
        if (skipSpaces === void 0) { skipSpaces = false; }
        var l = Math.max(pos.line, 0), c = Math.max(pos.column, 0);
        if (c < this.getLineLength(l)) {
            pos.column += 1;
            return skipSpaces ? !!this.skipSpaces(pos, false, true) : true;
        }
        if (l < this.length) {
            pos.line += 1;
            pos.column = 0;
            return skipSpaces ? !!this.skipSpaces(pos, false, true) : true;
        }
        return false;
    };
    Lines.prototype.prevPos = function (pos, skipSpaces) {
        if (skipSpaces === void 0) { skipSpaces = false; }
        var l = pos.line, c = pos.column;
        if (c < 1) {
            l -= 1;
            if (l < 1)
                return false;
            c = this.getLineLength(l);
        }
        else {
            c = Math.min(c - 1, this.getLineLength(l));
        }
        pos.line = l;
        pos.column = c;
        return skipSpaces ? !!this.skipSpaces(pos, true, true) : true;
    };
    Lines.prototype.firstPos = function () {
        // Trivial, but provided for completeness.
        return { line: 1, column: 0 };
    };
    Lines.prototype.lastPos = function () {
        return {
            line: this.length,
            column: this.getLineLength(this.length),
        };
    };
    Lines.prototype.skipSpaces = function (pos, backward, modifyInPlace) {
        if (backward === void 0) { backward = false; }
        if (modifyInPlace === void 0) { modifyInPlace = false; }
        if (pos) {
            pos = modifyInPlace
                ? pos
                : {
                    line: pos.line,
                    column: pos.column,
                };
        }
        else if (backward) {
            pos = this.lastPos();
        }
        else {
            pos = this.firstPos();
        }
        if (backward) {
            while (this.prevPos(pos)) {
                if (!isOnlyWhitespace(this.charAt(pos)) && this.nextPos(pos)) {
                    return pos;
                }
            }
            return null;
        }
        else {
            while (isOnlyWhitespace(this.charAt(pos))) {
                if (!this.nextPos(pos)) {
                    return null;
                }
            }
            return pos;
        }
    };
    Lines.prototype.trimLeft = function () {
        var pos = this.skipSpaces(this.firstPos(), false, true);
        return pos ? this.slice(pos) : emptyLines;
    };
    Lines.prototype.trimRight = function () {
        var pos = this.skipSpaces(this.lastPos(), true, true);
        return pos ? this.slice(this.firstPos(), pos) : emptyLines;
    };
    Lines.prototype.trim = function () {
        var start = this.skipSpaces(this.firstPos(), false, true);
        if (start === null) {
            return emptyLines;
        }
        var end = this.skipSpaces(this.lastPos(), true, true);
        if (end === null) {
            return emptyLines;
        }
        return this.slice(start, end);
    };
    Lines.prototype.eachPos = function (callback, startPos, skipSpaces) {
        if (startPos === void 0) { startPos = this.firstPos(); }
        if (skipSpaces === void 0) { skipSpaces = false; }
        var pos = this.firstPos();
        if (startPos) {
            (pos.line = startPos.line), (pos.column = startPos.column);
        }
        if (skipSpaces && !this.skipSpaces(pos, false, true)) {
            return; // Encountered nothing but spaces.
        }
        do
            callback.call(this, pos);
        while (this.nextPos(pos, skipSpaces));
    };
    Lines.prototype.bootstrapSlice = function (start, end) {
        var strings = this.toString()
            .split(lineTerminatorSeqExp)
            .slice(start.line - 1, end.line);
        if (strings.length > 0) {
            strings.push(strings.pop().slice(0, end.column));
            strings[0] = strings[0].slice(start.column);
        }
        return fromString(strings.join("\n"));
    };
    Lines.prototype.slice = function (start, end) {
        if (!end) {
            if (!start) {
                // The client seems to want a copy of this Lines object, but
                // Lines objects are immutable, so it's perfectly adequate to
                // return the same object.
                return this;
            }
            // Slice to the end if no end position was provided.
            end = this.lastPos();
        }
        if (!start) {
            throw new Error("cannot slice with end but not start");
        }
        var sliced = this.infos.slice(start.line - 1, end.line);
        if (start.line === end.line) {
            sliced[0] = sliceInfo(sliced[0], start.column, end.column);
        }
        else {
            assert_1.default.ok(start.line < end.line);
            sliced[0] = sliceInfo(sliced[0], start.column);
            sliced.push(sliceInfo(sliced.pop(), 0, end.column));
        }
        var lines = new Lines(sliced);
        if (this.mappings.length > 0) {
            var newMappings_4 = lines.mappings;
            assert_1.default.strictEqual(newMappings_4.length, 0);
            this.mappings.forEach(function (mapping) {
                var sliced = mapping.slice(this, start, end);
                if (sliced) {
                    newMappings_4.push(sliced);
                }
            }, this);
        }
        return lines;
    };
    Lines.prototype.bootstrapSliceString = function (start, end, options) {
        return this.slice(start, end).toString(options);
    };
    Lines.prototype.sliceString = function (start, end, options) {
        if (start === void 0) { start = this.firstPos(); }
        if (end === void 0) { end = this.lastPos(); }
        var _a = options_1.normalize(options), tabWidth = _a.tabWidth, useTabs = _a.useTabs, reuseWhitespace = _a.reuseWhitespace, lineTerminator = _a.lineTerminator;
        var parts = [];
        for (var line = start.line; line <= end.line; ++line) {
            var info = this.infos[line - 1];
            if (line === start.line) {
                if (line === end.line) {
                    info = sliceInfo(info, start.column, end.column);
                }
                else {
                    info = sliceInfo(info, start.column);
                }
            }
            else if (line === end.line) {
                info = sliceInfo(info, 0, end.column);
            }
            var indent = Math.max(info.indent, 0);
            var before_1 = info.line.slice(0, info.sliceStart);
            if (reuseWhitespace &&
                isOnlyWhitespace(before_1) &&
                countSpaces(before_1, tabWidth) === indent) {
                // Reuse original spaces if the indentation is correct.
                parts.push(info.line.slice(0, info.sliceEnd));
                continue;
            }
            var tabs = 0;
            var spaces = indent;
            if (useTabs) {
                tabs = Math.floor(indent / tabWidth);
                spaces -= tabs * tabWidth;
            }
            var result = "";
            if (tabs > 0) {
                result += new Array(tabs + 1).join("\t");
            }
            if (spaces > 0) {
                result += new Array(spaces + 1).join(" ");
            }
            result += info.line.slice(info.sliceStart, info.sliceEnd);
            parts.push(result);
        }
        return parts.join(lineTerminator);
    };
    Lines.prototype.isEmpty = function () {
        return this.length < 2 && this.getLineLength(1) < 1;
    };
    Lines.prototype.join = function (elements) {
        var separator = this;
        var infos = [];
        var mappings = [];
        var prevInfo;
        function appendLines(linesOrNull) {
            if (linesOrNull === null) {
                return;
            }
            if (prevInfo) {
                var info = linesOrNull.infos[0];
                var indent = new Array(info.indent + 1).join(" ");
                var prevLine_1 = infos.length;
                var prevColumn_1 = Math.max(prevInfo.indent, 0) +
                    prevInfo.sliceEnd -
                    prevInfo.sliceStart;
                prevInfo.line =
                    prevInfo.line.slice(0, prevInfo.sliceEnd) +
                        indent +
                        info.line.slice(info.sliceStart, info.sliceEnd);
                // If any part of a line is indentation-locked, the whole line
                // will be indentation-locked.
                prevInfo.locked = prevInfo.locked || info.locked;
                prevInfo.sliceEnd = prevInfo.line.length;
                if (linesOrNull.mappings.length > 0) {
                    linesOrNull.mappings.forEach(function (mapping) {
                        mappings.push(mapping.add(prevLine_1, prevColumn_1));
                    });
                }
            }
            else if (linesOrNull.mappings.length > 0) {
                mappings.push.apply(mappings, linesOrNull.mappings);
            }
            linesOrNull.infos.forEach(function (info, i) {
                if (!prevInfo || i > 0) {
                    prevInfo = tslib_1.__assign({}, info);
                    infos.push(prevInfo);
                }
            });
        }
        function appendWithSeparator(linesOrNull, i) {
            if (i > 0)
                appendLines(separator);
            appendLines(linesOrNull);
        }
        elements
            .map(function (elem) {
            var lines = fromString(elem);
            if (lines.isEmpty())
                return null;
            return lines;
        })
            .forEach(function (linesOrNull, i) {
            if (separator.isEmpty()) {
                appendLines(linesOrNull);
            }
            else {
                appendWithSeparator(linesOrNull, i);
            }
        });
        if (infos.length < 1)
            return emptyLines;
        var lines = new Lines(infos);
        lines.mappings = mappings;
        return lines;
    };
    Lines.prototype.concat = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var list = [this];
        list.push.apply(list, args);
        assert_1.default.strictEqual(list.length, args.length + 1);
        return emptyLines.join(list);
    };
    return Lines;
}());
exports.Lines = Lines;
var fromStringCache = {};
var hasOwn = fromStringCache.hasOwnProperty;
var maxCacheKeyLen = 10;
function countSpaces(spaces, tabWidth) {
    var count = 0;
    var len = spaces.length;
    for (var i = 0; i < len; ++i) {
        switch (spaces.charCodeAt(i)) {
            case 9: {
                // '\t'
                assert_1.default.strictEqual(typeof tabWidth, "number");
                assert_1.default.ok(tabWidth > 0);
                var next = Math.ceil(count / tabWidth) * tabWidth;
                if (next === count) {
                    count += tabWidth;
                }
                else {
                    count = next;
                }
                break;
            }
            case 11: // '\v'
            case 12: // '\f'
            case 13: // '\r'
            case 0xfeff: // zero-width non-breaking space
                // These characters contribute nothing to indentation.
                break;
            case 32: // ' '
            default:
                // Treat all other whitespace like ' '.
                count += 1;
                break;
        }
    }
    return count;
}
exports.countSpaces = countSpaces;
var leadingSpaceExp = /^\s*/;
// As specified here: http://www.ecma-international.org/ecma-262/6.0/#sec-line-terminators
var lineTerminatorSeqExp = /\u000D\u000A|\u000D(?!\u000A)|\u000A|\u2028|\u2029/;
/**
 * @param {Object} options - Options object that configures printing.
 */
function fromString(string, options) {
    if (string instanceof Lines)
        return string;
    string += "";
    var tabWidth = options && options.tabWidth;
    var tabless = string.indexOf("\t") < 0;
    var cacheable = !options && tabless && string.length <= maxCacheKeyLen;
    assert_1.default.ok(tabWidth || tabless, "No tab width specified but encountered tabs in string\n" + string);
    if (cacheable && hasOwn.call(fromStringCache, string))
        return fromStringCache[string];
    var lines = new Lines(string.split(lineTerminatorSeqExp).map(function (line) {
        // TODO: handle null exec result
        var spaces = leadingSpaceExp.exec(line)[0];
        return {
            line: line,
            indent: countSpaces(spaces, tabWidth),
            // Boolean indicating whether this line can be reindented.
            locked: false,
            sliceStart: spaces.length,
            sliceEnd: line.length,
        };
    }), options_1.normalize(options).sourceFileName);
    if (cacheable)
        fromStringCache[string] = lines;
    return lines;
}
exports.fromString = fromString;
function isOnlyWhitespace(string) {
    return !/\S/.test(string);
}
function sliceInfo(info, startCol, endCol) {
    var sliceStart = info.sliceStart;
    var sliceEnd = info.sliceEnd;
    var indent = Math.max(info.indent, 0);
    var lineLength = indent + sliceEnd - sliceStart;
    if (typeof endCol === "undefined") {
        endCol = lineLength;
    }
    startCol = Math.max(startCol, 0);
    endCol = Math.min(endCol, lineLength);
    endCol = Math.max(endCol, startCol);
    if (endCol < indent) {
        indent = endCol;
        sliceEnd = sliceStart;
    }
    else {
        sliceEnd -= lineLength - endCol;
    }
    lineLength = endCol;
    lineLength -= startCol;
    if (startCol < indent) {
        indent -= startCol;
    }
    else {
        startCol -= indent;
        indent = 0;
        sliceStart += startCol;
    }
    assert_1.default.ok(indent >= 0);
    assert_1.default.ok(sliceStart <= sliceEnd);
    assert_1.default.strictEqual(lineLength, indent + sliceEnd - sliceStart);
    if (info.indent === indent &&
        info.sliceStart === sliceStart &&
        info.sliceEnd === sliceEnd) {
        return info;
    }
    return {
        line: info.line,
        indent: indent,
        // A destructive slice always unlocks indentation.
        locked: false,
        sliceStart: sliceStart,
        sliceEnd: sliceEnd,
    };
}
function concat(elements) {
    return emptyLines.join(elements);
}
exports.concat = concat;
// The emptyLines object needs to be created all the way down here so that
// Lines.prototype will be fully populated.
var emptyLines = fromString("");

},{"./mapping":40,"./options":41,"./util":45,"assert":1,"source-map":59,"tslib":47}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var assert_1 = tslib_1.__importDefault(require("assert"));
var util_1 = require("./util");
var Mapping = /** @class */ (function () {
    function Mapping(sourceLines, sourceLoc, targetLoc) {
        if (targetLoc === void 0) { targetLoc = sourceLoc; }
        this.sourceLines = sourceLines;
        this.sourceLoc = sourceLoc;
        this.targetLoc = targetLoc;
    }
    Mapping.prototype.slice = function (lines, start, end) {
        if (end === void 0) { end = lines.lastPos(); }
        var sourceLines = this.sourceLines;
        var sourceLoc = this.sourceLoc;
        var targetLoc = this.targetLoc;
        function skip(name) {
            var sourceFromPos = sourceLoc[name];
            var targetFromPos = targetLoc[name];
            var targetToPos = start;
            if (name === "end") {
                targetToPos = end;
            }
            else {
                assert_1.default.strictEqual(name, "start");
            }
            return skipChars(sourceLines, sourceFromPos, lines, targetFromPos, targetToPos);
        }
        if (util_1.comparePos(start, targetLoc.start) <= 0) {
            if (util_1.comparePos(targetLoc.end, end) <= 0) {
                targetLoc = {
                    start: subtractPos(targetLoc.start, start.line, start.column),
                    end: subtractPos(targetLoc.end, start.line, start.column),
                };
                // The sourceLoc can stay the same because the contents of the
                // targetLoc have not changed.
            }
            else if (util_1.comparePos(end, targetLoc.start) <= 0) {
                return null;
            }
            else {
                sourceLoc = {
                    start: sourceLoc.start,
                    end: skip("end"),
                };
                targetLoc = {
                    start: subtractPos(targetLoc.start, start.line, start.column),
                    end: subtractPos(end, start.line, start.column),
                };
            }
        }
        else {
            if (util_1.comparePos(targetLoc.end, start) <= 0) {
                return null;
            }
            if (util_1.comparePos(targetLoc.end, end) <= 0) {
                sourceLoc = {
                    start: skip("start"),
                    end: sourceLoc.end,
                };
                targetLoc = {
                    // Same as subtractPos(start, start.line, start.column):
                    start: { line: 1, column: 0 },
                    end: subtractPos(targetLoc.end, start.line, start.column),
                };
            }
            else {
                sourceLoc = {
                    start: skip("start"),
                    end: skip("end"),
                };
                targetLoc = {
                    // Same as subtractPos(start, start.line, start.column):
                    start: { line: 1, column: 0 },
                    end: subtractPos(end, start.line, start.column),
                };
            }
        }
        return new Mapping(this.sourceLines, sourceLoc, targetLoc);
    };
    Mapping.prototype.add = function (line, column) {
        return new Mapping(this.sourceLines, this.sourceLoc, {
            start: addPos(this.targetLoc.start, line, column),
            end: addPos(this.targetLoc.end, line, column),
        });
    };
    Mapping.prototype.subtract = function (line, column) {
        return new Mapping(this.sourceLines, this.sourceLoc, {
            start: subtractPos(this.targetLoc.start, line, column),
            end: subtractPos(this.targetLoc.end, line, column),
        });
    };
    Mapping.prototype.indent = function (by, skipFirstLine, noNegativeColumns) {
        if (skipFirstLine === void 0) { skipFirstLine = false; }
        if (noNegativeColumns === void 0) { noNegativeColumns = false; }
        if (by === 0) {
            return this;
        }
        var targetLoc = this.targetLoc;
        var startLine = targetLoc.start.line;
        var endLine = targetLoc.end.line;
        if (skipFirstLine && startLine === 1 && endLine === 1) {
            return this;
        }
        targetLoc = {
            start: targetLoc.start,
            end: targetLoc.end,
        };
        if (!skipFirstLine || startLine > 1) {
            var startColumn = targetLoc.start.column + by;
            targetLoc.start = {
                line: startLine,
                column: noNegativeColumns ? Math.max(0, startColumn) : startColumn,
            };
        }
        if (!skipFirstLine || endLine > 1) {
            var endColumn = targetLoc.end.column + by;
            targetLoc.end = {
                line: endLine,
                column: noNegativeColumns ? Math.max(0, endColumn) : endColumn,
            };
        }
        return new Mapping(this.sourceLines, this.sourceLoc, targetLoc);
    };
    return Mapping;
}());
exports.default = Mapping;
function addPos(toPos, line, column) {
    return {
        line: toPos.line + line - 1,
        column: toPos.line === 1 ? toPos.column + column : toPos.column,
    };
}
function subtractPos(fromPos, line, column) {
    return {
        line: fromPos.line - line + 1,
        column: fromPos.line === line ? fromPos.column - column : fromPos.column,
    };
}
function skipChars(sourceLines, sourceFromPos, targetLines, targetFromPos, targetToPos) {
    var targetComparison = util_1.comparePos(targetFromPos, targetToPos);
    if (targetComparison === 0) {
        // Trivial case: no characters to skip.
        return sourceFromPos;
    }
    var sourceCursor, targetCursor;
    if (targetComparison < 0) {
        // Skipping forward.
        sourceCursor =
            sourceLines.skipSpaces(sourceFromPos) || sourceLines.lastPos();
        targetCursor =
            targetLines.skipSpaces(targetFromPos) || targetLines.lastPos();
        var lineDiff = targetToPos.line - targetCursor.line;
        sourceCursor.line += lineDiff;
        targetCursor.line += lineDiff;
        if (lineDiff > 0) {
            // If jumping to later lines, reset columns to the beginnings
            // of those lines.
            sourceCursor.column = 0;
            targetCursor.column = 0;
        }
        else {
            assert_1.default.strictEqual(lineDiff, 0);
        }
        while (util_1.comparePos(targetCursor, targetToPos) < 0 &&
            targetLines.nextPos(targetCursor, true)) {
            assert_1.default.ok(sourceLines.nextPos(sourceCursor, true));
            assert_1.default.strictEqual(sourceLines.charAt(sourceCursor), targetLines.charAt(targetCursor));
        }
    }
    else {
        // Skipping backward.
        sourceCursor =
            sourceLines.skipSpaces(sourceFromPos, true) || sourceLines.firstPos();
        targetCursor =
            targetLines.skipSpaces(targetFromPos, true) || targetLines.firstPos();
        var lineDiff = targetToPos.line - targetCursor.line;
        sourceCursor.line += lineDiff;
        targetCursor.line += lineDiff;
        if (lineDiff < 0) {
            // If jumping to earlier lines, reset columns to the ends of
            // those lines.
            sourceCursor.column = sourceLines.getLineLength(sourceCursor.line);
            targetCursor.column = targetLines.getLineLength(targetCursor.line);
        }
        else {
            assert_1.default.strictEqual(lineDiff, 0);
        }
        while (util_1.comparePos(targetToPos, targetCursor) < 0 &&
            targetLines.prevPos(targetCursor, true)) {
            assert_1.default.ok(sourceLines.prevPos(sourceCursor, true));
            assert_1.default.strictEqual(sourceLines.charAt(sourceCursor), targetLines.charAt(targetCursor));
        }
    }
    return sourceCursor;
}

},{"./util":45,"assert":1,"tslib":47}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = void 0;
var defaults = {
    parser: require("../parsers/esprima"),
    tabWidth: 4,
    useTabs: false,
    reuseWhitespace: true,
    lineTerminator: require("os").EOL || "\n",
    wrapColumn: 74,
    sourceFileName: null,
    sourceMapName: null,
    sourceRoot: null,
    inputSourceMap: null,
    range: false,
    tolerant: true,
    quote: null,
    trailingComma: false,
    arrayBracketSpacing: false,
    objectCurlySpacing: true,
    arrowParensAlways: false,
    flowObjectCommas: true,
    tokens: true,
};
var hasOwn = defaults.hasOwnProperty;
// Copy options and fill in default values.
function normalize(opts) {
    var options = opts || defaults;
    function get(key) {
        return hasOwn.call(options, key) ? options[key] : defaults[key];
    }
    return {
        tabWidth: +get("tabWidth"),
        useTabs: !!get("useTabs"),
        reuseWhitespace: !!get("reuseWhitespace"),
        lineTerminator: get("lineTerminator"),
        wrapColumn: Math.max(get("wrapColumn"), 0),
        sourceFileName: get("sourceFileName"),
        sourceMapName: get("sourceMapName"),
        sourceRoot: get("sourceRoot"),
        inputSourceMap: get("inputSourceMap"),
        parser: get("esprima") || get("parser"),
        range: get("range"),
        tolerant: get("tolerant"),
        quote: get("quote"),
        trailingComma: get("trailingComma"),
        arrayBracketSpacing: get("arrayBracketSpacing"),
        objectCurlySpacing: get("objectCurlySpacing"),
        arrowParensAlways: get("arrowParensAlways"),
        flowObjectCommas: get("flowObjectCommas"),
        tokens: !!get("tokens"),
    };
}
exports.normalize = normalize;

},{"../parsers/esprima":48,"os":35}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
var tslib_1 = require("tslib");
var assert_1 = tslib_1.__importDefault(require("assert"));
var types = tslib_1.__importStar(require("ast-types"));
var b = types.builders;
var isObject = types.builtInTypes.object;
var isArray = types.builtInTypes.array;
var options_1 = require("./options");
var lines_1 = require("./lines");
var comments_1 = require("./comments");
var util = tslib_1.__importStar(require("./util"));
function parse(source, options) {
    options = options_1.normalize(options);
    var lines = lines_1.fromString(source, options);
    var sourceWithoutTabs = lines.toString({
        tabWidth: options.tabWidth,
        reuseWhitespace: false,
        useTabs: false,
    });
    var comments = [];
    var ast = options.parser.parse(sourceWithoutTabs, {
        jsx: true,
        loc: true,
        locations: true,
        range: options.range,
        comment: true,
        onComment: comments,
        tolerant: util.getOption(options, "tolerant", true),
        ecmaVersion: 6,
        sourceType: util.getOption(options, "sourceType", "module"),
    });
    // Use ast.tokens if possible, and otherwise fall back to the Esprima
    // tokenizer. All the preconfigured ../parsers/* expose ast.tokens
    // automatically, but custom parsers might need additional configuration
    // to avoid this fallback.
    var tokens = Array.isArray(ast.tokens)
        ? ast.tokens
        : require("esprima").tokenize(sourceWithoutTabs, {
            loc: true,
        });
    // We will reattach the tokens array to the file object below.
    delete ast.tokens;
    // Make sure every token has a token.value string.
    tokens.forEach(function (token) {
        if (typeof token.value !== "string") {
            token.value = lines.sliceString(token.loc.start, token.loc.end);
        }
    });
    if (Array.isArray(ast.comments)) {
        comments = ast.comments;
        delete ast.comments;
    }
    if (ast.loc) {
        // If the source was empty, some parsers give loc.{start,end}.line
        // values of 0, instead of the minimum of 1.
        util.fixFaultyLocations(ast, lines);
    }
    else {
        ast.loc = {
            start: lines.firstPos(),
            end: lines.lastPos(),
        };
    }
    ast.loc.lines = lines;
    ast.loc.indent = 0;
    var file;
    var program;
    if (ast.type === "Program") {
        program = ast;
        // In order to ensure we reprint leading and trailing program
        // comments, wrap the original Program node with a File node. Only
        // ESTree parsers (Acorn and Esprima) return a Program as the root AST
        // node. Most other (Babylon-like) parsers return a File.
        file = b.file(ast, options.sourceFileName || null);
        file.loc = {
            start: lines.firstPos(),
            end: lines.lastPos(),
            lines: lines,
            indent: 0,
        };
    }
    else if (ast.type === "File") {
        file = ast;
        program = file.program;
    }
    // Expose file.tokens unless the caller passed false for options.tokens.
    if (options.tokens) {
        file.tokens = tokens;
    }
    // Expand the Program's .loc to include all comments (not just those
    // attached to the Program node, as its children may have comments as
    // well), since sometimes program.loc.{start,end} will coincide with the
    // .loc.{start,end} of the first and last *statements*, mistakenly
    // excluding comments that fall outside that region.
    var trueProgramLoc = util.getTrueLoc({
        type: program.type,
        loc: program.loc,
        body: [],
        comments: comments,
    }, lines);
    program.loc.start = trueProgramLoc.start;
    program.loc.end = trueProgramLoc.end;
    // Passing file.program here instead of just file means that initial
    // comments will be attached to program.body[0] instead of program.
    comments_1.attach(comments, program.body.length ? file.program : file, lines);
    // Return a copy of the original AST so that any changes made may be
    // compared to the original.
    return new TreeCopier(lines, tokens).copy(file);
}
exports.parse = parse;
var TreeCopier = function TreeCopier(lines, tokens) {
    assert_1.default.ok(this instanceof TreeCopier);
    this.lines = lines;
    this.tokens = tokens;
    this.startTokenIndex = 0;
    this.endTokenIndex = tokens.length;
    this.indent = 0;
    this.seen = new Map();
};
var TCp = TreeCopier.prototype;
TCp.copy = function (node) {
    if (this.seen.has(node)) {
        return this.seen.get(node);
    }
    if (isArray.check(node)) {
        var copy_1 = new Array(node.length);
        this.seen.set(node, copy_1);
        node.forEach(function (item, i) {
            copy_1[i] = this.copy(item);
        }, this);
        return copy_1;
    }
    if (!isObject.check(node)) {
        return node;
    }
    util.fixFaultyLocations(node, this.lines);
    var copy = Object.create(Object.getPrototypeOf(node), {
        original: {
            // Provide a link from the copy to the original.
            value: node,
            configurable: false,
            enumerable: false,
            writable: true,
        },
    });
    this.seen.set(node, copy);
    var loc = node.loc;
    var oldIndent = this.indent;
    var newIndent = oldIndent;
    var oldStartTokenIndex = this.startTokenIndex;
    var oldEndTokenIndex = this.endTokenIndex;
    if (loc) {
        // When node is a comment, we set node.loc.indent to
        // node.loc.start.column so that, when/if we print the comment by
        // itself, we can strip that much whitespace from the left margin of
        // the comment. This only really matters for multiline Block comments,
        // but it doesn't hurt for Line comments.
        if (node.type === "Block" ||
            node.type === "Line" ||
            node.type === "CommentBlock" ||
            node.type === "CommentLine" ||
            this.lines.isPrecededOnlyByWhitespace(loc.start)) {
            newIndent = this.indent = loc.start.column;
        }
        // Every node.loc has a reference to the original source lines as well
        // as a complete list of source tokens.
        loc.lines = this.lines;
        loc.tokens = this.tokens;
        loc.indent = newIndent;
        // Set loc.start.token and loc.end.token such that
        // loc.tokens.slice(loc.start.token, loc.end.token) returns a list of
        // all the tokens that make up this node.
        this.findTokenRange(loc);
    }
    var keys = Object.keys(node);
    var keyCount = keys.length;
    for (var i = 0; i < keyCount; ++i) {
        var key = keys[i];
        if (key === "loc") {
            copy[key] = node[key];
        }
        else if (key === "tokens" && node.type === "File") {
            // Preserve file.tokens (uncopied) in case client code cares about
            // it, even though Recast ignores it when reprinting.
            copy[key] = node[key];
        }
        else {
            copy[key] = this.copy(node[key]);
        }
    }
    this.indent = oldIndent;
    this.startTokenIndex = oldStartTokenIndex;
    this.endTokenIndex = oldEndTokenIndex;
    return copy;
};
// If we didn't have any idea where in loc.tokens to look for tokens
// contained by this loc, a binary search would be appropriate, but
// because we maintain this.startTokenIndex and this.endTokenIndex as we
// traverse the AST, we only need to make small (linear) adjustments to
// those indexes with each recursive iteration.
TCp.findTokenRange = function (loc) {
    // In the unlikely event that loc.tokens[this.startTokenIndex] starts
    // *after* loc.start, we need to rewind this.startTokenIndex first.
    while (this.startTokenIndex > 0) {
        var token = loc.tokens[this.startTokenIndex];
        if (util.comparePos(loc.start, token.loc.start) < 0) {
            --this.startTokenIndex;
        }
        else
            break;
    }
    // In the unlikely event that loc.tokens[this.endTokenIndex - 1] ends
    // *before* loc.end, we need to fast-forward this.endTokenIndex first.
    while (this.endTokenIndex < loc.tokens.length) {
        var token = loc.tokens[this.endTokenIndex];
        if (util.comparePos(token.loc.end, loc.end) < 0) {
            ++this.endTokenIndex;
        }
        else
            break;
    }
    // Increment this.startTokenIndex until we've found the first token
    // contained by this node.
    while (this.startTokenIndex < this.endTokenIndex) {
        var token = loc.tokens[this.startTokenIndex];
        if (util.comparePos(token.loc.start, loc.start) < 0) {
            ++this.startTokenIndex;
        }
        else
            break;
    }
    // Index into loc.tokens of the first token within this node.
    loc.start.token = this.startTokenIndex;
    // Decrement this.endTokenIndex until we've found the first token after
    // this node (not contained by the node).
    while (this.endTokenIndex > this.startTokenIndex) {
        var token = loc.tokens[this.endTokenIndex - 1];
        if (util.comparePos(loc.end, token.loc.end) < 0) {
            --this.endTokenIndex;
        }
        else
            break;
    }
    // Index into loc.tokens of the first token *after* this node.
    // If loc.start.token === loc.end.token, the node contains no tokens,
    // and the index is that of the next token following this node.
    loc.end.token = this.endTokenIndex;
};

},{"./comments":37,"./lines":39,"./options":41,"./util":45,"assert":1,"ast-types":30,"esprima":33,"tslib":47}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReprinter = exports.Patcher = void 0;
var tslib_1 = require("tslib");
var assert_1 = tslib_1.__importDefault(require("assert"));
var linesModule = tslib_1.__importStar(require("./lines"));
var types = tslib_1.__importStar(require("ast-types"));
var Printable = types.namedTypes.Printable;
var Expression = types.namedTypes.Expression;
var ReturnStatement = types.namedTypes.ReturnStatement;
var SourceLocation = types.namedTypes.SourceLocation;
var util_1 = require("./util");
var fast_path_1 = tslib_1.__importDefault(require("./fast-path"));
var isObject = types.builtInTypes.object;
var isArray = types.builtInTypes.array;
var isString = types.builtInTypes.string;
var riskyAdjoiningCharExp = /[0-9a-z_$]/i;
var Patcher = function Patcher(lines) {
    assert_1.default.ok(this instanceof Patcher);
    assert_1.default.ok(lines instanceof linesModule.Lines);
    var self = this, replacements = [];
    self.replace = function (loc, lines) {
        if (isString.check(lines))
            lines = linesModule.fromString(lines);
        replacements.push({
            lines: lines,
            start: loc.start,
            end: loc.end,
        });
    };
    self.get = function (loc) {
        // If no location is provided, return the complete Lines object.
        loc = loc || {
            start: { line: 1, column: 0 },
            end: { line: lines.length, column: lines.getLineLength(lines.length) },
        };
        var sliceFrom = loc.start, toConcat = [];
        function pushSlice(from, to) {
            assert_1.default.ok(util_1.comparePos(from, to) <= 0);
            toConcat.push(lines.slice(from, to));
        }
        replacements
            .sort(function (a, b) { return util_1.comparePos(a.start, b.start); })
            .forEach(function (rep) {
            if (util_1.comparePos(sliceFrom, rep.start) > 0) {
                // Ignore nested replacement ranges.
            }
            else {
                pushSlice(sliceFrom, rep.start);
                toConcat.push(rep.lines);
                sliceFrom = rep.end;
            }
        });
        pushSlice(sliceFrom, loc.end);
        return linesModule.concat(toConcat);
    };
};
exports.Patcher = Patcher;
var Pp = Patcher.prototype;
Pp.tryToReprintComments = function (newNode, oldNode, print) {
    var patcher = this;
    if (!newNode.comments && !oldNode.comments) {
        // We were (vacuously) able to reprint all the comments!
        return true;
    }
    var newPath = fast_path_1.default.from(newNode);
    var oldPath = fast_path_1.default.from(oldNode);
    newPath.stack.push("comments", getSurroundingComments(newNode));
    oldPath.stack.push("comments", getSurroundingComments(oldNode));
    var reprints = [];
    var ableToReprintComments = findArrayReprints(newPath, oldPath, reprints);
    // No need to pop anything from newPath.stack or oldPath.stack, since
    // newPath and oldPath are fresh local variables.
    if (ableToReprintComments && reprints.length > 0) {
        reprints.forEach(function (reprint) {
            var oldComment = reprint.oldPath.getValue();
            assert_1.default.ok(oldComment.leading || oldComment.trailing);
            patcher.replace(oldComment.loc, 
            // Comments can't have .comments, so it doesn't matter whether we
            // print with comments or without.
            print(reprint.newPath).indentTail(oldComment.loc.indent));
        });
    }
    return ableToReprintComments;
};
// Get all comments that are either leading or trailing, ignoring any
// comments that occur inside node.loc. Returns an empty array for nodes
// with no leading or trailing comments.
function getSurroundingComments(node) {
    var result = [];
    if (node.comments && node.comments.length > 0) {
        node.comments.forEach(function (comment) {
            if (comment.leading || comment.trailing) {
                result.push(comment);
            }
        });
    }
    return result;
}
Pp.deleteComments = function (node) {
    if (!node.comments) {
        return;
    }
    var patcher = this;
    node.comments.forEach(function (comment) {
        if (comment.leading) {
            // Delete leading comments along with any trailing whitespace they
            // might have.
            patcher.replace({
                start: comment.loc.start,
                end: node.loc.lines.skipSpaces(comment.loc.end, false, false),
            }, "");
        }
        else if (comment.trailing) {
            // Delete trailing comments along with any leading whitespace they
            // might have.
            patcher.replace({
                start: node.loc.lines.skipSpaces(comment.loc.start, true, false),
                end: comment.loc.end,
            }, "");
        }
    });
};
function getReprinter(path) {
    assert_1.default.ok(path instanceof fast_path_1.default);
    // Make sure that this path refers specifically to a Node, rather than
    // some non-Node subproperty of a Node.
    var node = path.getValue();
    if (!Printable.check(node))
        return;
    var orig = node.original;
    var origLoc = orig && orig.loc;
    var lines = origLoc && origLoc.lines;
    var reprints = [];
    if (!lines || !findReprints(path, reprints))
        return;
    return function (print) {
        var patcher = new Patcher(lines);
        reprints.forEach(function (reprint) {
            var newNode = reprint.newPath.getValue();
            var oldNode = reprint.oldPath.getValue();
            SourceLocation.assert(oldNode.loc, true);
            var needToPrintNewPathWithComments = !patcher.tryToReprintComments(newNode, oldNode, print);
            if (needToPrintNewPathWithComments) {
                // Since we were not able to preserve all leading/trailing
                // comments, we delete oldNode's comments, print newPath with
                // comments, and then patch the resulting lines where oldNode used
                // to be.
                patcher.deleteComments(oldNode);
            }
            var newLines = print(reprint.newPath, {
                includeComments: needToPrintNewPathWithComments,
                // If the oldNode we're replacing already had parentheses, we may
                // not need to print the new node with any extra parentheses,
                // because the existing parentheses will suffice. However, if the
                // newNode has a different type than the oldNode, let the printer
                // decide if reprint.newPath needs parentheses, as usual.
                avoidRootParens: oldNode.type === newNode.type && reprint.oldPath.hasParens(),
            }).indentTail(oldNode.loc.indent);
            var nls = needsLeadingSpace(lines, oldNode.loc, newLines);
            var nts = needsTrailingSpace(lines, oldNode.loc, newLines);
            // If we try to replace the argument of a ReturnStatement like
            // return"asdf" with e.g. a literal null expression, we run the risk
            // of ending up with returnnull, so we need to add an extra leading
            // space in situations where that might happen. Likewise for
            // "asdf"in obj. See #170.
            if (nls || nts) {
                var newParts = [];
                nls && newParts.push(" ");
                newParts.push(newLines);
                nts && newParts.push(" ");
                newLines = linesModule.concat(newParts);
            }
            patcher.replace(oldNode.loc, newLines);
        });
        // Recall that origLoc is the .loc of an ancestor node that is
        // guaranteed to contain all the reprinted nodes and comments.
        var patchedLines = patcher.get(origLoc).indentTail(-orig.loc.indent);
        if (path.needsParens()) {
            return linesModule.concat(["(", patchedLines, ")"]);
        }
        return patchedLines;
    };
}
exports.getReprinter = getReprinter;
// If the last character before oldLoc and the first character of newLines
// are both identifier characters, they must be separated by a space,
// otherwise they will most likely get fused together into a single token.
function needsLeadingSpace(oldLines, oldLoc, newLines) {
    var posBeforeOldLoc = util_1.copyPos(oldLoc.start);
    // The character just before the location occupied by oldNode.
    var charBeforeOldLoc = oldLines.prevPos(posBeforeOldLoc) && oldLines.charAt(posBeforeOldLoc);
    // First character of the reprinted node.
    var newFirstChar = newLines.charAt(newLines.firstPos());
    return (charBeforeOldLoc &&
        riskyAdjoiningCharExp.test(charBeforeOldLoc) &&
        newFirstChar &&
        riskyAdjoiningCharExp.test(newFirstChar));
}
// If the last character of newLines and the first character after oldLoc
// are both identifier characters, they must be separated by a space,
// otherwise they will most likely get fused together into a single token.
function needsTrailingSpace(oldLines, oldLoc, newLines) {
    // The character just after the location occupied by oldNode.
    var charAfterOldLoc = oldLines.charAt(oldLoc.end);
    var newLastPos = newLines.lastPos();
    // Last character of the reprinted node.
    var newLastChar = newLines.prevPos(newLastPos) && newLines.charAt(newLastPos);
    return (newLastChar &&
        riskyAdjoiningCharExp.test(newLastChar) &&
        charAfterOldLoc &&
        riskyAdjoiningCharExp.test(charAfterOldLoc));
}
function findReprints(newPath, reprints) {
    var newNode = newPath.getValue();
    Printable.assert(newNode);
    var oldNode = newNode.original;
    Printable.assert(oldNode);
    assert_1.default.deepEqual(reprints, []);
    if (newNode.type !== oldNode.type) {
        return false;
    }
    var oldPath = new fast_path_1.default(oldNode);
    var canReprint = findChildReprints(newPath, oldPath, reprints);
    if (!canReprint) {
        // Make absolutely sure the calling code does not attempt to reprint
        // any nodes.
        reprints.length = 0;
    }
    return canReprint;
}
function findAnyReprints(newPath, oldPath, reprints) {
    var newNode = newPath.getValue();
    var oldNode = oldPath.getValue();
    if (newNode === oldNode)
        return true;
    if (isArray.check(newNode))
        return findArrayReprints(newPath, oldPath, reprints);
    if (isObject.check(newNode))
        return findObjectReprints(newPath, oldPath, reprints);
    return false;
}
function findArrayReprints(newPath, oldPath, reprints) {
    var newNode = newPath.getValue();
    var oldNode = oldPath.getValue();
    if (newNode === oldNode ||
        newPath.valueIsDuplicate() ||
        oldPath.valueIsDuplicate()) {
        return true;
    }
    isArray.assert(newNode);
    var len = newNode.length;
    if (!(isArray.check(oldNode) && oldNode.length === len))
        return false;
    for (var i = 0; i < len; ++i) {
        newPath.stack.push(i, newNode[i]);
        oldPath.stack.push(i, oldNode[i]);
        var canReprint = findAnyReprints(newPath, oldPath, reprints);
        newPath.stack.length -= 2;
        oldPath.stack.length -= 2;
        if (!canReprint) {
            return false;
        }
    }
    return true;
}
function findObjectReprints(newPath, oldPath, reprints) {
    var newNode = newPath.getValue();
    isObject.assert(newNode);
    if (newNode.original === null) {
        // If newNode.original node was set to null, reprint the node.
        return false;
    }
    var oldNode = oldPath.getValue();
    if (!isObject.check(oldNode))
        return false;
    if (newNode === oldNode ||
        newPath.valueIsDuplicate() ||
        oldPath.valueIsDuplicate()) {
        return true;
    }
    if (Printable.check(newNode)) {
        if (!Printable.check(oldNode)) {
            return false;
        }
        var newParentNode = newPath.getParentNode();
        var oldParentNode = oldPath.getParentNode();
        if (oldParentNode !== null &&
            oldParentNode.type === "FunctionTypeAnnotation" &&
            newParentNode !== null &&
            newParentNode.type === "FunctionTypeAnnotation") {
            var oldNeedsParens = oldParentNode.params.length !== 1 || !!oldParentNode.params[0].name;
            var newNeedParens = newParentNode.params.length !== 1 || !!newParentNode.params[0].name;
            if (!oldNeedsParens && newNeedParens) {
                return false;
            }
        }
        // Here we need to decide whether the reprinted code for newNode is
        // appropriate for patching into the location of oldNode.
        if (newNode.type === oldNode.type) {
            var childReprints = [];
            if (findChildReprints(newPath, oldPath, childReprints)) {
                reprints.push.apply(reprints, childReprints);
            }
            else if (oldNode.loc) {
                // If we have no .loc information for oldNode, then we won't be
                // able to reprint it.
                reprints.push({
                    oldPath: oldPath.copy(),
                    newPath: newPath.copy(),
                });
            }
            else {
                return false;
            }
            return true;
        }
        if (Expression.check(newNode) &&
            Expression.check(oldNode) &&
            // If we have no .loc information for oldNode, then we won't be
            // able to reprint it.
            oldNode.loc) {
            // If both nodes are subtypes of Expression, then we should be able
            // to fill the location occupied by the old node with code printed
            // for the new node with no ill consequences.
            reprints.push({
                oldPath: oldPath.copy(),
                newPath: newPath.copy(),
            });
            return true;
        }
        // The nodes have different types, and at least one of the types is
        // not a subtype of the Expression type, so we cannot safely assume
        // the nodes are syntactically interchangeable.
        return false;
    }
    return findChildReprints(newPath, oldPath, reprints);
}
function findChildReprints(newPath, oldPath, reprints) {
    var newNode = newPath.getValue();
    var oldNode = oldPath.getValue();
    isObject.assert(newNode);
    isObject.assert(oldNode);
    if (newNode.original === null) {
        // If newNode.original node was set to null, reprint the node.
        return false;
    }
    // If this node needs parentheses and will not be wrapped with
    // parentheses when reprinted, then return false to skip reprinting and
    // let it be printed generically.
    if (newPath.needsParens() && !oldPath.hasParens()) {
        return false;
    }
    var keys = util_1.getUnionOfKeys(oldNode, newNode);
    if (oldNode.type === "File" || newNode.type === "File") {
        // Don't bother traversing file.tokens, an often very large array
        // returned by Babylon, and useless for our purposes.
        delete keys.tokens;
    }
    // Don't bother traversing .loc objects looking for reprintable nodes.
    delete keys.loc;
    var originalReprintCount = reprints.length;
    for (var k in keys) {
        if (k.charAt(0) === "_") {
            // Ignore "private" AST properties added by e.g. Babel plugins and
            // parsers like Babylon.
            continue;
        }
        newPath.stack.push(k, types.getFieldValue(newNode, k));
        oldPath.stack.push(k, types.getFieldValue(oldNode, k));
        var canReprint = findAnyReprints(newPath, oldPath, reprints);
        newPath.stack.length -= 2;
        oldPath.stack.length -= 2;
        if (!canReprint) {
            return false;
        }
    }
    // Return statements might end up running into ASI issues due to
    // comments inserted deep within the tree, so reprint them if anything
    // changed within them.
    if (ReturnStatement.check(newPath.getNode()) &&
        reprints.length > originalReprintCount) {
        return false;
    }
    return true;
}

},{"./fast-path":38,"./lines":39,"./util":45,"assert":1,"ast-types":30,"tslib":47}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Printer = void 0;
var tslib_1 = require("tslib");
var assert_1 = tslib_1.__importDefault(require("assert"));
var comments_1 = require("./comments");
var lines_1 = require("./lines");
var options_1 = require("./options");
var patcher_1 = require("./patcher");
var types = tslib_1.__importStar(require("ast-types"));
var namedTypes = types.namedTypes;
var isString = types.builtInTypes.string;
var isObject = types.builtInTypes.object;
var fast_path_1 = tslib_1.__importDefault(require("./fast-path"));
var util = tslib_1.__importStar(require("./util"));
var PrintResult = function PrintResult(code, sourceMap) {
    assert_1.default.ok(this instanceof PrintResult);
    isString.assert(code);
    this.code = code;
    if (sourceMap) {
        isObject.assert(sourceMap);
        this.map = sourceMap;
    }
};
var PRp = PrintResult.prototype;
var warnedAboutToString = false;
PRp.toString = function () {
    if (!warnedAboutToString) {
        console.warn("Deprecation warning: recast.print now returns an object with " +
            "a .code property. You appear to be treating the object as a " +
            "string, which might still work but is strongly discouraged.");
        warnedAboutToString = true;
    }
    return this.code;
};
var emptyPrintResult = new PrintResult("");
var Printer = function Printer(config) {
    assert_1.default.ok(this instanceof Printer);
    var explicitTabWidth = config && config.tabWidth;
    config = options_1.normalize(config);
    // It's common for client code to pass the same options into both
    // recast.parse and recast.print, but the Printer doesn't need (and
    // can be confused by) config.sourceFileName, so we null it out.
    config.sourceFileName = null;
    // Non-destructively modifies options with overrides, and returns a
    // new print function that uses the modified options.
    function makePrintFunctionWith(options, overrides) {
        options = Object.assign({}, options, overrides);
        return function (path) { return print(path, options); };
    }
    function print(path, options) {
        assert_1.default.ok(path instanceof fast_path_1.default);
        options = options || {};
        if (options.includeComments) {
            return comments_1.printComments(path, makePrintFunctionWith(options, {
                includeComments: false,
            }));
        }
        var oldTabWidth = config.tabWidth;
        if (!explicitTabWidth) {
            var loc = path.getNode().loc;
            if (loc && loc.lines && loc.lines.guessTabWidth) {
                config.tabWidth = loc.lines.guessTabWidth();
            }
        }
        var reprinter = patcher_1.getReprinter(path);
        var lines = reprinter
            ? // Since the print function that we pass to the reprinter will
                // be used to print "new" nodes, it's tempting to think we
                // should pass printRootGenerically instead of print, to avoid
                // calling maybeReprint again, but that would be a mistake
                // because the new nodes might not be entirely new, but merely
                // moved from elsewhere in the AST. The print function is the
                // right choice because it gives us the opportunity to reprint
                // such nodes using their original source.
                reprinter(print)
            : genericPrint(path, config, options, makePrintFunctionWith(options, {
                includeComments: true,
                avoidRootParens: false,
            }));
        config.tabWidth = oldTabWidth;
        return lines;
    }
    this.print = function (ast) {
        if (!ast) {
            return emptyPrintResult;
        }
        var lines = print(fast_path_1.default.from(ast), {
            includeComments: true,
            avoidRootParens: false,
        });
        return new PrintResult(lines.toString(config), util.composeSourceMaps(config.inputSourceMap, lines.getSourceMap(config.sourceMapName, config.sourceRoot)));
    };
    this.printGenerically = function (ast) {
        if (!ast) {
            return emptyPrintResult;
        }
        // Print the entire AST generically.
        function printGenerically(path) {
            return comments_1.printComments(path, function (path) {
                return genericPrint(path, config, {
                    includeComments: true,
                    avoidRootParens: false,
                }, printGenerically);
            });
        }
        var path = fast_path_1.default.from(ast);
        var oldReuseWhitespace = config.reuseWhitespace;
        // Do not reuse whitespace (or anything else, for that matter)
        // when printing generically.
        config.reuseWhitespace = false;
        // TODO Allow printing of comments?
        var pr = new PrintResult(printGenerically(path).toString(config));
        config.reuseWhitespace = oldReuseWhitespace;
        return pr;
    };
};
exports.Printer = Printer;
function genericPrint(path, config, options, printPath) {
    assert_1.default.ok(path instanceof fast_path_1.default);
    var node = path.getValue();
    var parts = [];
    var linesWithoutParens = genericPrintNoParens(path, config, printPath);
    if (!node || linesWithoutParens.isEmpty()) {
        return linesWithoutParens;
    }
    var shouldAddParens = node.extra ? node.extra.parenthesized : false;
    var decoratorsLines = printDecorators(path, printPath);
    if (decoratorsLines.isEmpty()) {
        // Nodes with decorators can't have parentheses, so we can avoid
        // computing path.needsParens() except in this case.
        if (!options.avoidRootParens) {
            shouldAddParens = shouldAddParens || path.needsParens();
        }
    }
    else {
        parts.push(decoratorsLines);
    }
    if (shouldAddParens) {
        parts.unshift("(");
    }
    parts.push(linesWithoutParens);
    if (shouldAddParens) {
        parts.push(")");
    }
    return lines_1.concat(parts);
}
// Note that the `options` parameter of this function is what other
// functions in this file call the `config` object (that is, the
// configuration object originally passed into the Printer constructor).
// Its properties are documented in lib/options.js.
function genericPrintNoParens(path, options, print) {
    var n = path.getValue();
    if (!n) {
        return lines_1.fromString("");
    }
    if (typeof n === "string") {
        return lines_1.fromString(n, options);
    }
    namedTypes.Printable.assert(n);
    var parts = [];
    switch (n.type) {
        case "File":
            return path.call(print, "program");
        case "Program":
            // Babel 6
            if (n.directives) {
                path.each(function (childPath) {
                    parts.push(print(childPath), ";\n");
                }, "directives");
            }
            if (n.interpreter) {
                parts.push(path.call(print, "interpreter"));
            }
            parts.push(path.call(function (bodyPath) { return printStatementSequence(bodyPath, options, print); }, "body"));
            return lines_1.concat(parts);
        case "Noop": // Babel extension.
        case "EmptyStatement":
            return lines_1.fromString("");
        case "ExpressionStatement":
            return lines_1.concat([path.call(print, "expression"), ";"]);
        case "ParenthesizedExpression": // Babel extension.
            return lines_1.concat(["(", path.call(print, "expression"), ")"]);
        case "BinaryExpression":
        case "LogicalExpression":
        case "AssignmentExpression":
            return lines_1.fromString(" ").join([
                path.call(print, "left"),
                n.operator,
                path.call(print, "right"),
            ]);
        case "AssignmentPattern":
            return lines_1.concat([
                path.call(print, "left"),
                " = ",
                path.call(print, "right"),
            ]);
        case "MemberExpression":
        case "OptionalMemberExpression": {
            parts.push(path.call(print, "object"));
            var property = path.call(print, "property");
            // Like n.optional, except with defaults applied, so optional
            // defaults to true for OptionalMemberExpression nodes.
            var optional = types.getFieldValue(n, "optional");
            if (n.computed) {
                parts.push(optional ? "?.[" : "[", property, "]");
            }
            else {
                parts.push(optional ? "?." : ".", property);
            }
            return lines_1.concat(parts);
        }
        case "ChainExpression":
            return path.call(print, "expression");
        case "MetaProperty":
            return lines_1.concat([
                path.call(print, "meta"),
                ".",
                path.call(print, "property"),
            ]);
        case "BindExpression":
            if (n.object) {
                parts.push(path.call(print, "object"));
            }
            parts.push("::", path.call(print, "callee"));
            return lines_1.concat(parts);
        case "Path":
            return lines_1.fromString(".").join(n.body);
        case "Identifier":
            return lines_1.concat([
                lines_1.fromString(n.name, options),
                n.optional ? "?" : "",
                path.call(print, "typeAnnotation"),
            ]);
        case "SpreadElement":
        case "SpreadElementPattern":
        case "RestProperty": // Babel 6 for ObjectPattern
        case "SpreadProperty":
        case "SpreadPropertyPattern":
        case "ObjectTypeSpreadProperty":
        case "RestElement":
            return lines_1.concat([
                "...",
                path.call(print, "argument"),
                path.call(print, "typeAnnotation"),
            ]);
        case "FunctionDeclaration":
        case "FunctionExpression":
        case "TSDeclareFunction":
            if (n.declare) {
                parts.push("declare ");
            }
            if (n.async) {
                parts.push("async ");
            }
            parts.push("function");
            if (n.generator)
                parts.push("*");
            if (n.id) {
                parts.push(" ", path.call(print, "id"), path.call(print, "typeParameters"));
            }
            else {
                if (n.typeParameters) {
                    parts.push(path.call(print, "typeParameters"));
                }
            }
            parts.push("(", printFunctionParams(path, options, print), ")", path.call(print, "returnType"));
            if (n.body) {
                parts.push(" ", path.call(print, "body"));
            }
            return lines_1.concat(parts);
        case "ArrowFunctionExpression":
            if (n.async) {
                parts.push("async ");
            }
            if (n.typeParameters) {
                parts.push(path.call(print, "typeParameters"));
            }
            if (!options.arrowParensAlways &&
                n.params.length === 1 &&
                !n.rest &&
                n.params[0].type === "Identifier" &&
                !n.params[0].typeAnnotation &&
                !n.returnType) {
                parts.push(path.call(print, "params", 0));
            }
            else {
                parts.push("(", printFunctionParams(path, options, print), ")", path.call(print, "returnType"));
            }
            parts.push(" => ", path.call(print, "body"));
            return lines_1.concat(parts);
        case "MethodDefinition":
            return printMethod(path, options, print);
        case "YieldExpression":
            parts.push("yield");
            if (n.delegate)
                parts.push("*");
            if (n.argument)
                parts.push(" ", path.call(print, "argument"));
            return lines_1.concat(parts);
        case "AwaitExpression":
            parts.push("await");
            if (n.all)
                parts.push("*");
            if (n.argument)
                parts.push(" ", path.call(print, "argument"));
            return lines_1.concat(parts);
        case "ModuleDeclaration":
            parts.push("module", path.call(print, "id"));
            if (n.source) {
                assert_1.default.ok(!n.body);
                parts.push("from", path.call(print, "source"));
            }
            else {
                parts.push(path.call(print, "body"));
            }
            return lines_1.fromString(" ").join(parts);
        case "ImportSpecifier":
            if (n.importKind && n.importKind !== "value") {
                parts.push(n.importKind + " ");
            }
            if (n.imported) {
                parts.push(path.call(print, "imported"));
                if (n.local && n.local.name !== n.imported.name) {
                    parts.push(" as ", path.call(print, "local"));
                }
            }
            else if (n.id) {
                parts.push(path.call(print, "id"));
                if (n.name) {
                    parts.push(" as ", path.call(print, "name"));
                }
            }
            return lines_1.concat(parts);
        case "ExportSpecifier":
            if (n.local) {
                parts.push(path.call(print, "local"));
                if (n.exported && n.exported.name !== n.local.name) {
                    parts.push(" as ", path.call(print, "exported"));
                }
            }
            else if (n.id) {
                parts.push(path.call(print, "id"));
                if (n.name) {
                    parts.push(" as ", path.call(print, "name"));
                }
            }
            return lines_1.concat(parts);
        case "ExportBatchSpecifier":
            return lines_1.fromString("*");
        case "ImportNamespaceSpecifier":
            parts.push("* as ");
            if (n.local) {
                parts.push(path.call(print, "local"));
            }
            else if (n.id) {
                parts.push(path.call(print, "id"));
            }
            return lines_1.concat(parts);
        case "ImportDefaultSpecifier":
            if (n.local) {
                return path.call(print, "local");
            }
            return path.call(print, "id");
        case "TSExportAssignment":
            return lines_1.concat(["export = ", path.call(print, "expression")]);
        case "ExportDeclaration":
        case "ExportDefaultDeclaration":
        case "ExportNamedDeclaration":
            return printExportDeclaration(path, options, print);
        case "ExportAllDeclaration":
            parts.push("export *");
            if (n.exported) {
                parts.push(" as ", path.call(print, "exported"));
            }
            parts.push(" from ", path.call(print, "source"), ";");
            return lines_1.concat(parts);
        case "TSNamespaceExportDeclaration":
            parts.push("export as namespace ", path.call(print, "id"));
            return maybeAddSemicolon(lines_1.concat(parts));
        case "ExportNamespaceSpecifier":
            return lines_1.concat(["* as ", path.call(print, "exported")]);
        case "ExportDefaultSpecifier":
            return path.call(print, "exported");
        case "Import":
            return lines_1.fromString("import", options);
        // Recast and ast-types currently support dynamic import(...) using
        // either this dedicated ImportExpression type or a CallExpression
        // whose callee has type Import.
        // https://github.com/benjamn/ast-types/pull/365#issuecomment-605214486
        case "ImportExpression":
            return lines_1.concat(["import(", path.call(print, "source"), ")"]);
        case "ImportDeclaration": {
            parts.push("import ");
            if (n.importKind && n.importKind !== "value") {
                parts.push(n.importKind + " ");
            }
            if (n.specifiers && n.specifiers.length > 0) {
                var unbracedSpecifiers_1 = [];
                var bracedSpecifiers_1 = [];
                path.each(function (specifierPath) {
                    var spec = specifierPath.getValue();
                    if (spec.type === "ImportSpecifier") {
                        bracedSpecifiers_1.push(print(specifierPath));
                    }
                    else if (spec.type === "ImportDefaultSpecifier" ||
                        spec.type === "ImportNamespaceSpecifier") {
                        unbracedSpecifiers_1.push(print(specifierPath));
                    }
                }, "specifiers");
                unbracedSpecifiers_1.forEach(function (lines, i) {
                    if (i > 0) {
                        parts.push(", ");
                    }
                    parts.push(lines);
                });
                if (bracedSpecifiers_1.length > 0) {
                    var lines = lines_1.fromString(", ").join(bracedSpecifiers_1);
                    if (lines.getLineLength(1) > options.wrapColumn) {
                        lines = lines_1.concat([
                            lines_1.fromString(",\n").join(bracedSpecifiers_1).indent(options.tabWidth),
                            ",",
                        ]);
                    }
                    if (unbracedSpecifiers_1.length > 0) {
                        parts.push(", ");
                    }
                    if (lines.length > 1) {
                        parts.push("{\n", lines, "\n}");
                    }
                    else if (options.objectCurlySpacing) {
                        parts.push("{ ", lines, " }");
                    }
                    else {
                        parts.push("{", lines, "}");
                    }
                }
                parts.push(" from ");
            }
            parts.push(path.call(print, "source"), ";");
            return lines_1.concat(parts);
        }
        case "BlockStatement": {
            var naked_1 = path.call(function (bodyPath) { return printStatementSequence(bodyPath, options, print); }, "body");
            if (naked_1.isEmpty()) {
                if (!n.directives || n.directives.length === 0) {
                    return lines_1.fromString("{}");
                }
            }
            parts.push("{\n");
            // Babel 6
            if (n.directives) {
                path.each(function (childPath) {
                    parts.push(maybeAddSemicolon(print(childPath).indent(options.tabWidth)), n.directives.length > 1 || !naked_1.isEmpty() ? "\n" : "");
                }, "directives");
            }
            parts.push(naked_1.indent(options.tabWidth));
            parts.push("\n}");
            return lines_1.concat(parts);
        }
        case "ReturnStatement": {
            parts.push("return");
            if (n.argument) {
                var argLines = path.call(print, "argument");
                if (argLines.startsWithComment() ||
                    (argLines.length > 1 &&
                        namedTypes.JSXElement &&
                        namedTypes.JSXElement.check(n.argument))) {
                    parts.push(" (\n", argLines.indent(options.tabWidth), "\n)");
                }
                else {
                    parts.push(" ", argLines);
                }
            }
            parts.push(";");
            return lines_1.concat(parts);
        }
        case "CallExpression":
        case "OptionalCallExpression":
            parts.push(path.call(print, "callee"));
            if (n.typeParameters) {
                parts.push(path.call(print, "typeParameters"));
            }
            if (n.typeArguments) {
                parts.push(path.call(print, "typeArguments"));
            }
            // Like n.optional, but defaults to true for OptionalCallExpression
            // nodes that are missing an n.optional property (unusual),
            // according to the OptionalCallExpression definition in ast-types.
            if (types.getFieldValue(n, "optional")) {
                parts.push("?.");
            }
            parts.push(printArgumentsList(path, options, print));
            return lines_1.concat(parts);
        case "ObjectExpression":
        case "ObjectPattern":
        case "ObjectTypeAnnotation": {
            var isTypeAnnotation_1 = n.type === "ObjectTypeAnnotation";
            var separator_1 = options.flowObjectCommas
                ? ","
                : isTypeAnnotation_1
                    ? ";"
                    : ",";
            var fields = [];
            var allowBreak_1 = false;
            if (isTypeAnnotation_1) {
                fields.push("indexers", "callProperties");
                if (n.internalSlots != null) {
                    fields.push("internalSlots");
                }
            }
            fields.push("properties");
            var len_1 = 0;
            fields.forEach(function (field) {
                len_1 += n[field].length;
            });
            var oneLine_1 = (isTypeAnnotation_1 && len_1 === 1) || len_1 === 0;
            var leftBrace = n.exact ? "{|" : "{";
            var rightBrace = n.exact ? "|}" : "}";
            parts.push(oneLine_1 ? leftBrace : leftBrace + "\n");
            var leftBraceIndex = parts.length - 1;
            var i_1 = 0;
            fields.forEach(function (field) {
                path.each(function (childPath) {
                    var lines = print(childPath);
                    if (!oneLine_1) {
                        lines = lines.indent(options.tabWidth);
                    }
                    var multiLine = !isTypeAnnotation_1 && lines.length > 1;
                    if (multiLine && allowBreak_1) {
                        // Similar to the logic for BlockStatement.
                        parts.push("\n");
                    }
                    parts.push(lines);
                    if (i_1 < len_1 - 1) {
                        // Add an extra line break if the previous object property
                        // had a multi-line value.
                        parts.push(separator_1 + (multiLine ? "\n\n" : "\n"));
                        allowBreak_1 = !multiLine;
                    }
                    else if (len_1 !== 1 && isTypeAnnotation_1) {
                        parts.push(separator_1);
                    }
                    else if (!oneLine_1 &&
                        util.isTrailingCommaEnabled(options, "objects") &&
                        childPath.getValue().type !== "RestElement") {
                        parts.push(separator_1);
                    }
                    i_1++;
                }, field);
            });
            if (n.inexact) {
                var line = lines_1.fromString("...", options);
                if (oneLine_1) {
                    if (len_1 > 0) {
                        parts.push(separator_1, " ");
                    }
                    parts.push(line);
                }
                else {
                    // No trailing separator after ... to maintain parity with prettier.
                    parts.push("\n", line.indent(options.tabWidth));
                }
            }
            parts.push(oneLine_1 ? rightBrace : "\n" + rightBrace);
            if (i_1 !== 0 && oneLine_1 && options.objectCurlySpacing) {
                parts[leftBraceIndex] = leftBrace + " ";
                parts[parts.length - 1] = " " + rightBrace;
            }
            if (n.typeAnnotation) {
                parts.push(path.call(print, "typeAnnotation"));
            }
            return lines_1.concat(parts);
        }
        case "PropertyPattern":
            return lines_1.concat([
                path.call(print, "key"),
                ": ",
                path.call(print, "pattern"),
            ]);
        case "ObjectProperty": // Babel 6
        case "Property": {
            // Non-standard AST node type.
            if (n.method || n.kind === "get" || n.kind === "set") {
                return printMethod(path, options, print);
            }
            if (n.shorthand && n.value.type === "AssignmentPattern") {
                return path.call(print, "value");
            }
            var key = path.call(print, "key");
            if (n.computed) {
                parts.push("[", key, "]");
            }
            else {
                parts.push(key);
            }
            if (!n.shorthand || n.key.name !== n.value.name) {
                parts.push(": ", path.call(print, "value"));
            }
            return lines_1.concat(parts);
        }
        case "ClassMethod": // Babel 6
        case "ObjectMethod": // Babel 6
        case "ClassPrivateMethod":
        case "TSDeclareMethod":
            return printMethod(path, options, print);
        case "PrivateName":
            return lines_1.concat(["#", path.call(print, "id")]);
        case "Decorator":
            return lines_1.concat(["@", path.call(print, "expression")]);
        case "ArrayExpression":
        case "ArrayPattern": {
            var elems = n.elements;
            var len_2 = elems.length;
            var printed_1 = path.map(print, "elements");
            var joined = lines_1.fromString(", ").join(printed_1);
            var oneLine_2 = joined.getLineLength(1) <= options.wrapColumn;
            if (oneLine_2) {
                if (options.arrayBracketSpacing) {
                    parts.push("[ ");
                }
                else {
                    parts.push("[");
                }
            }
            else {
                parts.push("[\n");
            }
            path.each(function (elemPath) {
                var i = elemPath.getName();
                var elem = elemPath.getValue();
                if (!elem) {
                    // If the array expression ends with a hole, that hole
                    // will be ignored by the interpreter, but if it ends with
                    // two (or more) holes, we need to write out two (or more)
                    // commas so that the resulting code is interpreted with
                    // both (all) of the holes.
                    parts.push(",");
                }
                else {
                    var lines = printed_1[i];
                    if (oneLine_2) {
                        if (i > 0)
                            parts.push(" ");
                    }
                    else {
                        lines = lines.indent(options.tabWidth);
                    }
                    parts.push(lines);
                    if (i < len_2 - 1 ||
                        (!oneLine_2 && util.isTrailingCommaEnabled(options, "arrays")))
                        parts.push(",");
                    if (!oneLine_2)
                        parts.push("\n");
                }
            }, "elements");
            if (oneLine_2 && options.arrayBracketSpacing) {
                parts.push(" ]");
            }
            else {
                parts.push("]");
            }
            if (n.typeAnnotation) {
                parts.push(path.call(print, "typeAnnotation"));
            }
            return lines_1.concat(parts);
        }
        case "SequenceExpression":
            return lines_1.fromString(", ").join(path.map(print, "expressions"));
        case "ThisExpression":
            return lines_1.fromString("this");
        case "Super":
            return lines_1.fromString("super");
        case "NullLiteral": // Babel 6 Literal split
            return lines_1.fromString("null");
        case "RegExpLiteral": // Babel 6 Literal split
            return lines_1.fromString(n.extra.raw);
        case "BigIntLiteral": // Babel 7 Literal split
            return lines_1.fromString(n.value + "n");
        case "NumericLiteral": // Babel 6 Literal Split
            // Keep original representation for numeric values not in base 10.
            if (n.extra &&
                typeof n.extra.raw === "string" &&
                Number(n.extra.raw) === n.value) {
                return lines_1.fromString(n.extra.raw, options);
            }
            return lines_1.fromString(n.value, options);
        case "BooleanLiteral": // Babel 6 Literal split
        case "StringLiteral": // Babel 6 Literal split
        case "Literal":
            // Numeric values may be in bases other than 10. Use their raw
            // representation if equivalent.
            if (typeof n.value === "number" &&
                typeof n.raw === "string" &&
                Number(n.raw) === n.value) {
                return lines_1.fromString(n.raw, options);
            }
            if (typeof n.value !== "string") {
                return lines_1.fromString(n.value, options);
            }
            return lines_1.fromString(nodeStr(n.value, options), options);
        case "Directive": // Babel 6
            return path.call(print, "value");
        case "DirectiveLiteral": // Babel 6
            return lines_1.fromString(nodeStr(n.value, options));
        case "InterpreterDirective":
            return lines_1.fromString("#!" + n.value + "\n", options);
        case "ModuleSpecifier":
            if (n.local) {
                throw new Error("The ESTree ModuleSpecifier type should be abstract");
            }
            // The Esprima ModuleSpecifier type is just a string-valued
            // Literal identifying the imported-from module.
            return lines_1.fromString(nodeStr(n.value, options), options);
        case "UnaryExpression":
            parts.push(n.operator);
            if (/[a-z]$/.test(n.operator))
                parts.push(" ");
            parts.push(path.call(print, "argument"));
            return lines_1.concat(parts);
        case "UpdateExpression":
            parts.push(path.call(print, "argument"), n.operator);
            if (n.prefix)
                parts.reverse();
            return lines_1.concat(parts);
        case "ConditionalExpression":
            return lines_1.concat([
                path.call(print, "test"),
                " ? ",
                path.call(print, "consequent"),
                " : ",
                path.call(print, "alternate"),
            ]);
        case "NewExpression": {
            parts.push("new ", path.call(print, "callee"));
            if (n.typeParameters) {
                parts.push(path.call(print, "typeParameters"));
            }
            if (n.typeArguments) {
                parts.push(path.call(print, "typeArguments"));
            }
            var args = n.arguments;
            if (args) {
                parts.push(printArgumentsList(path, options, print));
            }
            return lines_1.concat(parts);
        }
        case "VariableDeclaration": {
            if (n.declare) {
                parts.push("declare ");
            }
            parts.push(n.kind, " ");
            var maxLen_1 = 0;
            var printed = path.map(function (childPath) {
                var lines = print(childPath);
                maxLen_1 = Math.max(lines.length, maxLen_1);
                return lines;
            }, "declarations");
            if (maxLen_1 === 1) {
                parts.push(lines_1.fromString(", ").join(printed));
            }
            else if (printed.length > 1) {
                parts.push(lines_1.fromString(",\n")
                    .join(printed)
                    .indentTail(n.kind.length + 1));
            }
            else {
                parts.push(printed[0]);
            }
            // We generally want to terminate all variable declarations with a
            // semicolon, except when they are children of for loops.
            var parentNode = path.getParentNode();
            if (!namedTypes.ForStatement.check(parentNode) &&
                !namedTypes.ForInStatement.check(parentNode) &&
                !(namedTypes.ForOfStatement &&
                    namedTypes.ForOfStatement.check(parentNode)) &&
                !(namedTypes.ForAwaitStatement &&
                    namedTypes.ForAwaitStatement.check(parentNode))) {
                parts.push(";");
            }
            return lines_1.concat(parts);
        }
        case "VariableDeclarator":
            return n.init
                ? lines_1.fromString(" = ").join([
                    path.call(print, "id"),
                    path.call(print, "init"),
                ])
                : path.call(print, "id");
        case "WithStatement":
            return lines_1.concat([
                "with (",
                path.call(print, "object"),
                ") ",
                path.call(print, "body"),
            ]);
        case "IfStatement": {
            var con = adjustClause(path.call(print, "consequent"), options);
            parts.push("if (", path.call(print, "test"), ")", con);
            if (n.alternate)
                parts.push(endsWithBrace(con) ? " else" : "\nelse", adjustClause(path.call(print, "alternate"), options));
            return lines_1.concat(parts);
        }
        case "ForStatement": {
            // TODO Get the for (;;) case right.
            var init = path.call(print, "init");
            var sep = init.length > 1 ? ";\n" : "; ";
            var forParen = "for (";
            var indented = lines_1.fromString(sep)
                .join([init, path.call(print, "test"), path.call(print, "update")])
                .indentTail(forParen.length);
            var head = lines_1.concat([forParen, indented, ")"]);
            var clause = adjustClause(path.call(print, "body"), options);
            parts.push(head);
            if (head.length > 1) {
                parts.push("\n");
                clause = clause.trimLeft();
            }
            parts.push(clause);
            return lines_1.concat(parts);
        }
        case "WhileStatement":
            return lines_1.concat([
                "while (",
                path.call(print, "test"),
                ")",
                adjustClause(path.call(print, "body"), options),
            ]);
        case "ForInStatement":
            // Note: esprima can't actually parse "for each (".
            return lines_1.concat([
                n.each ? "for each (" : "for (",
                path.call(print, "left"),
                " in ",
                path.call(print, "right"),
                ")",
                adjustClause(path.call(print, "body"), options),
            ]);
        case "ForOfStatement":
        case "ForAwaitStatement":
            parts.push("for ");
            if (n.await || n.type === "ForAwaitStatement") {
                parts.push("await ");
            }
            parts.push("(", path.call(print, "left"), " of ", path.call(print, "right"), ")", adjustClause(path.call(print, "body"), options));
            return lines_1.concat(parts);
        case "DoWhileStatement": {
            var doBody = lines_1.concat([
                "do",
                adjustClause(path.call(print, "body"), options),
            ]);
            parts.push(doBody);
            if (endsWithBrace(doBody))
                parts.push(" while");
            else
                parts.push("\nwhile");
            parts.push(" (", path.call(print, "test"), ");");
            return lines_1.concat(parts);
        }
        case "DoExpression": {
            var statements = path.call(function (bodyPath) { return printStatementSequence(bodyPath, options, print); }, "body");
            return lines_1.concat(["do {\n", statements.indent(options.tabWidth), "\n}"]);
        }
        case "BreakStatement":
            parts.push("break");
            if (n.label)
                parts.push(" ", path.call(print, "label"));
            parts.push(";");
            return lines_1.concat(parts);
        case "ContinueStatement":
            parts.push("continue");
            if (n.label)
                parts.push(" ", path.call(print, "label"));
            parts.push(";");
            return lines_1.concat(parts);
        case "LabeledStatement":
            return lines_1.concat([
                path.call(print, "label"),
                ":\n",
                path.call(print, "body"),
            ]);
        case "TryStatement":
            parts.push("try ", path.call(print, "block"));
            if (n.handler) {
                parts.push(" ", path.call(print, "handler"));
            }
            else if (n.handlers) {
                path.each(function (handlerPath) {
                    parts.push(" ", print(handlerPath));
                }, "handlers");
            }
            if (n.finalizer) {
                parts.push(" finally ", path.call(print, "finalizer"));
            }
            return lines_1.concat(parts);
        case "CatchClause":
            parts.push("catch ");
            if (n.param) {
                parts.push("(", path.call(print, "param"));
            }
            if (n.guard) {
                // Note: esprima does not recognize conditional catch clauses.
                parts.push(" if ", path.call(print, "guard"));
            }
            if (n.param) {
                parts.push(") ");
            }
            parts.push(path.call(print, "body"));
            return lines_1.concat(parts);
        case "ThrowStatement":
            return lines_1.concat(["throw ", path.call(print, "argument"), ";"]);
        case "SwitchStatement":
            return lines_1.concat([
                "switch (",
                path.call(print, "discriminant"),
                ") {\n",
                lines_1.fromString("\n").join(path.map(print, "cases")),
                "\n}",
            ]);
        // Note: ignoring n.lexical because it has no printing consequences.
        case "SwitchCase":
            if (n.test)
                parts.push("case ", path.call(print, "test"), ":");
            else
                parts.push("default:");
            if (n.consequent.length > 0) {
                parts.push("\n", path
                    .call(function (consequentPath) {
                    return printStatementSequence(consequentPath, options, print);
                }, "consequent")
                    .indent(options.tabWidth));
            }
            return lines_1.concat(parts);
        case "DebuggerStatement":
            return lines_1.fromString("debugger;");
        // JSX extensions below.
        case "JSXAttribute":
            parts.push(path.call(print, "name"));
            if (n.value)
                parts.push("=", path.call(print, "value"));
            return lines_1.concat(parts);
        case "JSXIdentifier":
            return lines_1.fromString(n.name, options);
        case "JSXNamespacedName":
            return lines_1.fromString(":").join([
                path.call(print, "namespace"),
                path.call(print, "name"),
            ]);
        case "JSXMemberExpression":
            return lines_1.fromString(".").join([
                path.call(print, "object"),
                path.call(print, "property"),
            ]);
        case "JSXSpreadAttribute":
            return lines_1.concat(["{...", path.call(print, "argument"), "}"]);
        case "JSXSpreadChild":
            return lines_1.concat(["{...", path.call(print, "expression"), "}"]);
        case "JSXExpressionContainer":
            return lines_1.concat(["{", path.call(print, "expression"), "}"]);
        case "JSXElement":
        case "JSXFragment": {
            var openingPropName = "opening" + (n.type === "JSXElement" ? "Element" : "Fragment");
            var closingPropName = "closing" + (n.type === "JSXElement" ? "Element" : "Fragment");
            var openingLines = path.call(print, openingPropName);
            if (n[openingPropName].selfClosing) {
                assert_1.default.ok(!n[closingPropName], "unexpected " +
                    closingPropName +
                    " element in self-closing " +
                    n.type);
                return openingLines;
            }
            var childLines = lines_1.concat(path.map(function (childPath) {
                var child = childPath.getValue();
                if (namedTypes.Literal.check(child) &&
                    typeof child.value === "string") {
                    if (/\S/.test(child.value)) {
                        return child.value.replace(/^\s+|\s+$/g, "");
                    }
                    else if (/\n/.test(child.value)) {
                        return "\n";
                    }
                }
                return print(childPath);
            }, "children")).indentTail(options.tabWidth);
            var closingLines = path.call(print, closingPropName);
            return lines_1.concat([openingLines, childLines, closingLines]);
        }
        case "JSXOpeningElement": {
            parts.push("<", path.call(print, "name"));
            var attrParts_1 = [];
            path.each(function (attrPath) {
                attrParts_1.push(" ", print(attrPath));
            }, "attributes");
            var attrLines = lines_1.concat(attrParts_1);
            var needLineWrap = attrLines.length > 1 || attrLines.getLineLength(1) > options.wrapColumn;
            if (needLineWrap) {
                attrParts_1.forEach(function (part, i) {
                    if (part === " ") {
                        assert_1.default.strictEqual(i % 2, 0);
                        attrParts_1[i] = "\n";
                    }
                });
                attrLines = lines_1.concat(attrParts_1).indentTail(options.tabWidth);
            }
            parts.push(attrLines, n.selfClosing ? " />" : ">");
            return lines_1.concat(parts);
        }
        case "JSXClosingElement":
            return lines_1.concat(["</", path.call(print, "name"), ">"]);
        case "JSXOpeningFragment":
            return lines_1.fromString("<>");
        case "JSXClosingFragment":
            return lines_1.fromString("</>");
        case "JSXText":
            return lines_1.fromString(n.value, options);
        case "JSXEmptyExpression":
            return lines_1.fromString("");
        case "TypeAnnotatedIdentifier":
            return lines_1.concat([
                path.call(print, "annotation"),
                " ",
                path.call(print, "identifier"),
            ]);
        case "ClassBody":
            if (n.body.length === 0) {
                return lines_1.fromString("{}");
            }
            return lines_1.concat([
                "{\n",
                path
                    .call(function (bodyPath) { return printStatementSequence(bodyPath, options, print); }, "body")
                    .indent(options.tabWidth),
                "\n}",
            ]);
        case "ClassPropertyDefinition":
            parts.push("static ", path.call(print, "definition"));
            if (!namedTypes.MethodDefinition.check(n.definition))
                parts.push(";");
            return lines_1.concat(parts);
        case "ClassProperty": {
            if (n.declare) {
                parts.push("declare ");
            }
            var access = n.accessibility || n.access;
            if (typeof access === "string") {
                parts.push(access, " ");
            }
            if (n.static) {
                parts.push("static ");
            }
            if (n.abstract) {
                parts.push("abstract ");
            }
            if (n.readonly) {
                parts.push("readonly ");
            }
            var key = path.call(print, "key");
            if (n.computed) {
                key = lines_1.concat(["[", key, "]"]);
            }
            if (n.variance) {
                key = lines_1.concat([printVariance(path, print), key]);
            }
            parts.push(key);
            if (n.optional) {
                parts.push("?");
            }
            if (n.typeAnnotation) {
                parts.push(path.call(print, "typeAnnotation"));
            }
            if (n.value) {
                parts.push(" = ", path.call(print, "value"));
            }
            parts.push(";");
            return lines_1.concat(parts);
        }
        case "ClassPrivateProperty":
            if (n.static) {
                parts.push("static ");
            }
            parts.push(path.call(print, "key"));
            if (n.typeAnnotation) {
                parts.push(path.call(print, "typeAnnotation"));
            }
            if (n.value) {
                parts.push(" = ", path.call(print, "value"));
            }
            parts.push(";");
            return lines_1.concat(parts);
        case "ClassDeclaration":
        case "ClassExpression":
            if (n.declare) {
                parts.push("declare ");
            }
            if (n.abstract) {
                parts.push("abstract ");
            }
            parts.push("class");
            if (n.id) {
                parts.push(" ", path.call(print, "id"));
            }
            if (n.typeParameters) {
                parts.push(path.call(print, "typeParameters"));
            }
            if (n.superClass) {
                parts.push(" extends ", path.call(print, "superClass"), path.call(print, "superTypeParameters"));
            }
            if (n["implements"] && n["implements"].length > 0) {
                parts.push(" implements ", lines_1.fromString(", ").join(path.map(print, "implements")));
            }
            parts.push(" ", path.call(print, "body"));
            return lines_1.concat(parts);
        case "TemplateElement":
            return lines_1.fromString(n.value.raw, options).lockIndentTail();
        case "TemplateLiteral": {
            var expressions_1 = path.map(print, "expressions");
            parts.push("`");
            path.each(function (childPath) {
                var i = childPath.getName();
                parts.push(print(childPath));
                if (i < expressions_1.length) {
                    parts.push("${", expressions_1[i], "}");
                }
            }, "quasis");
            parts.push("`");
            return lines_1.concat(parts).lockIndentTail();
        }
        case "TaggedTemplateExpression":
            return lines_1.concat([path.call(print, "tag"), path.call(print, "quasi")]);
        // These types are unprintable because they serve as abstract
        // supertypes for other (printable) types.
        case "Node":
        case "Printable":
        case "SourceLocation":
        case "Position":
        case "Statement":
        case "Function":
        case "Pattern":
        case "Expression":
        case "Declaration":
        case "Specifier":
        case "NamedSpecifier":
        case "Comment": // Supertype of Block and Line
        case "Flow": // Supertype of all Flow AST node types
        case "FlowType": // Supertype of all Flow types
        case "FlowPredicate": // Supertype of InferredPredicate and DeclaredPredicate
        case "MemberTypeAnnotation": // Flow
        case "Type": // Flow
        case "TSHasOptionalTypeParameterInstantiation":
        case "TSHasOptionalTypeParameters":
        case "TSHasOptionalTypeAnnotation":
        case "ChainElement": // Supertype of MemberExpression and CallExpression
            throw new Error("unprintable type: " + JSON.stringify(n.type));
        case "CommentBlock": // Babel block comment.
        case "Block": // Esprima block comment.
            return lines_1.concat(["/*", lines_1.fromString(n.value, options), "*/"]);
        case "CommentLine": // Babel line comment.
        case "Line": // Esprima line comment.
            return lines_1.concat(["//", lines_1.fromString(n.value, options)]);
        // Type Annotations for Facebook Flow, typically stripped out or
        // transformed away before printing.
        case "TypeAnnotation":
            if (n.typeAnnotation) {
                if (n.typeAnnotation.type !== "FunctionTypeAnnotation") {
                    parts.push(": ");
                }
                parts.push(path.call(print, "typeAnnotation"));
                return lines_1.concat(parts);
            }
            return lines_1.fromString("");
        case "ExistentialTypeParam":
        case "ExistsTypeAnnotation":
            return lines_1.fromString("*", options);
        case "EmptyTypeAnnotation":
            return lines_1.fromString("empty", options);
        case "AnyTypeAnnotation":
            return lines_1.fromString("any", options);
        case "MixedTypeAnnotation":
            return lines_1.fromString("mixed", options);
        case "ArrayTypeAnnotation":
            return lines_1.concat([path.call(print, "elementType"), "[]"]);
        case "TupleTypeAnnotation": {
            var printed_2 = path.map(print, "types");
            var joined = lines_1.fromString(", ").join(printed_2);
            var oneLine_3 = joined.getLineLength(1) <= options.wrapColumn;
            if (oneLine_3) {
                if (options.arrayBracketSpacing) {
                    parts.push("[ ");
                }
                else {
                    parts.push("[");
                }
            }
            else {
                parts.push("[\n");
            }
            path.each(function (elemPath) {
                var i = elemPath.getName();
                var elem = elemPath.getValue();
                if (!elem) {
                    // If the array expression ends with a hole, that hole
                    // will be ignored by the interpreter, but if it ends with
                    // two (or more) holes, we need to write out two (or more)
                    // commas so that the resulting code is interpreted with
                    // both (all) of the holes.
                    parts.push(",");
                }
                else {
                    var lines = printed_2[i];
                    if (oneLine_3) {
                        if (i > 0)
                            parts.push(" ");
                    }
                    else {
                        lines = lines.indent(options.tabWidth);
                    }
                    parts.push(lines);
                    if (i < n.types.length - 1 ||
                        (!oneLine_3 && util.isTrailingCommaEnabled(options, "arrays")))
                        parts.push(",");
                    if (!oneLine_3)
                        parts.push("\n");
                }
            }, "types");
            if (oneLine_3 && options.arrayBracketSpacing) {
                parts.push(" ]");
            }
            else {
                parts.push("]");
            }
            return lines_1.concat(parts);
        }
        case "BooleanTypeAnnotation":
            return lines_1.fromString("boolean", options);
        case "BooleanLiteralTypeAnnotation":
            assert_1.default.strictEqual(typeof n.value, "boolean");
            return lines_1.fromString("" + n.value, options);
        case "InterfaceTypeAnnotation":
            parts.push("interface");
            if (n.extends && n.extends.length > 0) {
                parts.push(" extends ", lines_1.fromString(", ").join(path.map(print, "extends")));
            }
            parts.push(" ", path.call(print, "body"));
            return lines_1.concat(parts);
        case "DeclareClass":
            return printFlowDeclaration(path, [
                "class ",
                path.call(print, "id"),
                " ",
                path.call(print, "body"),
            ]);
        case "DeclareFunction":
            return printFlowDeclaration(path, [
                "function ",
                path.call(print, "id"),
                ";",
            ]);
        case "DeclareModule":
            return printFlowDeclaration(path, [
                "module ",
                path.call(print, "id"),
                " ",
                path.call(print, "body"),
            ]);
        case "DeclareModuleExports":
            return printFlowDeclaration(path, [
                "module.exports",
                path.call(print, "typeAnnotation"),
            ]);
        case "DeclareVariable":
            return printFlowDeclaration(path, ["var ", path.call(print, "id"), ";"]);
        case "DeclareExportDeclaration":
        case "DeclareExportAllDeclaration":
            return lines_1.concat(["declare ", printExportDeclaration(path, options, print)]);
        case "EnumDeclaration":
            return lines_1.concat([
                "enum ",
                path.call(print, "id"),
                path.call(print, "body"),
            ]);
        case "EnumBooleanBody":
        case "EnumNumberBody":
        case "EnumStringBody":
        case "EnumSymbolBody": {
            if (n.type === "EnumSymbolBody" || n.explicitType) {
                parts.push(" of ", 
                // EnumBooleanBody => boolean, etc.
                n.type.slice(4, -4).toLowerCase());
            }
            parts.push(" {\n", lines_1.fromString("\n")
                .join(path.map(print, "members"))
                .indent(options.tabWidth), "\n}");
            return lines_1.concat(parts);
        }
        case "EnumDefaultedMember":
            return lines_1.concat([path.call(print, "id"), ","]);
        case "EnumBooleanMember":
        case "EnumNumberMember":
        case "EnumStringMember":
            return lines_1.concat([
                path.call(print, "id"),
                " = ",
                path.call(print, "init"),
                ",",
            ]);
        case "InferredPredicate":
            return lines_1.fromString("%checks", options);
        case "DeclaredPredicate":
            return lines_1.concat(["%checks(", path.call(print, "value"), ")"]);
        case "FunctionTypeAnnotation": {
            // FunctionTypeAnnotation is ambiguous:
            // declare function(a: B): void; OR
            // const A: (a: B) => void;
            var parent = path.getParentNode(0);
            var isArrowFunctionTypeAnnotation = !(namedTypes.ObjectTypeCallProperty.check(parent) ||
                (namedTypes.ObjectTypeInternalSlot.check(parent) && parent.method) ||
                namedTypes.DeclareFunction.check(path.getParentNode(2)));
            var needsColon = isArrowFunctionTypeAnnotation &&
                !namedTypes.FunctionTypeParam.check(parent) &&
                !namedTypes.TypeAlias.check(parent);
            if (needsColon) {
                parts.push(": ");
            }
            var needsParens = n.params.length !== 1 || n.params[0].name;
            parts.push(needsParens ? "(" : "", printFunctionParams(path, options, print), needsParens ? ")" : "");
            // The returnType is not wrapped in a TypeAnnotation, so the colon
            // needs to be added separately.
            if (n.returnType) {
                parts.push(isArrowFunctionTypeAnnotation ? " => " : ": ", path.call(print, "returnType"));
            }
            return lines_1.concat(parts);
        }
        case "FunctionTypeParam": {
            var name = path.call(print, "name");
            parts.push(name);
            if (n.optional) {
                parts.push("?");
            }
            if (name.infos[0].line) {
                parts.push(": ");
            }
            parts.push(path.call(print, "typeAnnotation"));
            return lines_1.concat(parts);
        }
        case "GenericTypeAnnotation":
            return lines_1.concat([
                path.call(print, "id"),
                path.call(print, "typeParameters"),
            ]);
        case "DeclareInterface":
            parts.push("declare ");
        // Fall through to InterfaceDeclaration...
        case "InterfaceDeclaration":
        case "TSInterfaceDeclaration":
            if (n.declare) {
                parts.push("declare ");
            }
            parts.push("interface ", path.call(print, "id"), path.call(print, "typeParameters"), " ");
            if (n["extends"] && n["extends"].length > 0) {
                parts.push("extends ", lines_1.fromString(", ").join(path.map(print, "extends")), " ");
            }
            if (n.body) {
                parts.push(path.call(print, "body"));
            }
            return lines_1.concat(parts);
        case "ClassImplements":
        case "InterfaceExtends":
            return lines_1.concat([
                path.call(print, "id"),
                path.call(print, "typeParameters"),
            ]);
        case "IntersectionTypeAnnotation":
            return lines_1.fromString(" & ").join(path.map(print, "types"));
        case "NullableTypeAnnotation":
            return lines_1.concat(["?", path.call(print, "typeAnnotation")]);
        case "NullLiteralTypeAnnotation":
            return lines_1.fromString("null", options);
        case "ThisTypeAnnotation":
            return lines_1.fromString("this", options);
        case "NumberTypeAnnotation":
            return lines_1.fromString("number", options);
        case "ObjectTypeCallProperty":
            return path.call(print, "value");
        case "ObjectTypeIndexer":
            if (n.static) {
                parts.push("static ");
            }
            parts.push(printVariance(path, print), "[");
            if (n.id) {
                parts.push(path.call(print, "id"), ": ");
            }
            parts.push(path.call(print, "key"), "]: ", path.call(print, "value"));
            return lines_1.concat(parts);
        case "ObjectTypeProperty":
            return lines_1.concat([
                printVariance(path, print),
                path.call(print, "key"),
                n.optional ? "?" : "",
                ": ",
                path.call(print, "value"),
            ]);
        case "ObjectTypeInternalSlot":
            return lines_1.concat([
                n.static ? "static " : "",
                "[[",
                path.call(print, "id"),
                "]]",
                n.optional ? "?" : "",
                n.value.type !== "FunctionTypeAnnotation" ? ": " : "",
                path.call(print, "value"),
            ]);
        case "QualifiedTypeIdentifier":
            return lines_1.concat([
                path.call(print, "qualification"),
                ".",
                path.call(print, "id"),
            ]);
        case "StringLiteralTypeAnnotation":
            return lines_1.fromString(nodeStr(n.value, options), options);
        case "NumberLiteralTypeAnnotation":
        case "NumericLiteralTypeAnnotation":
            assert_1.default.strictEqual(typeof n.value, "number");
            return lines_1.fromString(JSON.stringify(n.value), options);
        case "BigIntLiteralTypeAnnotation":
            return lines_1.fromString(n.raw, options);
        case "StringTypeAnnotation":
            return lines_1.fromString("string", options);
        case "DeclareTypeAlias":
            parts.push("declare ");
        // Fall through to TypeAlias...
        case "TypeAlias":
            return lines_1.concat([
                "type ",
                path.call(print, "id"),
                path.call(print, "typeParameters"),
                " = ",
                path.call(print, "right"),
                ";",
            ]);
        case "DeclareOpaqueType":
            parts.push("declare ");
        // Fall through to OpaqueType...
        case "OpaqueType":
            parts.push("opaque type ", path.call(print, "id"), path.call(print, "typeParameters"));
            if (n["supertype"]) {
                parts.push(": ", path.call(print, "supertype"));
            }
            if (n["impltype"]) {
                parts.push(" = ", path.call(print, "impltype"));
            }
            parts.push(";");
            return lines_1.concat(parts);
        case "TypeCastExpression":
            return lines_1.concat([
                "(",
                path.call(print, "expression"),
                path.call(print, "typeAnnotation"),
                ")",
            ]);
        case "TypeParameterDeclaration":
        case "TypeParameterInstantiation":
            return lines_1.concat([
                "<",
                lines_1.fromString(", ").join(path.map(print, "params")),
                ">",
            ]);
        case "Variance":
            if (n.kind === "plus") {
                return lines_1.fromString("+");
            }
            if (n.kind === "minus") {
                return lines_1.fromString("-");
            }
            return lines_1.fromString("");
        case "TypeParameter":
            if (n.variance) {
                parts.push(printVariance(path, print));
            }
            parts.push(path.call(print, "name"));
            if (n.bound) {
                parts.push(path.call(print, "bound"));
            }
            if (n["default"]) {
                parts.push("=", path.call(print, "default"));
            }
            return lines_1.concat(parts);
        case "TypeofTypeAnnotation":
            return lines_1.concat([
                lines_1.fromString("typeof ", options),
                path.call(print, "argument"),
            ]);
        case "UnionTypeAnnotation":
            return lines_1.fromString(" | ").join(path.map(print, "types"));
        case "VoidTypeAnnotation":
            return lines_1.fromString("void", options);
        case "NullTypeAnnotation":
            return lines_1.fromString("null", options);
        case "SymbolTypeAnnotation":
            return lines_1.fromString("symbol", options);
        case "BigIntTypeAnnotation":
            return lines_1.fromString("bigint", options);
        // Type Annotations for TypeScript (when using Babylon as parser)
        case "TSType":
            throw new Error("unprintable type: " + JSON.stringify(n.type));
        case "TSNumberKeyword":
            return lines_1.fromString("number", options);
        case "TSBigIntKeyword":
            return lines_1.fromString("bigint", options);
        case "TSObjectKeyword":
            return lines_1.fromString("object", options);
        case "TSBooleanKeyword":
            return lines_1.fromString("boolean", options);
        case "TSStringKeyword":
            return lines_1.fromString("string", options);
        case "TSSymbolKeyword":
            return lines_1.fromString("symbol", options);
        case "TSAnyKeyword":
            return lines_1.fromString("any", options);
        case "TSVoidKeyword":
            return lines_1.fromString("void", options);
        case "TSThisType":
            return lines_1.fromString("this", options);
        case "TSNullKeyword":
            return lines_1.fromString("null", options);
        case "TSUndefinedKeyword":
            return lines_1.fromString("undefined", options);
        case "TSUnknownKeyword":
            return lines_1.fromString("unknown", options);
        case "TSNeverKeyword":
            return lines_1.fromString("never", options);
        case "TSArrayType":
            return lines_1.concat([path.call(print, "elementType"), "[]"]);
        case "TSLiteralType":
            return path.call(print, "literal");
        case "TSUnionType":
            return lines_1.fromString(" | ").join(path.map(print, "types"));
        case "TSIntersectionType":
            return lines_1.fromString(" & ").join(path.map(print, "types"));
        case "TSConditionalType":
            parts.push(path.call(print, "checkType"), " extends ", path.call(print, "extendsType"), " ? ", path.call(print, "trueType"), " : ", path.call(print, "falseType"));
            return lines_1.concat(parts);
        case "TSInferType":
            parts.push("infer ", path.call(print, "typeParameter"));
            return lines_1.concat(parts);
        case "TSParenthesizedType":
            return lines_1.concat(["(", path.call(print, "typeAnnotation"), ")"]);
        case "TSFunctionType":
            return lines_1.concat([
                path.call(print, "typeParameters"),
                "(",
                printFunctionParams(path, options, print),
                ") => ",
                path.call(print, "typeAnnotation", "typeAnnotation"),
            ]);
        case "TSConstructorType":
            return lines_1.concat([
                "new ",
                path.call(print, "typeParameters"),
                "(",
                printFunctionParams(path, options, print),
                ") => ",
                path.call(print, "typeAnnotation", "typeAnnotation"),
            ]);
        case "TSMappedType": {
            parts.push(n.readonly ? "readonly " : "", "[", path.call(print, "typeParameter"), "]", n.optional ? "?" : "");
            if (n.typeAnnotation) {
                parts.push(": ", path.call(print, "typeAnnotation"), ";");
            }
            return lines_1.concat(["{\n", lines_1.concat(parts).indent(options.tabWidth), "\n}"]);
        }
        case "TSTupleType":
            return lines_1.concat([
                "[",
                lines_1.fromString(", ").join(path.map(print, "elementTypes")),
                "]",
            ]);
        case "TSNamedTupleMember":
            parts.push(path.call(print, "label"));
            if (n.optional) {
                parts.push("?");
            }
            parts.push(": ", path.call(print, "elementType"));
            return lines_1.concat(parts);
        case "TSRestType":
            return lines_1.concat(["...", path.call(print, "typeAnnotation")]);
        case "TSOptionalType":
            return lines_1.concat([path.call(print, "typeAnnotation"), "?"]);
        case "TSIndexedAccessType":
            return lines_1.concat([
                path.call(print, "objectType"),
                "[",
                path.call(print, "indexType"),
                "]",
            ]);
        case "TSTypeOperator":
            return lines_1.concat([
                path.call(print, "operator"),
                " ",
                path.call(print, "typeAnnotation"),
            ]);
        case "TSTypeLiteral": {
            var memberLines = lines_1.fromString(",\n").join(path.map(print, "members"));
            if (memberLines.isEmpty()) {
                return lines_1.fromString("{}", options);
            }
            parts.push("{\n", memberLines.indent(options.tabWidth), "\n}");
            return lines_1.concat(parts);
        }
        case "TSEnumMember":
            parts.push(path.call(print, "id"));
            if (n.initializer) {
                parts.push(" = ", path.call(print, "initializer"));
            }
            return lines_1.concat(parts);
        case "TSTypeQuery":
            return lines_1.concat(["typeof ", path.call(print, "exprName")]);
        case "TSParameterProperty":
            if (n.accessibility) {
                parts.push(n.accessibility, " ");
            }
            if (n.export) {
                parts.push("export ");
            }
            if (n.static) {
                parts.push("static ");
            }
            if (n.readonly) {
                parts.push("readonly ");
            }
            parts.push(path.call(print, "parameter"));
            return lines_1.concat(parts);
        case "TSTypeReference":
            return lines_1.concat([
                path.call(print, "typeName"),
                path.call(print, "typeParameters"),
            ]);
        case "TSQualifiedName":
            return lines_1.concat([path.call(print, "left"), ".", path.call(print, "right")]);
        case "TSAsExpression": {
            var expression = path.call(print, "expression");
            parts.push(expression, lines_1.fromString(" as "), path.call(print, "typeAnnotation"));
            return lines_1.concat(parts);
        }
        case "TSNonNullExpression":
            return lines_1.concat([path.call(print, "expression"), "!"]);
        case "TSTypeAnnotation":
            return lines_1.concat([": ", path.call(print, "typeAnnotation")]);
        case "TSIndexSignature":
            return lines_1.concat([
                n.readonly ? "readonly " : "",
                "[",
                path.map(print, "parameters"),
                "]",
                path.call(print, "typeAnnotation"),
            ]);
        case "TSPropertySignature":
            parts.push(printVariance(path, print), n.readonly ? "readonly " : "");
            if (n.computed) {
                parts.push("[", path.call(print, "key"), "]");
            }
            else {
                parts.push(path.call(print, "key"));
            }
            parts.push(n.optional ? "?" : "", path.call(print, "typeAnnotation"));
            return lines_1.concat(parts);
        case "TSMethodSignature":
            if (n.computed) {
                parts.push("[", path.call(print, "key"), "]");
            }
            else {
                parts.push(path.call(print, "key"));
            }
            if (n.optional) {
                parts.push("?");
            }
            parts.push(path.call(print, "typeParameters"), "(", printFunctionParams(path, options, print), ")", path.call(print, "typeAnnotation"));
            return lines_1.concat(parts);
        case "TSTypePredicate":
            if (n.asserts) {
                parts.push("asserts ");
            }
            parts.push(path.call(print, "parameterName"));
            if (n.typeAnnotation) {
                parts.push(" is ", path.call(print, "typeAnnotation", "typeAnnotation"));
            }
            return lines_1.concat(parts);
        case "TSCallSignatureDeclaration":
            return lines_1.concat([
                path.call(print, "typeParameters"),
                "(",
                printFunctionParams(path, options, print),
                ")",
                path.call(print, "typeAnnotation"),
            ]);
        case "TSConstructSignatureDeclaration":
            if (n.typeParameters) {
                parts.push("new", path.call(print, "typeParameters"));
            }
            else {
                parts.push("new ");
            }
            parts.push("(", printFunctionParams(path, options, print), ")", path.call(print, "typeAnnotation"));
            return lines_1.concat(parts);
        case "TSTypeAliasDeclaration":
            return lines_1.concat([
                n.declare ? "declare " : "",
                "type ",
                path.call(print, "id"),
                path.call(print, "typeParameters"),
                " = ",
                path.call(print, "typeAnnotation"),
                ";",
            ]);
        case "TSTypeParameter": {
            parts.push(path.call(print, "name"));
            // ambiguous because of TSMappedType
            var parent = path.getParentNode(0);
            var isInMappedType = namedTypes.TSMappedType.check(parent);
            if (n.constraint) {
                parts.push(isInMappedType ? " in " : " extends ", path.call(print, "constraint"));
            }
            if (n["default"]) {
                parts.push(" = ", path.call(print, "default"));
            }
            return lines_1.concat(parts);
        }
        case "TSTypeAssertion": {
            parts.push("<", path.call(print, "typeAnnotation"), "> ", path.call(print, "expression"));
            return lines_1.concat(parts);
        }
        case "TSTypeParameterDeclaration":
        case "TSTypeParameterInstantiation":
            return lines_1.concat([
                "<",
                lines_1.fromString(", ").join(path.map(print, "params")),
                ">",
            ]);
        case "TSEnumDeclaration": {
            parts.push(n.declare ? "declare " : "", n.const ? "const " : "", "enum ", path.call(print, "id"));
            var memberLines = lines_1.fromString(",\n").join(path.map(print, "members"));
            if (memberLines.isEmpty()) {
                parts.push(" {}");
            }
            else {
                parts.push(" {\n", memberLines.indent(options.tabWidth), "\n}");
            }
            return lines_1.concat(parts);
        }
        case "TSExpressionWithTypeArguments":
            return lines_1.concat([
                path.call(print, "expression"),
                path.call(print, "typeParameters"),
            ]);
        case "TSInterfaceBody": {
            var lines = lines_1.fromString(";\n").join(path.map(print, "body"));
            if (lines.isEmpty()) {
                return lines_1.fromString("{}", options);
            }
            return lines_1.concat(["{\n", lines.indent(options.tabWidth), ";", "\n}"]);
        }
        case "TSImportType":
            parts.push("import(", path.call(print, "argument"), ")");
            if (n.qualifier) {
                parts.push(".", path.call(print, "qualifier"));
            }
            if (n.typeParameters) {
                parts.push(path.call(print, "typeParameters"));
            }
            return lines_1.concat(parts);
        case "TSImportEqualsDeclaration":
            if (n.isExport) {
                parts.push("export ");
            }
            parts.push("import ", path.call(print, "id"), " = ", path.call(print, "moduleReference"));
            return maybeAddSemicolon(lines_1.concat(parts));
        case "TSExternalModuleReference":
            return lines_1.concat(["require(", path.call(print, "expression"), ")"]);
        case "TSModuleDeclaration": {
            var parent = path.getParentNode();
            if (parent.type === "TSModuleDeclaration") {
                parts.push(".");
            }
            else {
                if (n.declare) {
                    parts.push("declare ");
                }
                if (!n.global) {
                    var isExternal = n.id.type === "StringLiteral" ||
                        (n.id.type === "Literal" && typeof n.id.value === "string");
                    if (isExternal) {
                        parts.push("module ");
                    }
                    else if (n.loc && n.loc.lines && n.id.loc) {
                        var prefix = n.loc.lines.sliceString(n.loc.start, n.id.loc.start);
                        // These keywords are fundamentally ambiguous in the
                        // Babylon parser, and not reflected in the AST, so
                        // the best we can do is to match the original code,
                        // when possible.
                        if (prefix.indexOf("module") >= 0) {
                            parts.push("module ");
                        }
                        else {
                            parts.push("namespace ");
                        }
                    }
                    else {
                        parts.push("namespace ");
                    }
                }
            }
            parts.push(path.call(print, "id"));
            if (n.body && n.body.type === "TSModuleDeclaration") {
                parts.push(path.call(print, "body"));
            }
            else if (n.body) {
                var bodyLines = path.call(print, "body");
                if (bodyLines.isEmpty()) {
                    parts.push(" {}");
                }
                else {
                    parts.push(" {\n", bodyLines.indent(options.tabWidth), "\n}");
                }
            }
            return lines_1.concat(parts);
        }
        case "TSModuleBlock":
            return path.call(function (bodyPath) { return printStatementSequence(bodyPath, options, print); }, "body");
        // Unhandled types below. If encountered, nodes of these types should
        // be either left alone or desugared into AST types that are fully
        // supported by the pretty-printer.
        case "ClassHeritage": // TODO
        case "ComprehensionBlock": // TODO
        case "ComprehensionExpression": // TODO
        case "Glob": // TODO
        case "GeneratorExpression": // TODO
        case "LetStatement": // TODO
        case "LetExpression": // TODO
        case "GraphExpression": // TODO
        case "GraphIndexExpression": // TODO
        case "XMLDefaultDeclaration":
        case "XMLAnyName":
        case "XMLQualifiedIdentifier":
        case "XMLFunctionQualifiedIdentifier":
        case "XMLAttributeSelector":
        case "XMLFilterExpression":
        case "XML":
        case "XMLElement":
        case "XMLList":
        case "XMLEscape":
        case "XMLText":
        case "XMLStartTag":
        case "XMLEndTag":
        case "XMLPointTag":
        case "XMLName":
        case "XMLAttribute":
        case "XMLCdata":
        case "XMLComment":
        case "XMLProcessingInstruction":
        default:
            debugger;
            throw new Error("unknown type: " + JSON.stringify(n.type));
    }
}
function printDecorators(path, printPath) {
    var parts = [];
    var node = path.getValue();
    if (node.decorators &&
        node.decorators.length > 0 &&
        // If the parent node is an export declaration, it will be
        // responsible for printing node.decorators.
        !util.getParentExportDeclaration(path)) {
        path.each(function (decoratorPath) {
            parts.push(printPath(decoratorPath), "\n");
        }, "decorators");
    }
    else if (util.isExportDeclaration(node) &&
        node.declaration &&
        node.declaration.decorators) {
        // Export declarations are responsible for printing any decorators
        // that logically apply to node.declaration.
        path.each(function (decoratorPath) {
            parts.push(printPath(decoratorPath), "\n");
        }, "declaration", "decorators");
    }
    return lines_1.concat(parts);
}
function printStatementSequence(path, options, print) {
    var filtered = [];
    var sawComment = false;
    var sawStatement = false;
    path.each(function (stmtPath) {
        var stmt = stmtPath.getValue();
        // Just in case the AST has been modified to contain falsy
        // "statements," it's safer simply to skip them.
        if (!stmt) {
            return;
        }
        // Skip printing EmptyStatement nodes to avoid leaving stray
        // semicolons lying around.
        if (stmt.type === "EmptyStatement" &&
            !(stmt.comments && stmt.comments.length > 0)) {
            return;
        }
        if (namedTypes.Comment.check(stmt)) {
            // The pretty printer allows a dangling Comment node to act as
            // a Statement when the Comment can't be attached to any other
            // non-Comment node in the tree.
            sawComment = true;
        }
        else if (namedTypes.Statement.check(stmt)) {
            sawStatement = true;
        }
        else {
            // When the pretty printer encounters a string instead of an
            // AST node, it just prints the string. This behavior can be
            // useful for fine-grained formatting decisions like inserting
            // blank lines.
            isString.assert(stmt);
        }
        // We can't hang onto stmtPath outside of this function, because
        // it's just a reference to a mutable FastPath object, so we have
        // to go ahead and print it here.
        filtered.push({
            node: stmt,
            printed: print(stmtPath),
        });
    });
    if (sawComment) {
        assert_1.default.strictEqual(sawStatement, false, "Comments may appear as statements in otherwise empty statement " +
            "lists, but may not coexist with non-Comment nodes.");
    }
    var prevTrailingSpace = null;
    var len = filtered.length;
    var parts = [];
    filtered.forEach(function (info, i) {
        var printed = info.printed;
        var stmt = info.node;
        var multiLine = printed.length > 1;
        var notFirst = i > 0;
        var notLast = i < len - 1;
        var leadingSpace;
        var trailingSpace;
        var lines = stmt && stmt.loc && stmt.loc.lines;
        var trueLoc = lines && options.reuseWhitespace && util.getTrueLoc(stmt, lines);
        if (notFirst) {
            if (trueLoc) {
                var beforeStart = lines.skipSpaces(trueLoc.start, true);
                var beforeStartLine = beforeStart ? beforeStart.line : 1;
                var leadingGap = trueLoc.start.line - beforeStartLine;
                leadingSpace = Array(leadingGap + 1).join("\n");
            }
            else {
                leadingSpace = multiLine ? "\n\n" : "\n";
            }
        }
        else {
            leadingSpace = "";
        }
        if (notLast) {
            if (trueLoc) {
                var afterEnd = lines.skipSpaces(trueLoc.end);
                var afterEndLine = afterEnd ? afterEnd.line : lines.length;
                var trailingGap = afterEndLine - trueLoc.end.line;
                trailingSpace = Array(trailingGap + 1).join("\n");
            }
            else {
                trailingSpace = multiLine ? "\n\n" : "\n";
            }
        }
        else {
            trailingSpace = "";
        }
        parts.push(maxSpace(prevTrailingSpace, leadingSpace), printed);
        if (notLast) {
            prevTrailingSpace = trailingSpace;
        }
        else if (trailingSpace) {
            parts.push(trailingSpace);
        }
    });
    return lines_1.concat(parts);
}
function maxSpace(s1, s2) {
    if (!s1 && !s2) {
        return lines_1.fromString("");
    }
    if (!s1) {
        return lines_1.fromString(s2);
    }
    if (!s2) {
        return lines_1.fromString(s1);
    }
    var spaceLines1 = lines_1.fromString(s1);
    var spaceLines2 = lines_1.fromString(s2);
    if (spaceLines2.length > spaceLines1.length) {
        return spaceLines2;
    }
    return spaceLines1;
}
function printMethod(path, options, print) {
    var node = path.getNode();
    var kind = node.kind;
    var parts = [];
    var nodeValue = node.value;
    if (!namedTypes.FunctionExpression.check(nodeValue)) {
        nodeValue = node;
    }
    var access = node.accessibility || node.access;
    if (typeof access === "string") {
        parts.push(access, " ");
    }
    if (node.static) {
        parts.push("static ");
    }
    if (node.abstract) {
        parts.push("abstract ");
    }
    if (node.readonly) {
        parts.push("readonly ");
    }
    if (nodeValue.async) {
        parts.push("async ");
    }
    if (nodeValue.generator) {
        parts.push("*");
    }
    if (kind === "get" || kind === "set") {
        parts.push(kind, " ");
    }
    var key = path.call(print, "key");
    if (node.computed) {
        key = lines_1.concat(["[", key, "]"]);
    }
    parts.push(key);
    if (node.optional) {
        parts.push("?");
    }
    if (node === nodeValue) {
        parts.push(path.call(print, "typeParameters"), "(", printFunctionParams(path, options, print), ")", path.call(print, "returnType"));
        if (node.body) {
            parts.push(" ", path.call(print, "body"));
        }
        else {
            parts.push(";");
        }
    }
    else {
        parts.push(path.call(print, "value", "typeParameters"), "(", path.call(function (valuePath) { return printFunctionParams(valuePath, options, print); }, "value"), ")", path.call(print, "value", "returnType"));
        if (nodeValue.body) {
            parts.push(" ", path.call(print, "value", "body"));
        }
        else {
            parts.push(";");
        }
    }
    return lines_1.concat(parts);
}
function printArgumentsList(path, options, print) {
    var printed = path.map(print, "arguments");
    var trailingComma = util.isTrailingCommaEnabled(options, "parameters");
    var joined = lines_1.fromString(", ").join(printed);
    if (joined.getLineLength(1) > options.wrapColumn) {
        joined = lines_1.fromString(",\n").join(printed);
        return lines_1.concat([
            "(\n",
            joined.indent(options.tabWidth),
            trailingComma ? ",\n)" : "\n)",
        ]);
    }
    return lines_1.concat(["(", joined, ")"]);
}
function printFunctionParams(path, options, print) {
    var fun = path.getValue();
    var params;
    var printed = [];
    if (fun.params) {
        params = fun.params;
        printed = path.map(print, "params");
    }
    else if (fun.parameters) {
        params = fun.parameters;
        printed = path.map(print, "parameters");
    }
    if (fun.defaults) {
        path.each(function (defExprPath) {
            var i = defExprPath.getName();
            var p = printed[i];
            if (p && defExprPath.getValue()) {
                printed[i] = lines_1.concat([p, " = ", print(defExprPath)]);
            }
        }, "defaults");
    }
    if (fun.rest) {
        printed.push(lines_1.concat(["...", path.call(print, "rest")]));
    }
    var joined = lines_1.fromString(", ").join(printed);
    if (joined.length > 1 || joined.getLineLength(1) > options.wrapColumn) {
        joined = lines_1.fromString(",\n").join(printed);
        if (util.isTrailingCommaEnabled(options, "parameters") &&
            !fun.rest &&
            params[params.length - 1].type !== "RestElement") {
            joined = lines_1.concat([joined, ",\n"]);
        }
        else {
            joined = lines_1.concat([joined, "\n"]);
        }
        return lines_1.concat(["\n", joined.indent(options.tabWidth)]);
    }
    return joined;
}
function printExportDeclaration(path, options, print) {
    var decl = path.getValue();
    var parts = ["export "];
    if (decl.exportKind && decl.exportKind === "type") {
        if (!decl.declaration) {
            parts.push("type ");
        }
    }
    var shouldPrintSpaces = options.objectCurlySpacing;
    namedTypes.Declaration.assert(decl);
    if (decl["default"] || decl.type === "ExportDefaultDeclaration") {
        parts.push("default ");
    }
    if (decl.declaration) {
        parts.push(path.call(print, "declaration"));
    }
    else if (decl.specifiers) {
        if (decl.specifiers.length === 1 &&
            decl.specifiers[0].type === "ExportBatchSpecifier") {
            parts.push("*");
        }
        else if (decl.specifiers.length === 0) {
            parts.push("{}");
        }
        else if (decl.specifiers[0].type === "ExportDefaultSpecifier") {
            var unbracedSpecifiers_2 = [];
            var bracedSpecifiers_2 = [];
            path.each(function (specifierPath) {
                var spec = specifierPath.getValue();
                if (spec.type === "ExportDefaultSpecifier") {
                    unbracedSpecifiers_2.push(print(specifierPath));
                }
                else {
                    bracedSpecifiers_2.push(print(specifierPath));
                }
            }, "specifiers");
            unbracedSpecifiers_2.forEach(function (lines, i) {
                if (i > 0) {
                    parts.push(", ");
                }
                parts.push(lines);
            });
            if (bracedSpecifiers_2.length > 0) {
                var lines_2 = lines_1.fromString(", ").join(bracedSpecifiers_2);
                if (lines_2.getLineLength(1) > options.wrapColumn) {
                    lines_2 = lines_1.concat([
                        lines_1.fromString(",\n").join(bracedSpecifiers_2).indent(options.tabWidth),
                        ",",
                    ]);
                }
                if (unbracedSpecifiers_2.length > 0) {
                    parts.push(", ");
                }
                if (lines_2.length > 1) {
                    parts.push("{\n", lines_2, "\n}");
                }
                else if (options.objectCurlySpacing) {
                    parts.push("{ ", lines_2, " }");
                }
                else {
                    parts.push("{", lines_2, "}");
                }
            }
        }
        else {
            parts.push(shouldPrintSpaces ? "{ " : "{", lines_1.fromString(", ").join(path.map(print, "specifiers")), shouldPrintSpaces ? " }" : "}");
        }
        if (decl.source) {
            parts.push(" from ", path.call(print, "source"));
        }
    }
    var lines = lines_1.concat(parts);
    if (lastNonSpaceCharacter(lines) !== ";" &&
        !(decl.declaration &&
            (decl.declaration.type === "FunctionDeclaration" ||
                decl.declaration.type === "ClassDeclaration" ||
                decl.declaration.type === "TSModuleDeclaration" ||
                decl.declaration.type === "TSInterfaceDeclaration" ||
                decl.declaration.type === "TSEnumDeclaration"))) {
        lines = lines_1.concat([lines, ";"]);
    }
    return lines;
}
function printFlowDeclaration(path, parts) {
    var parentExportDecl = util.getParentExportDeclaration(path);
    if (parentExportDecl) {
        assert_1.default.strictEqual(parentExportDecl.type, "DeclareExportDeclaration");
    }
    else {
        // If the parent node has type DeclareExportDeclaration, then it
        // will be responsible for printing the "declare" token. Otherwise
        // it needs to be printed with this non-exported declaration node.
        parts.unshift("declare ");
    }
    return lines_1.concat(parts);
}
function printVariance(path, print) {
    return path.call(function (variancePath) {
        var value = variancePath.getValue();
        if (value) {
            if (value === "plus") {
                return lines_1.fromString("+");
            }
            if (value === "minus") {
                return lines_1.fromString("-");
            }
            return print(variancePath);
        }
        return lines_1.fromString("");
    }, "variance");
}
function adjustClause(clause, options) {
    if (clause.length > 1)
        return lines_1.concat([" ", clause]);
    return lines_1.concat(["\n", maybeAddSemicolon(clause).indent(options.tabWidth)]);
}
function lastNonSpaceCharacter(lines) {
    var pos = lines.lastPos();
    do {
        var ch = lines.charAt(pos);
        if (/\S/.test(ch))
            return ch;
    } while (lines.prevPos(pos));
}
function endsWithBrace(lines) {
    return lastNonSpaceCharacter(lines) === "}";
}
function swapQuotes(str) {
    return str.replace(/['"]/g, function (m) { return (m === '"' ? "'" : '"'); });
}
function nodeStr(str, options) {
    isString.assert(str);
    switch (options.quote) {
        case "auto": {
            var double = JSON.stringify(str);
            var single = swapQuotes(JSON.stringify(swapQuotes(str)));
            return double.length > single.length ? single : double;
        }
        case "single":
            return swapQuotes(JSON.stringify(swapQuotes(str)));
        case "double":
        default:
            return JSON.stringify(str);
    }
}
function maybeAddSemicolon(lines) {
    var eoc = lastNonSpaceCharacter(lines);
    if (!eoc || "\n};".indexOf(eoc) < 0)
        return lines_1.concat([lines, ";"]);
    return lines;
}

},{"./comments":37,"./fast-path":38,"./lines":39,"./options":41,"./patcher":43,"./util":45,"assert":1,"ast-types":30,"tslib":47}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTrailingCommaEnabled = exports.getParentExportDeclaration = exports.isExportDeclaration = exports.fixFaultyLocations = exports.getTrueLoc = exports.composeSourceMaps = exports.copyPos = exports.comparePos = exports.getUnionOfKeys = exports.getOption = void 0;
var tslib_1 = require("tslib");
var assert_1 = tslib_1.__importDefault(require("assert"));
var types = tslib_1.__importStar(require("ast-types"));
var n = types.namedTypes;
var source_map_1 = tslib_1.__importDefault(require("source-map"));
var SourceMapConsumer = source_map_1.default.SourceMapConsumer;
var SourceMapGenerator = source_map_1.default.SourceMapGenerator;
var hasOwn = Object.prototype.hasOwnProperty;
function getOption(options, key, defaultValue) {
    if (options && hasOwn.call(options, key)) {
        return options[key];
    }
    return defaultValue;
}
exports.getOption = getOption;
function getUnionOfKeys() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var result = {};
    var argc = args.length;
    for (var i = 0; i < argc; ++i) {
        var keys = Object.keys(args[i]);
        var keyCount = keys.length;
        for (var j = 0; j < keyCount; ++j) {
            result[keys[j]] = true;
        }
    }
    return result;
}
exports.getUnionOfKeys = getUnionOfKeys;
function comparePos(pos1, pos2) {
    return pos1.line - pos2.line || pos1.column - pos2.column;
}
exports.comparePos = comparePos;
function copyPos(pos) {
    return {
        line: pos.line,
        column: pos.column,
    };
}
exports.copyPos = copyPos;
function composeSourceMaps(formerMap, latterMap) {
    if (formerMap) {
        if (!latterMap) {
            return formerMap;
        }
    }
    else {
        return latterMap || null;
    }
    var smcFormer = new SourceMapConsumer(formerMap);
    var smcLatter = new SourceMapConsumer(latterMap);
    var smg = new SourceMapGenerator({
        file: latterMap.file,
        sourceRoot: latterMap.sourceRoot,
    });
    var sourcesToContents = {};
    smcLatter.eachMapping(function (mapping) {
        var origPos = smcFormer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn,
        });
        var sourceName = origPos.source;
        if (sourceName === null) {
            return;
        }
        smg.addMapping({
            source: sourceName,
            original: copyPos(origPos),
            generated: {
                line: mapping.generatedLine,
                column: mapping.generatedColumn,
            },
            name: mapping.name,
        });
        var sourceContent = smcFormer.sourceContentFor(sourceName);
        if (sourceContent && !hasOwn.call(sourcesToContents, sourceName)) {
            sourcesToContents[sourceName] = sourceContent;
            smg.setSourceContent(sourceName, sourceContent);
        }
    });
    return smg.toJSON();
}
exports.composeSourceMaps = composeSourceMaps;
function getTrueLoc(node, lines) {
    // It's possible that node is newly-created (not parsed by Esprima),
    // in which case it probably won't have a .loc property (or an
    // .original property for that matter). That's fine; we'll just
    // pretty-print it as usual.
    if (!node.loc) {
        return null;
    }
    var result = {
        start: node.loc.start,
        end: node.loc.end,
    };
    function include(node) {
        expandLoc(result, node.loc);
    }
    // If the node is an export declaration and its .declaration has any
    // decorators, their locations might contribute to the true start/end
    // positions of the export declaration node.
    if (node.declaration &&
        node.declaration.decorators &&
        isExportDeclaration(node)) {
        node.declaration.decorators.forEach(include);
    }
    if (comparePos(result.start, result.end) < 0) {
        // Trim leading whitespace.
        result.start = copyPos(result.start);
        lines.skipSpaces(result.start, false, true);
        if (comparePos(result.start, result.end) < 0) {
            // Trim trailing whitespace, if the end location is not already the
            // same as the start location.
            result.end = copyPos(result.end);
            lines.skipSpaces(result.end, true, true);
        }
    }
    // If the node has any comments, their locations might contribute to
    // the true start/end positions of the node.
    if (node.comments) {
        node.comments.forEach(include);
    }
    return result;
}
exports.getTrueLoc = getTrueLoc;
function expandLoc(parentLoc, childLoc) {
    if (parentLoc && childLoc) {
        if (comparePos(childLoc.start, parentLoc.start) < 0) {
            parentLoc.start = childLoc.start;
        }
        if (comparePos(parentLoc.end, childLoc.end) < 0) {
            parentLoc.end = childLoc.end;
        }
    }
}
function fixFaultyLocations(node, lines) {
    var loc = node.loc;
    if (loc) {
        if (loc.start.line < 1) {
            loc.start.line = 1;
        }
        if (loc.end.line < 1) {
            loc.end.line = 1;
        }
    }
    if (node.type === "File") {
        // Babylon returns File nodes whose .loc.{start,end} do not include
        // leading or trailing whitespace.
        loc.start = lines.firstPos();
        loc.end = lines.lastPos();
    }
    fixForLoopHead(node, lines);
    fixTemplateLiteral(node, lines);
    if (loc && node.decorators) {
        // Expand the .loc of the node responsible for printing the decorators
        // (here, the decorated node) so that it includes node.decorators.
        node.decorators.forEach(function (decorator) {
            expandLoc(loc, decorator.loc);
        });
    }
    else if (node.declaration && isExportDeclaration(node)) {
        // Nullify .loc information for the child declaration so that we never
        // try to reprint it without also reprinting the export declaration.
        node.declaration.loc = null;
        // Expand the .loc of the node responsible for printing the decorators
        // (here, the export declaration) so that it includes node.decorators.
        var decorators = node.declaration.decorators;
        if (decorators) {
            decorators.forEach(function (decorator) {
                expandLoc(loc, decorator.loc);
            });
        }
    }
    else if ((n.MethodDefinition && n.MethodDefinition.check(node)) ||
        (n.Property.check(node) && (node.method || node.shorthand))) {
        // If the node is a MethodDefinition or a .method or .shorthand
        // Property, then the location information stored in
        // node.value.loc is very likely untrustworthy (just the {body}
        // part of a method, or nothing in the case of shorthand
        // properties), so we null out that information to prevent
        // accidental reuse of bogus source code during reprinting.
        node.value.loc = null;
        if (n.FunctionExpression.check(node.value)) {
            // FunctionExpression method values should be anonymous,
            // because their .id fields are ignored anyway.
            node.value.id = null;
        }
    }
    else if (node.type === "ObjectTypeProperty") {
        var loc_1 = node.loc;
        var end = loc_1 && loc_1.end;
        if (end) {
            end = copyPos(end);
            if (lines.prevPos(end) && lines.charAt(end) === ",") {
                // Some parsers accidentally include trailing commas in the
                // .loc.end information for ObjectTypeProperty nodes.
                if ((end = lines.skipSpaces(end, true, true))) {
                    loc_1.end = end;
                }
            }
        }
    }
}
exports.fixFaultyLocations = fixFaultyLocations;
function fixForLoopHead(node, lines) {
    if (node.type !== "ForStatement") {
        return;
    }
    function fix(child) {
        var loc = child && child.loc;
        var start = loc && loc.start;
        var end = loc && copyPos(loc.end);
        while (start && end && comparePos(start, end) < 0) {
            lines.prevPos(end);
            if (lines.charAt(end) === ";") {
                // Update child.loc.end to *exclude* the ';' character.
                loc.end.line = end.line;
                loc.end.column = end.column;
            }
            else {
                break;
            }
        }
    }
    fix(node.init);
    fix(node.test);
    fix(node.update);
}
function fixTemplateLiteral(node, lines) {
    if (node.type !== "TemplateLiteral") {
        return;
    }
    if (node.quasis.length === 0) {
        // If there are no quasi elements, then there is nothing to fix.
        return;
    }
    // node.loc is not present when using export default with a template literal
    if (node.loc) {
        // First we need to exclude the opening ` from the .loc of the first
        // quasi element, in case the parser accidentally decided to include it.
        var afterLeftBackTickPos = copyPos(node.loc.start);
        assert_1.default.strictEqual(lines.charAt(afterLeftBackTickPos), "`");
        assert_1.default.ok(lines.nextPos(afterLeftBackTickPos));
        var firstQuasi = node.quasis[0];
        if (comparePos(firstQuasi.loc.start, afterLeftBackTickPos) < 0) {
            firstQuasi.loc.start = afterLeftBackTickPos;
        }
        // Next we need to exclude the closing ` from the .loc of the last quasi
        // element, in case the parser accidentally decided to include it.
        var rightBackTickPos = copyPos(node.loc.end);
        assert_1.default.ok(lines.prevPos(rightBackTickPos));
        assert_1.default.strictEqual(lines.charAt(rightBackTickPos), "`");
        var lastQuasi = node.quasis[node.quasis.length - 1];
        if (comparePos(rightBackTickPos, lastQuasi.loc.end) < 0) {
            lastQuasi.loc.end = rightBackTickPos;
        }
    }
    // Now we need to exclude ${ and } characters from the .loc's of all
    // quasi elements, since some parsers accidentally include them.
    node.expressions.forEach(function (expr, i) {
        // Rewind from expr.loc.start over any whitespace and the ${ that
        // precedes the expression. The position of the $ should be the same
        // as the .loc.end of the preceding quasi element, but some parsers
        // accidentally include the ${ in the .loc of the quasi element.
        var dollarCurlyPos = lines.skipSpaces(expr.loc.start, true, false);
        if (lines.prevPos(dollarCurlyPos) &&
            lines.charAt(dollarCurlyPos) === "{" &&
            lines.prevPos(dollarCurlyPos) &&
            lines.charAt(dollarCurlyPos) === "$") {
            var quasiBefore = node.quasis[i];
            if (comparePos(dollarCurlyPos, quasiBefore.loc.end) < 0) {
                quasiBefore.loc.end = dollarCurlyPos;
            }
        }
        // Likewise, some parsers accidentally include the } that follows
        // the expression in the .loc of the following quasi element.
        var rightCurlyPos = lines.skipSpaces(expr.loc.end, false, false);
        if (lines.charAt(rightCurlyPos) === "}") {
            assert_1.default.ok(lines.nextPos(rightCurlyPos));
            // Now rightCurlyPos is technically the position just after the }.
            var quasiAfter = node.quasis[i + 1];
            if (comparePos(quasiAfter.loc.start, rightCurlyPos) < 0) {
                quasiAfter.loc.start = rightCurlyPos;
            }
        }
    });
}
function isExportDeclaration(node) {
    if (node)
        switch (node.type) {
            case "ExportDeclaration":
            case "ExportDefaultDeclaration":
            case "ExportDefaultSpecifier":
            case "DeclareExportDeclaration":
            case "ExportNamedDeclaration":
            case "ExportAllDeclaration":
                return true;
        }
    return false;
}
exports.isExportDeclaration = isExportDeclaration;
function getParentExportDeclaration(path) {
    var parentNode = path.getParentNode();
    if (path.getName() === "declaration" && isExportDeclaration(parentNode)) {
        return parentNode;
    }
    return null;
}
exports.getParentExportDeclaration = getParentExportDeclaration;
function isTrailingCommaEnabled(options, context) {
    var trailingComma = options.trailingComma;
    if (typeof trailingComma === "object") {
        return !!trailingComma[context];
    }
    return !!trailingComma;
}
exports.isTrailingCommaEnabled = isTrailingCommaEnabled;

},{"assert":1,"ast-types":30,"source-map":59,"tslib":47}],46:[function(require,module,exports){
(function (process){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.prettyPrint = exports.print = exports.types = exports.parse = void 0;
var tslib_1 = require("tslib");
var fs_1 = tslib_1.__importDefault(require("fs"));
var types = tslib_1.__importStar(require("ast-types"));
exports.types = types;
var parser_1 = require("./lib/parser");
Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return parser_1.parse; } });
var printer_1 = require("./lib/printer");
/**
 * Traverse and potentially modify an abstract syntax tree using a
 * convenient visitor syntax:
 *
 *   recast.visit(ast, {
 *     names: [],
 *     visitIdentifier: function(path) {
 *       var node = path.value;
 *       this.visitor.names.push(node.name);
 *       this.traverse(path);
 *     }
 *   });
 */
var ast_types_1 = require("ast-types");
Object.defineProperty(exports, "visit", { enumerable: true, get: function () { return ast_types_1.visit; } });
/**
 * Reprint a modified syntax tree using as much of the original source
 * code as possible.
 */
function print(node, options) {
    return new printer_1.Printer(options).print(node);
}
exports.print = print;
/**
 * Print without attempting to reuse any original source code.
 */
function prettyPrint(node, options) {
    return new printer_1.Printer(options).printGenerically(node);
}
exports.prettyPrint = prettyPrint;
/**
 * Convenient command-line interface (see e.g. example/add-braces).
 */
function run(transformer, options) {
    return runFile(process.argv[2], transformer, options);
}
exports.run = run;
function runFile(path, transformer, options) {
    fs_1.default.readFile(path, "utf-8", function (err, code) {
        if (err) {
            console.error(err);
            return;
        }
        runString(code, transformer, options);
    });
}
function defaultWriteback(output) {
    process.stdout.write(output);
}
function runString(code, transformer, options) {
    var writeback = options && options.writeback || defaultWriteback;
    transformer(parser_1.parse(code, options), function (node) {
        writeback(print(node, options).code);
    });
}

}).call(this)}).call(this,require('_process'))
},{"./lib/parser":42,"./lib/printer":44,"_process":36,"ast-types":30,"fs":32,"tslib":47}],47:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"dup":31}],48:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
// This module is suitable for passing as options.parser when calling
// recast.parse to process ECMAScript code with Esprima:
//
//   const ast = recast.parse(source, {
//     parser: require("recast/parsers/esprima")
//   });
//
var util_1 = require("../lib/util");
function parse(source, options) {
    var comments = [];
    var ast = require("esprima").parse(source, {
        loc: true,
        locations: true,
        comment: true,
        onComment: comments,
        range: util_1.getOption(options, "range", false),
        tolerant: util_1.getOption(options, "tolerant", true),
        tokens: true,
        jsx: util_1.getOption(options, "jsx", false)
    });
    if (!Array.isArray(ast.comments)) {
        ast.comments = comments;
    }
    return ast;
}
exports.parse = parse;
;

},{"../lib/util":45,"esprima":33}],49:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var has = Object.prototype.hasOwnProperty;
var hasNativeMap = typeof Map !== "undefined";

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet() {
  this._array = [];
  this._set = hasNativeMap ? new Map() : Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet.prototype.size = function ArraySet_size() {
  return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
  var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    if (hasNativeMap) {
      this._set.set(aStr, idx);
    } else {
      this._set[sStr] = idx;
    }
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet.prototype.has = function ArraySet_has(aStr) {
  if (hasNativeMap) {
    return this._set.has(aStr);
  } else {
    var sStr = util.toSetString(aStr);
    return has.call(this._set, sStr);
  }
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (hasNativeMap) {
    var idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
  } else {
    var sStr = util.toSetString(aStr);
    if (has.call(this._set, sStr)) {
      return this._set[sStr];
    }
  }

  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

exports.ArraySet = ArraySet;

},{"./util":58}],50:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var base64 = require('./base64');

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
exports.encode = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};

},{"./base64":51}],51:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
exports.encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
exports.decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};

},{}],52:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  }
  else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    } else {
      return mid;
    }
  }
  else {
    // Our needle is less than aHaystack[mid].
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
    }

    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return mid;
    } else {
      return aLow < 0 ? -1 : aLow;
    }
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};

},{}],53:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');

/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  var lineA = mappingA.generatedLine;
  var lineB = mappingB.generatedLine;
  var columnA = mappingA.generatedColumn;
  var columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a neglibable overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
function MappingList() {
  this._array = [];
  this._sorted = true;
  // Serves as infimum
  this._last = {generatedLine: -1, generatedColumn: 0};
}

/**
 * Iterate through internal items. This method takes the same arguments that
 * `Array.prototype.forEach` takes.
 *
 * NOTE: The order of the mappings is NOT guaranteed.
 */
MappingList.prototype.unsortedForEach =
  function MappingList_forEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  };

/**
 * Add the given source mapping.
 *
 * @param Object aMapping
 */
MappingList.prototype.add = function MappingList_add(aMapping) {
  if (generatedPositionAfter(this._last, aMapping)) {
    this._last = aMapping;
    this._array.push(aMapping);
  } else {
    this._sorted = false;
    this._array.push(aMapping);
  }
};

/**
 * Returns the flat, sorted array of mappings. The mappings are sorted by
 * generated position.
 *
 * WARNING: This method returns internal data without copying, for
 * performance. The return value must NOT be mutated, and should be treated as
 * an immutable borrow. If you want to take ownership, you must make your own
 * copy.
 */
MappingList.prototype.toArray = function MappingList_toArray() {
  if (!this._sorted) {
    this._array.sort(util.compareByGeneratedPositionsInflated);
    this._sorted = true;
  }
  return this._array;
};

exports.MappingList = MappingList;

},{"./util":58}],54:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
exports.quickSort = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};

},{}],55:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var binarySearch = require('./binary-search');
var ArraySet = require('./array-set').ArraySet;
var base64VLQ = require('./base64-vlq');
var quickSort = require('./quick-sort').quickSort;

function SourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
    : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
}

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL);
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number is 1-based.
 *   - column: Optional. the column number in the original source.
 *    The column number is 0-based.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *    line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *    The column number is 0-based.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util.getArg(aArgs, 'column', 0)
    };

    needle.source = this._findSourceIndex(needle.source);
    if (needle.source < 0) {
      return [];
    }

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

exports.SourceMapConsumer = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The first parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util.getArg(sourceMap, 'names', []);
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  if (sourceRoot) {
    sourceRoot = util.normalize(sourceRoot);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
        ? util.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);

  this._absoluteSources = this._sources.toArray().map(function (s) {
    return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
  });

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this._sourceMapURL = aSourceMapURL;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Utility function to find the index of a source.  Returns -1 if not
 * found.
 */
BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
  var relativeSource = aSource;
  if (this.sourceRoot != null) {
    relativeSource = util.relative(this.sourceRoot, relativeSource);
  }

  if (this._sources.has(relativeSource)) {
    return this._sources.indexOf(relativeSource);
  }

  // Maybe aSource is an absolute URL as returned by |sources|.  In
  // this case we can't simply undo the transform.
  var i;
  for (i = 0; i < this._absoluteSources.length; ++i) {
    if (this._absoluteSources[i] == aSource) {
      return i;
    }
  }

  return -1;
};

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @param String aSourceMapURL
 *        The URL at which the source map can be found (optional)
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;
    smc._sourceMapURL = aSourceMapURL;
    smc._absoluteSources = smc._sources.toArray().map(function (s) {
      return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
    });

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort(smc.__originalMappings, util.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._absoluteSources.slice();
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util.compareByGeneratedPositionsDeflated,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
        }
        var name = util.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    var index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }

    var relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util.relative(this.sourceRoot, relativeSource);
    }

    var url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + relativeSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + relativeSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, 'source');
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }

    var needle = {
      source: source,
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util.compareByOriginalPositions,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The first parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sections = util.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet();
  this._names = new ArraySet();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util.getArg(s, 'offset');
    var offsetLine = util.getArg(offset, 'line');
    var offsetColumn = util.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util.getArg(s, 'map'), aSourceMapURL)
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based. 
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer._findSourceIndex(util.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = null;
        if (mapping.name) {
          name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);
        }

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util.compareByOriginalPositions);
  };

exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

},{"./array-set":49,"./base64-vlq":50,"./binary-search":52,"./quick-sort":54,"./util":58}],56:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ = require('./base64-vlq');
var util = require('./util');
var ArraySet = require('./array-set').ArraySet;
var MappingList = require('./mapping-list').MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util.getArg(aArgs, 'file', null);
  this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet();
  this._names = new ArraySet();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}

SourceMapGenerator.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var sourceRelative = sourceFile;
      if (sourceRoot !== null) {
        sourceRelative = util.relative(sourceRoot, sourceFile);
      }

      if (!generator._sources.has(sourceRelative)) {
        generator._sources.add(sourceRelative);
      }

      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util.getArg(aArgs, 'generated');
    var original = util.getArg(aArgs, 'original', null);
    var source = util.getArg(aArgs, 'source', null);
    var name = util.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet();
    var newNames = new ArraySet();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source)
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
        throw new Error(
            'original.line and original.column are not numbers -- you probably meant to omit ' +
            'the original mapping entirely and only map the generated position. If so, pass ' +
            'null for the original mapping instead of an object with empty or null values.'
        );
    }

    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = ''

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64VLQ.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      var key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

exports.SourceMapGenerator = SourceMapGenerator;

},{"./array-set":49,"./base64-vlq":50,"./mapping-list":53,"./util":58}],57:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
var util = require('./util');

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      // The last line of a file might not have a newline.
      var newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[remainingLinesIndex] || '';
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex] || '';
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

exports.SourceNode = SourceNode;

},{"./source-map-generator":56,"./util":58}],58:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || urlRegexp.test(aPath);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 === null) {
    return 1; // aStr2 !== null
  }

  if (aStr2 === null) {
    return -1; // aStr1 !== null
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 */
function parseSourceMapInput(str) {
  return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''));
}
exports.parseSourceMapInput = parseSourceMapInput;

/**
 * Compute the URL of a source given the the source root, the source's
 * URL, and the source map's URL.
 */
function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
  sourceURL = sourceURL || '';

  if (sourceRoot) {
    // This follows what Chrome does.
    if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
      sourceRoot += '/';
    }
    // The spec says:
    //   Line 4: An optional source root, useful for relocating source
    //   files on a server or removing repeated values in the
    //   “sources” entry.  This value is prepended to the individual
    //   entries in the “source” field.
    sourceURL = sourceRoot + sourceURL;
  }

  // Historically, SourceMapConsumer did not take the sourceMapURL as
  // a parameter.  This mode is still somewhat supported, which is why
  // this code block is conditional.  However, it's preferable to pass
  // the source map URL to SourceMapConsumer, so that this function
  // can implement the source URL resolution algorithm as outlined in
  // the spec.  This block is basically the equivalent of:
  //    new URL(sourceURL, sourceMapURL).toString()
  // ... except it avoids using URL, which wasn't available in the
  // older releases of node still supported by this library.
  //
  // The spec says:
  //   If the sources are not absolute URLs after prepending of the
  //   “sourceRoot”, the sources are resolved relative to the
  //   SourceMap (like resolving script src in a html document).
  if (sourceMapURL) {
    var parsed = urlParse(sourceMapURL);
    if (!parsed) {
      throw new Error("sourceMapURL could not be parsed");
    }
    if (parsed.path) {
      // Strip the last path component, but keep the "/".
      var index = parsed.path.lastIndexOf('/');
      if (index >= 0) {
        parsed.path = parsed.path.substring(0, index + 1);
      }
    }
    sourceURL = join(urlGenerate(parsed), sourceURL);
  }

  return normalize(sourceURL);
}
exports.computeSourceURL = computeSourceURL;

},{}],59:[function(require,module,exports){
/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require('./lib/source-map-generator').SourceMapGenerator;
exports.SourceMapConsumer = require('./lib/source-map-consumer').SourceMapConsumer;
exports.SourceNode = require('./lib/source-node').SourceNode;

},{"./lib/source-map-consumer":55,"./lib/source-map-generator":56,"./lib/source-node":57}]},{},[46]);
export default exp(46);