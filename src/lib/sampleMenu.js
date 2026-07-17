// Spirit Soda sample menu. Emojis act as lightweight, offline item images;
// you can later paste a real photo URL per item in the Menu editor.

const single = (price) => [{ name: 'Regular', price }]

export const SAMPLE = [
  {
    category: 'Drinks',
    emoji: '🍹',
    items: [{ name: 'Mojito', emoji: '🍹', price: 20 }],
  },
  {
    category: 'Fresh Drinks',
    emoji: '🧃',
    items: [
      { name: 'Mango', emoji: '🥭', price: 20 },
      { name: 'Strawberry', emoji: '🍓', price: 20 },
      { name: 'Watermelon', emoji: '🍉', price: 20 },
      { name: 'Pineapple', emoji: '🍍', price: 20 },
      { name: 'Peach', emoji: '🍑', price: 20 },
      { name: 'Lemon', emoji: '🍋', price: 20 },
      { name: 'Mint Lemon', emoji: '🌿', price: 20 },
      { name: 'Orange', emoji: '🍊', price: 20 },
      { name: 'Hibiscus', emoji: '🌺', price: 20 },
    ],
  },
  {
    category: 'Smoothies',
    emoji: '🥤',
    items: [
      { name: 'Mango', emoji: '🥭', price: 25 },
      { name: 'Strawberry', emoji: '🍓', price: 25 },
      { name: 'Watermelon', emoji: '🍉', price: 25 },
      { name: 'Mint Lemon', emoji: '🌿', price: 25 },
      { name: 'Peach', emoji: '🍑', price: 25 },
      { name: 'Blueberry', emoji: '🫐', price: 25 },
      { name: 'Mixed Berry', emoji: '🍒', price: 25 },
    ],
  },
  {
    category: 'Coffee',
    emoji: '☕',
    items: [{ name: 'Iced Latte Coconut', emoji: '🥥', price: 50 }],
  },
  {
    category: 'Mixed Juice',
    emoji: '🧉',
    items: [
      { name: 'Banana', emoji: '🍌', price: 30 },
      { name: 'Strawberry', emoji: '🍓', price: 30 },
      { name: 'Mango', emoji: '🥭', price: 30 },
      { name: 'Strawberry Passion', emoji: '🍓', price: 30 },
      { name: 'Blue Passion', emoji: '💙', price: 30 },
      { name: 'Blue Gold', emoji: '✨', price: 30 },
      { name: 'Florida Mix', emoji: '🍹', price: 30 },
      { name: 'Mixed Berry', emoji: '🍒', price: 30 },
      { name: 'Hibiscus', emoji: '🌺', price: 30 },
      { name: 'Orange', emoji: '🍊', price: 30 },
    ],
  },
  {
    category: 'Snacks',
    emoji: '🍴',
    items: [
      { name: 'Fruit Salad', emoji: '🥗', price: 20 },
      { name: 'Fruit Salad with Honey', emoji: '🍯', price: 25 },
      { name: 'Fruit Salad with Ice Cream', emoji: '🍨', price: 30 },
      { name: 'Ice Cream', emoji: '🍦', price: 15 },
      { name: 'French Fries with Ketchup', emoji: '🍟', price: 15 },
      { name: 'Popcorn', emoji: '🍿', price: 10 },
    ],
  },
]

// Seeds categories + items into whichever backend is active.
export async function seedSampleMenu(db) {
  for (const group of SAMPLE) {
    await db.addCategory(group.category, group.emoji)
  }
  const cats = await db.listCategories()
  const idByName = Object.fromEntries(cats.map((c) => [c.name, c.id]))
  for (const group of SAMPLE) {
    for (const it of group.items) {
      await db.addMenuItem({
        name: it.name,
        category_id: idByName[group.category] || null,
        description: '',
        emoji: it.emoji,
        image_url: '',
        sizes: single(it.price),
        addons: [],
      })
    }
  }
}
