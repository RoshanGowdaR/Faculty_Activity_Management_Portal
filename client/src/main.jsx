import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Intercept axios requests to rewrite http://localhost:5000 to the correct api host in production/Vercel
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http://localhost:5000')) {
    const isDev = import.meta.env.DEV;
    const apiBase = import.meta.env.VITE_API_URL;
    if (apiBase !== undefined) {
      config.url = config.url.replace('http://localhost:5000', apiBase);
    } else if (!isDev) {
      config.url = config.url.replace('http://localhost:5000', '');
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
