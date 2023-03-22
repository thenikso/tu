# Try 1

I already see how IO should parse itself. In fact it's quite cool how you can
"hack" the syntax to allow for parsing things like square brackets and other
which normally you couldn't do.

In this try however I want to parse with OHM and try to get something working.
I had an idea to "compile" it to efficient javascript but it may or may not come
later.
Instead I'll try a "dumb" approach and see how it goes. Probably with `Proxy`es.

## OHM grammar

From the IO guide and a bit the iota implementation I came up with this:

```
Arithmetic {
  Program
    = Terminator* Exps Terminator*

  Exps
    = Exps Terminator+ Exp -- sequence
    | Exp

  Exp
    = Exp Message -- chain
    | Message
    | "(" Exp ")" -- paren

  Message
    = Symbol Arguments?

  Arguments
    = "(" NonemptyListOf<Exps, ","> ")"

  Symbol
    = ident | number | string

  Terminator
    = "\n" | ";"

  ident  (an identifier)
    = (~("(" | ")" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space) any)+

  number (a number)
    = digit* "." digit+  -- float
    | digit+             -- int

  string
    = "\"" (~"\"" any)* "\""
}
```
