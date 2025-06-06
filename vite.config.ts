import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/EntryPoint/index.html'),
        popup: resolve(__dirname, 'src/EntryPoint/popup.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'popup' ? 'popup/[name].js' : '[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}); 