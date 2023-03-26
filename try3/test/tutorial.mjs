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
  const { withEnv, assertReturn, assertLogs } = createUtils(
    environment,
    assert,
  );

  withEnv(() => {
    assertReturn(
      'd := List clone append(30, 10, 5, 20); d jsArray',
      [30, 10, 5, 20],
    );
    assertReturn('d size', 4);
    assertLogs('d print', 'list(30, 10, 5, 20)');
    assertReturn('d := d sort; d jsArray', [5, 10, 20, 30]);
    assertReturn('d first', 5);
    assertReturn('d last', 30);
    assertReturn('d at(2)', 20);
    assertReturn('d remove(30) jsArray', [5, 10, 20]);
    assertReturn('d atPut(1, 123) jsArray', [5, 123, 20]);
  });

  assertReturn('list(30, 10, 5, 20) select(>10) jsArray', [30, 20]);
  assertReturn('list(30, 10, 5, 20) detect(>10)', 30);
  assertReturn('list(30, 10, 5, 20) map(*2) jsArray', [60, 20, 10, 40]);
  assertReturn('list(30, 10, 5, 20) map(v, v*2) jsArray', [60, 20, 10, 40]);
});

describe('Tutorial: Loops', async (assert) => {
  const { withEnv, assertReturn, assertLogs } = createUtils(
    environment,
    assert,
  );

  assertLogs('for(i, 1, 10, writeln(i))', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
});

// describe('Tutorial: ', async (assert) => {
//   const { withEnv, assertReturn, assertLogs } = createUtils(environment, assert);

//   assertReturn('', );
// });
