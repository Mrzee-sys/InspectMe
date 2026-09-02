import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  switch (status) {
    case 'Green':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    case 'Amber':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
    case 'Red':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300'
  }
}

const inspectionTypes = [
  {
    title: 'Fire Fighting Equipment',
    description: 'Complete the fire fighting equipment register.',
    path: '/inspections/health-safety/fire-fighting-equipment-register',
  },
  {
    title: 'First Aid Box Contents',
    description: 'Run through the first aid box contents checklist.',
    path: '/inspections/health-safety/first-aid-box-contents',
  },

]

function DashboardPage() {
  const [sites, setSites] = useState([])
  const [locations, setLocations] = useState([])
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastRefreshedAt, setLastRefreshedAt] = useState('')
  const navigate = useNavigate()

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
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
  }

  return (
    <main className="space-y-8">
      {/* Analytics Dashboard Section */}
      <section>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inspection Dashboard</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Auto-refreshes every 60 seconds.</p>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Last refreshed: {lastRefreshedAt || 'Never'}</div>
        </header>

        {errorMessage && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {errorMessage}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {siteStatusCards.map((card) => (
            <article key={card.site._id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{card.site.siteCode}</p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{card.site.siteName}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(card.overallStatus)}`}>
                  {card.overallStatus}
                </span>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Morning (06:00-12:00)</dt>
                  <dd className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusPillClass(card.morningStatus)}`}>
                    {card.morningStatus} ({card.checkedMorning}/{card.expectedLocations})
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Afternoon (12:01-18:00)</dt>
                  <dd className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusPillClass(card.afternoonStatus)}`}>
                    {card.afternoonStatus} ({card.checkedAfternoon}/{card.expectedLocations})
                  </dd>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <dt className="text-gray-600 dark:text-gray-400">Submissions today</dt>
                  <dd className="font-semibold text-gray-900 dark:text-gray-100">{card.submissions}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* Divider */}
      <hr className="border-gray-200 dark:border-gray-800" />

      {/* Inspection Launchpad Section */}
      <section>
        <header>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inspection Launchpad</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Select an inspection type to begin.</p>
        </header>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          {inspectionTypes.map((inspection) => (
            <button
              type="button"
              key={inspection.title}
              onClick={() => navigate(inspection.path)}
              className="group block cursor-pointer rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{inspection.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{inspection.description}</p>
              <div className="mt-4 font-semibold text-blue-600 dark:text-blue-400">
                Start Inspection
                <span className="opacity-0 transition-opacity group-hover:opacity-100"> →</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

export default DashboardPage
