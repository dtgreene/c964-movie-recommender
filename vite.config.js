import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  root: './runtime/client',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5005',
    },
  },
  resolve: {
    alias: {
      utils: path.resolve(import.meta.dirname, 'runtime/client/src/utils.js'),
      store: path.resolve(import.meta.dirname, 'runtime/client/src/store.js'),
      query: path.resolve(import.meta.dirname, 'runtime/client/src/query.js'),
    },
  },
});
