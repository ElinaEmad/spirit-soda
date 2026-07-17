import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Surface any failed save (e.g. network/database error) as a brief banner,
// so an action never silently "vanishes".
function showError(message) {
  let el = document.getElementById('err-banner')
  if (!el) {
    el = document.createElement('div')
    el.id = 'err-banner'
    el.className = 'err-banner'
    document.body.appendChild(el)
  }
  el.textContent = `⚠ ${message}`
  el.classList.add('show')
  clearTimeout(el._t)
  el._t = setTimeout(() => el.classList.remove('show'), 4000)
}
window.addEventListener('unhandledrejection', (e) => {
  showError(e.reason?.message || 'Something went wrong. Please try again.')
})

createRoot(document.getElementById('root')).render(<App />)
