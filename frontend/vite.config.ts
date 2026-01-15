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
        // Proxy API requests to the backend (solves mixed content issue on mobile)
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/ws': {
                target: 'ws://localhost:8000',
                ws: true,
            },
            '/people': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/register-face': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/health': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    // Optimize dependencies
    optimizeDeps: {
        include: ['three', '@react-three/fiber', '@react-three/drei'],
    },
})
