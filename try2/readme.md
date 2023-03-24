# Try 2

Ok from try1 I got confused and still in the process of figuring this out.
This time I'll start from scratch with a different approach: trying to get something
to execute.

With some early successes I think I'll keep doing this. That is implement from the runtime up.

```
// sender: Lobby
// message: "+(2)"
// target: test
// slotContext: Object
test +(2)
```

## Early Successes

After cracking the idea of `Message` which is a `Receiver` (how I call
the base object) it all fell into place. I have a working prototype
that can execute simple programs.

I can now start testing more and more concepts from Io guide and
see if the base implementation is solid.

OR I can attempt a more javascripty way with this ideas:
- use `Object.create` to create objects
- single prototype by default, to have multiple prototypes use a `Proxy`
  as the prototype
- Use `Object.defineProperty` to define slots
- Use `Symbol.for` for slot names? this could help distinguish between
  slots and internal slots
- use the `arguments` object to get the arguments of a function (`call message arguments`)
- use `this` for target (`call target`)
- `call sender` is hard to do as it's beed [deprecated](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/caller)
  > This is to prevent a function from being able to "walk the stack", which both poses security risks and severely limits the possibility of optimizations like inlining and tail-call optimization.
- an issue to resolve is: how to know if a function call parameter should
  be evaluated or wrapped in an arrow function? (I think the answer is
  to use the `arguments` object and check if the parameter is a `Message`
  or not. If it is then wrap it in an arrow function. - by copilot)

I think I will still use the `Message` chain idea but eventually I'd like
to "compile" those in more efficient javascript.
