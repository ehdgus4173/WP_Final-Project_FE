import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, readdirSync, mkdirSync, existsSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        board: resolve(__dirname, 'board.html'),
        post: resolve(__dirname, 'post.html'),
        write: resolve(__dirname, 'write.html'),
        admin: resolve(__dirname, 'admin.html'),
        callback: resolve(__dirname, 'callback.html'),
        mypage: resolve(__dirname, 'mypage.html')
      },
    },
  },
  plugins: [
    {
      name: 'copy-js',
      closeBundle() {
        const srcDir = resolve(__dirname, 'js');
        const destDir = resolve(__dirname, 'dist/js');
        if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
        readdirSync(srcDir).forEach(file => {
          copyFileSync(resolve(srcDir, file), resolve(destDir, file));
        });
      },
    },
  ],
});