export function createEmptyEnvironment() {
  /** @type {import('./types').EnvironmentPlugin[]} */
  const plugins = [];

  function createEnvironment(options) {
    let Lobby = null;
    const pluginsCount = plugins.length;
    for (let i = 0; i < pluginsCount; i++) {
      Lobby = plugins[i].install?.(Lobby, options);
    }
    for (let i = 0; i < pluginsCount; i++) {
      plugins[i].secure?.(Lobby, options);
    }

    function run(code) {
      const msg = Lobby.Message.fromString(code);
      return msg.doInContext(Lobby);
    }

    function tu(strings, ...values) {
      let code = '';
      for (let i = 0; i < strings.length; i++) {
        code += strings[i];
        if (i < values.length) {
          code += values[i];
        }
      }
      return run(code);
    }

    return {
      Lobby,
      run,
      tu,
    };
  }

  /**
   *
   * @param {import('./types').EnvironmentPlugin} plugin
   * @returns
   */
  createEnvironment.use = function createEnvironmentUse(plugin) {
    plugins.push(plugin);
    return createEnvironment;
  };

  return createEnvironment;
}
