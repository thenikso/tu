import '../../vendor/tap-console.mjs';
import { describe } from '../../vendor/riteway.mjs';
import { createUtils } from './utils.mjs';

import { environment } from '../try3.mjs';

describe('Tutorial: Math', async (assert) => {
  const { assertReturn } = createUtils(environment, assert);

  assertReturn('1+1', 2);
  assertReturn('1+1 == 2', true);
  assertReturn('2 sqrt', 1.4142135623730951);
});

describe('Tutorial: Variables', async (assert) => {
  const { assertReturn, withSameEnv } = createUtils(environment, assert);

  withSameEnv(() => {
    assertReturn('a := 1', 1);
    assertReturn('a', 1);
    assertReturn('b := 2 * 3', 6);
    assertReturn('a + b', 7);
  });
});

// describe('Tutorial: ', async (assert) => {
//   const { assertReturn } = createUtils(environment, assert);

//   assertReturn('', );
// });
