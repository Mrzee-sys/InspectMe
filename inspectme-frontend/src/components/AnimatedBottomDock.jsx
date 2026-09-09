import { useRef, useState, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatedTopDock } from '@designcodeio/threeui/components/AnimatedTopDock'
import '@designcodeio/threeui/style.css'

/* ── Navigation Items ─────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    to: '/home',
    label: 'Home',
    svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />',
  },
  {
    to: '/dashboard',
    label: 'Inspections',
    svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />',
  },
  {
    to: '/overview',
    label: 'Analytics',
    svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
  },
  {
    to: '/settings',
    label: 'Settings',
    svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" />',
  },
]

/* ── Physics constants ────────────────────────────────────────── */
const BASE_SIZE = 40
const MAX_SIZE  = 58
const ICON_BASE = 20
const ICON_MAX  = 28
const PROXIMITY = 140

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

/* ── Component ────────────────────────────────────────────────── */
export default function AnimatedBottomDock() {
  const dockRef = useRef(null)
  const [mouseX, setMouseX] = useState(null)
  const location = useLocation()

  const handlePointerMove = useCallback((e) => {
    if (!dockRef.current) return
    const rect = dockRef.current.getBoundingClientRect()
    setMouseX(e.clientX - rect.left)
  }, [])

  const handlePointerLeave = useCallback(() => {
    setMouseX(null)
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!dockRef.current || !e.touches[0]) return
    const rect = dockRef.current.getBoundingClientRect()
    setMouseX(e.touches[0].clientX - rect.left)
  }, [])

  /* Hide the dock on the login page */
  if (location.pathname === '/') return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <nav
        ref={dockRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePointerLeave}
        className="w-full max-w-md bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl relative flex items-end justify-around px-2 pb-3 pt-2 pointer-events-auto"
      >
        {NAV_ITEMS.map((item) => (
          <DockItem
            key={item.to}
            item={item}
            mouseX={mouseX}
            dockRef={dockRef}
          />
        ))}
      </nav>
    </div>
  )
}

/* ── Individual Dock Item ─────────────────────────────────────── */
function DockItem({ item, mouseX, dockRef }) {
  const itemRef = useRef(null)

  let scale = 0
  if (mouseX !== null && itemRef.current && dockRef.current) {
    const itemRect = itemRef.current.getBoundingClientRect()
    const dockRect = dockRef.current.getBoundingClientRect()
    const itemCenterX = itemRect.left + itemRect.width / 2 - dockRect.left
    const distance = Math.abs(mouseX - itemCenterX)
    scale = Math.max(0, 1 - distance / PROXIMITY)
    scale = scale * scale * (3 - 2 * scale)
  }

  const wrapperSize = lerp(BASE_SIZE, MAX_SIZE, scale)
  const iconSize    = lerp(ICON_BASE, ICON_MAX, scale)

  return (
    <NavLink
      ref={itemRef}
      to={item.to}
      className="flex flex-col items-center gap-0.5 no-underline outline-none"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {({ isActive }) => (
        <>
          <div
            className={
              'flex items-center justify-center rounded-2xl transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ' +
              (isActive
                ? 'bg-gradient-to-br from-teal-400/40 to-teal-600/30 text-teal-700 shadow-md ring-1 ring-teal-400/30'
                : 'bg-white/40 text-slate-600 shadow-sm ring-1 ring-white/40')
            }
            style={{
              width:  `${wrapperSize}px`,
              height: `${wrapperSize}px`,
            }}
          >
            <svg
              className="transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
              style={{
                width:  `${iconSize}px`,
                height: `${iconSize}px`,
              }}
              dangerouslySetInnerHTML={{ __html: item.svg }}
            />
          </div>

          <span
            className={
              'text-[10px] font-semibold transition-colors duration-150 ' +
              (isActive ? 'text-teal-700' : 'text-slate-500')
            }
          >
            {item.label}
          </span>

          {isActive && (
            <div className="h-1 w-1 rounded-full bg-teal-500 shadow-[0_0_4px_rgba(20,184,166,0.6)]" />
          )}
        </>
      )}
    </NavLink>
  )
}
