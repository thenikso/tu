// @ts-check

import { describe } from '../runner/index.mjs';
import { createRootReceiver, createReceiver } from '../../lib/receiver.js';

describe('receiver', async (assert) => {
  const root = createRootReceiver();

  assert({
    given: 'a receiver type',
    should: 'be "Receiver"',
    actual: root.type,
    expected: 'Receiver',
  });

  assert({
    given: 'a root receiver',
    should: 'have a null prototype',
    actual: Object.getPrototypeOf(root),
    expected: null,
  });

  assert({
    given: 'a root receiver',
    should: 'have an empty protos array',
    actual: root.protos,
    expected: [],
  });

  assert({
    given: 'a new receiver',
    should: 'have the root receiver as its prototype',
    actual: Object.getPrototypeOf(createReceiver(root)),
    expected: root,
  });

  {
    const proto1 = createReceiver(root);
    const proto2 = createReceiver(proto1);

    assert({
      given: 'a receiver with prototype chain',
      should: 'respond to hasProto',
      actual: proto2.hasProto(root),
      expected: true,
    });
  }

  {
    const proto1 = createReceiver(root, {
      prop1: { value: 1 },
      prop2: { value: 1 },
      prop3: { value: 1 },
      prop4: { value: 1 },
    });
    const proto2_1 = createReceiver(proto1, { prop2: { value: 2 } });
    const proto2_2 = createReceiver(root, {
      prop3: { value: 3 },
      prop3bis: { value: 3 },
    });

    const obj = createReceiver([proto2_1, proto2_2], {
      prop4: { value: 4 },
    });

    assert({
      given: 'a receiver with multi-prototype in the chain',
      should: 'respond to hasProto',
      actual: obj.hasProto(root),
      expected: true,
    });

    assert({
      given: 'a receiver with multi-prototype in the chain',
      should: 'respond to inherited properties with depth first search',
      actual: [obj.prop1, obj.prop2, obj.prop3, obj.prop3bis, obj.prop4],
      expected: [1, 2, 1, 3, 4],
    });

    const obj2 = createReceiver(proto2_1, {
      prop4: { value: 4 },
    });

    assert({
      given: 'a receiver appendProto',
      should: 'append the new prototype to the chain',
      actual: (() => {
        obj2.appendProto(proto2_2);
        return [obj2.prop1, obj2.prop2, obj2.prop3, obj2.prop3bis, obj2.prop4];
      })(),
      expected: [1, 2, 1, 3, 4],
    });
  }

  assert({
    given: 'a receiver clone',
    should: 'have the targget as prototype',
    actual: Object.getPrototypeOf(root.clone()),
    expected: root,
  });
  {
    let initCalledOn = null;
    const withInit = createReceiver(root, {
      init: {
        value: function () {
          initCalledOn = this;
        },
      },
    });

    assert({
      given: 'a receiver clone method',
      should: 'call the receiver init method',
      actual: (() => {
        withInit.clone();
        return initCalledOn;
      })(),
      expected: withInit,
    });
  }

  assert({
    given: 'a receiver setSlot method',
    should: 'set the slot value',
    actual: (() => {
      const obj1 = createReceiver(root);
      return [obj1.setSlot('slot1', 1), obj1.slot1];
    })(),
    expected: [1, 1],
  });

  assert({
    given: 'a receiver updateSlot method',
    should: 'throw if the slot does not exist',
    actual: (() => {
      try {
        const obj1 = createReceiver(root);
        obj1.updateSlot('NOTHING', 4);
      } catch (e) {
        return e.message;
      }
    })(),
    expected:
      'Slot NOTHING not found. Must define slot using := operator before updating.',
  });

  assert({
    given: 'a receiver updateSlot method',
    should: 'update an existing slot',
    actual: (() => {
      const obj1 = createReceiver(root);
      obj1.setSlot('slot1', 1);
      obj1.updateSlot('slot1', 4);
      return obj1.slot1;
    })(),
    expected: 4,
  });

  assert({
    given: 'a receiver updateSlot method',
    should: 'works with multi-proto',
    actual: (() => {
      try {
        const obj1 = createReceiver(root);
        const obj2 = createReceiver(obj1, { YES: { value: 1 } });
        const obj3 = createReceiver([obj1, obj2]);
        obj3.updateSlot('YES', 4);
        obj3.updateSlot('NO', 4);
      } catch (e) {
        return e.message;
      }
    })(),
    expected:
      'Slot NO not found. Must define slot using := operator before updating.',
  });

  // assert({
  //   given: 'a receiver newSlot method',
  //   should: 'create a new slot and its setter',
  //   actual: (() => {
  //     const res = [];
  //     const obj = createReceiver(root);
  //     obj.newSlot('slot1', 1);
  //     res.push(obj.slot1);
  //     obj.setSlot1(2);
  //     res.push(obj.slot1);
  //     return res;
  //   })(),
  //   expected: [1, 2],
  // });
});
