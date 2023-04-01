import { createEmptyEnvironment } from './environment.js';
import { receiverInstaller } from './receiver.js';
import { literalsInstaller } from './literals.js';
import { messageInstaller } from './message.js';
import { parserInstaller } from './parser.js';

export const createEnvironment = createEmptyEnvironment()
  .use(receiverInstaller())
  .use(literalsInstaller())
  .use(messageInstaller())
  .use(parserInstaller());
