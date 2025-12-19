import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import tailwindcss from 'tailwindcss';

const production = process.env.NODE_ENV === 'production';

export default [
  // Web JS bundle
  {
    input: 'src/web/index.ts',
    output: {
      file: 'dist/waystation-web.js',
      format: 'iife',
      name: 'WaystationWebApp',
      sourcemap: !production,
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript(),
    ],
  },

  // Web CSS bundle (reuses the existing styles entry)
  {
    input: 'src/vscode-extension/styles-entry.js',
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
        plugins: [tailwindcss()],
      }),
    ],
  },
];
