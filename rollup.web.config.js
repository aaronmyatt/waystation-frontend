import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

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
      replace({
        'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
        'process.env.API_BASE_URL': JSON.stringify(production ? '/api/v1' : 'http://localhost:4000/api/v1'),
        preventAssignment: true,
      }),
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

  // Web Integration bundle
  {
    input: 'src/web/integration.ts',
    watch: {
      exclude: ['dist/**']
    },
    output: {
      file: 'dist/waystation-integration.js',
      format: 'iife',
      name: 'WaystationIntegration',
      sourcemap: !production,
    },
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
        'process.env.API_BASE_URL': JSON.stringify(production ? '/api/v1' : 'http://localhost:4000/api/v1'),
        preventAssignment: true,
      }),
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
