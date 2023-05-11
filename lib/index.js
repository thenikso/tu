import { createEmptyEnvironment } from './environment.js';
import { receiverInstaller } from './receiver.js';
import { primitivesInstaller } from './primitives.js';
import { messageInstaller, method } from './message.js';
import { parserInstaller } from './parser.js';
import { sequenceInstaller } from './sequence.js';
import { browserInstaller } from './browser.js';
import { nodeInstaller } from './node.js';

export const createEnvironment = createEmptyEnvironment()
  .use(receiverInstaller(method))
  .use(primitivesInstaller(method))
  .use(messageInstaller())
  .use(parserInstaller())
  .use(sequenceInstaller())
  .use(
    typeof window === 'undefined'
      ? nodeInstaller(global)
      : browserInstaller(window),
  );
