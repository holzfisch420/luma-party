import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const SERVER_PORT = Number(process.env.SERVER_PORT ?? 3001);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // im LAN erreichbar, damit Smartphones beitreten können
    port: 5173,
    proxy: {
      '/api': `http://localhost:${SERVER_PORT}`,
      '/socket.io': { target: `http://localhost:${SERVER_PORT}`, ws: true },
    },
  },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1000 },
});
