import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        auth: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        board: resolve(__dirname, 'board.html'),
        post: resolve(__dirname, 'post.html'),
        write: resolve(__dirname, 'write.html'),
      },
    },
  },
});