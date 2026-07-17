import React from 'react'

// Shows a real photo if image_url is set, otherwise the emoji, otherwise a dot.
export default function Thumb({ emoji, image_url, size = 'md' }) {
  const cls = `thumb thumb-${size}`
  if (image_url) return <img className={cls} src={image_url} alt="" loading="lazy" />
  return <span className={`${cls} thumb-emoji`}>{emoji || '🥤'}</span>
}
