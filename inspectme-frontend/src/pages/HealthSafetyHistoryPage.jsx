import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchHealthSafetyInspections, fetchSites } from '../services/inspectionApi'
import { todayAsIsoDate } from '../utils/inspectionTime'

const inspectionTypeOptions = [
  { value: '', label: 'All inspection types' },
  { value: 'FIRST_AID_BOX_CONTENTS_CHECKLIST', label: 'First Aid Box Contents Checklist' },
  { value: 'VEHICLES_FORKLIFT_DAILY_INSPECTION', label: 'Vehicles / Forklift Daily Inspection' },
  {
    value: 'FIRE_FIGHTING_EQUIPMENT_INSPECTION_REGISTER',
    label: 'Fire Fighting Equipment Inspection Register',
  },
]

function statusPillClass(status) {
  if (status === 'Green') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (status === 'Amber') {
    return 'bg-amber-100 text-amber-700'
  }
  if (status === 'Red') {
    return 'bg-rose-100 text-rose-700'
  }
  return 'bg-slate-100 text-slate-700'
}

function formatInspectionType(type) {
  return type
    ?.toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function HealthSafetyHistoryPage() {
  const [sites, setSites] = useState([])
  const [inspections, setInspections] = useState([])
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayAsIsoDate)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadSites() {
      try {
        const siteData = await fetchSites()
        setSites(siteData)
      } catch {
        setErrorMessage('Unable to load sites.')
      }
    }

    void loadSites()
  }, [])

  useEffect(() => {
    async function loadHistory() {
      setLoading(true)
      setErrorMessage('')

      try {
        const result = await fetchHealthSafetyInspections({
          siteId: selectedSiteId || undefined,
          date: selectedDate || undefined,
          inspectionType: selectedType || undefined,
        })
        setInspections(result)
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Unable to load Health and Safety history.')
      } finally {
        setLoading(false)
      }
    }

    void loadHistory()
  }, [selectedDate, selectedSiteId, selectedType])

  const resultsLabel = useMemo(() => {
    if (loading) {
      return 'Loading records...'
    }

    return `${inspections.length} record${inspections.length === 1 ? '' : 's'} found`
  }, [inspections.length, loading])

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="rounded-2xl border border-white/40 bg-white/30 p-4 shadow-soft backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Health And Safety History</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Inspection Records</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-700 sm:text-base">
              Filter saved Health and Safety inspections by site, type, and date.
            </p>
          </div>
          <Link
            to="/inspections/health-safety"
            className="inline-flex rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            Back To Dashboard
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/45 bg-white/35 p-4 shadow-soft backdrop-blur-xl md:grid-cols-4 sm:p-6">
        <div>
          <label htmlFor="historySite" className="mb-1 block text-sm font-semibold text-slate-700">
            Site
          </label>
          <select
            id="historySite"
            value={selectedSiteId}
            onChange={(event) => setSelectedSiteId(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
          >
            <option value="">All sites</option>
            {sites.map((site) => (
              <option key={site._id} value={site._id}>
                {site.siteCode} - {site.siteName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="historyType" className="mb-1 block text-sm font-semibold text-slate-700">
            Inspection Type
          </label>
          <select
            id="historyType"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
          >
            {inspectionTypeOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="historyDate" className="mb-1 block text-sm font-semibold text-slate-700">
            Date
          </label>
          <input
            id="historyDate"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
          />
        </div>

        <div className="flex items-end">
          <div className="rounded-xl border border-white/40 bg-white/45 px-4 py-3 text-sm font-semibold text-slate-700">
            {resultsLabel}
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Loading Health and Safety records...</p>
      ) : (
        <div className="space-y-3">
          {inspections.length === 0 ? (
            <div className="rounded-2xl border border-white/45 bg-white/35 p-5 text-sm text-slate-700 shadow-soft backdrop-blur-xl">
              No Health and Safety inspections matched the current filters.
            </div>
          ) : (
            inspections.map((inspection) => (
              <article
                key={inspection._id}
                className="rounded-2xl border border-white/45 bg-white/35 p-4 shadow-soft backdrop-blur-xl sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {inspection.site?.siteCode || 'Unknown Site'}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {formatInspectionType(inspection.inspectionType)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {inspection.location?.locationName || 'Unknown Location'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(inspection.status)}`}>
                    {inspection.status}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</dt>
                    <dd className="mt-1">{inspection.date}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Time</dt>
                    <dd className="mt-1">{inspection.time}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Inspector</dt>
                    <dd className="mt-1">{inspection.employee?.username || 'Unknown Inspector'}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  )
}

export default HealthSafetyHistoryPage
