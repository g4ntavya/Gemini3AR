/**
 * RemindAR Frontend - Main Entry Point
 * Renders the React application with AR overlay system
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { Analytics } from '@vercel/analytics/react'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
        <Analytics />
    </React.StrictMode>,
)
