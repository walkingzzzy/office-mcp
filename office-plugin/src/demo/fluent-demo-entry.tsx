import '../styles/global.css'

import React from 'react'
import ReactDOM from 'react-dom/client'

import FluentDemo from './FluentDemo'

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <FluentDemo />
  </React.StrictMode>
)
