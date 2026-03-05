import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), basicSsl()],
    server: {
        port: 5174,
        host: true,
        https: true,
        // Proxy API requests to backend (solves HTTPS/HTTP mixed content on mobile)
        proxy: {
            '/api': {
                target: 'http://146.56.53.208:8000',
                changeOrigin: true,
            },
            '/ws': {
                target: 'ws://146.56.53.208:8000',
                ws: true,
            },
            '/people': {
                target: 'http://146.56.53.208:8000',
                changeOrigin: true,
            },
            '/register-face': {
                target: 'http://146.56.53.208:8000',
                changeOrigin: true,
            },
            '/health': {
                target: 'http://146.56.53.208:8000',
                changeOrigin: true,
            },
        },
    },
})
