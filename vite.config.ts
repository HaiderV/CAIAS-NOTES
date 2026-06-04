import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from "rollup-plugin-visualizer";


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: any) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    visualizer({
      open: true,
      gzipSize: true,
      filename: "./stats.html",
      brotliSize: true,
    }),
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase/auth')) {
              return 'firebase-auth';
            }
            if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
              return 'firebase-firestore';
            }
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'firebase-core';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('lucide-react')) {
              return 'lucide';
            }
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('react-router-dom') || id.includes('scheduler')) {
              return 'react-core';
            }
            if (id.includes('motion') || id.includes('framer-motion')) {
              return 'motion';
            }
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
