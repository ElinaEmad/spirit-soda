// Change CURRENCY to your locale's symbol (e.g. "$", "€", "EGP ").
export const CURRENCY = 'EGP '

export const money = (n) => `${CURRENCY}${Number(n || 0).toFixed(2)}`

// Local calendar date (YYYY-MM-DD), NOT the UTC date — so an order placed
// late in the evening in Egypt still counts as today.
export const todayISO = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// start/end of a YYYY-MM-DD day as ISO timestamps (local time)
export const dayRange = (ymd) => {
  const start = new Date(`${ymd}T00:00:00`)
  const end = new Date(`${ymd}T23:59:59.999`)
  return { from: start.toISOString(), to: end.toISOString() }
}
