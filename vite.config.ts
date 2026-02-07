import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // CRITIQUE : base: './' assure que tous les liens (JS, CSS, Assets) sont relatifs.
  // Cela empêche les erreurs 404 sur les fichiers assets quand le site n'est pas à la racine.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    port: 3000
  }
});