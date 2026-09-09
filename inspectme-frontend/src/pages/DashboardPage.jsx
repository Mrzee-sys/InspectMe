import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchSites,
  fetchHealthSafetyInspections,
} from '../services/inspectionApi'
import { useSite } from '../store/siteContext'
import {
  Activity,
  Droplets,
  Shirt,
  Coffee,
  Flame,
  Truck,
  ClipboardList,
  ChevronLeft,
  Search,
  Shield,
} from 'lucide-react'

/* ── Inspection type config ────────────────────────────── */
const inspectionConfig = {
  FIRST_AID_BOX_CONTENTS_CHECKLIST: {
    icon: Activity,
    color: 'text-rose-500',
    bg: 'bg-rose-100/60 border-rose-200/50',
    name: 'First Aid',
  },
  ABLUTION_TOILET_SANITATION: {
    icon: Droplets,
    color: 'text-blue-500',
    bg: 'bg-blue-100/60 border-blue-200/50',
    name: 'Ablution',
  },
  CHANGE_ROOMS_SECURE_STORAGE: {
    icon: Shirt,
    color: 'text-amber-500',
    bg: 'bg-amber-100/60 border-amber-200/50',
    name: 'Lockers',
  },
  DINING_CANTEEN_EATING_FACILITIES: {
    icon: Coffee,
    color: 'text-orange-500',
    bg: 'bg-orange-100/60 border-orange-200/50',
    name: 'Dining',
  },
  FIRE_FIGHTING_EQUIPMENT_INSPECTION_REGISTER: {
    icon: Flame,
    color: 'text-red-500',
    bg: 'bg-red-100/60 border-red-200/50',
    name: 'Fire Equipment',
  },
  VEHICLES_FORKLIFT_DAILY_INSPECTION: {
    icon: Truck,
    color: 'text-indigo-500',
    bg: 'bg-indigo-100/60 border-indigo-200/50',
    name: 'Vehicles',
  },
}

function statusPill(status) {
  if (status === 'Green')
    return 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50'
  if (status === 'Amber')
    return 'bg-amber-100/80 text-amber-700 border border-amber-200/50'
  if (status === 'Red')
    return 'bg-rose-100/80 text-rose-700 border border-rose-200/50'
  return 'bg-slate-100/80 text-slate-600 border border-slate-200/50'
}

function formatType(type) {
  return (
    type
      ?.toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Unknown'
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/* ── Component ─────────────────────────────────────────── */
function DashboardPage() {
  const navigate = useNavigate()
  const { selectedSiteId, selectSite } = useSite()
  const [sites, setSites] = useState([])
  const [inspections, setInspections] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Map context value for filtering ('All' when empty)
  const selectedSite = selectedSiteId || 'All'

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [siteData, inspectionData] = await Promise.all([
        fetchSites(),
        fetchHealthSafetyInspections(),
      ])
      setSites(siteData)
      setInspections(inspectionData)
    } catch (err) {
      console.error('Error loading analytics data', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  /* ── Derived data ── */
  const filtered = useMemo(() => {
    let result = inspections

    // Filter by site
    if (selectedSite !== 'All') {
      result = result.filter((i) => {
        if (!i.site) return false
        const siteId = typeof i.site === 'object' ? i.site._id : i.site
        return siteId === selectedSite
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((i) => {
        const type = formatType(i.inspectionType).toLowerCase()
        const site = i.site?.siteCode?.toLowerCase() || ''
        const loc = i.location?.locationName?.toLowerCase() || ''
        const inspector = i.employee?.username?.toLowerCase() || ''
        return (
          type.includes(q) ||
          site.includes(q) ||
          loc.includes(q) ||
          inspector.includes(q)
        )
      })
    }

    // Sort newest first
    return [...result].sort(
      (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
    )
  }, [inspections, selectedSite, searchQuery])

  const stats = useMemo(() => {
    const green = filtered.filter((i) => i.status === 'Green').length
    const amber = filtered.filter((i) => i.status === 'Amber').length
    const red = filtered.filter((i) => i.status === 'Red').length
    const compliance =
      filtered.length > 0 ? Math.round((green / filtered.length) * 100) : 0
    return { green, amber, red, total: filtered.length, compliance }
  }, [filtered])

  const selectedSiteName = useMemo(() => {
    if (selectedSite === 'All') return 'All Sites'
    const site = sites.find((s) => s._id === selectedSite)
    return site ? `${site.siteCode} - ${site.siteName}` : 'Unknown'
  }, [selectedSite, sites])

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen text-slate-900 flex flex-col select-none">
      {/* ── Header ── */}
      <header className="w-full px-4 py-4 bg-white/40 backdrop-blur-xl border-b border-white/50 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-teal-100/80 border border-white/50 flex items-center justify-center text-teal-600 shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Inspection
            </p>
            <h1 className="text-sm font-bold leading-tight text-slate-900">
              Analytics
            </h1>
          </div>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50/80 border border-teal-200/50 px-3 py-1.5 rounded-xl hover:bg-teal-100/80 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Home
        </button>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto p-3 pb-28 space-y-3">
        {/* Site Filter */}
        <div className="p-2.5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 flex items-center space-x-2 shadow-sm">
          <span className="text-xs font-semibold text-slate-900 pl-2 whitespace-nowrap">
            Site:
          </span>
          <select
            value={selectedSite}
            onChange={(e) => selectSite(e.target.value === 'All' ? '' : e.target.value)}
            className="w-full bg-white/50 border border-white/40 rounded-xl px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none shadow-sm font-medium"
          >
            <option value="All">All Sites</option>
            {sites.map((site) => (
              <option key={site._id} value={site._id}>
                {site.siteCode} - {site.siteName}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2.5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm flex flex-col items-center">
            <span className="text-xl font-black text-slate-900">
              {stats.total}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Total
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-emerald-50/60 backdrop-blur-xl border border-emerald-200/40 shadow-sm flex flex-col items-center">
            <span className="text-xl font-black text-emerald-700">
              {stats.green}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">
              Pass
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-amber-50/60 backdrop-blur-xl border border-amber-200/40 shadow-sm flex flex-col items-center">
            <span className="text-xl font-black text-amber-700">
              {stats.amber}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600">
              Warn
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-rose-50/60 backdrop-blur-xl border border-rose-200/40 shadow-sm flex flex-col items-center">
            <span className="text-xl font-black text-rose-700">
              {stats.red}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-rose-600">
              Fail
            </span>
          </div>
        </div>

        {/* Compliance Bar */}
        <div className="p-3 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              Compliance
            </span>
            <span className="text-xs font-extrabold text-teal-700">
              {stats.compliance}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${stats.compliance}%`,
                background:
                  stats.compliance >= 80
                    ? 'linear-gradient(90deg, #10b981, #14b8a6)'
                    : stats.compliance >= 50
                      ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                      : 'linear-gradient(90deg, #ef4444, #f97316)',
              }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
            {selectedSiteName} · {stats.total} inspections
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search inspections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Inspection Cards */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm text-center">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                No inspections found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try changing the site filter or search query.
              </p>
            </div>
          ) : (
            filtered.map((inspection) => {
              const config = inspectionConfig[inspection.inspectionType] || {
                icon: ClipboardList,
                color: 'text-teal-500',
                bg: 'bg-teal-100/60 border-teal-200/50',
                name: 'Other',
              }
              const Icon = config.icon

              return (
                <article
                  key={inspection._id}
                  className="p-3.5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm shrink-0 ${config.bg}`}
                      >
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                          {formatType(inspection.inspectionType)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                          {inspection.site?.siteCode || 'N/A'} ·{' '}
                          {inspection.location?.locationName || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusPill(inspection.status)}`}
                    >
                      {inspection.status}
                    </span>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/40">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-slate-500">
                        {formatDate(inspection.date || inspection.createdAt)}
                      </span>
                      {inspection.time && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {inspection.time}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {inspection.employee?.username || 'Unknown'}
                    </span>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
