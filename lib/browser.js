import { dValue } from './util.js';

/**
 * Installs:
 * - `Receiver.println` - a function that logs the receiver to the console
 * @returns {import('./types').EnvironmentPlugin}
 */
export function browserInstaller(window) {
  return {
    install(Lobby, options) {
      const write = options?.write ?? window.console.log.bind(window.console);

      Object.defineProperty(
        Lobby.Receiver,
        'println',
        dValue(function Receiver_println() {
          write((this?.toString?.() ?? String(this)) + '\n');
          return this;
        }),
      );
      Object.defineProperty(
        Lobby.Receiver,
        'print',
        dValue(function Receiver_print() {
          write(this?.toString?.() ?? String(this));
          return this;
        }),
      );

      Object.defineProperty(
        Lobby.Receiver,
        'writeln',
        dValue(function Receiver_writeln(...msgs) {
          const text = msgs.map((msg) => msg?.toString?.() ?? msg).join('');
          write(text + '\n');
          return this;
        }),
      );
      Object.defineProperty(
        Lobby.Receiver,
        'write',
        dValue(function Receiver_write(...msgs) {
          const text = msgs.map((msg) => msg?.toString?.() ?? msg).join('');
          write(text);
          return this;
        }),
      );

      // TODO put somewhere else
      Object.defineProperty(
        Lobby,
        'fetch',
        dValue(function Lobby_fetch(url, options) {
          return window.fetch(url, options);
        }),
      );

      return Lobby;
    },
  };
}
