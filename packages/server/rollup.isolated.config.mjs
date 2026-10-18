// This config rolls up all the types for the isolated module to a single declaration (d.ts) file.

import dts from 'rollup-plugin-dts';

export default {
  input: './src/isolated.ts',
  output: {
    file: './dist/isolated.d.ts',
    format: 'es',
  },
  // function indicating which deps should be considered external: external deps will NOT have their types bundled
  external: (id) => {
    // bundle everything except peer deps (@openfeature/*, @nest/*, react, rxjs)
    return id.startsWith('@openfeature') || id.startsWith('@nest') || id === 'rxjs' || id === 'react';
  },
  plugins: [
    // use the rollup override tsconfig (applies equivalent in each sub-packages as well)
    dts({ tsconfig: './tsconfig.rollup.json', respectExternal: true }),
  ],
};
