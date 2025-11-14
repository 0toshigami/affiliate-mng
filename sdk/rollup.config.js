import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // UMD build for browsers (unminified)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/affiliate-sdk.js',
      format: 'umd',
      name: 'AffiliateSDK',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
        rootDir: './src',
      }),
    ],
  },
  // UMD build for browsers (minified)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/affiliate-sdk.min.js',
      format: 'umd',
      name: 'AffiliateSDK',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
      terser({
        compress: {
          drop_console: production,
        },
      }),
    ],
  },
  // ESM build for modern bundlers
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/affiliate-sdk.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
  },
];
