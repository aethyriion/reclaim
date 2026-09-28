import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

/* Build target: Supero's generated `ui/index.html` is not editable and references
 * exactly one entry point, `ui/app.js`, which it loads as `type="text/babel"`.
 * We therefore do NOT build into app.js — that would push a whole bundle through
 * @babel/standalone in the browser on every page load. Instead app.js stays a small
 * hand-written loader and injects this output as a plain classic script.
 *
 * Constraints encoded below:
 *   - IIFE, never ESM: the loader injects a classic <script> with no type="module".
 *   - emptyOutDir false: ../ui also holds app.js and CLI-generated runtime files.
 *   - minify false: keeps the shipped artifact reviewable on GitHub, and avoids
 *     tripping build_doctor's density/minification heuristics.
 */
export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  build: {
    outDir: '../ui',
    emptyOutDir: false,
    cssCodeSplit: false,
    minify: false,
    sourcemap: false,
    target: 'es2020',
    lib: {
      entry: 'src/main.ts',
      name: 'ReclaimApp',
      formats: ['iife'],
      fileName: () => 'bundle.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: (info) =>
          (info.names?.[0] ?? '').endsWith('.css') ? 'app.css' : '[name][extname]',
      },
    },
  },
});
