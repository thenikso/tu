#!/usr/bin/env node

import nodeRepl from 'repl';
import chalk from 'chalk';
import minimist from 'minimist';
import path from 'path';
import fs from 'fs/promises';
import { createEnvironment } from './index.mjs';

const argv = minimist(process.argv.slice(2), {
  '--': true,
});

switch (argv._[0]) {
  case 'repl':
  case undefined:
    repl();
    break;
  default:
    run(argv._[0]);
    break;
}

function repl() {
  const replServer = nodeRepl.start({
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
}

async function run(filePath) {
  const fullPath = path.resolve(filePath);
  const source = await fs.readFile(fullPath, 'utf-8');
  const { Lobby } = createEnvironment();
  const msg = Lobby.Message.fromString(source);
  const res = await msg.doInContext(Lobby);
  return res;
}
