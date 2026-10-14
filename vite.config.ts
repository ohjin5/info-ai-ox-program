import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxR76bAEt-552_1G4xzTTdxc5Erp1srEx4dVh1S3z4nFOk2k-FV3Y5-CTONygJJCCfjVw/exec';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: '0.0.0.0',
    port: 3000,

    proxy: {
      '/api/apps-script': {
        target: APPS_SCRIPT_URL,

        changeOrigin: true,

        secure: true,

        followRedirects: true,

        rewrite: (path) =>
          path.replace(
            /^\/api\/apps-script/,
            ''
          ),
      },
    },
  },
});