import { describe, envTestUtils, loadFile } from './runner/index.mjs';

import { createEnvironment } from '../index.mjs';

describe('Samples', async (assert) => {
  const { assertLogs } = envTestUtils(createEnvironment, assert, {
    showTime: true,
  });

  await assertLogs(await loadFile('../examples/Account.tu'), [
    'Inital: ',
    'Account balance: $0\n',
    'Depositing $10\n',
    'Final: ',
    'Account balance: $10\n',
  ]);

  await assertLogs(await loadFile('../examples/Ackermann.tu'), ['125', '\n']);

  await assertLogs(
    String.raw`#!/usr/bin/env tu

    fetch("https://jsonplaceholder.typicode.com/todos/1") json id println
    `,
    '1\n',
  );

  await assertLogs(
    String.raw`#!/usr/bin/env tu

    writeln(fetch("https://jsonplaceholder.typicode.com/todos/2") json id)
    `,
    '2\n',
  );

  await assertLogs(await loadFile('../examples/BottlesOfBeer.tu'), 99 * 3, {
    mapLogs(logs) {
      return [logs.length];
    },
  });

  await assertLogs(await loadFile('../examples/ControlFlow.tu'), [
    'break:    OK\n',
    'continue: OK\n',
    'return:   OK\n',
  ]);

  await assertLogs(await loadFile('../examples/Conditions.tu'), [
    'test1: OK\n',
    'test2: OK\n',
    'test3: OK\n',
    'test4: OK\n',
    'test5: OK\n',
  ]);

  await assertLogs(await loadFile('../examples/Foreach.tu'), ['b := 2\n']);
});
