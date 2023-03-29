// @ts-check

/** @type {import('vite').UserConfig} */
export default {
  define: {
    'process.env': {
      NODE_DEBUG: false,
    },
  },
  resolve: {
    alias: {
      'ohm-js': './ohm.js',
      recast: './recast.js',
    },
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        tu: 'index.mjs',
        ohm: 'node_modules/ohm-js/src/main.js',
        recast: 'node_modules/recast/main.js',
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['./ohm.js', './recast.js'],
      makeAbsoluteExternalsRelative: true,
    },
  },
};
