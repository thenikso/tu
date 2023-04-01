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
    return {
      Lobby,
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
