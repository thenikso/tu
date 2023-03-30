// @ts-check

import { describe } from './runner/index.mjs';
import { createRootReceiver, createReceiver } from '../lib/receiver.js';

describe('root receiver', async (assert) => {
  assert({
    given: 'a root receiver',
    should: 'have a null prototype',
    actual: Object.getPrototypeOf(createRootReceiver()),
    expected: null,
  });

  assert({
    given: 'a root receiver',
    should: 'have an empty protos array',
    actual: createRootReceiver().protos,
    expected: [],
  });
});

describe('receiver protos', async (assert) => {
  const root = createRootReceiver();

  assert({
    given: 'a receiver',
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
});
