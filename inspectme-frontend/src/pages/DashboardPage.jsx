import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchInspections, fetchLocations, fetchSites } from '../services/inspectionApi'
import { todayAsIsoDate } from '../utils/inspectionTime'

function getEntityId(value) {
  return typeof value === 'string' ? value : value?._id
}

function calculateSitePeriodStatus(inspections, expectedLocations, period, nowMinutes) {
  const periodEnd = period === 'Morning' ? 720 : 1080
  const inPeriod = inspections.filter((inspection) => inspection.period === period)
  const inspectedLocationIds = new Set(inPeriod.map((inspection) => getEntityId(inspection.location)).filter(Boolean))
  const expectedLocationIds = expectedLocations.map((location) => location._id)
  const allLocationsChecked =
    expectedLocationIds.length > 0 && expectedLocationIds.every((locationId) => inspectedLocationIds.has(locationId))

  if (!allLocationsChecked) {
    if (nowMinutes > periodEnd) {
      return 'Red'
    }
    return 'Pending'
  }

  const hasAmber = inPeriod.some((inspection) => inspection.status === 'Amber')
  if (hasAmber) {
    return 'Amber'
  }

  return 'Green'
}

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

function DashboardPage() {
  const [sites, setSites] = useState([])
  const [locations, setLocations] = useState([])
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastRefreshedAt, setLastRefreshedAt] = useState('')

  const loadDashboardData = useCallback(async () => {
    setErrorMessage('')

    try {
      const [siteData, locationData, inspectionData] = await Promise.all([
        fetchSites(),
        fetchLocations(),
        fetchInspections({ date: todayAsIsoDate() }),
      ])

      setSites(siteData)
      setLocations(locationData.filter((location) => location.active !== false))
      setInspections(inspectionData)
      setLastRefreshedAt(new Date().toLocaleTimeString())
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => {
      void loadDashboardData()
    }, 0)

    const intervalId = window.setInterval(() => {
      void loadDashboardData()
    }, 60000)

    return () => {
      window.clearTimeout(initialLoadId)
      window.clearInterval(intervalId)
    }
  }, [loadDashboardData])

  const siteStatusCards = useMemo(() => {
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    return sites.map((site) => {
      const expectedLocations = locations.filter((location) => getEntityId(location.siteCode) === site._id)
      const siteInspections = inspections.filter((inspection) => {
        return getEntityId(inspection.site) === site._id
      })

      const morningStatus = calculateSitePeriodStatus(siteInspections, expectedLocations, 'Morning', nowMinutes)
      const afternoonStatus = calculateSitePeriodStatus(siteInspections, expectedLocations, 'Afternoon', nowMinutes)

      let overallStatus = 'Green'
      if (morningStatus === 'Red' || afternoonStatus === 'Red') {
        overallStatus = 'Red'
      } else if (morningStatus === 'Amber' || afternoonStatus === 'Amber') {
        overallStatus = 'Amber'
      } else if (morningStatus === 'Pending' || afternoonStatus === 'Pending') {
        overallStatus = 'Pending'
      }

      return {
        site,
        morningStatus,
        afternoonStatus,
        overallStatus,
        submissions: siteInspections.length,
        expectedLocations: expectedLocations.length,
        checkedMorning: new Set(
          siteInspections
            .filter((inspection) => inspection.period === 'Morning')
            .map((inspection) => getEntityId(inspection.location))
            .filter(Boolean),
        ).size,
        checkedAfternoon: new Set(
          siteInspections
            .filter((inspection) => inspection.period === 'Afternoon')
            .map((inspection) => getEntityId(inspection.location))
            .filter(Boolean),
        ).size,
      }
    })
  }, [inspections, locations, sites])

  if (loading) {
    return <p className="text-sm text-slate-500">Loading dashboard...</p>
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inspection Dashboard</h2>
          <p className="text-sm text-slate-600">Auto-refreshes every 60 seconds.</p>
        </div>
        <div className="text-xs text-slate-500">Last refreshed: {lastRefreshedAt || 'Never'}</div>
      </header>

      {errorMessage && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {siteStatusCards.map((card) => (
          <article key={card.site._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.site.siteCode}</p>
                <h3 className="text-lg font-semibold text-slate-900">{card.site.siteName}</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(card.overallStatus)}`}>
                {card.overallStatus}
              </span>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Morning (06:00-12:00)</dt>
                <dd className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusPillClass(card.morningStatus)}`}>
                  {card.morningStatus} ({card.checkedMorning}/{card.expectedLocations})
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Afternoon (12:01-18:00)</dt>
                <dd className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusPillClass(card.afternoonStatus)}`}>
                  {card.afternoonStatus} ({card.checkedAfternoon}/{card.expectedLocations})
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Submissions today</dt>
                <dd className="font-semibold text-slate-900">{card.submissions}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DashboardPage
