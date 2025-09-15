import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Performance optimizations
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Group node_modules by package
          if (id.includes('node_modules')) {
            // Separate Monaco Editor into its own chunk for lazy loading
            if (id.includes('@monaco-editor/react') || id.includes('monaco-editor')) {
              return 'monaco';
            }

            // Separate AI providers into their own chunks
            if (id.includes('openai')) return 'ai-openai';
            if (id.includes('@anthropic-ai/sdk')) return 'ai-anthropic';
            if (id.includes('@google/generative-ai')) return 'ai-google';
            if (id.includes('cohere-ai')) return 'ai-cohere';
            if (id.includes('@mistralai/mistralai')) return 'ai-mistral';

            // Separate React ecosystem
            if (id.includes('react') || id.includes('react-dom')) return 'react';

            // UI libraries
            if (id.includes('lucide-react')) return 'icons';

            // Tauri APIs
            if (id.includes('@tauri-apps/')) return 'tauri';

            // Database and auth
            if (id.includes('@supabase/supabase-js')) return 'supabase';
            if (id.includes('@stripe/stripe-js')) return 'stripe';

            // State management and utilities
            if (id.includes('zustand') || id.includes('axios') || id.includes('crypto-js')) {
              return 'utils';
            }

            // Other vendor libraries
            return 'vendor';
          }
        }
      }
    },

    // Optimize chunk size
    chunkSizeWarningLimit: 1000,

    // Enable source maps only in development
    sourcemap: process.env.NODE_ENV === 'development',

    // Use esbuild for faster builds with good compression
    minify: 'esbuild',

    // Report compressed file sizes
    reportCompressedSize: true,

    // Output directory
    outDir: 'dist',

    // Clean output directory before build
    emptyOutDir: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'lucide-react'
    ],
    exclude: [
      // Exclude large dependencies that should be lazy loaded
      '@monaco-editor/react',
      'monaco-editor'
    ]
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : {
          overlay: false
        },
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
