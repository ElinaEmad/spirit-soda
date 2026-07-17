import React, { useMemo, useState } from 'react'
import { db } from '../lib/db'
import { useLive } from '../lib/useLive'
import { money, todayISO, dayRange, CURRENCY } from '../lib/format'

export default function Reports() {
  const [day, setDay] = useState(todayISO())
  const [orders] = useLive(() => db.listOrders(dayRange(day)), [day])

  const stats = useMemo(() => {
    const list = orders || []
    const total = list.reduce((s, o) => s + Number(o.total || 0), 0)
    const items = {}
    const cats = {}
    for (const o of list) {
      for (const it of o.items || []) {
        const k = `${it.item_name} (${it.size_name})`
        items[k] = items[k] || { qty: 0, revenue: 0 }
        items[k].qty += it.qty
        items[k].revenue += Number(it.line_total || 0)
        const c = it.category_name || 'Uncategorized'
        cats[c] = (cats[c] || 0) + Number(it.line_total || 0)
      }
    }
    const top = Object.entries(items).sort((a, b) => b[1].qty - a[1].qty)
    return { total, count: list.length, top, cats: Object.entries(cats).sort((a, b) => b[1] - a[1]) }
  }, [orders])

  const exportCsv = () => {
    const rows = [['order_time', 'customer', 'category', 'item', 'size', 'addons', 'qty', 'unit_price', 'line_total', 'note']]
    for (const o of orders || []) {
      for (const it of o.items || []) {
        rows.push([
          o.created_at,
          o.customer_name,
          it.category_name || '',
          it.item_name,
          it.size_name || '',
          (it.addons || []).map((a) => a.name).join('; '),
          it.qty,
          it.unit_price,
          it.line_total,
          (it.note || '').replace(/\n/g, ' '),
        ])
      }
    }
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cafe-sales-${day}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!orders) return <p className="muted">Loading…</p>

  return (
    <div className="view">
      <h2>Reports</h2>

      <div className="row center">
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        <button className="btn ghost" onClick={() => setDay(todayISO())}>Today</button>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-label">Total sales</span>
          <span className="stat-value">{money(stats.total)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Orders</span>
          <span className="stat-value">{stats.count}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Avg / order</span>
          <span className="stat-value">{money(stats.count ? stats.total / stats.count : 0)}</span>
        </div>
      </div>

      <button className="btn" onClick={exportCsv} disabled={stats.count === 0}>⬇ Export CSV</button>

      <section className="card">
        <h3>Best sellers</h3>
        {stats.top.length === 0 ? <p className="muted">No sales for this day.</p> : (
          <ul className="list">
            {stats.top.map(([name, v]) => (
              <li key={name} className="rank">
                <span>{name}</span>
                <span className="muted small">{v.qty} sold · {money(v.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>Sales by category</h3>
        {stats.cats.length === 0 ? <p className="muted">—</p> : (
          <ul className="list">
            {stats.cats.map(([c, v]) => (
              <li key={c} className="rank"><span>{c}</span><span className="muted small">{money(v)}</span></li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>Orders</h3>
        {(orders || []).length === 0 ? <p className="muted">No orders.</p> : (
          <ul className="list">
            {orders.map((o) => (
              <li key={o.id} className="rank">
                <span>{o.customer_name} <span className="muted small">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
                <span>{money(o.total)} {o.status === 'completed' && <span className="tag">done</span>}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="muted small">Amounts in {CURRENCY}. Edit the symbol in src/lib/format.js.</p>
    </div>
  )
}
