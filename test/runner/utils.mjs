export function envTestUtils(createEnvironment, assert) {
  let currentEnv = null;
  let currentLogs = [];
  const createEnv = (options) => {
    const env = createEnvironment(options);
    return {
      parse(code) {
        return env.Lobby.Message.fromString(code);
      },
      eval(code) {
        const msg = env.Lobby.Message.fromString(code);
        return msg.doInContext(env.Lobby);
      },
    };
  };
  const logEnv = () =>
    createEnv({
      // TODO new options
      log(message) {
        currentLogs.push(message);
      },
    });
  return {
    assertReturn(code, ret) {
      assert({
        given: `\`${code}\``,
        should: `return ${typeof ret === 'string' ? `"${ret}"` : ret}`,
        actual: (currentEnv ?? createEnv()).eval(code),
        expected: ret,
      });
    },
    async assertAsyncReturn(code, ret) {
      assert({
        given: `\`${code}\``,
        should: `return ${typeof ret === 'string' ? `"${ret}"` : ret}`,
        actual: await (currentEnv ?? createEnv()).eval(code),
        expected: ret,
      });
    },
    assertError(code, error) {
      assert({
        given: `\`${code}\``,
        should: `throw "${error}"`,
        actual: (() => {
          let res;
          let err;
          try {
            res = (currentEnv ?? createEnv()).eval(code);
          } catch (e) {
            err = e;
          }
          return err?.message ?? res;
        })(),
        expected: error,
      });
    },
    assertCode(code, expected) {
      assert({
        given: `\`${code}\``,
        should: `parse as \`${expected}\``,
        actual: (currentEnv ?? createEnv()).parse(code).toString(),
        expected,
      });
    },
    assertLogs(code, ...logs) {
      assert({
        given: `\`${code}\``,
        should: `logs ${logs.map((l) => `"${l}"`).join(', ')}`,
        actual: (() => {
          currentLogs = [];
          (currentEnv ?? logEnv()).eval(code);
          return currentLogs;
        })(),
        expected: logs,
      });
    },
    withEnv(fn, env) {
      currentEnv = env ?? logEnv();
      fn(currentEnv);
      currentEnv = null;
    },
  };
}
