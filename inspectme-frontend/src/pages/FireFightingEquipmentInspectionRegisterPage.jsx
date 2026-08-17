import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { queueInspectionSubmission } from '../offline/syncService'
import { fetchLocations, fetchSites, submitHealthSafetyInspection } from '../services/inspectionApi'
import { useAuth } from '../store/authContext'
import { derivePeriodFromTime, todayAsIsoDate } from '../utils/inspectionTime'

const FE_CODES = [
  { value: '', label: 'Select code (no deviation if blank)' },
  { value: 'FE1', label: 'FE1 - Equipment due for service' },
  { value: 'FE2', label: 'FE2 - Missing or damaged label / service tag' },
  { value: 'FE3', label: 'FE3 - Missing or damaged safety pin' },
  { value: 'FE4', label: 'FE4 - Broken or missing tamper seal' },
  { value: 'FE5', label: 'FE5 - Corrosion/rust on cylinder or fittings' },
  { value: 'FE6', label: 'FE6 - Pressure gauge issue (low/high/faulty)' },
  { value: 'FE7', label: 'FE7 - Damaged hose or nozzle' },
  { value: 'FE8', label: 'FE8 - Mounting bracket damaged/loose' },
  { value: 'FE9', label: 'FE9 - Extinguisher inaccessible/obstructed' },
  { value: 'FE10', label: 'FE10 - Extinguisher discharged/underweight' },
  { value: 'FE11', label: 'FE11 - Other' },
]

const HR_CODES = [
  { value: '', label: 'Select code (no deviation if blank)' },
  { value: 'HR1', label: 'HR1 - No/damaged signs' },
  { value: 'HR2', label: 'HR2 - Reel inaccessible/obstructed' },
  { value: 'HR3', label: 'HR3 - Reel not rolled up correctly' },
  { value: 'HR4', label: 'HR4 - Missing or damaged nozzle' },
  { value: 'HR5', label: 'HR5 - Missing or damaged valve' },
  { value: 'HR6', label: 'HR6 - Hose damaged/leaking' },
  { value: 'HR7', label: 'HR7 - Drum/reel damaged' },
  { value: 'HR8', label: 'HR8 - Cabinet damaged/cannot close' },
  { value: 'HR9', label: 'HR9 - Water flow/pressure issue' },
  { value: 'HR10', label: 'HR10 - Other' },
]

const HY_CODES = [
  { value: '', label: 'Select code (no deviation if blank)' },
  { value: 'HY1', label: 'HY1 - No/damaged signs' },
  { value: 'HY2', label: 'HY2 - Hydrant inaccessible/obstructed' },
  { value: 'HY3', label: 'HY3 - Leaking hydrant' },
  { value: 'HY4', label: 'HY4 - Missing or damaged wheel valve' },
  { value: 'HY5', label: 'HY5 - Damaged/missing lugs or couplings' },
  { value: 'HY6', label: 'HY6 - Cap missing/damaged' },
  { value: 'HY7', label: 'HY7 - Corrosion/damage to outlet' },
  { value: 'HY8', label: 'HY8 - Poor operation/stiff valve' },
  { value: 'HY9', label: 'HY9 - Other' },
]

const FIRE_EXTINGUISHER_ITEMS = [
  { key: 'feSignageAndLabel', label: 'Signage / service label condition' },
  { key: 'feSealAndPin', label: 'Seal and safety pin present/intact' },
  { key: 'fePressureGauge', label: 'Pressure gauge condition' },
  { key: 'feBodyCorrosion', label: 'Cylinder body / corrosion check' },
  { key: 'feHoseNozzle', label: 'Hose/nozzle condition' },
]

const HOSE_REEL_ITEMS = [
  { key: 'hrSigns', label: 'Signs visible and undamaged' },
  { key: 'hrNozzleValve', label: 'Nozzle and valve present/intact' },
  { key: 'hrAccessibility', label: 'Accessible and not obstructed' },
  { key: 'hrRolledUp', label: 'Hose correctly rolled up' },
  { key: 'hrGeneralCondition', label: 'General hose reel condition' },
]

const HYDRANT_ITEMS = [
  { key: 'hySigns', label: 'Signs visible and undamaged' },
  { key: 'hyLeaks', label: 'No leaks observed' },
  { key: 'hyWheelValve', label: 'Wheel valve present and operable' },
  { key: 'hyLugsAndCouplings', label: 'Lugs/couplings condition' },
  { key: 'hyGeneralCondition', label: 'General hydrant condition' },
]

function buildInitialDeviationState(items) {
  return items.reduce((accumulator, item) => {
    accumulator[item.key] = ''
    return accumulator
  }, {})
}

function FireFightingEquipmentInspectionRegisterPage() {
  const { user } = useAuth()
  const [sites, setSites] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [date, setDate] = useState(todayAsIsoDate)
  const [time, setTime] = useState('06:00')

  const [formData, setFormData] = useState({
    area: '',
    inspector: '',
    year: String(new Date().getFullYear()),
  })
  const [deviations, setDeviations] = useState({
    fireExtinguishers: buildInitialDeviationState(FIRE_EXTINGUISHER_ITEMS),
    hoseReels: buildInitialDeviationState(HOSE_REEL_ITEMS),
    hydrants: buildInitialDeviationState(HYDRANT_ITEMS),
  })
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

  function updateDeviation(sectionKey, itemKey, code) {
    setDeviations((previous) => ({
      ...previous,
      [sectionKey]: {
        ...previous[sectionKey],
        [itemKey]: code,
      },
    }))
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

    if (!formData.area.trim()) {
      errors.push('AREA is required.')
    }

    if (!formData.inspector.trim()) {
      errors.push('INSPECTOR is required.')
    }

    if (!formData.year.trim()) {
      errors.push('YEAR is required.')
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

    const sectionToLabels = (items, sectionValues) =>
      items.reduce((accumulator, item) => {
        accumulator[item.label] = sectionValues[item.key]
        return accumulator
      }, {})

    const payload = {
      date,
      time,
      period,
      site: selectedSiteId,
      location: selectedLocationId,
      employee: user.id,
      inspectionType: 'FIRE_FIGHTING_EQUIPMENT_INSPECTION_REGISTER',
      formPayload: {
        details: {
          area: formData.area,
          inspector: formData.inspector,
          year: formData.year,
        },
        deviations: {
          fireExtinguishers: sectionToLabels(FIRE_EXTINGUISHER_ITEMS, deviations.fireExtinguishers),
          hoseReels: sectionToLabels(HOSE_REEL_ITEMS, deviations.hoseReels),
          hydrants: sectionToLabels(HYDRANT_ITEMS, deviations.hydrants),
        },
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

  function renderSection(sectionKey, title, items, options) {
    return (
      <div className="space-y-2 rounded-xl border border-white/45 bg-white/25 p-3 sm:p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-800">{title}</h3>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.key} className="grid grid-cols-1 gap-2 rounded-lg border border-white/40 bg-white/45 p-3 md:grid-cols-[1fr_260px] md:items-center">
              <label htmlFor={`${sectionKey}-${item.key}`} className="text-sm text-slate-700">
                {item.label}
              </label>
              <select
                id={`${sectionKey}-${item.key}`}
                value={deviations[sectionKey][item.key]}
                onChange={(event) => updateDeviation(sectionKey, item.key, event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-700 outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
              >
                {options.map((option) => (
                  <option key={option.value || 'none'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="rounded-2xl border border-white/45 bg-white/35 p-5 shadow-soft backdrop-blur-xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Health And Safety Form</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Fire Fighting Equipment Inspection Register</h2>
        <p className="mt-2 text-sm text-slate-700">Capture register details and log deviations using the section-specific code lists.</p>
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="area" className="mb-1 block text-sm font-semibold text-slate-700">
              AREA
            </label>
            <input
              id="area"
              type="text"
              value={formData.area}
              onChange={(event) => updateField('area', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="inspector" className="mb-1 block text-sm font-semibold text-slate-700">
              INSPECTOR
            </label>
            <input
              id="inspector"
              type="text"
              value={formData.inspector}
              onChange={(event) => updateField('inspector', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="year" className="mb-1 block text-sm font-semibold text-slate-700">
              YEAR
            </label>
            <input
              id="year"
              type="text"
              value={formData.year}
              onChange={(event) => updateField('year', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>
        </div>

        {renderSection('fireExtinguishers', 'Fire Extinguishers', FIRE_EXTINGUISHER_ITEMS, FE_CODES)}
        {renderSection('hoseReels', 'Hose Reels', HOSE_REEL_ITEMS, HR_CODES)}
        {renderSection('hydrants', 'Hydrants', HYDRANT_ITEMS, HY_CODES)}

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
          {isSubmitting ? 'Saving...' : 'Save Register'}
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

export default FireFightingEquipmentInspectionRegisterPage
