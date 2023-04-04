import { dValue } from './util.js';

/**
 * Installs:
 * - `Receiver.println` - a function that logs the receiver to the console
 * @returns {import('./types').EnvironmentPlugin}
 */
export function nodeInstaller(global) {
  return {
    install(Lobby, options) {
      const log = options?.log ?? global.console.log.bind(global.console);

      Object.defineProperty(
        Lobby.Receiver,
        'println',
        dValue(function Receiver_println() {
          log(this?.toString?.() ?? this);
          return this;
        }),
      );
      Object.defineProperty(
        Lobby.Receiver,
        'print',
        dValue(function Receiver_print() {
          global.process.stdout.write(this?.toString?.() ?? this);
          return this;
        }),
      );

      Object.defineProperty(
        Lobby.Receiver,
        'writeln',
        dValue(function Receiver_writeln(...msgs) {
          const text = msgs.map((msg) => msg?.toString?.() ?? msg).join('');
          log(text);
          return this;
        }),
      );
      Object.defineProperty(
        Lobby.Receiver,
        'write',
        dValue(function Receiver_write(...msgs) {
          const text = msgs.map((msg) => msg?.toString?.() ?? msg).join('');
          global.process.stdout.write(text);
          return this;
        }),
      );

      return Lobby;
    },
  };
}
