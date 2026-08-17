import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { queueInspectionSubmission } from '../offline/syncService'
import { fetchLocations, fetchSites, submitHealthSafetyInspection } from '../services/inspectionApi'
import { useAuth } from '../store/authContext'
import { derivePeriodFromTime, todayAsIsoDate } from '../utils/inspectionTime'

const REQUIRED_ITEMS = [
  { key: 'absorbentMaterial', label: 'Absorbent material for the absorption of spilt body fluids' },
  { key: 'bandageRoller', label: 'Bandage Roller (100mm x 5 m) and (75mm x 5m)' },
  { key: 'triangularBandages', label: 'Triangular Bandages' },
  { key: 'cottonWoolGauze', label: 'Cotton wool / Gauze for cleaning wounds and padding (50g)' },
  { key: 'cprMouthpieces', label: 'CPR mouthpieces' },
  { key: 'disinfectant', label: 'Disinfectant to sterilize spilt body fluids' },
  { key: 'dressingsFirstAid', label: 'Dressings First Aid (150mm x 200mm) and (75mm x 100mm)' },
  { key: 'tweezerAndGauze', label: 'Tweezer and Gauze (Sterile)' },
  {
    key: 'gloves',
    label: 'Gloves (disposable large, disposable medium, household rubber large, household rubber medium)',
  },
  { key: 'plaster', label: 'Plaster (Roll 25mm x 3m, Band aid strips, Roll on non allergic)' },
  { key: 'safetyPinsAndScissors', label: 'Safety pins and Scissors' },
  { key: 'straightSplints', label: 'Straight splints' },
  { key: 'woundCleaner', label: '100ml Wound cleaner (Cetrimide)' },
]

function buildInitialChecklistState() {
  return REQUIRED_ITEMS.reduce((accumulator, item) => {
    accumulator[item.key] = false
    return accumulator
  }, {})
}

function FirstAidBoxContentsChecklistPage() {
  const { user } = useAuth()
  const [sites, setSites] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [date, setDate] = useState(todayAsIsoDate)
  const [time, setTime] = useState('06:00')

  const [formData, setFormData] = useState({
    boxNo: '',
    location: '',
    firstAider: '',
    year: String(new Date().getFullYear()),
    signatureFirstAider: '',
    signatureSection16_2: '',
  })
  const [checklist, setChecklist] = useState(buildInitialChecklistState)
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

  function updateChecklistItem(itemKey, checked) {
    setChecklist((previous) => ({ ...previous, [itemKey]: checked }))
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

    if (!formData.boxNo.trim()) {
      errors.push('Box No is required.')
    }

    if (!formData.firstAider.trim()) {
      errors.push('First Aider is required.')
    }

    if (!formData.year.trim()) {
      errors.push('Year is required.')
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

    const checklistByLabel = REQUIRED_ITEMS.reduce((accumulator, item) => {
      accumulator[item.label] = checklist[item.key]
      return accumulator
    }, {})

    const payload = {
      date,
      time,
      period,
      site: selectedSiteId,
      location: selectedLocationId,
      employee: user.id,
      inspectionType: 'FIRST_AID_BOX_CONTENTS_CHECKLIST',
      formPayload: {
        details: {
          boxNo: formData.boxNo,
          location: formData.location,
          firstAider: formData.firstAider,
          year: formData.year,
        },
        checklist: checklistByLabel,
        signatures: {
          firstAider: formData.signatureFirstAider,
          section16_2: formData.signatureSection16_2,
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

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="rounded-2xl border border-white/45 bg-white/35 p-5 shadow-soft backdrop-blur-xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Health And Safety Form</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">First Aid Box Contents Checklist</h2>
        <p className="mt-2 text-sm text-slate-700">Complete box details, mark each required item, and sign at the bottom.</p>
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="boxNo" className="mb-1 block text-sm font-semibold text-slate-700">
              Box No
            </label>
            <input
              id="boxNo"
              type="text"
              value={formData.boxNo}
              onChange={(event) => updateField('boxNo', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="location" className="mb-1 block text-sm font-semibold text-slate-700">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(event) => updateField('location', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="firstAider" className="mb-1 block text-sm font-semibold text-slate-700">
              First Aider
            </label>
            <input
              id="firstAider"
              type="text"
              value={formData.firstAider}
              onChange={(event) => updateField('firstAider', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="year" className="mb-1 block text-sm font-semibold text-slate-700">
              Year
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

        <div className="space-y-2 rounded-xl border border-white/45 bg-white/25 p-3 sm:p-4">
          <p className="text-sm font-semibold text-slate-800">Required Items</p>
          <div className="space-y-2">
            {REQUIRED_ITEMS.map((item) => (
              <label key={item.key} className="flex items-start gap-3 rounded-lg border border-white/40 bg-white/45 p-3">
                <input
                  type="checkbox"
                  checked={checklist[item.key]}
                  onChange={(event) => updateChecklistItem(item.key, event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="signatureFirstAider" className="mb-1 block text-sm font-semibold text-slate-700">
              Signature: First Aider
            </label>
            <input
              id="signatureFirstAider"
              type="text"
              value={formData.signatureFirstAider}
              onChange={(event) => updateField('signatureFirstAider', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="signatureSection16" className="mb-1 block text-sm font-semibold text-slate-700">
              Signature: Section 16(2)
            </label>
            <input
              id="signatureSection16"
              type="text"
              value={formData.signatureSection16_2}
              onChange={(event) => updateField('signatureSection16_2', event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            />
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
          {isSubmitting ? 'Saving...' : 'Save Checklist'}
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

export default FirstAidBoxContentsChecklistPage
