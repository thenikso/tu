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
  const { assertReturn, withEnv } = createUtils(environment, assert);

  withEnv(() => {
    assertReturn('a := 1', 1);
    assertReturn('a', 1);
    assertReturn('b := 2 * 3', 6);
    assertReturn('a + b', 7);
  });
});

describe('Tutorial: ', async (assert) => {
  const { assertReturn, withEnv, assertLogs } = createUtils(
    environment,
    assert,
  );

  withEnv(() => {
    assertLogs(
      `a := 2;
      (a == 1) ifTrue("a is one" println) ifFalse("a is not one" println)`,
      'a is not one',
    );
    assertLogs(
      'if(a == 1, writeln("a is one"), writeln("a is not one"))',
      'a is not one',
    );
  });
});

describe('Tutorial: List', async (assert) => {
  const { assertReturn, withEnv } = createUtils(environment, assert);

  assertReturn('d := List clone append(30, 10, 5, 20)', [30, 10, 5, 20]);
});

// describe('Tutorial: ', async (assert) => {
//   const { assertReturn } = createUtils(environment, assert);

//   assertReturn('', );
// });
