import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { queueInspectionSubmission } from '../offline/syncService'
import { fetchLocations, fetchSites, submitHealthSafetyInspection } from '../services/inspectionApi'
import { useAuth } from '../store/authContext'
import { derivePeriodFromTime, todayAsIsoDate } from '../utils/inspectionTime'

const INSPECTION_ITEMS = [
  { key: 'lubricationAdequate', label: 'Lubrication adequate' },
  { key: 'switchesGaugesBrakes', label: 'Switches, Gauges, and Brakes in good working order' },
  { key: 'hoistingAndHorn', label: 'Hoisting mechanisms and Horn in good working order' },
  { key: 'lights', label: 'Lights in good working order' },
  {
    key: 'pedalsRimsTyresPipes',
    label: 'Pedal rubbers, Wheel rims and tyres, and All pipes in good condition',
  },
  { key: 'wheelNutsAndBolts', label: 'Wheel nuts and bolts secure' },
  { key: 'oilCoolantLevelsAndLeaks', label: 'Oil and coolant levels and leaks' },
  { key: 'fanbeltsConditionTension', label: 'Fanbelt/s in good condition and correct tension' },
  {
    key: 'capsAndBatteryMounting',
    label: 'Caps (i.e. oil, petrol, etc.) and Battery mounting secure',
  },
  { key: 'controlLevers', label: 'Control levers in good working order' },
  { key: 'compartmentSeatBelt', label: 'Compartment/seat and Safety belt in good condition' },
  { key: 'hydraulicOilLevel', label: 'Hydraulic oil level correct' },
  { key: 'gasShutOffAndHose', label: 'Gas shut-off valve operational/hose not damaged' },
  { key: 'gasTankMountings', label: 'Gas tank mountings secure' },
  { key: 'reverseSirenAndBeacon', label: 'Reverse siren and Beacon or strobe warning light' },
]

function buildInitialStatusState() {
  return INSPECTION_ITEMS.reduce((accumulator, item) => {
    accumulator[item.key] = ''
    return accumulator
  }, {})
}

function VehiclesForkliftDailyInspectionPage() {
  const { user } = useAuth()
  const [sites, setSites] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [date, setDate] = useState(todayAsIsoDate)
  const [time, setTime] = useState('06:00')

  const [formData, setFormData] = useState({
    regNo: '',
    dateFrom: '',
    dateTo: '',
    driver: '',
    timeOut: '',
    timeIn: '',
  })
  const [itemStatus, setItemStatus] = useState(buildInitialStatusState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessages, setErrorMessages] = useState([])
  const [successMessage, setSuccessMessage] = useState('')

  const period = useMemo(() => derivePeriodFromTime(time), [time])

  useEffect(() => {
    async function loadSites() {
      try {
        const siteData = await fetchSites()
        setSites(siteData)
      } catch {
        setErrorMessages(['Unable to load sites. Please try again.'])
      }
    }

    void loadSites()
  }, [])

  useEffect(() => {
    if (!selectedSiteId) {
      return
    }

    async function loadLocations() {
      try {
        const locationData = await fetchLocations(selectedSiteId)
        setLocations(locationData)
      } catch {
        setErrorMessages(['Unable to load locations for selected site.'])
      }
    }

    void loadLocations()
  }, [selectedSiteId])

  function updateField(field, value) {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  function updateStatus(itemKey, status) {
    setItemStatus((previous) => ({ ...previous, [itemKey]: status }))
  }

  function getValidationErrors() {
    const errors = []

    if (!selectedSiteId) {
      errors.push('Please select a site.')
    }

    if (!selectedLocationId) {
      errors.push('Please select a location.')
    }

    if (!time) {
      errors.push('Please provide inspection time.')
    }

    if (!period) {
      errors.push('Time must be between 06:00 and 18:00 local time.')
    }

    if (!formData.regNo.trim()) {
      errors.push('REG. No is required.')
    }

    if (!formData.driver.trim()) {
      errors.push('DRIVER is required.')
    }

    if (!formData.dateFrom || !formData.dateTo) {
      errors.push('DATE FROM and DATE TO are required.')
    }

    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSuccessMessage('')

    const validationErrors = getValidationErrors()
    if (validationErrors.length > 0) {
      setErrorMessages(validationErrors)
      return
    }

    setErrorMessages([])
    setIsSubmitting(true)

    const statusByLabel = INSPECTION_ITEMS.reduce((accumulator, item) => {
      accumulator[item.label] = itemStatus[item.key]
      return accumulator
    }, {})

    const payload = {
      date,
      time,
      period,
      site: selectedSiteId,
      location: selectedLocationId,
      employee: user.id,
      inspectionType: 'VEHICLES_FORKLIFT_DAILY_INSPECTION',
      formPayload: {
        details: {
          regNo: formData.regNo,
          dateFrom: formData.dateFrom,
          dateTo: formData.dateTo,
          driver: formData.driver,
          timeOut: formData.timeOut,
          timeIn: formData.timeIn,
        },
        itemStatus: statusByLabel,
      },
    }

    try {
      if (!navigator.onLine) {
        const queuedId = await queueInspectionSubmission(payload, '/health-safety-inspections')
        setSuccessMessage(`Offline: inspection queued locally (${queuedId}).`)
      } else {
        await submitHealthSafetyInspection(payload)
        setSuccessMessage('Inspection submitted successfully.')
      }
    } catch (error) {
      setErrorMessages([error?.response?.data?.message || 'Failed to submit inspection.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="rounded-2xl border border-white/45 bg-white/35 p-5 shadow-soft backdrop-blur-xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Health And Safety Form</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Vehicles / Forklift Daily Inspection</h2>
        <p className="mt-2 text-sm text-slate-700">Capture shift details and mark each item as OK or DEF (Defective).</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/45 bg-white/35 p-4 shadow-soft backdrop-blur-xl sm:space-y-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label htmlFor="site" className="mb-1 block text-sm font-semibold text-slate-700">
              Site
            </label>
            <select
              id="site"
              value={selectedSiteId}
              onChange={(event) => {
                setSelectedSiteId(event.target.value)
                setSelectedLocationId('')
                setLocations([])
              }}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            >
              <option value="">Select site</option>
              {sites.map((site) => (
                <option key={site._id} value={site._id}>
                  {site.siteCode} - {site.siteName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="siteLocation" className="mb-1 block text-sm font-semibold text-slate-700">
              Location
            </label>
            <select
              id="siteLocation"
              value={selectedLocationId}
              onChange={(event) => setSelectedLocationId(event.target.value)}
              disabled={!selectedSiteId}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            >
              <option value="">Select location</option>
              {locations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.locationName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className="mb-1 block text-sm font-semibold text-slate-700">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="time" className="mb-1 block text-sm font-semibold text-slate-700">
              Time
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
            <p className="mt-1 text-xs text-slate-500">Detected period: {period || 'Invalid time window'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="regNo" className="mb-1 block text-sm font-semibold text-slate-700">
              REG. No
            </label>
            <input
              id="regNo"
              type="text"
              value={formData.regNo}
              onChange={(event) => updateField('regNo', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="dateFrom" className="mb-1 block text-sm font-semibold text-slate-700">
              DATE FROM
            </label>
            <input
              id="dateFrom"
              type="date"
              value={formData.dateFrom}
              onChange={(event) => updateField('dateFrom', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="mb-1 block text-sm font-semibold text-slate-700">
              DATE TO
            </label>
            <input
              id="dateTo"
              type="date"
              value={formData.dateTo}
              onChange={(event) => updateField('dateTo', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="driver" className="mb-1 block text-sm font-semibold text-slate-700">
              DRIVER
            </label>
            <input
              id="driver"
              type="text"
              value={formData.driver}
              onChange={(event) => updateField('driver', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="timeOut" className="mb-1 block text-sm font-semibold text-slate-700">
              TIME Out
            </label>
            <input
              id="timeOut"
              type="time"
              value={formData.timeOut}
              onChange={(event) => updateField('timeOut', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="timeIn" className="mb-1 block text-sm font-semibold text-slate-700">
              TIME In
            </label>
            <input
              id="timeIn"
              type="time"
              value={formData.timeIn}
              onChange={(event) => updateField('timeIn', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/45 bg-white/30">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-white/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 sm:px-4">
            <span>Inspection Item</span>
            <span>OK</span>
            <span>DEF</span>
          </div>

          <div className="divide-y divide-white/45">
            {INSPECTION_ITEMS.map((item) => (
              <div key={item.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-3 sm:px-4">
                <p className="pr-2 text-sm text-slate-700">{item.label}</p>

                <input
                  type="radio"
                  name={`status-${item.key}`}
                  checked={itemStatus[item.key] === 'OK'}
                  onChange={() => updateStatus(item.key, 'OK')}
                  className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />

                <input
                  type="radio"
                  name={`status-${item.key}`}
                  checked={itemStatus[item.key] === 'DEF'}
                  onChange={() => updateStatus(item.key, 'DEF')}
                  className="h-4 w-4 border-slate-300 text-rose-600 focus:ring-rose-500"
                />
              </div>
            ))}
          </div>
        </div>

        {errorMessages.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        {successMessage && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
        >
          {isSubmitting ? 'Saving...' : 'Save Daily Inspection'}
        </button>
      </form>

      <Link
        to="/inspections/health-safety"
        className="inline-flex rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
      >
        Back To Health And Safety Inspections
      </Link>
    </section>
  )
}

export default VehiclesForkliftDailyInspectionPage
