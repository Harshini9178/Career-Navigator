import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      exclude: ['jspdf', 'canvg', 'html2pdf.js']
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/data/**', '**/backend/**', '**/.git/**', '**/target/**', '**/db.json', '**/*.jsonl', '**/*.log', '**/dist/**']
      },
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_URL || 'http://localhost:8081',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@monaco-editor') || id.includes('monaco-editor')) {
              return 'monaco-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-vendor';
            }
            if (id.includes('motion')) {
              return 'motion-vendor';
            }
          }
        }
      }
    },
    test: {
      exclude: ['**/node_modules/**', '**/dist/**', 'MockGenius-main/**'],
      fileParallelism: false
    }
  };
});
