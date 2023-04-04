#!/usr/bin/env node

import repl from 'repl';
import chalk from 'chalk';
import { createEnvironment } from './index.mjs';

const replServer = repl.start({
  prompt: chalk.greenBright('⟩ '),
  useColors: true,
  useGlobal: false,
  eval: async function (cmd, context, filename, callback) {
    try {
      const msg = context.Lobby.Message.fromString(cmd);
      const res = msg.doInContext(context.Lobby);
      callback(null, res);
    } catch (err) {
      callback(err);
    }
  },
});

initializeContext(replServer.context);
replServer.on('reset', initializeContext);

function initializeContext(context) {
  const { Lobby } = createEnvironment();
  context.Lobby = Lobby;
}
