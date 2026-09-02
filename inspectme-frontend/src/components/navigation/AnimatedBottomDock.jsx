import { useState } from 'react'
import { AnimatedTopDock } from '@designcodeio/threeui'
import '@designcodeio/threeui/style.css'

/* ── Brand mark SVG (simplified) ─────────────────────────────── */
const BRAND_MARK = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6">
    <rect width="24" height="24" rx="4.5" fill="#E8E8E3" />
    <path d="M6 6h8.6L18 9.35v8.15H9.15L6 14.35V6Z" fill="#111" />
    <path d="M9 9h5.15L15 9.85V15H9.85L9 14.15V9Z" fill="#E8E8E3" />
    <path d="M12 9v6M9 12h6" stroke="#111" strokeWidth=".7" />
  </svg>
)

/* ── Navigation items (custom icons, simplified) ────────────── */
const NAV_ITEMS = [
  { id: 'system', label: 'SYSTEM', icon: BRAND_MARK },
  {
    id: 'method',
    label: 'METHOD',
    icon: <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />,
  },
  {
    id: 'work',
    label: 'WORK',
    icon: <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />,
  },
  {
    id: 'access',
    label: 'ACCESS',
    icon: <path d="M4 12l4-4 4 4" stroke="currentColor" strokeWidth="2" fill="none" />,
  },
  {
    id: 'notes',
    label: 'NOTES',
    icon: <path d="M5 5h6v10h-6z" stroke="currentColor" strokeWidth="2" fill="none" />,
  },
]

/*
 * Repurposes the ThreeUI Animated Top Dock as a fixed bottom
 * navigation bar. The library component is wrapped in a container
 * anchored to the bottom of the screen and its own CSS is overridden
 * (via class-based rules) so the dock reads vertically-flipped /
 * bottom-anchored for the mobile view.
 */
export function AnimatedBottomDock() {
  // Active state is managed outside the library since we use its
  // TopDock component as a static wrapper for the mobile bottom nav.
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id)

  return (
    // Fixed container anchored to the absolute bottom of the screen.
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Use the exact component with the glass variant and custom settings */}
      <AnimatedTopDock
        variant="glass"
        dispersion={0.05}
        drift={1.0}
        drop={11.0}
        heightGrowth={20}
        particles={22}
        proximity={44}
        rim={0.5}
        specular={0.85}
        thickness={0.115}
      />

      {/* Accessible native nav mirroring the dock items */}
      <nav aria-label="Bottom navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={activeId === item.id}
            onClick={() => setActiveId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
