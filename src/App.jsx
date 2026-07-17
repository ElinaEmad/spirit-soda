import React, { useState } from 'react'
import { isCloud } from './lib/db'
import Cashier from './views/Cashier.jsx'
import OrdersDisplay from './views/OrdersDisplay.jsx'
import MenuAdmin from './views/MenuAdmin.jsx'
import Reports from './views/Reports.jsx'

const TABS = [
  { key: 'cashier', label: 'Cashier', icon: '🧾' },
  { key: 'orders', label: 'Orders', icon: '📋' },
  { key: 'menu', label: 'Menu', icon: '☕' },
  { key: 'reports', label: 'Reports', icon: '📊' },
]

export default function App() {
  const [tab, setTab] = useState('cashier')

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">🥤 Spirit Soda</span>
        <span className={`sync ${isCloud ? 'on' : 'off'}`}>
          {isCloud ? '● Live sync' : '○ Local only'}
        </span>
      </header>

      <main className="content">
        {tab === 'cashier' && <Cashier />}
        {tab === 'orders' && <OrdersDisplay />}
        {tab === 'menu' && <MenuAdmin />}
        {tab === 'reports' && <Reports />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
