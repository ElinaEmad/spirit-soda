import React, { useMemo, useState } from 'react'
import { db } from '../lib/db'
import { useLive } from '../lib/useLive'
import { money } from '../lib/format'
import { activeMenu, itemInMenu } from '../lib/menus'
import Thumb from '../components/Thumb.jsx'

export default function Cashier() {
  const [categories] = useLive(() => db.listCategories())
  const [items] = useLive(() => db.listMenuItems())
  const [menus] = useLive(() => db.listMenus())
  const [customer, setCustomer] = useState('')
  const [filter, setFilter] = useState('all')
  const [cart, setCart] = useState([])
  const [picking, setPicking] = useState(null) // item being customized
  const [cartOpen, setCartOpen] = useState(false) // checkout sheet
  const [toast, setToast] = useState('')

  const cat = (id) => categories?.find((c) => c.id === id)
  const catName = (id) => cat(id)?.name || 'Uncategorized'
  const catLabel = (id) => {
    const c = cat(id)
    if (!c) return 'Uncategorized'
    return c.emoji ? `${c.emoji} ${c.name}` : c.name
  }
  const active = activeMenu(menus)

  const visible = useMemo(() => {
    if (!items) return []
    return items
      .filter((i) => i.available)
      .filter((i) => itemInMenu(i, active?.id))
      .filter((i) => filter === 'all' || i.category_id === filter)
  }, [items, filter, active])

  const total = cart.reduce((s, l) => s + l.line_total, 0)
  const count = cart.reduce((s, l) => s + l.qty, 0)

  const addLine = (line) => {
    setCart((c) => [...c, { ...line, key: crypto.randomUUID?.() || String(Math.random()) }])
    setPicking(null)
  }
  const setQty = (key, d) =>
    setCart((c) =>
      c
        .map((l) => (l.key === key ? { ...l, qty: l.qty + d, line_total: (l.qty + d) * l.unit_price } : l))
        .filter((l) => l.qty > 0)
    )
  const removeLine = (key) => setCart((c) => c.filter((l) => l.key !== key))

  const submit = async () => {
    if (cart.length === 0) return
    await db.createOrder({
      customer_name: customer.trim() || 'Guest',
      total,
      items: cart.map(({ key, ...l }) => l),
    })
    setCart([])
    setCustomer('')
    setCartOpen(false)
    setToast('✅ Order sent to kitchen')
    setTimeout(() => setToast(''), 2000)
  }

  if (!categories || !items) return <p className="muted">Loading…</p>

  return (
    <div className="view cashier">
      <div className="row between center">
        <h2>New order</h2>
        {active && <span className="serving">Serving: {active.name}</span>}
      </div>

      <div className="chips scroll">
        <button className={filter === 'all' ? 'chip on' : 'chip'} onClick={() => setFilter('all')}>All</button>
        {categories.map((c) => (
          <button key={c.id} className={filter === c.id ? 'chip on' : 'chip'} onClick={() => setFilter(c.id)}>
            {c.emoji ? `${c.emoji} ` : ''}{c.name}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="muted">No available items. Add some in the Menu tab.</p>
      ) : (
        <div className="grid">
          {visible.map((it) => {
            const from = Math.min(...(it.sizes || [{ price: 0 }]).map((s) => s.price))
            const inCart = cart.reduce((s, l) => (l.item_name === it.name ? s + l.qty : s), 0)
            return (
              <button key={it.id} className="menu-btn" onClick={() => setPicking(it)}>
                {inCart > 0 && <span className="mb-badge">{inCart}</span>}
                <Thumb emoji={it.emoji} image_url={it.image_url} />
                <span className="mb-cat">{catLabel(it.category_id)}</span>
                <span className="mb-name">{it.name}</span>
                <span className="mb-price">{money(from)}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* keeps the menu grid clear of the floating bar */}
      {cart.length > 0 && <div className="fab-spacer" />}

      {/* Floating cart — always reachable, no scrolling */}
      {cart.length > 0 && (
        <button className="cart-fab" onClick={() => setCartOpen(true)}>
          <span className="cart-fab-badge">{count}</span>
          <span className="cart-fab-label">View order</span>
          <span className="cart-fab-total">{money(total)} ›</span>
        </button>
      )}

      {/* Checkout sheet */}
      {cartOpen && cart.length > 0 && (
        <div className="sheet-backdrop" onClick={() => setCartOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row between center">
              <h3>Order · {count} item{count !== 1 ? 's' : ''}</h3>
              <button className="sheet-close" onClick={() => setCartOpen(false)}>×</button>
            </div>

            <input
              className="big-input"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Customer name"
              autoFocus
            />

            {cart.map((l) => (
              <div key={l.key} className="cart-line">
                <div className="cl-info">
                  <strong>{l.item_name}</strong> <span className="muted small">{l.size_name}</span>
                  {l.addons?.length > 0 && <div className="muted small">+ {l.addons.map((a) => a.name).join(', ')}</div>}
                  {l.note && <div className="muted small">“{l.note}”</div>}
                </div>
                <div className="qty">
                  <button onClick={() => setQty(l.key, -1)}>−</button>
                  <span>{l.qty}</span>
                  <button onClick={() => setQty(l.key, +1)}>+</button>
                </div>
                <div className="cl-total">{money(l.line_total)}</div>
                <button className="cl-x" onClick={() => removeLine(l.key)}>×</button>
              </div>
            ))}

            <div className="cart-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <button className="btn big" onClick={submit}>Send order · {money(total)}</button>
            <button className="btn ghost" onClick={() => setCart([])}>Clear order</button>
          </div>
        </div>
      )}

      {picking && (
        <ItemPicker
          item={picking}
          categoryName={catName(picking.category_id)}
          onAdd={addLine}
          onClose={() => setPicking(null)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function ItemPicker({ item, categoryName, onAdd, onClose }) {
  const sizes = item.sizes?.length ? item.sizes : [{ name: 'Regular', price: 0 }]
  const [size, setSize] = useState(sizes[0])
  const [addons, setAddons] = useState([])
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')

  const toggleAddon = (a) =>
    setAddons((cur) => (cur.find((x) => x.name === a.name) ? cur.filter((x) => x.name !== a.name) : [...cur, a]))

  const unit = size.price + addons.reduce((s, a) => s + a.price, 0)

  const confirm = () =>
    onAdd({
      item_name: item.name,
      category_name: categoryName,
      size_name: size.name,
      unit_price: unit,
      qty,
      addons,
      note: note.trim(),
      line_total: unit * qty,
    })

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="sheet-title"><Thumb emoji={item.emoji} image_url={item.image_url} size="sm" /> {item.name}</h3>
        {item.description && <p className="muted small">{item.description}</p>}

        <div className="field-label">Size</div>
        <div className="chips">
          {sizes.map((s) => (
            <button key={s.name} className={size.name === s.name ? 'chip on' : 'chip'} onClick={() => setSize(s)}>
              {s.name} · {money(s.price)}
            </button>
          ))}
        </div>

        {item.addons?.length > 0 && (
          <>
            <div className="field-label">Add-ons</div>
            <div className="chips">
              {item.addons.map((a) => (
                <button
                  key={a.name}
                  className={addons.find((x) => x.name === a.name) ? 'chip on' : 'chip'}
                  onClick={() => toggleAddon(a)}
                >
                  {a.name} +{money(a.price)}
                </button>
              ))}
            </div>
          </>
        )}

        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (e.g. no sugar)" />

        <div className="row between center">
          <div className="qty big">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
          <button className="btn" onClick={confirm}>Add · {money(unit * qty)}</button>
        </div>
      </div>
    </div>
  )
}
