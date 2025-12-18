import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';

const production = process.env.NODE_ENV === 'production';

export default {
  input: 'src/vscode-extension/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    name: 'WaystationApp',
    sourcemap: !production
  },
  plugins: [
    postcss({
      extract: 'bundle.css',
      minimize: production,
      sourceMap: !production
    }),
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      compilerOptions: {
        noEmitOnError: false
      }
    })
  ]
};
