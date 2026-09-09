import { createContext, useContext, useState, useMemo, useCallback } from 'react'

const SiteContext = createContext(null)

export function SiteProvider({ children }) {
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    try {
      return localStorage.getItem('inspectme-selected-site') || ''
    } catch {
      return ''
    }
  })

  const selectSite = useCallback((siteId) => {
    setSelectedSiteId(siteId)
    try {
      if (siteId) {
        localStorage.setItem('inspectme-selected-site', siteId)
      } else {
        localStorage.removeItem('inspectme-selected-site')
      }
    } catch {
      // Storage unavailable
    }
  }, [])

  const value = useMemo(
    () => ({ selectedSiteId, selectSite }),
    [selectedSiteId, selectSite]
  )

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const context = useContext(SiteContext)
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider')
  }
  return context
}
