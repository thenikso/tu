# Tu language

An **experimental** implementation of the [Io language](https://iolanguage.org/) in Javascript.

```
Account := Object clone do(
  balance := 0.0
  deposit := method(v,  balance = balance + v)
  show := method(write("Account balance: $", balance, "\n"))
)

"Inital: " print
Account show

"Depositing $10\n" print
Account deposit(10.0)

"Final: " print
Account show
```

:warning: **This is a hobby work in progress.** :warning: many things are not yet
implemented, and the API is subject to change.

## Installation

To install globally, run:

```
npm install -g @nikso/tu
```

## Using the REPL

You can now start an interactive session with `tu`:

```bash
$ tu
⟩ a := 1 + 1
2
⟩ a + 40
42
```

## Using in the browser

You can also use Tu in the browser. To do so, you can use the `tu.js` file
in the `dist` folder. You can also use the `tu.cjs` file for CommonJS.

Alternatively, you can also use the `index.mjs` file in the root folder.
This is the same as the `tu.js` file, but it is written in ES6 modules.

```html
<html>
  <body>
    <script type="module">
      import { createEnvironment } from './index.mjs';

      const env = createEnvironment();
      window.Lobby = env.Lobby;
      window.tu = env.tu;

      const result = await tu`
        a := 1 + 1
        a + 40
      `;

      console.log(result); // 42
    </script>
  </body>
</html>
```

## Development

Clone this repository and run:
1. `npm install` to install the dependencies
2. `npm run build` to build the project dependencies in `dist`
3. `npm run dev` to serve the root folder
4. open `http://localhost:3000` in your browser
5. open the devtools console to see the output of tests and use `tu`

You can also run `npm link -g` to get a `tu` command wich will use the local
version of the project.

### How does it work?

- `lib/environment.js` contains the `createEnvironment` function which
  creates a new environment with the `Lobby` object and the `tu` function.
- `lib/receiver.js` contains the `Receiver` main object (called `Object` in Io),
  as well as the definition of the `Lobby` object.
- `lib/primitives.js` have some low level implementation of javascript primitives
  (like `Number`, `String`, `Array`, etc.) to get things rolling.
- `lib/message.js` is where the magic happens. It contains the `Message` object
  which is used to represent the entirety of a Tu program. The special function
  here is `evalMessage` that takes a `Message` and an start interpreting it in
  the given context.
- `lib/parser.js` is a [Ohm](https://ohmjs.org/) grammar that parses a Tu program
  into a `Message`.

Check out also some strip down, early versions of the project in the `study`
folder. Those should be more readable and easier to understand.

Recently `evalMessage` was made async, so that it can `await` on each message
allowing to write something like this:

```
fetch("https://jsonplaceholder.typicode.com/todos/1") json userId println
```

This works and I must say it's rather cool. Unfortunately it made the interpreter
much slower.

### Where to go from here?

My ideas for this project would be:
- Complete the implementation of `evalMessage` to properly support all the
  features of Io (in particular the `stopStatus` to allow for `break`, `continue`).
- Attempt a DOM library to allow for DOM manipulation in the browser. See how it
  would feel to write a web app in Tu. Possibly integrate with Svelte to write
  something like (pseudo code):
  ```html
  <script lang="tu">
    name := "World"
    greeting := "Hello "..name.."!"
  </script>
  <div>
    <input type="text" bind:value={name} />
    <p>{greeting}</p>
  </div>
  ```
- Compile Tu into Javascript. This has some early attempts in `study/try4` and
  it seams promising. Compiled Tu would not need to maintain the dynamic nature
  of Tu and it could be much more performant.

Not sure if and when I'll ever get to do any of those things :P
