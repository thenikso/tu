import ohm from '../vendor/ohm.mjs';
import recast from '../vendor/recast.mjs';

window.recast = recast;

const MessageTerminatorSymbol = Symbol('MessageTerminator');
const MethodArgsSymbol = Symbol('MethodArgs');
const MethodCompilerSymbol = Symbol('MethodCompiler');
const JsValueSymbol = Symbol('JsValue');

function method(fn, args, compilerFn) {
  fn[MethodArgsSymbol] = args ?? [];
  if (compilerFn) {
    withCompile(fn, compilerFn);
  }
  return fn;
}

function withCompile(fn, compilerFn) {
  fn[MethodCompilerSymbol] = compilerFn;
  return fn;
}

export function environment() {
  const Receiver = Object.create(null, {
    self: {
      get() {
        return this;
      },
    },
    Object: {
      get() {
        return Receiver;
      },
    },
    proto: {
      get() {
        return Object.getPrototypeOf(this);
      },
    },
    clone: {
      value: method(
        function () {
          const obj = Object.create(this);
          obj.init?.();
          return obj;
        },
        [],
        Receiver_clone_compile,
      ),
    },
    do: {
      value: method(
        function (fn) {
          fn.call(this.self);
          return this.self;
        },
        [],
        Receiver_do_compile,
      ),
    },
    print: {
      value: function () {
        console.log(this.asString ? this.asString() : this);
      },
    },
    write: {
      value: function (...str) {
        console.log(...str);
      },
    },
    str: {
      value: function (value) {
        const str = Object.create(Str);
        str[JsValueSymbol] = value;
        return str;
      },
    },
    num: {
      value: function (value) {
        const num = Object.create(Num);
        num[JsValueSymbol] = value;
        return num;
      },
    },
    bool: {
      value: function (value) {
        const bool = Object.create(Bool);
        bool[JsValueSymbol] = value;
        return bool;
      },
    },
    setSlot: {
      value: method(
        function (slotNameString, slotValue) {
          this.self[slotNameString] = slotValue ?? null;
          return slotValue;
        },
        ['slotNameString', 'slotValue'],
        Receiver_setSlot_compile,
      ),
    },
    updateSlot: {
      value: method(
        function (slotNameString, slotValue) {
          if (!(slotNameString in this.self)) {
            throw new Error(`Slot ${slotNameString} does not exist`);
          }
          this.self[slotNameString] = slotValue ?? null;
          return this.self;
        },
        ['slotNameString', 'slotValue'],
        Receiver_setSlot_compile,
      ),
    },
    newSlot: {
      value: function (slotNameString, slotValue) {
        this.setSlot(slotNameString, slotValue);
        const setterName = `set${slotNameString[0].toUpperCase()}${slotNameString.slice(
          1,
        )}`;
        Object.defineProperty(this.self, setterName, {
          enumerable: true,
          value: function (value) {
            this.self.updateSlot(slotNameString, value);
            return this.self;
          },
        });
        return slotValue;
      },
    },
    method: {
      value: method(
        function (...args) {
          const fn = args.pop();
          const argNames = this.call.message.arguments
            ?.slice(0, args.length)
            .map((msg, i) => {
              if (
                msg.isLiteral ||
                msg.isTerminal ||
                !(msg.next?.isTerminal ?? true)
              ) {
                throw new Error(`Expected symbol for argument ${i}`);
              }
              return msg.name;
            });
          const m = method(fn, argNames);
          return m;
        },
        [],
        Receiver_method_compile,
      ),
    },
    list: {
      value: function (...items) {
        return List.clone().append(...items);
      },
    },
  });

  const Str = Object.create(Receiver, {
    [JsValueSymbol]: {
      writable: true,
      value: '',
    },
    asString: {
      value: function () {
        return this[JsValueSymbol];
      },
    },
  });

  const Num = Object.create(Receiver, {
    [JsValueSymbol]: {
      writable: true,
      value: 0,
    },
    asString: {
      value: function () {
        return String(this[JsValueSymbol]);
      },
    },
    '+': {
      value: method(
        function (other) {
          if (typeof other !== 'number') {
            throw new Error(`Expected number`);
          }
          return this.num(this[JsValueSymbol] + other);
        },
        ['other'],
        Num_add_compile,
      ),
    },
  });

  const Bool = Object.create(Receiver, {
    [JsValueSymbol]: {
      writable: true,
      value: false,
    },
    asString: {
      value: function () {
        return String(this[JsValueSymbol]);
      },
    },
  });

  const Nil = Object.create(Receiver, {
    forward: {
      value: () => null,
    },
  });

  const Message = Object.create(Receiver, {
    name: {
      writable: true,
      value: '',
    },
    setName: {
      value: function (name) {
        this.name = name;
        return this;
      },
    },
    arguments: {
      writable: true,
      value: [],
    },
    setArguments: {
      value: function (args) {
        this.arguments = args;
        return this;
      },
    },
    next: {
      writable: true,
      value: null,
    },
    isLiteral: {
      writable: true,
      value: false,
    },
    isTerminal: {
      get() {
        return this.name === MessageTerminatorSymbol;
      },
    },
    last: {
      get() {
        let last = this;
        while (last.next) {
          last = last.next;
        }
        return last;
      },
    },
    asString: {
      value: function Message_asString() {
        let str = '';
        let msg = this;
        let inArgs = false;
        do {
          if (msg.isTerminal) {
            str = str.trimEnd();
            str += ';';
            str += inArgs ? ' ' : '\n';
          } else if (msg.isLiteral) {
            str += JSON.stringify(msg.name) + ' ';
          } else {
            str += msg.name;
            if (msg.arguments?.length > 0) {
              inArgs = true;
              str += '(';
              str += msg.arguments
                .map((arg) => arg.asString().trimEnd())
                .join(', ');
              str += ')';
              inArgs = false;
            }
            str += ' ';
          }
          msg = msg.next;
        } while (msg);
        return str.trim();
      },
    },
    doInContext: {
      value: function (context, locals) {
        return doMessage(env, this, context, locals);
      },
    },
    asJavascript: {
      value: function Message_asJavascript() {
        const ast = compileMessage(env, this);
        const prog = builders.program([
          builders.expressionStatement(
            builders.callExpression(
              builders.memberExpression(
                builders.identifier('environment'),
                builders.identifier('run'),
              ),
              [
                builders.functionExpression(
                  null,
                  [],
                  builders.blockStatement(ast.lines),
                ),
              ],
            ),
          ),
        ]);
        const code = recast.prettyPrint(prog, { tabWidth: 2 }).code;
        return code;
      },
    },
  });

  function message(name, args = null, isLiteral = false) {
    let _previous = null;
    const msg = Object.create(Message, {
      previous: {
        get() {
          return _previous?.deref() ?? null;
        },
        set(value) {
          _previous = value && new WeakRef(value);
        },
      },
      setPrevious: {
        value: function (previous) {
          this.previous = previous;
          return this;
        },
      },
      setNext: {
        value: function (next) {
          this.next = next;
          if (next) {
            next.setPrevious(this);
          }
          return this;
        },
      },
    });
    msg.name = name;
    msg.arguments = args;
    msg.isLiteral = isLiteral;
    return msg;
  }

  function messageTerminator() {
    return message(MessageTerminatorSymbol);
  }

  function messageLiteral(value) {
    return message(value, null, true);
  }

  const Call = Object.create(Receiver);

  function callContext(sender, msg, target, activated) {
    let literalProxy = null;
    switch (typeof target) {
      case 'number':
        literalProxy = env.Lobby.Num;
        break;
      case 'string':
        literalProxy = env.Lobby.Str;
        break;
      case 'boolean':
        literalProxy = env.Lobby.Bool;
        break;
      default:
        if (target === null) {
          literalProxy = env.Lobby.Nil;
        }
    }
    return Object.create(literalProxy ?? target.self, {
      self: {
        value: literalProxy ? target : target.self,
      },
      call: {
        value: Object.create(env.Lobby.Call, {
          target: {
            value: literalProxy ? target : target.self,
          },
          activated: {
            value: activated,
          },
          message: {
            value: msg,
          },
          sender: {
            value: sender,
          },
        }),
      },
    });
  }

  const OperatorTable = Object.create(Receiver, {
    // TODO make it a Map
    operators: {
      enumerable: true,
      value: {
        //0   ? @ @@
        '?': 0,
        '@': 0,
        '@@': 0,
        //1   **
        '**': 1,
        //2   % * /
        '%': 2,
        '*': 2,
        '/': 2,
        //3   + -
        '+': 3,
        '-': 3,
        //4   << >>
        '<<': 4,
        '>>': 4,
        //5   < <= > >=
        '<': 5,
        '<=': 5,
        '>': 5,
        '>=': 5,
        //6   != ==
        '!=': 6,
        '==': 6,
        //7   &
        '&': 7,
        //8   ^
        '^': 8,
        //9   |
        '|': 9,
        //10  && and
        '&&': 10,
        and: 10,
        //11  or ||
        '||': 11,
        or: 11,
        //12  ..
        '..': 12,
        //13  %= &= *= += -= /= <<= >>= ^= |=
        '%=': 13,
        '&=': 13,
        '*=': 13,
        '+=': 13,
        '-=': 13,
        '/=': 13,
        '<<=': 13,
        '>>=': 13,
        '^=': 13,
        '|=': 13,
        //14  return
        return: 14,
      },
    },
    // TODO make a map
    assignOperators: {
      enumerable: true,
      value: {
        '::=': 'newSlot',
        ':=': 'setSlot',
        '=': 'updateSlot',
      },
    },
  });

  const List = Object.create(Receiver, {
    [JsValueSymbol]: {
      writable: true,
      value: [],
    },
    init: {
      value: function List_init() {
        // if (this.self.proto instanceof List) {
        if (this.self.proto === List) {
          this.self[JsValueSymbol] = this.self.proto[JsValueSymbol].slice();
        } else {
          this.self[JsValueSymbol] = [];
        }
        return this.self;
      },
    },
    append: {
      value: function List_append(...items) {
        this.self[JsValueSymbol].push(...items);
        return this.self;
      },
    },
    foreach: {
      value: method(function List_foreach(...args) {
        if (args.length === 1) {
          const body = args[0];
          this.self[JsValueSymbol].forEach((item) => body.call(item));
        } else if (args.length === 2) {
          const eName = this.call.message.arguments?.[0].name;
          if (!eName || typeof eName !== 'string') {
            throw new Error(`argument 0 must be a Symbol`);
          }
          const body = args[1];
          const context = callContext(
            this.self,
            this.call.message.arguments?.[1],
            this.call.sender,
            body,
          );
          this.self[JsValueSymbol].forEach((item) => {
            context[eName] = item;
            body.call(context);
          });
        } else if (args.length === 3) {
          const eName = this.call.message.arguments?.[0].name;
          if (!eName || typeof eName !== 'string') {
            throw new Error(`argument 0 must be a Symbol`);
          }
          const iName = this.call.message.arguments?.[1].name;
          if (!iName || typeof iName !== 'string') {
            throw new Error(`argument 1 must be a Symbol`);
          }
          const body = args[2];
          const context = callContext(
            this.self,
            this.call.message.arguments?.[1],
            this.call.sender,
            body,
          );
          this.self[JsValueSymbol].forEach((item, index) => {
            context[eName] = item;
            context[iName] = index;
            body.call(context);
          });
        } else {
          throw new Error(`wrong number of arguments`);
        }
      }),
    },
  });

  const Core = Object.create(Receiver, {
    Receiver: {
      value: Receiver,
    },
    Message: {
      value: Message,
    },
    Call: {
      value: Call,
    },
    Str: {
      value: Str,
    },
    Num: {
      value: Num,
    },
    Bool: {
      value: Bool,
    },
    List: {
      value: List,
    },
  });

  const Lobby = Object.create(Core, {
    Lobby: {
      get() {
        return Lobby;
      },
    },
  });

  const env = {
    Lobby,
    run(fn) {
      const result = fn.call(Lobby, env);
      return result;
    },
    message,
    messageTerminator,
    messageLiteral,
    parse(code) {
      const match = grammar.match(code, 'Program');
      const assigns = OperatorTable.assignOperators;
      const infixes = OperatorTable.operators;
      const msg = semantics(match).toMessage(env, assigns, infixes);
      return msg;
    },
    eval(code) {
      const msg = env.parse(code);
      const result = msg.doInContext(Lobby);
      return result;
    },
    compile(code) {
      const msg = env.parse(code);
      const result = msg.asJavascript(Lobby);
      return result;
    },
    compileAndRun(code) {
      const jsCode = env.compile(code);
      const jsFun = new Function('environment', jsCode);
      const result = jsFun(env);
      return result;
    },
  };

  return env;
}

//
// DoMessage
//

/**
 * NOTE context should always be a Receiver (not a locals wrapper) and
 * `locals`, if present` should always have a `self` field.
 * @param {*} env
 * @param {*} firstMsg
 * @param {*} context
 * @param {*} locals
 */
function doMessage(env, firstMsg, context, locals) {
  let msg = firstMsg;
  const sender = locals ?? context;

  let cursor = null;
  let target = context;

  let literalProxy = null;
  let slotName;
  let slot;

  do {
    // Terminal resets the context and proceeds to the next message
    if (msg.isTerminal) {
      cursor = null;
      target = context;
      msg = msg.next;
      continue;
    }

    // Literal values are wrapped in a Receiver
    if (msg.isLiteral) {
      switch (typeof msg.name) {
        case 'string':
          cursor = env.Lobby.str(msg.name);
          break;
        case 'number':
          cursor = env.Lobby.num(msg.name);
          break;
        case 'boolean':
          cursor = env.Lobby.bool(msg.name);
          break;
        default:
          throw new Error('Unknown literal type');
      }
      target = cursor;
      msg = msg.next;
      continue;
    }

    // Find slot for symbol messages
    literalProxy = null;
    slotName = msg.name;
    slot = null;
    switch (typeof target) {
      case 'number':
        slot = env.Lobby.Num[slotName];
        literalProxy = env.Lobby.Num;
        break;
      case 'string':
        slot = env.Lobby.Str[slotName];
        literalProxy = env.Lobby.Str;
        break;
      case 'boolean':
        slot = env.Lobby.Bool[slotName];
        literalProxy = env.Lobby.Bool;
        break;
      default:
        if (target === null) {
          slot = env.Lobby.Nil[slotName];
          literalProxy = env.Lobby.Nil;
        } else {
          slot = target[slotName];
        }
    }
    if (typeof slot === 'undefined') {
      if (locals) {
        slot = locals[slotName];
      }
      if (typeof slot === 'undefined' && target.forward) {
        slot = target.forward;
      }
      if (typeof slot === 'undefined') {
        slot = env.Lobby[slotName];
      }
      if (typeof slot === 'undefined') {
        throw new Error(
          `${target.type ?? typeof target} does not respond to '${slotName}'`,
        );
      }
    }

    // Advance cursor to slot
    cursor = slot;

    // Execute cursor if function
    if (typeof cursor === 'function') {
      const newContext = Object.create(literalProxy ?? target.self, {
        self: {
          value: literalProxy ? target : target.self,
        },
        call: {
          value: Object.create(env.Lobby.Call, {
            target: {
              value: literalProxy ? target : target.self,
            },
            activated: {
              value: cursor,
            },
            message: {
              value: msg,
            },
            sender: {
              value: sender,
            },
          }),
        },
      });

      // Eval args
      const localArgs = [];
      const methodArgs = cursor[MethodArgsSymbol];
      const methodArgsCount = methodArgs?.length;
      let argValue;
      let i = 0;
      let l = methodArgsCount ?? msg.arguments?.length;
      if (typeof l !== 'undefined') {
        for (; i < l; i++) {
          argValue = doMessage(env, msg.arguments[i], sender);
          localArgs[i] = argValue;
          if (methodArgs && methodArgsCount > i) {
            newContext[methodArgs[i]] = argValue;
          }
        }

        for (l = msg.arguments?.length; i < l; i++) {
          const bodyMsg = msg.arguments[i];
          localArgs[i] = bodyMsg
            ? function () {
                return doMessage(env, bodyMsg, this);
              }
            : returnNull;
        }
      }

      // Eval function
      cursor = cursor.apply(newContext, localArgs);

      // Safety check for method return
      if (cursor === newContext) {
        throw new Error(
          `Method '${msg.name}' returned 'this' which is not allowed, use 'this.self' instead`,
        );
      }
    }

    // Next message
    target = cursor;
    msg = msg.next;
  } while (msg);

  // Return cursor
  let result = cursor?.[JsValueSymbol] ?? cursor ?? null;
  if (Array.isArray(result)) {
    const listResult = Object.create(env.Lobby.List);
    listResult[JsValueSymbol] = result;
    result = listResult;
  }

  return result;
}

function returnNull() {
  return null;
}

//
// Compile
//

/** @type {import("recast").types.builders} */
const builders = recast.types.builders;

// It compiles!!!!!!!!!
function compileMessage(env, firstMsg, context, locals, accessorExp) {
  let msg = firstMsg;

  const lines = [];
  const rootAccessorExp = accessorExp ?? builders.thisExpression();
  const rootContext = context ?? Object.create(env.Lobby);

  let currentExp = rootAccessorExp;
  let currentContext = rootContext;
  let currentContextLiteral = null;

  do {
    if (msg.isTerminal) {
      lines.push(builders.expressionStatement(currentExp));
      currentExp = rootAccessorExp;
      currentContext = rootContext;
      msg = msg.next;
      continue;
    }

    currentContextLiteral = null;
    if (msg.isLiteral) {
      switch (typeof msg.name) {
        case 'string':
          currentContext = env.Lobby.Str;
          currentExp = compile_thisLobbyXcall('str', [
            builders.literal(msg.name),
          ]);
          currentContextLiteral = currentExp;
          break;
        case 'number':
          currentContext = env.Lobby.Num;
          currentExp = compile_thisLobbyXcall('num', [
            builders.literal(msg.name),
          ]);
          currentContextLiteral = currentExp;
          break;
        case 'boolean':
          currentContext = env.Lobby.Bool;
          currentExp = compile_thisLobbyXcall('bool', [
            builders.literal(msg.name),
          ]);
          currentContextLiteral = currentExp;
          break;
        default:
          throw new Error('Unknown literal type');
      }
      msg = msg.next;
      continue;
    }

    const slot = currentContext[msg.name];
    const slotCompile = slot?.[MethodCompilerSymbol];
    if (slotCompile) {
      const compiled = slotCompile(
        env,
        msg,
        currentContext,
        locals,
        currentExp,
      );
      currentExp = compiled.lines[0].expression;
      if (compiled.currentContext) {
        currentContext = compiled.currentContext;
      }
    } else {
      if (locals?.[msg.name]) {
        // Accessing locals, this is used in methods body with parameters
        currentExp = builders.identifier(msg.name);
      } else {
        // Accessing the current context
        currentExp = builders.memberExpression(
          currentExp,
          builders.identifier(msg.name),
        );
      }
      if (slot) {
        if (typeof slot === 'function') {
          const args = msg.arguments?.map((arg) => {
            const argComp = compileMessage(
              env,
              arg,
              rootContext,
              locals,
              rootAccessorExp,
            );
            if (argComp.lines.length === 1) {
              return argComp.lines[0].expression;
            } else {
              throw new Error('Not implemented');
            }
          });
          currentExp = builders.callExpression(currentExp, args ?? []);
        } else {
          currentContext = slot;
        }
      }
    }

    msg = msg.next;
  } while (msg);

  if (currentExp !== rootAccessorExp) {
    if (currentExp === currentContextLiteral) {
      lines.push(
        builders.expressionStatement(currentContextLiteral.arguments[0]),
      );
      currentContextLiteral = null;
    } else {
      lines.push(builders.expressionStatement(currentExp));
    }
  } else {
    lines.push(builders.expressionStatement(builders.nullLiteral()));
  }

  return { lines, currentContext };
}

function compile_thisLobbyXcall(x, args) {
  return builders.callExpression(
    builders.memberExpression(
      builders.memberExpression(
        builders.thisExpression(),
        builders.identifier('Lobby'),
      ),
      builders.identifier(x),
    ),
    args,
  );
}

function Receiver_setSlot_compile(env, msg, context, locals, accessorExp) {
  const val = compileMessage(
    env,
    msg.arguments[1],
    context,
    locals,
    accessorExp,
  );
  const ast = builders.assignmentExpression(
    '=',
    builders.memberExpression(
      accessorExp,
      builders.identifier(msg.arguments[0].name),
    ),
    val.lines[0].expression,
  );
  context[msg.arguments[0].name] = val.currentContext;
  return {
    lines: [builders.expressionStatement(ast)],
    currentContext: context,
  };
}

function Receiver_clone_compile(env, msg, context, locals, accessorExp) {
  const ast = builders.callExpression(
    builders.memberExpression(accessorExp, builders.identifier('clone')),
    [],
  );
  const currentContext = Object.create(context);
  return {
    lines: [builders.expressionStatement(ast)],
    currentContext,
  };
}

function Receiver_do_compile(env, msg, context, locals, accessorExp) {
  const thisSelf = builders.memberExpression(
    builders.thisExpression(),
    builders.identifier('self'),
  );
  const body = compileMessage(env, msg.arguments[0], context, locals, thisSelf);
  const bodyLines = body.lines;
  bodyLines.push(builders.returnStatement(thisSelf));
  const ast = builders.callExpression(
    builders.memberExpression(accessorExp, builders.identifier('do')),
    [builders.functionExpression(null, [], builders.blockStatement(bodyLines))],
  );
  return {
    lines: [builders.expressionStatement(ast)],
    currentContext: context,
  };
}

function Receiver_method_compile(env, msg, context, locals, accessorExp) {
  const thisSelf = builders.memberExpression(
    builders.thisExpression(),
    builders.identifier('self'),
  );
  const argNames = msg.arguments.slice(0, -1).map((argMsg) => argMsg.name);
  // TODO how to set the proper proto to locals?
  const bodyLocals = Object.create(locals ?? null);
  for (const argName of argNames) {
    bodyLocals[argName] = true;
  }
  const body = compileMessage(
    env,
    msg.arguments[msg.arguments.length - 1],
    context,
    bodyLocals,
    thisSelf,
  );
  const bodyLines = body.lines;
  bodyLines[bodyLines.length - 1] = builders.returnStatement(
    bodyLines[bodyLines.length - 1].expression,
  );
  const fn = builders.functionExpression(
    null,
    argNames.map((argName) => builders.identifier(argName)),
    builders.blockStatement(bodyLines),
  );
  return {
    lines: [builders.expressionStatement(fn)],
    // TODO how to make something more clever?
    currentContext: function () {},
  };
}

function Num_add_compile(env, msg, context, locals, accessorExp) {
  const val = compileMessage(
    env,
    msg.arguments[0],
    context,
    locals,
    accessorExp,
  );
  const ast = builders.binaryExpression(
    '+',
    accessorExp,
    val.lines[0].expression,
  );
  return {
    lines: [builders.expressionStatement(ast)],
    currentContext: context,
  };
}

//
// Parser
//

const grammar = ohm.grammar(String.raw`Io {
  Program
    = Exps Terminator?

  Exps
    = Exps Terminator Exp -- many
    | Exp                 -- single

  Exp
    = Exp Message                      -- multiMessage
    | Message                          -- singleMessage
    | "(" Exp ")"                      -- parentheses
    | "{" Exp "}"                      -- curlyBrackets
    | "[" Exp "]"                      -- squareBrackets

  Message
    = Symbol Arguments -- args
    | Symbol

  Arguments
    = "(" ListOf<Exps, ","> Terminator? ")"

  Symbol
    = number | string | ident

  Terminator
    = ";" // this should? have a newline after it but as syntactic rule it doesn't work
          // I should convert all to lexycal? maybe later

  ident  (an identifier)
    = (~("(" | ")" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space | alnum) any)+
    | (~("(" | ")" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space) alnum)+

  number (a number)
    = digit* "." digit+  -- float
    | digit+             -- int
    // TODO exponentials, hex

  // TODO escape sequences
  string
  	= "\"" (~"\"" any)* "\""
}`);
const semantics = grammar.createSemantics();
semantics.addOperation('toMessage(env, assigns, infixes)', {
  Program(exps, _1) {
    const { env, assigns: assignsMacros, infixes: infixPriorities } = this.args;
    const allInfixes = Array.from(Object.keys(infixPriorities));
    const assigns = {
      macros: assignsMacros,
      messagesByMacro: {},
    };
    const infixes = {
      allInfixes,
      priorities: infixPriorities,
      messagesByPriority: {},
      // A syntethic message name to be used in the case of infix resolution
      groupEndSymbol: Symbol('groupEnd'),
      // In the case an exp starts with a parathesis, we need to terminate infix
      // resolution early. We save those messages here because they need to be
      // removed from the final message anyway.
      groupEndMessages: [],
    };
    let msg = exps.toMessage(env, assigns, infixes);

    //
    // apply assign macros
    //

    // a := b -> setSlot("a", b)
    for (const [assignMethod, messages] of Object.entries(
      assigns.messagesByMacro,
    )) {
      for (const assignOp of messages) {
        const assignName = assignOp.previous;
        const assignFollow = assignName?.previous;
        const assignValue = assignOp.next;
        let assignEnd = assignValue.next;
        while (assignEnd && !assignEnd?.isTerminal) {
          assignEnd = assignEnd.next;
        }
        if (!assignName) {
          throw new Error(`Missing assign name`);
        }
        if (assignName.isLiteral) {
          throw new Error(`Assign name must be a symbol`);
        }
        if (assignName.arguments?.length > 0) {
          throw new Error(`Assign name must not have arguments`);
        }
        if (!assignValue) {
          throw new Error(`Missing assign value`);
        }
        if (assignEnd) {
          assignEnd.previous?.setNext(null);
        }
        const assignLiteral = env.messageLiteral(assignName.name);
        assignName.setName(assignMethod);
        assignName.setArguments([assignLiteral, assignValue]);
        assignName.setNext(assignEnd);
      }
    }

    //
    // apply infixes macros
    //

    /**
     * Gether infixes by priority
     * @type {Record<number, string[]>}
     */
    const infixesByPriority = {};
    for (const [infix, priority] of Object.entries(infixPriorities)) {
      if (!infixesByPriority[priority]) {
        infixesByPriority[priority] = [];
      }
      infixesByPriority[priority].push(infix);
    }
    const allPriorities = Array.from(Object.keys(infixesByPriority)).map((x) =>
      parseInt(x, 10),
    );
    /**
     * Sort infix messages by priority (lower number means higher priority first)
     * @type {[number, Message[]][]}
     */
    const infixMessages = Array.from(
      Object.entries(infixes.messagesByPriority).map((x) => [
        parseInt(x[0], 10),
        x[1],
      ]),
    ).sort((a, b) => a[0] - b[0]);

    /**
     * We now want to transform infix messages in messages with a parameter:
     *     a * b -> a *(b)
     * But we need to keep in mind the priority of the infixes:
     *    a + b * c -> a +(b *(c))
     * Even if there are messasges with already resolved infixes:
     *    a + b *(c) -> a +(b *(c))
     * So we start from the highest priority and we use as argument of
     * the resolved infix, the next messages while there are next messages
     * with a (resolved) infix name.
     */
    for (const [priority, infixMsgs] of infixMessages) {
      const infixesNotYetResolved = allPriorities
        .filter((p) => p >= priority)
        .flatMap((p) => infixesByPriority[p]);
      for (const infixMsg of infixMsgs) {
        const arg = infixMsg.next;
        if (!arg) {
          continue;
        }
        let argEnd = arg.next;
        while (
          argEnd &&
          argEnd.name !== MessageTerminatorSymbol &&
          argEnd.name !== infixes.groupEndSymbol &&
          !infixesNotYetResolved.includes(argEnd.name)
        ) {
          argEnd = argEnd.next;
        }
        // Cut arg until argEnd
        if (argEnd) {
          argEnd.previous.setNext(null);
        }
        // We are expecing infixMsg.arguments to be empty
        infixMsg.setArguments([arg]);
        // Set next to argEnd
        infixMsg.setNext(argEnd);
      }
    }

    // Remove group end messages
    for (const groupEndMsg of infixes.groupEndMessages) {
      groupEndMsg.previous.setNext(groupEndMsg.next);
    }

    return msg;
  },
  Exps_single(exp) {
    const { env, assigns, infixes } = this.args;
    return exp.toMessage(env, assigns, infixes);
  },
  Exps_many(exps, term, exp) {
    const { env, assigns, infixes } = this.args;
    const msg = exps.toMessage(env, assigns, infixes);
    const termMsg = term.toMessage(env, assigns, infixes);
    msg.last.setNext(termMsg);
    termMsg.setNext(exp.toMessage(env, assigns, infixes));
    return msg;
  },
  Exp_singleMessage(exp) {
    const { env, assigns, infixes } = this.args;
    return exp.toMessage(env, assigns, infixes);
  },
  Exp_multiMessage(exp, message) {
    const { env, assigns, infixes } = this.args;
    const msg = exp.toMessage(env, assigns, infixes);
    msg.last.setNext(message.toMessage(env, assigns, infixes));
    return msg;
  },
  Exp_parentheses(lb, exp, rb) {
    const { env, assigns, infixes } = this.args;

    // Having an `(exp)` only happens if it's the first message after a
    // terminator (or the first message of the program), because other
    // parenthesis are handled by the `Arguments` rule.
    // So here we insert a temporary message to be able to resolve
    // the infixes.
    const msg = exp.toMessage(env, assigns, infixes);
    // const groupEndMsg = env.messageLiteral(infixes.groupEndSymbol);
    // infixes.groupEndMessages.push(groupEndMsg);
    // msg.last.setNext(groupEndMsg);
    return msg;
  },
  Exp_curlyBrackets(lb, exp, rb) {
    throw new Error('Brackets not implemented');
  },
  Exp_squareBrackets(lb, exp, rb) {
    throw new Error('Brackets not implemented');
  },
  Message(symbol) {
    const { env, assigns, infixes } = this.args;

    const literalOrSymbolMsg = symbol.toMessage(env, assigns, infixes);
    if (!literalOrSymbolMsg.isLiteral) {
      const symbolString = literalOrSymbolMsg.name;
      // Check for assign macros
      const assignMacro = assigns.macros[symbolString];
      if (assignMacro) {
        assigns.messagesByMacro[assignMacro] ??= [];
        assigns.messagesByMacro[assignMacro].push(literalOrSymbolMsg);
      } else {
        // Check for infix macros
        const infixPriority = infixes.priorities[symbolString];
        if (typeof infixPriority !== 'undefined') {
          infixes.messagesByPriority[infixPriority] ??= [];
          infixes.messagesByPriority[infixPriority].push(literalOrSymbolMsg);
        }
      }
    }
    return literalOrSymbolMsg;
  },
  Message_args(symbol, args) {
    const { env, assigns, infixes } = this.args;

    const msg = symbol.toMessage(env, assigns, infixes);
    msg.setArguments(args.toMessage(env, assigns, infixes));
    return msg;
  },
  Arguments(_1, args, t, _2) {
    const { env, assigns, infixes } = this.args;

    const msgs = args
      .asIteration()
      .children.map((exps) => exps.toMessage(env, assigns, infixes));
    if (t.sourceString && msgs.length > 0) {
      msgs[msgs.length - 1].last.setNext(env.messageTerminator());
    }
    return msgs;
  },
  Symbol(symbol) {
    const { env, assigns, infixes } = this.args;

    return symbol.toMessage(env, assigns, infixes);
  },
  Terminator(_1) {
    const { env, assigns, infixes } = this.args;

    return env.messageTerminator();
  },
  // primitives
  ident(id) {
    const { env, assigns, infixes } = this.args;

    return env.message(id.sourceString);
  },
  number(chars) {
    const { env, assigns, infixes } = this.args;

    return env.messageLiteral(parseInt(chars.sourceString, 10));
  },
  string(l, chars, r) {
    const { env, assigns, infixes } = this.args;

    return env.messageLiteral(chars.sourceString);
  },
});
