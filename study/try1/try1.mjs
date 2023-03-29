import ohm from '../../vendor/ohm.mjs';

//
// Parsing
//

/**
 * A chain is a left-associative application of zero or more messages
 * `a b c(d)`
 */
class AstChain {
  constructor(messages) {
    this.value = messages;
  }

  get messages() {
    return this.value;
  }

  set messages(value) {
    this.value = value;
  }
}

/**
 * A message is a symbol plus zero or more arguments
 * `a(b, c)`
 */
class AstMessage {
  constructor(symbol, args = []) {
    /** @type AstSymbol */
    this.value = symbol;
    this.args = args;
  }

  get symbolValue() {
    return this.value;
  }

  get symbolType() {
    return this.value;
  }

  get arguments() {
    return this.args;
  }
}

/**
 * A symbol is anything that may serve as a literal value:
 * a number, string, or idenfitier
 */
class AstSymbol {
  constructor(literal) {
    /** @type AstLiteral */
    this.value = literal;
  }

  get literalType() {
    return this.value.type;
  }

  get literalValue() {
    return this.value.value;
  }
}

class AstLiteral {
  /**
   *
   * @param {'string' | 'number' | 'identifier'} type
   * @param {string | number} value
   */
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

// Debug it at https://ohmlang.github.io/editor/#
const grammar = ohm.grammar(String.raw`Io {
  Program
    = Exps Terminator?

  Exps
    = Exps Terminator Exp -- many
    | Exp                 -- single

  Exp
    = Exp Message -- withMessage
    | Message     -- onlyMessage
    | "(" Exp ")" -- paren

  Message
    = Symbol Arguments -- args
    | Symbol

  Arguments
    = "(" ListOf<Exps, ","> ")"

  Symbol
    = ident | number | string

  Terminator
    = ";" // this should? have a newline after it but as syntactic rule it doesn't work
          // I should convert all to lexycal? maybe later

  ident  (an identifier)
    = (~("(" | ")" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space) any)+

  number (a number)
    = digit* "." digit+  -- float
    | digit+             -- int

  string
  	= "\"" (~"\"" any)* "\""
}`);
const semantics = grammar.createSemantics();
semantics.addOperation('ast', {
  Program(exps, _1) {
    return exps.ast();
  },
  Exps_many(exps, _1, exp) {
    const builtExps = exps.ast();
    builtExps.push(exp.ast());
    return builtExps;
  },
  Exps_single(exp) {
    return [exp.ast()];
  },
  Exp_withMessage(exp, message) {
    /** @type {AstChain} */
    const chain = exp.ast();
    chain.messages.push(message.ast());
    return chain;
  },
  Exp_onlyMessage(exp) {
    /** @type {AstMessage} */
    const msg = exp.ast();
    return new AstChain([msg]);
  },
  Exp_paren(_1, exp, _2) {
    return exp.ast();
  },
  Message(symbol) {
    const literal = symbol.ast();
    return new AstMessage(literal);
  },
  Message_args(symbol, args) {
    const literal = symbol.ast();
    const builtArgs = args.ast();
    return new AstMessage(literal, builtArgs);
  },
  Arguments(_1, args, _2) {
    const builtArgs = args.asIteration().children.map((exps) => exps.ast());
    return builtArgs;
  },
  Symbol(symbol) {
    return new AstSymbol(symbol.ast());
  },
  Terminator(_1) {},
  // primitives
  ident(id) {
    return new AstLiteral('identifier', id.sourceString);
  },
  number(chars) {
    return new AstLiteral('number', parseInt(chars.sourceString, 10));
  },
  string(l, chars, r) {
    // TODO escape
    return new AstLiteral('string', chars.sourceString);
  },
});

export function parseProgram(source) {
  const match = grammar.match(source, 'Program');
  const code = semantics(match).ast();
  return code;
}

console.log(
  parseProgram(`
fact := method(n, if (n == 0, 1, n * fact (n - 1)));
writeln(fact(5))
`),
);

//
// Evaluation
//

function forgeBaseObject() {
  const obj = Object.create(null, {
    clone: {
      enumerable: true,
      value: function () {
        return Object.create(this);
      },
    },
    setSlot: {
      enumerable: true,
      value: function (name, value) {
        // TODO use Object.setProperty instead?
        // augment `this` with `call`
        this[name] = value;
        return value;
      },
    },
    if: {
      enumerable: true,
      value: function (cond, then, otherwise) {
        if (cond()) {
          return then();
        } else if (otherwise) {
          return otherwise();
        }
      },
    },
    self: {
      enumerable: true,
      value: function () {
        return this;
      }
    },
  });
  // const proxy = new Proxy(obj, {
  //   get(target, prop) {

  //   }
  // });
  return obj;
}

const Obj = forgeBaseObject();
const Lobby = Obj.clone();
Lobby.setSlot('writeln', function () {
  console.log(...Array.from(arguments).map((arg) => arg()));
});

Lobby.setSlot('fact', function (n) {
  return this.if(
    () => n() === 0,
    () => 1,
    () => n() * this.fact(() => n() - 1),
  );
});
Lobby.writeln(() => Lobby.fact(() => 5));
