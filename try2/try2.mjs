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

class Literal extends Receiver {
  /**
   * @param {Receiver} rootObject
   * @param {string | number} value
   */
  constructor(rootObject, value) {
    super(value, [rootObject], null);
    this.value = value;
  }

  get type() {
    return typeof this.value;
  }
}

class Message extends Receiver {
  /**
   * @param {Receiver} rootObject
   * @param {string | Literal | Terminator} name
   * @param {[Message]=} args
   */
  constructor(rootObject, name, args) {
    super(id('Message'), [rootObject], null);

    this.name = name;
    this.args = args;
    this.next = null;
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

      if (msg.name instanceof Literal) {
        cursor = msg.name;
        target = cursor;
        msg = msg.next;
        continue;
      }

      const foundSlot = anObject.findSlot(msg.name);
      if (!foundSlot) {
        throw new Error(`Exception: Message does not respond to '${msg.name}'`);
      }

      cursor = foundSlot.slot;

      if (cursor instanceof Method || cursor instanceof InternalMethod) {
        cursor = cursor.activate(
          sender, // TODO this should have `call` and `self`?
          msg,
          target,
          foundSlot.slotContext,
        );
      }

      target = cursor;
      msg = msg.next;
    } while (msg);

    return cursor;
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

class Method extends Receiver {
  /**
   * @param {Receiver} rootObject
   * @param {Message} body
   */
  constructor(rootObject, body) {
    super(id('Method'), [rootObject], null);
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
    return this.body.doInContext(target, sender);
  }
}

class InternalMethod extends Receiver {
  /**
   *
   * @param {Receiver} rootObject
   * @param {(sender: Receiver, message: Message, target: Receiver, slotContext: Receiver) => Receiver} func
   */
  constructor(rootObject, func) {
    super(id('Method'), [rootObject], null);
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
   * @returns {Receiver}
   */
  activate(sender, message, target, slotContext) {
    return this.func(sender, message, target, slotContext);
  }
}

class Singleton extends Receiver {
  constructor(id, rootObject) {
    super(id, [rootObject], null);
  }
}

export function environment() {
  const RootObject = new Receiver('Object', null, null);
  const Nil = new Singleton('Nil', RootObject);

  const rootObjectSlots = new Map();
  rootObjectSlots.set(
    'setSlot',
    new InternalMethod(RootObject, (sender, message, target, slotContext) => {
      const slotNameMsg = message.getArgAt(0);
      if (!slotNameMsg) {
        throw new Error(
          "Exception: argument 0 to method 'setSlot' must be a string. Got nil instead.",
        );
      }
      const slotName = slotNameMsg.doInContext(slotContext);
      if (!(slotName instanceof Literal) || slotName.type !== 'string') {
        throw new Error(
          "Exception: argument 0 to method 'setSlot' must be a string.",
        );
      }
      const slotNameStr = slotName.value;
      const slotBodyMsg = message.getArgAt(1);
      let slotBody = Nil;
      if (slotBodyMsg) {
        slotBody = slotBodyMsg.doInContext(slotContext);
      }
      target.setSlot(slotNameStr, slotBody);
      return slotBody;
    }),
  );

  RootObject.slots = rootObjectSlots;

  const Lobby = new Receiver(id('Lobby'), [RootObject], null);

  return {
    Object: RootObject,
    Lobby,
    terminator: () => new Terminator(),
    literal: (value) => new Literal(RootObject, value),
    message: (name, args) => new Message(RootObject, name, args),
    method: (body) => new Method(RootObject, body),
  };
}
