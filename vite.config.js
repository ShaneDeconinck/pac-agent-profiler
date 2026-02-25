import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss()],
  build: mode === 'lib'
    ? {
        lib: {
          entry: resolve(__dirname, 'src/lib.js'),
          name: 'PACProfiler',
          formats: ['es', 'umd'],
          fileName: (format) => `pac-profiler.${format}.js`,
          cssFileName: 'pac-profiler',
        },
        outDir: 'dist-lib',
      }
    : {
        outDir: 'dist',
      },
}))
