// src/main.tsx (ISKO SIMPLE RAKHO)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App /> {/* SIRF APP, NO ROUTER HERE */}
  </React.StrictMode>
)