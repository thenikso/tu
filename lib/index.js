import { createEmptyEnvironment } from './environment.js';
import { coreReceiverInstaller } from './receiver.js';

export const createEnvironment = createEmptyEnvironment().use(
  coreReceiverInstaller(),
);
