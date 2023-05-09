import { describe, envTestUtils, loadFile } from './runner/index.mjs';

import { createEnvironment } from '../index.mjs';

describe('Samples', async (assert) => {
  const { assertLogs } = envTestUtils(createEnvironment, assert, true);

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

    fetch("https://jsonplaceholder.typicode.com/todos/1") json userId println
    `,
    '1\n',
  );

  await assertLogs(await loadFile('../examples/BottlesOfBeer.tu'), 99 * 3, {
    mapLogs(logs) {
      return [logs.length];
    },
  });
});
