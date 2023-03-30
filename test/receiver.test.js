// @ts-check

import { describe } from './runner/index.mjs';
import { createRootReceiver } from '../lib/receiver.js';

describe('receiver', (assert) => {
  assert({
    given: 'a root receiver',
    should: 'have a null prototype',
    actual: Object.getPrototypeOf(createRootReceiver()),
    expected: null,
  });
});
