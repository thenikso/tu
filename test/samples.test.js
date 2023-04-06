import { describe, envTestUtils } from './runner/index.mjs';

import { createEnvironment } from '../index.mjs';

describe('Samples', async (assert) => {
  const { assertLogs } = envTestUtils(createEnvironment, assert);

  assertLogs(
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

    'Inital: ',
    'Account balance: $0\n',
    'Depositing $10\n',
    'Final: ',
    'Account balance: $10\n',
  );
});
