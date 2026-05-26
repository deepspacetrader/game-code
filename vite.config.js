import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Set base path for GitHub Pages (root of deepspacetrader.github.io)
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
  },
});