# Try 3

This one is the good one. I have a working parser and a working interpreter. From this point I think I can move to a "proper" implementation.

## Problems with doInContext

A problem I will need to properly explore is how `Message.doInContext(context, locals)` is properly used. Especially how to recurse into it
and what to pass as `locals`.

As for now I am passing the `locals` containing also `call` and `self`.
It's working with the tests taken from the Io guide, but it looks
fragile.

## Async

Something next to explore will be the `@` method to create a promise from
any message.

I easily implemented this! Now this works as espected:

    Time @timeout(10, 3) + 2 // returns 5 after 10 ms

## Compilation

Ahother thing to explore will be how to compile the code. It seams
doable.