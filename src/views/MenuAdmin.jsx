import React, { useState } from 'react'
import { db } from '../lib/db'
import { useLive } from '../lib/useLive'
import { money } from '../lib/format'
import { activeMenu } from '../lib/menus'
import { seedSampleMenu } from '../lib/sampleMenu'
import Thumb from '../components/Thumb.jsx'

const blankItem = (menuId) => ({
  name: '',
  category_id: '',
  description: '',
  emoji: '',
  image_url: '',
  menu_ids: menuId ? [menuId] : [],
  sizes: [{ name: 'Regular', price: '' }],
  addons: [],
})

export default function MenuAdmin() {
  const [categories] = useLive(() => db.listCategories())
  const [items] = useLive(() => db.listMenuItems())
  const [menus] = useLive(() => db.listMenus())
  const [newCat, setNewCat] = useState('')
  const [newMenu, setNewMenu] = useState('')
  const [editing, setEditing] = useState(null) // item draft or null

  if (!categories || !items || !menus) return <p className="muted">Loading…</p>

  const catName = (id) => categories.find((c) => c.id === id)?.name || 'Uncategorized'
  const menuName = (id) => menus.find((m) => m.id === id)?.name
  const active = activeMenu(menus)
  const allMenuIds = menus.map((m) => m.id)

  const saveItem = async (draft) => {
    const sizes = draft.sizes
      .filter((s) => s.name.trim() !== '')
      .map((s) => ({ name: s.name.trim(), price: Number(s.price) || 0 }))
    if (sizes.length === 0) sizes.push({ name: 'Regular', price: 0 })
    const addons = draft.addons
      .filter((a) => a.name.trim() !== '')
      .map((a) => ({ name: a.name.trim(), price: Number(a.price) || 0 }))
    const payload = {
      name: draft.name.trim(),
      category_id: draft.category_id || null,
      description: draft.description.trim(),
      emoji: (draft.emoji || '').trim(),
      image_url: (draft.image_url || '').trim(),
      menu_ids: (draft.menu_ids || []).filter((id) => allMenuIds.includes(id)),
      sizes,
      addons,
    }
    if (!payload.name) return
    if (draft.id) await db.updateMenuItem(draft.id, payload)
    else await db.addMenuItem(payload)
    setEditing(null)
  }

  // existing items with no membership are treated as "in every menu"
  const editItem = (it) =>
    setEditing({
      ...it,
      sizes: it.sizes || [],
      addons: it.addons || [],
      menu_ids: it.menu_ids?.length ? it.menu_ids : allMenuIds,
    })

  const empty = categories.length === 0 && items.length === 0

  return (
    <div className="view">
      <h2>Menu</h2>

      {empty && (
        <section className="card seed">
          <h3>Get started fast</h3>
          <p className="muted small">Load the full Spirit Soda menu (drinks, smoothies, juices, snacks) with emoji icons so you can test right away.</p>
          <button className="btn big" onClick={() => seedSampleMenu(db)}>✨ Load Spirit Soda sample menu</button>
        </section>
      )}

      <section className="card">
        <h3>Menus</h3>
        <p className="muted small">Tap a menu to make it the one the cashier sees today.</p>
        <div className="chips">
          {menus.map((m) => (
            <span key={m.id} className={m.id === active?.id ? 'chip on' : 'chip'}>
              <button className="chip-main" onClick={() => db.setActiveMenu(m.id)}>
                {m.id === active?.id ? '● ' : ''}{m.name}
              </button>
              <button className="chip-x" onClick={() => db.deleteMenu(m.id)}>×</button>
            </span>
          ))}
          {menus.length === 0 && <span className="muted">No menus yet — create one (e.g. “Full Menu”, “Fasting Menu”).</span>}
        </div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            if (newMenu.trim()) db.addMenu(newMenu.trim())
            setNewMenu('')
          }}
        >
          <input value={newMenu} onChange={(e) => setNewMenu(e.target.value)} placeholder="New menu (e.g. Fasting Menu)" />
          <button className="btn">Add</button>
        </form>
      </section>

      <section className="card">
        <h3>Categories</h3>
        <div className="chips">
          {categories.map((c) => (
            <span key={c.id} className="chip">
              {c.emoji ? `${c.emoji} ` : ''}{c.name}
              <button className="chip-x" onClick={() => db.deleteCategory(c.id)}>×</button>
            </span>
          ))}
          {categories.length === 0 && <span className="muted">No categories yet.</span>}
        </div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            if (newCat.trim()) db.addCategory(newCat.trim())
            setNewCat('')
          }}
        >
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category (e.g. Hot Drinks)" />
          <button className="btn">Add</button>
        </form>
      </section>

      <section className="card">
        <div className="row between">
          <h3>Items</h3>
          {!editing && <button className="btn" onClick={() => setEditing(blankItem(active?.id))}>+ Add item</button>}
        </div>

        {editing && (
          <ItemForm
            draft={editing}
            categories={categories}
            menus={menus}
            onChange={setEditing}
            onSave={saveItem}
            onCancel={() => setEditing(null)}
          />
        )}

        {items.length === 0 && !editing && <p className="muted">No items yet. Add your first drink or snack.</p>}

        <ul className="list">
          {items.map((it) => (
            <li key={it.id} className={it.available ? 'item' : 'item out'}>
              <div className="item-main">
                <Thumb emoji={it.emoji} image_url={it.image_url} size="sm" />
                <div>
                  <strong>{it.name}</strong>{' '}
                  <span className="tag">{catName(it.category_id)}</span>
                  {!it.available && <span className="tag warn">sold out</span>}
                  <div className="muted small">
                    {(it.sizes || []).map((s) => `${s.name} ${money(s.price)}`).join(' · ')}
                    {it.addons?.length ? ` · +${it.addons.length} add-on(s)` : ''}
                  </div>
                  {menus.length > 0 && (
                    <div className="menu-tags">
                      {(it.menu_ids?.length ? it.menu_ids : allMenuIds)
                        .map(menuName)
                        .filter(Boolean)
                        .map((n) => <span key={n} className="tag menu">{n}</span>)}
                    </div>
                  )}
                </div>
              </div>
              <div className="item-actions">
                <button className="btn ghost" onClick={() => db.updateMenuItem(it.id, { available: !it.available })}>
                  {it.available ? 'Mark sold out' : 'Make available'}
                </button>
                <button className="btn ghost" onClick={() => editItem(it)}>Edit</button>
                <button className="btn danger" onClick={() => db.deleteMenuItem(it.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function ItemForm({ draft, categories, menus, onChange, onSave, onCancel }) {
  const set = (patch) => onChange({ ...draft, ...patch })
  const setRow = (key, i, field, value) => {
    const rows = draft[key].slice()
    rows[i] = { ...rows[i], [field]: value }
    set({ [key]: rows })
  }
  const addRow = (key) => set({ [key]: [...draft[key], { name: '', price: '' }] })
  const delRow = (key, i) => set({ [key]: draft[key].filter((_, j) => j !== i) })
  const toggleMenu = (id) => {
    const cur = draft.menu_ids || []
    set({ menu_ids: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] })
  }

  return (
    <form className="item-form" onSubmit={(e) => { e.preventDefault(); onSave(draft) }}>
      <input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Item name (e.g. Latte)" autoFocus />
      <select value={draft.category_id || ''} onChange={(e) => set({ category_id: e.target.value })}>
        <option value="">— Category —</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description (optional)" />

      <div className="row center">
        <input className="emoji-input" value={draft.emoji} onChange={(e) => set({ emoji: e.target.value })} placeholder="🥭" maxLength={4} />
        <input value={draft.image_url} onChange={(e) => set({ image_url: e.target.value })} placeholder="Photo URL (optional, overrides emoji)" />
      </div>

      {menus.length > 0 && (
        <fieldset>
          <legend>Show in menus</legend>
          <div className="chips">
            {menus.map((m) => (
              <button
                type="button"
                key={m.id}
                className={(draft.menu_ids || []).includes(m.id) ? 'chip on' : 'chip'}
                onClick={() => toggleMenu(m.id)}
              >
                {(draft.menu_ids || []).includes(m.id) ? '✓ ' : ''}{m.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend>Sizes &amp; prices</legend>
        {draft.sizes.map((s, i) => (
          <div className="row" key={i}>
            <input value={s.name} onChange={(e) => setRow('sizes', i, 'name', e.target.value)} placeholder="Size (e.g. Small)" />
            <input type="number" step="0.01" inputMode="decimal" value={s.price} onChange={(e) => setRow('sizes', i, 'price', e.target.value)} placeholder="Price" />
            {draft.sizes.length > 1 && <button type="button" className="btn ghost" onClick={() => delRow('sizes', i)}>×</button>}
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => addRow('sizes')}>+ size</button>
      </fieldset>

      <fieldset>
        <legend>Add-ons (optional)</legend>
        {draft.addons.map((a, i) => (
          <div className="row" key={i}>
            <input value={a.name} onChange={(e) => setRow('addons', i, 'name', e.target.value)} placeholder="Add-on (e.g. Extra shot)" />
            <input type="number" step="0.01" inputMode="decimal" value={a.price} onChange={(e) => setRow('addons', i, 'price', e.target.value)} placeholder="Price" />
            <button type="button" className="btn ghost" onClick={() => delRow('addons', i)}>×</button>
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => addRow('addons')}>+ add-on</button>
      </fieldset>

      <div className="row">
        <button className="btn" type="submit">Save item</button>
        <button className="btn ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
