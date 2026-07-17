// Helpers for the "active menu" concept.

// The menu currently being served (explicit active flag, else the first menu).
export function activeMenu(menus) {
  if (!menus || menus.length === 0) return null
  return menus.find((m) => m.is_active) || menus[0]
}

// Should an item show in the given menu?
//  - no menus configured at all  -> show everything
//  - item has no memberships yet  -> treated as "available in every menu"
//  - otherwise                    -> only in the menus it was assigned to
export function itemInMenu(item, menuId) {
  if (!menuId) return true
  const ids = item.menu_ids || []
  if (ids.length === 0) return true
  return ids.includes(menuId)
}
