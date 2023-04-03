import { dValue } from './util.js';

/**
 * Installs:
 * - `Receiver.println` - a function that logs the receiver to the console
 * @returns {import('./types').EnvironmentPlugin}
 */
export function browserInstaller(window) {
  return {
    install(Lobby, options) {
      const log = options?.log ?? window.console.log.bind(window.console);

      function Receiver_println() {
        log(this?.toString?.() ?? this);
        return this;
      }
      Object.defineProperty(
        Lobby.Receiver,
        'println',
        dValue(Receiver_println),
      );

      function Receiver_writeln(...msgs) {
        const text = msgs.map((msg) => msg?.toString?.() ?? msg).join(' ');
        log(text);
        return this;
      }
      Object.defineProperty(
        Lobby.Receiver,
        'writeln',
        dValue(Receiver_writeln),
      );

      return Lobby;
    },
  };
}
