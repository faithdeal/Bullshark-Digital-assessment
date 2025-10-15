import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // listen on all addresses (fixes some localhost/IPv6 issues)
    port: 5173,
    open: false,
  },
  preview: {
    host: true,
    port: 5173,
  },
})
