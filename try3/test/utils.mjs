export function createUtils(createEnv, assert) {
  let currentEnv = null;
  return {
    assertReturn(code, ret) {
      assert({
        given: `\`${code}\``,
        should: `return ${typeof ret === 'string' ? `"${ret}"` : ret}`,
        actual: (currentEnv ?? createEnv()).eval(code),
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
    withSameEnv(fn) {
      const env = createEnv();
      currentEnv = env;
      fn(env);
      currentEnv = null;
    },
  };
}
