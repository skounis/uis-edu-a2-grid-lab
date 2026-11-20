import { defineConfig } from 'vite';

// base './' so the built site works from any path, for example a GitHub Pages project site.
export default defineConfig({
  base: './',
  test: { environment: 'node' },
});
