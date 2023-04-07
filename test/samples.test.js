import { describe, envTestUtils } from './runner/index.mjs';

import { createEnvironment } from '../index.mjs';

describe('Samples', async (assert) => {
  const { assertLogs } = envTestUtils(createEnvironment, assert, true);

  await assertLogs(
    String.raw`#!/usr/bin/env tu

  Account := Receiver clone do(
    balance := 0.0
    deposit := method(v,  balance = balance + v)
    show := method(write("Account balance: $", balance, "\n"))
  )

  "Inital: " print
  Account show

  "Depositing $10\n" print
  Account deposit(10.0)

  "Final: " print
  Account show
  `,
    [
      'Inital: ',
      'Account balance: $0\n',
      'Depositing $10\n',
      'Final: ',
      'Account balance: $10\n',
    ],
  );

  await assertLogs(
    String.raw`#!/usr/bin/env tu

    ack := method(m, n,
      //writeln("ack(", m, ",", n, ")")
      if (m < 1, return n + 1)
      if (n < 1, return ack(m - 1, 1))
      return ack(m - 1, ack(m, n - 1))
    )

    ack(3, 4) print
    "\n" print
    `,
    ['125', '\n'],
  );

  await assertLogs(
    String.raw`#!/usr/bin/env tu

    fetch("https://jsonplaceholder.typicode.com/todos/1") json userId println
    `,
    '1\n',
  );
});
