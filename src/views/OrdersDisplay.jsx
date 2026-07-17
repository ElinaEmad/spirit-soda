import React, { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/db'
import { useLive } from '../lib/useLive'
import { money, todayISO, dayRange } from '../lib/format'
import Thumb from '../components/Thumb.jsx'

// Kitchen board: today's active orders, one card per order, in the order they
// were placed — first come, first served (oldest at the top).
export default function OrdersDisplay() {
  const range = dayRange(todayISO())
  const [orders, reload] = useLive(() => db.listOrders(range), [todayISO()])
  const [menu] = useLive(() => db.listMenuItems())
  const [cats] = useLive(() => db.listCategories())
  const [now, setNow] = useState(() => Date.now())

  // Look up an item's icon from the current menu (icons aren't stored on the order).
  const iconFor = useMemo(() => {
    const catName = {}
    ;(cats || []).forEach((c) => (catName[c.id] = c.name))
    const map = {}
    ;(menu || []).forEach((m) => {
      map[`${catName[m.category_id] || 'Uncategorized'}::${m.name}`] = { emoji: m.emoji, image_url: m.image_url }
    })
    return (it) => map[`${it.category_name || 'Uncategorized'}::${it.item_name}`] || {}
  }, [menu, cats])

  // Refresh data + the "x min ago" clock so the board never goes stale.
  useEffect(() => {
    const id = setInterval(() => {
      reload()
      setNow(Date.now())
    }, 5000)
    return () => clearInterval(id)
  }, [reload])

  // First come, first served: oldest order first.
  const queue = useMemo(
    () =>
      (orders || [])
        .filter((o) => o.status !== 'completed')
        .sort((a, b) => (a.created_at < b.created_at ? -1 : 1)),
    [orders]
  )

  if (!orders) return <p className="muted">Loading…</p>

  const waited = (iso) => {
    const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000))
    return mins === 0 ? 'just now' : `${mins} min ago`
  }

  return (
    <div className="view">
      <div className="row between center">
        <h2>Kitchen queue</h2>
        <span className="pill">{queue.length} waiting</span>
      </div>

      {queue.length === 0 && <p className="muted">No active orders. New orders appear here in the order they arrive.</p>}

      <ul className="queue">
        {queue.map((o, i) => (
          <li key={o.id} className={i === 0 ? 'order-card next' : 'order-card'}>
            <div className="oc-head">
              <span className="oc-num">#{i + 1}</span>
              <span className="oc-customer">{o.customer_name}</span>
              <span className="oc-time">{waited(o.created_at)}</span>
            </div>

            <ul className="oc-items">
              {(o.items || []).map((it, j) => (
                <li key={j} className="oc-line">
                  <Thumb {...iconFor(it)} size="sm" />
                  <span className="bl-qty">{it.qty}×</span>
                  <span className="oc-name">
                    {it.item_name} <span className="muted small">{it.size_name}</span>
                    {it.addons?.length > 0 && <span className="muted small"> · {it.addons.map((a) => a.name).join(', ')}</span>}
                    {it.note && <span className="note"> “{it.note}”</span>}
                  </span>
                </li>
              ))}
            </ul>

            <div className="oc-foot">
              <strong>{money(o.total)}</strong>
              <button className="btn done" onClick={() => db.updateOrderStatus(o.id, 'completed')}>✓ Done</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
