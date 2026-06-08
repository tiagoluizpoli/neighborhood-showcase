import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({}),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Neighborhood Showcase',
        short_name: 'Showcase',
        description: 'Neighborhood Showcase - PWA Application',
        theme_color: '#0c0c0c',
      },
      pwaAssets: { disabled: false, config: true },
      devOptions: { enabled: true },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('react-i18next') || id.includes('i18next'))
              return 'vendor-i18n';
            if (id.includes('better-auth')) return 'vendor-auth';
            if (
              id.includes('shadcn') ||
              id.includes('@neighborhood-showcase/ui')
            )
              return 'vendor-ui';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('sonner')) return 'vendor-toast';
            if (id.includes('zod')) return 'vendor-zod';
            return 'vendor-misc';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
