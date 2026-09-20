import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Cloudflare quick tunnels hand out a random *.trycloudflare.com hostname
    // each run, so the exact host can't be allow-listed in advance.
    allowedHosts: true,
  },
});
