import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Crucial para o Android carregar assets relativos
  build: {
    outDir: 'www',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
});