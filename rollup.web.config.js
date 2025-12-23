import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import json from '@rollup/plugin-json';

const production = process.env.NODE_ENV === 'production';

export default [
  // Web JS bundle
  {
    input: 'src/web/index.ts',
    watch: {
      exclude: ['dist/**']
    },
    output: {
      file: 'dist/waystation-web.js',
      format: 'iife',
      name: 'WaystationWebApp',
      sourcemap: !production,
      
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          noEmitOnError: false
        }
      })
    ],
  },

  // Web CSS bundle (reuses the existing styles entry)
  {
    input: 'src/web/styles-entry.js',
    watch: {
      exclude: ['dist/**']
    },
    output: {
      file: 'dist/waystation-web-styles-temp.js',
      format: 'esm',
      sourcemap: !production,
    },
    plugins: [
      postcss({
        extract: 'waystation-web.css',
        minimize: production,
        sourceMap: !production,
        inject: false // Don't inject into JS, only extract
      })
    ],
  },
];
