export async function loadFile(filePath) {
  if (typeof window !== 'undefined') {
    const res = await fetch(filePath);
    return res.text();
  }
  const fs = await import('fs/promises');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return fs.readFile(path.resolve(__dirname, '..', filePath), 'utf8');
}

export function envTestUtils(createEnvironment, assert, defaultOptions) {
  let currentEnv = null;
  let currentLogs = [];
  const { showTime: defaultShowTime = false } = defaultOptions ?? {};
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
    async assertReturn(code, ret, options) {
      const { showTime = defaultShowTime } = options ?? {};
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
    async assertError(code, error, options) {
      const { showTime = defaultShowTime } = options ?? {};
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
    assertCode(code, expected, options) {
      const { showTime = defaultShowTime } = options ?? {};
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
    async assertLogs(code, logs, options) {
      const { showTime = defaultShowTime, mapLogs } = options ?? {};
      logs = Array.isArray(logs) ? logs : [logs];
      const startTime = showTime ? performance.now() : 0;
      assert({
        given: `\`${code}\``,
        should: `log ${logs.map((l) => `"${l}"`).join(', ')}`,
        actual: await (async () => {
          currentLogs = [];
          await (currentEnv ?? logEnv()).eval(code);
          return mapLogs ? mapLogs(currentLogs) : currentLogs;
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
