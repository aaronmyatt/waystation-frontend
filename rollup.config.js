import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

const production = process.env.NODE_ENV === 'production';

export default [
  // JavaScript/TypeScript bundle
  {
    input: 'src/vscode-extension/index.ts',
    watch: {
      exclude: ['dist/**']
    },
    output: {
      file: 'dist/waystation-vscode.js',
      format: 'iife',
      name: 'WaystationApp',
      sourcemap: !production
    },
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
        'process.env.API_BASE_URL': JSON.stringify(production ? 'https://waystation.aaronmyatt.com/api/v1' : 'http://localhost:4000/api/v1'),
        preventAssignment: true,
      }),
      resolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
        mainFields: ['module', 'jsnext:main', 'jsnext'],
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          noEmitOnError: false
        }
      })
    ]
  },
  // CSS bundle (separate from JS)
  {
    input: 'src/vscode-extension/styles-entry.js',
    watch: {
      exclude: ['dist/**']
    },
    output: {
      file: 'dist/waystation-vscode-styles-temp.js', // Temporary output, will be removed
      format: 'es'
    },
    plugins: [
      postcss({
        extract: 'waystation-vscode.css',
        minimize: production,
        sourceMap: !production,
        inject: false // Don't inject into JS, only extract
      })
    ]
  }
];
