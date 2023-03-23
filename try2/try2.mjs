function id(prefix) {
  return (
    prefix +
    '_0x' +
    Math.abs(Date.now() ^ (Math.random() * 10000000000000)).toString(32)
  );
}

class Receiver {
  /**
   * @param {Receiver[] | null} protos
   * @param {Map<string, Receiver> | null} slots
   */
  constructor(id, protos, slots) {
    this.id = id;
    this.protos = protos;
    this.slots = slots;
    if (protos === null) {
      this._nil = new Receiver('Nil', [this], null);
      this._rootObject = this;
    }
  }

  get Nil() {
    if (this.protos === null) {
      return this._nil;
    }
    return this.protos[0].Nil;
  }

  get RootObject() {
    if (this.protos === null) {
      return this._rootObject;
    }
    return this.protos[0].RootObject;
  }

  /**
   * @param {string} slotName
   * @returns {{ slot: Receiver, slotContext: Receiver } | null}
   */
  findSlot(slotName) {
    if (this.slots && this.slots.has(slotName)) {
      return { slot: this.slots.get(slotName), slotContext: this };
    } else if (this.protos) {
      for (const proto of this.protos) {
        const slot = proto.findSlot(slotName);
        if (slot) {
          return slot;
        }
      }
    }
    return null;
  }

  /**
   *
   * @param {string} slotName
   * @param {Receiver} slotValue
   */
  setSlot(slotName, slotValue) {
    if (!this.slots) {
      this.slots = new Map();
    }
    this.slots.set(slotName, slotValue);
  }
}

class Terminator {}

class Message extends Receiver {
  /**
   * @param {Receiver} rootObject
   * @param {string | Str | Num | Terminator} name
   * @param {[Message]=} args
   * @param {Message=} next
   */
  constructor(rootObject, name, args, next) {
    super(id('Message'), [rootObject], null);

    this.name = name;
    this.args = args;
    this.next = next ?? null;
  }

  /**
   * @param {number} index
   * @returns {Message | null}
   */
  getArgAt(index) {
    if (!this.args || index >= this.args.length) {
      return null;
    }
    return this.args[index];
  }

  /**
   * @param {Receiver} anObject
   * @param {Receiver=} locals
   * @returns {Receiver}
   */
  doInContext(anObject, locals) {
    let msg = this;
    let cursor = null;
    let target = anObject;
    let sender = locals ?? anObject;
    do {
      if (msg.name instanceof Terminator) {
        cursor = null;
        target = anObject;
        sender = locals ?? anObject;
        msg = msg.next;
        continue;
      }

      if (msg.name instanceof Str || msg.name instanceof Num) {
        cursor = msg.name;
        target = cursor;
        msg = msg.next;
        continue;
      }

      const foundSlot = target.findSlot(msg.name);
      if (!foundSlot) {
        throw new Error(
          `Exception: ${target.id} does not respond to '${msg.name}'`,
        );
      }

      cursor = foundSlot.slot;

      if (cursor instanceof Method || cursor instanceof InternalMethod) {
        cursor = cursor.activate(
          sender, // TODO this should have `call` and `self`?
          msg,
          target,
          foundSlot.slotContext,
          super.RootObject,
        );
      }

      target = cursor;
      msg = msg.next;
    } while (msg);

    return cursor || super.Nil;
  }

  /**
   *
   * @param {Message} next
   * @returns {Message}
   */
  setNext(next) {
    // TODO deep copy
    this.next = next;
    return next;
  }
}

class Locals extends Receiver {
  /**
   *
   * @param {Receiver} target
   * @param {[[string, Message]]} args
   */
  constructor(target, args) {
    super(
      id('locals'),
      [target],
      new Map([
        ['self', target],
        // TODO `call`
        ...args,
      ]),
    );
  }
}

class Method extends Receiver {
  /**
   * @param {Receiver} rootObject
   * @param {[string]} argNames
   * @param {Message} body
   */
  constructor(rootObject, argNames, body) {
    super(id('Method'), [rootObject], null);
    this.argNames = argNames;
    this.body = body;
  }

  /**
   *
   * @param {Receiver} sender locals object of caller
   * @param {Message} message message used to call this method/block
   * @param {Receiver} target current object
   * @param {Receiver} slotContext context in which slot was found. This is
   * usually the same as `target`, but may be different if the slot was
   * found in a prototype.
   * @returns {Receiver}
   */
  activate(sender, message, target, slotContext) {
    const locals = new Locals(
      target,
      this.argNames.map((argName, i) => {
        const argMsg = message.getArgAt(i);
        let argValue = super.Nil;
        if (argMsg) {
          argValue = argMsg.doInContext(sender);
        }
        return [argName, argValue];
      }),
    );
    return this.body.doInContext(locals, sender);
  }
}

class InternalMethod extends Receiver {
  /**
   *
   * @param {(sender: Receiver, message: Message, target: Receiver, slotContext: Receiver, rootObject: Receiver) => Receiver} func
   */
  constructor(id, func) {
    super(id, null, null);
    this.func = func;
  }

  /**
   *
   * @param {Receiver} sender locals object of caller
   * @param {Message} message message used to call this method/block
   * @param {Receiver} target current object
   * @param {Receiver} slotContext context in which slot was found. This is
   * usually the same as `target`, but may be different if the slot was
   * found in a prototype.
   * @param {Receiver} rootObject
   * @returns {Receiver}
   */
  activate(sender, message, target, slotContext, rootObject) {
    return this.func(sender, message, target, slotContext, rootObject);
  }
}

class Str extends Receiver {
  /**
   * @param {Receiver} rootObject
   * @param {string} value
   */
  constructor(rootObject, value) {
    super(value, [rootObject], null);
    this.value = value;
  }
}

const NumSlots = new Map();
NumSlots.set(
  '+',
  new InternalMethod(
    'Number_+',
    (sender, message, target, slotContext, rootObject) => {
      const arg0Msg = message.getArgAt(0);
      const arg0 = arg0Msg?.doInContext(sender);
      if (!arg0Msg || !arg0 || !(arg0 instanceof Num)) {
        throw new Error(
          "Exception: argument 0 to method '+' must be a Number, not a 'nil'",
        );
      }
      return new Num(rootObject, arg0.value + target.value);
    },
  ),
);

class Num extends Receiver {
  /**
   * @param {Receiver} rootObject
   * @param {number} value
   */
  constructor(rootObject, value) {
    super(value, [rootObject], NumSlots);
    this.value = value;
  }
}

const RootObjectSlots = new Map();
RootObjectSlots.set(
  'setSlot',
  new InternalMethod(
    'Object_setSlot',
    (sender, message, target, slotContext, rootObject) => {
      const slotNameMsg = message.getArgAt(0);
      if (!slotNameMsg) {
        throw new Error(
          "Exception: argument 0 to method 'setSlot' must be a string. Got nil instead.",
        );
      }
      const slotName = slotNameMsg.doInContext(sender);
      if (!(slotName instanceof Str)) {
        throw new Error(
          "Exception: argument 0 to method 'setSlot' must be a string.",
        );
      }
      const slotNameStr = slotName.value;
      const slotBodyMsg = message.getArgAt(1);
      let slotBody = rootObject.Nil;
      if (slotBodyMsg) {
        slotBody = slotBodyMsg.doInContext(sender);
      }
      target.setSlot(slotNameStr, slotBody);
      return slotBody;
    },
  ),
);
RootObjectSlots.set(
  'method',
  new InternalMethod(
    'Object_method',
    (sender, message, target, slotContext, rootObject) => {
      /** @type [Message] */
      const messageArgs = message.args || [];
      const methodArgs = messageArgs.slice(0, -1);
      const methodArgNames = methodArgs.map((arg, i) => {
        if (arg.next || typeof arg.name !== 'string') {
          throw new Error(
            `Exception: argument ${i} to method 'method' must be a symbol`,
          );
        }
        return arg.name;
      });
      const methodBody = messageArgs[messageArgs.length - 1];
      const method = new Method(rootObject, methodArgNames, methodBody);
      return method;
    },
  ),
);

export function environment() {
  const RootObject = new Receiver('Object', null, RootObjectSlots);
  const Lobby = new Receiver(id('Lobby'), [RootObject], null);

  return {
    Object: RootObject,
    Lobby,
    terminator: () => new Terminator(),
    string: (value) => new Str(RootObject, value),
    number: (value) => new Num(RootObject, value),
    message: (name, args, next) => new Message(RootObject, name, args, next),
    method: (args, body) => new Method(RootObject, args ?? [], body),
  };
}
