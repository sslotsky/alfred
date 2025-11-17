import { copy } from '@web/rollup-plugin-copy';
import resolve from '@rollup/plugin-node-resolve';
// import {terser} from '@rollup/plugin-terser';
// import minifyHTML from 'rollup-plugin-minify-html-literals';
import summary from 'rollup-plugin-summary';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';


export default {
  plugins: [
    // Entry point for application build; can specify a glob to build multiple
    // HTML files for non-SPA app
    // Resolve bare module specifiers to relative paths
    typescript({
      include: ['src/client/**/*.ts', 'src/shared/**/*.ts', 'src/environment.d.ts'],
      target: "ES2022",
    }),
    resolve(),
    // Minify HTML template literals
    // minifyHTML(),
    // Minify JS
    // terser({
    //   ecma: 2021,
    //   module: true,
    //   warnings: true,
    // }),
    // Print bundle summary
    summary(),
    commonjs({
      requireReturnsDefault: 'auto'
    }),
    // Optional: copy any static assets to build directory
    copy({
      patterns: ['*.css'],
    }),
  ],
  input: 'src/client/index.ts',
  output: {
    dir: 'public',
    format: 'esm',
    sourcemap: true
  },
  preserveEntrySignatures: 'strict',
};