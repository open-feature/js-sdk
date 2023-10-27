// this config rolls up all the types in the project to a single declaration (d.ts) file.
// we do NOT use rollup to build (we use esbuild for that)

import alias from '@rollup/plugin-alias';
import dts from 'rollup-plugin-dts';

export default {
  input: "./src/index.ts",
  output: {
    file: './dist/types.d.ts',
    format: 'es', // module format doesn't really matter here since output i
  },
  external: [
    // function indicating which deps should be considered external: non-external deps will have their types bundled
    (id) => {
      // bundle 'events' types
      return id !== 'events';
    }
  ],
  plugins: [
    // TODO delete?
    // alias({
    //   entries: [
    //     { find: '@openfeature/core', replacement: '../shared/dist/types.d.ts' },
    //   ],
    // }),
    dts({tsconfig: './tsconfig.json'}),
  ],
};