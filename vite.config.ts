import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-assets',
      writeBundle() {
        // Copy manifest
        copyFileSync('manifest.json', 'dist/manifest.json');
        
        // Create icons directory
        if (!existsSync('dist/icons')) {
          mkdirSync('dist/icons');
        }
        
        // Create icon files with base64 data
        const iconData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafgwQLwcJCG1sLwcJCbW1tLbS1tRBsLbTQQrC1tRBsLbTQQrC1EGwtLLTQQrBQsLXQQrC10EKwtdBCsLXQQgtdC+25vZmdmZ2ZfXeZ/1//A1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqA1V1oKoOVNWBqjpQVQeq6kBVHaiqg/8A/1cAA7stLCsAAAAASUVORK5CYII=', 'base64');
        
        const iconSizes = [16, 32, 48, 128];
        iconSizes.forEach(size => {
          writeFileSync(`dist/icons/icon-${size}.png`, iconData);
        });
        
        console.log('✅ Icons and manifest created successfully!');
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});