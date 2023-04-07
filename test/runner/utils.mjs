export function envTestUtils(createEnvironment, assert, defaultShowTime = false) {
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
      write(message) {
        currentLogs.push(message);
      },
    });
  return {
    async assertReturn(code, ret, showTime = defaultShowTime) {
      const startTime = showTime ? performance.now() : 0;
      assert({
        given: `\`${code}\``,
        should: `return ${typeof ret === 'string' ? `"${ret}"` : ret}`,
        actual: await (currentEnv ?? createEnv()).eval(code),
        expected: ret,
      });
      if (showTime) {
        const endTime = performance.now();
        console.log(`took ${endTime - startTime}ms`);
      }
    },
    async assertError(code, error, showTime = defaultShowTime) {
      const startTime = showTime ? performance.now() : 0;
      assert({
        given: `\`${code}\``,
        should: `throw "${error}"`,
        actual: await (async () => {
          let res;
          let err;
          try {
            res = await (currentEnv ?? createEnv()).eval(code);
          } catch (e) {
            err = e;
          }
          return err?.message ?? res;
        })(),
        expected: error,
      });
      if (showTime) {
        const endTime = performance.now();
        console.log(`took ${endTime - startTime}ms`);
      }
    },
    assertCode(code, expected, showTime = defaultShowTime) {
      const startTime = showTime ? performance.now() : 0;
      assert({
        given: `\`${code}\``,
        should: `parse as \`${expected}\``,
        actual: (currentEnv ?? createEnv()).parse(code).toString(),
        expected,
      });
      if (showTime) {
        const endTime = performance.now();
        console.log(`took ${endTime - startTime}ms`);
      }
    },
    async assertLogs(code, logs, showTime = defaultShowTime) {
      logs = Array.isArray(logs) ? logs : [logs];
      const startTime = showTime ? performance.now() : 0;
      assert({
        given: `\`${code}\``,
        should: `logs ${logs.map((l) => `"${l}"`).join(', ')}`,
        actual: await (async () => {
          currentLogs = [];
          await (currentEnv ?? logEnv()).eval(code);
          return currentLogs;
        })(),
        expected: logs,
      });
      if (showTime) {
        const endTime = performance.now();
        console.log(`took ${endTime - startTime}ms`);
      }
    },
    async withEnv(fn, env) {
      currentEnv = env ?? logEnv();
      await fn(currentEnv);
      currentEnv = null;
    },
  };
}
