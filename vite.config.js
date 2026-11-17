import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Rutas relativas para que funcione en GitHub Pages (/linariastudio/) y como archivo suelto.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        tienda: resolve(import.meta.dirname, 'tienda.html'),
        mesesPasados: resolve(import.meta.dirname, 'meses-pasados.html'),
        nosotras: resolve(import.meta.dirname, 'nosotras.html'),
      },
    },
  },
});
