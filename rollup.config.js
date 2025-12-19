import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';

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
      resolve(),
      commonjs(),
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
