import { dValue } from './util.js';

/**
 * Installs:
 * - `Receiver.println` - a function that logs the receiver to the console
 * @param {typeof globalThis} global
 * @returns {import('./types').EnvironmentPlugin}
 */
export function nodeInstaller(global) {
  return {
    install(Lobby, options) {
      const write =
        options?.write ??
        global.process.stdout.write.bind(global.process.stdout);

      Object.defineProperty(
        Lobby.Receiver,
        'println',
        dValue(function Receiver_println() {
          write((this?.asString?.() ?? String(this)) + '\n');
          return this;
        }),
      );
      Object.defineProperty(
        Lobby.Receiver,
        'print',
        dValue(function Receiver_print() {
          write(this?.asString?.() ?? String(this));
          return this;
        }),
      );

      Object.defineProperty(
        Lobby.Receiver,
        'writeln',
        dValue(function Receiver_writeln(...msgs) {
          const text = msgs.map((msg) => msg?.asString?.() ?? msg).join('');
          write(text + '\n');
          return this;
        }),
      );
      Object.defineProperty(
        Lobby.Receiver,
        'write',
        dValue(function Receiver_write(...msgs) {
          const text = msgs.map((msg) => msg?.asString?.() ?? msg).join('');
          write(text);
          return this;
        }),
      );

      // TODO put somewhere else
      Object.defineProperty(
        Lobby,
        'fetch',
        dValue(function Lobby_fetch(url, options) {
          return global.fetch(url, options);
        }),
      );

      return Lobby;
    },
  };
}
