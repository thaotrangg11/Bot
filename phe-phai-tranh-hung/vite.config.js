import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Đảm bảo pixi.js được pre-bundle đúng cách, tránh lỗi ESM
  optimizeDeps: {
    include: ['pixi.js'],
  },
  build: {
    outDir: 'dist',
    // Tăng chunk size limit để tránh warning khi build pixi.js
    chunkSizeWarningLimit: 2000,
  },
})
