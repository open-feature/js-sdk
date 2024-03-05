// this config rolls up all the types in the project to a single declaration (d.ts) file.
// we do NOT use rollup to build (we use esbuild for that)

import dts from 'rollup-plugin-dts';

export default {
  input: "./src/index.ts",
  output: {
    file: './dist/types.d.ts',
    format: 'es', // module format doesn't really matter here since output is types
  },
  // function indicating which deps should be considered external: external deps will NOT have their types bundled
  external: (id) => {
    // bundle everything but '@openfeature/core', which is a peer
    return id === '@openfeature/core';
  },
  plugins: [
    // use the rollup override tsconfig (applies equivalent in each sub-packages as well)
    dts({tsconfig: './tsconfig.rollup.json', respectExternal: true }),
  ],
};