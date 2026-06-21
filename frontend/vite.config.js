import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El proxy /api replica el rewrite de vercel.json hacia el backend de Railway,
// para que los fetch del cliente sigan apuntando a rutas relativas /api/*.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://infradraw-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
