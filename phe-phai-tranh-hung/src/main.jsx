import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Không dùng StrictMode để tránh double-invoke với Pixi.js WebGL context
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
