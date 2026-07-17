// Unified data layer with two interchangeable backends:
//   - Supabase (live multi-device sync) when env vars are present
//   - localStorage (single device, fully offline) otherwise
// Both expose the same async API and an onChange() subscription.

import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const isCloud = Boolean(URL && KEY)

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))

// ---------------------------------------------------------------- local backend
const LS_KEYS = { categories: 'pos.categories', items: 'pos.items', orders: 'pos.orders', menus: 'pos.menus' }
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('pos') : null
const listeners = new Set()

function emitLocal() {
  listeners.forEach((cb) => cb())
  if (channel) channel.postMessage('change')
}
if (channel) channel.onmessage = () => listeners.forEach((cb) => cb())
window.addEventListener('storage', () => listeners.forEach((cb) => cb()))

const read = (k) => JSON.parse(localStorage.getItem(k) || '[]')
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))

const local = {
  async listCategories() {
    return read(LS_KEYS.categories).sort((a, b) => a.sort_order - b.sort_order)
  },
  async addCategory(name, emoji = '') {
    const cats = read(LS_KEYS.categories)
    cats.push({ id: uid(), name, emoji, sort_order: cats.length })
    write(LS_KEYS.categories, cats)
    emitLocal()
  },
  async deleteCategory(id) {
    write(LS_KEYS.categories, read(LS_KEYS.categories).filter((c) => c.id !== id))
    emitLocal()
  },
  async listMenus() {
    return read(LS_KEYS.menus).sort((a, b) => a.sort_order - b.sort_order)
  },
  async addMenu(name) {
    const menus = read(LS_KEYS.menus)
    menus.push({ id: uid(), name, is_active: menus.length === 0, sort_order: menus.length })
    write(LS_KEYS.menus, menus)
    emitLocal()
  },
  async setActiveMenu(id) {
    write(LS_KEYS.menus, read(LS_KEYS.menus).map((m) => ({ ...m, is_active: m.id === id })))
    emitLocal()
  },
  async deleteMenu(id) {
    write(LS_KEYS.menus, read(LS_KEYS.menus).filter((m) => m.id !== id))
    // strip the deleted menu from any item memberships
    write(
      LS_KEYS.items,
      read(LS_KEYS.items).map((i) => ({ ...i, menu_ids: (i.menu_ids || []).filter((x) => x !== id) }))
    )
    emitLocal()
  },
  async listMenuItems() {
    return read(LS_KEYS.items)
  },
  async addMenuItem(item) {
    const items = read(LS_KEYS.items)
    items.push({ id: uid(), available: true, addons: [], ...item })
    write(LS_KEYS.items, items)
    emitLocal()
  },
  async updateMenuItem(id, patch) {
    write(LS_KEYS.items, read(LS_KEYS.items).map((i) => (i.id === id ? { ...i, ...patch } : i)))
    emitLocal()
  },
  async deleteMenuItem(id) {
    write(LS_KEYS.items, read(LS_KEYS.items).filter((i) => i.id !== id))
    emitLocal()
  },
  async listOrders({ from, to } = {}) {
    let orders = read(LS_KEYS.orders)
    if (from) orders = orders.filter((o) => o.created_at >= from)
    if (to) orders = orders.filter((o) => o.created_at <= to)
    return orders.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  },
  async createOrder(order) {
    const orders = read(LS_KEYS.orders)
    orders.push({ id: uid(), status: 'new', created_at: new Date().toISOString(), ...order })
    write(LS_KEYS.orders, orders)
    emitLocal()
  },
  async updateOrderStatus(id, status) {
    write(LS_KEYS.orders, read(LS_KEYS.orders).map((o) => (o.id === id ? { ...o, status } : o)))
    emitLocal()
  },
  onChange(cb) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },
}

// ---------------------------------------------------------------- cloud backend
let sb
if (isCloud) sb = createClient(URL, KEY)
let channelSeq = 0 // each subscription needs a unique channel name

// Throws on a Supabase error so failures surface instead of silently vanishing.
const chk = ({ error }) => {
  if (error) throw new Error(error.message || 'Database error')
}

const cloud = {
  async listCategories() {
    const { data } = await sb.from('categories').select('*').order('sort_order')
    return data || []
  },
  async addCategory(name, emoji = '') {
    const { count } = await sb.from('categories').select('*', { count: 'exact', head: true })
    chk(await sb.from('categories').insert({ name, emoji, sort_order: count || 0 }))
  },
  async deleteCategory(id) {
    chk(await sb.from('categories').delete().eq('id', id))
  },
  async listMenus() {
    const { data } = await sb.from('menus').select('*').order('sort_order')
    return data || []
  },
  async addMenu(name) {
    const { count } = await sb.from('menus').select('*', { count: 'exact', head: true })
    chk(await sb.from('menus').insert({ name, sort_order: count || 0, is_active: (count || 0) === 0 }))
  },
  async setActiveMenu(id) {
    chk(await sb.from('menus').update({ is_active: false }).neq('id', id))
    chk(await sb.from('menus').update({ is_active: true }).eq('id', id))
  },
  async deleteMenu(id) {
    chk(await sb.from('menus').delete().eq('id', id))
  },
  async listMenuItems() {
    const { data } = await sb.from('menu_items').select('*').order('created_at')
    return data || []
  },
  async addMenuItem(item) {
    chk(await sb.from('menu_items').insert(item))
  },
  async updateMenuItem(id, patch) {
    chk(await sb.from('menu_items').update(patch).eq('id', id))
  },
  async deleteMenuItem(id) {
    chk(await sb.from('menu_items').delete().eq('id', id))
  },
  async listOrders({ from, to } = {}) {
    let q = sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
    if (from) q = q.gte('created_at', from)
    if (to) q = q.lte('created_at', to)
    const { data } = await q
    // normalise: views expect `items`
    return (data || []).map((o) => ({ ...o, items: o.order_items || [] }))
  },
  async createOrder(order) {
    const { items, ...head } = order
    const { data, error } = await sb.from('orders').insert(head).select().single()
    if (error) throw error
    if (items?.length) {
      await sb.from('order_items').insert(items.map((it) => ({ ...it, order_id: data.id })))
    }
  },
  async updateOrderStatus(id, status) {
    await sb.from('orders').update({ status }).eq('id', id)
  },
  onChange(cb) {
    const ch = sb
      .channel(`pos-changes-${channelSeq++}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => cb())
      .subscribe()
    return () => sb.removeChannel(ch)
  },
}

export const db = isCloud ? cloud : local
