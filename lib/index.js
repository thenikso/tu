import { createEmptyEnvironment } from './environment.js';
import { receiverInstaller } from './receiver.js';
import { literalsInstaller } from './literals.js';
import { messageInstaller, method } from './message.js';
import { parserInstaller } from './parser.js';
import { browserInstaller } from './browser.js';

export const createEnvironment = createEmptyEnvironment()
  .use(receiverInstaller(method))
  .use(literalsInstaller(method))
  .use(messageInstaller())
  .use(parserInstaller())
  .use(browserInstaller(window));
