import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import InspectionHeaderIcon from '../components/InspectionHeaderIcon'
import { queueInspectionSubmission } from '../offline/syncService'
import { fetchLocations, fetchSites, submitHealthSafetyInspection } from '../services/inspectionApi'
import { useAuth } from '../store/authContext'
import { useSite } from '../store/siteContext'
import { derivePeriodFromTime, todayAsIsoDate } from '../utils/inspectionTime'

const EMX_CODES = [
  { value: '', label: 'Select code (no deviation if blank)' },
  { value: 'EMX1', label: 'EMX1 - Obstructed exit doors' },
  { value: 'EMX2', label: 'EMX2 - Doors do not open outwards' },
  { value: 'EMX3', label: 'EMX3 - Missing/faulty panic hardware' },
  { value: 'EMX4', label: 'EMX4 - Combustible materials in escape routes' },
  { value: 'EMX5', label: 'EMX5 - Non-compliant signage' },
  { value: 'EMX6', label: 'EMX6 - Signage not illuminated/visible' },
  { value: 'EMX7', label: 'EMX7 - Backup lighting failed' },
  { value: 'EMX8', label: 'EMX8 - Assembly point issues' },
  { value: 'EMX9', label: 'EMX9 - Other' },
]

const EMX_ITEMS = [
  { key: 'emx01', label: 'Are all designated emergency exit doors completely unobstructed on both sides?' },
  { key: 'emx02', label: 'Do all emergency exit doors open outwards in the direction of the escape route?' },
  { key: 'emx03', label: 'Are exit doors fitted with panic hardware that does not require a key to open from the inside?' },
  { key: 'emx04', label: 'Are all escape routes entirely free of combustible materials or temporary storage?' },
  { key: 'emx05', label: 'Are emergency exit signs strictly compliant with SANS 1186 (correct green/white symbolic safety signs)?' },
  { key: 'emx06', label: 'Is the emergency exit signage continuously illuminated and clearly visible from anywhere within the escape path?' },
  { key: 'emx07', label: 'Are backup emergency lighting systems functional and tested to operate during load shedding or power failures?' },
  { key: 'emx08', label: 'Are designated outdoor emergency assembly points clearly marked and safely accessible?' },
]

const ITEM_METADATA = {
  emx01: { label: 'Unobstructed Doors', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />' },
  emx02: { label: 'Open Outwards', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />' },
  emx03: { label: 'Panic Hardware', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />' },
  emx04: { label: 'Clear Routes', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />' },
  emx05: { label: 'SANS 1186 Signs', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />' },
  emx06: { label: 'Illuminated Signs', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />' },
  emx07: { label: 'Backup Lighting', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />' },
  emx08: { label: 'Assembly Points', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />' },
};

function buildInitialDeviationState(items) {
  return items.reduce((accumulator, item) => {
    accumulator[item.key] = { status: null, issues: [] }
    return accumulator
  }, {})
}

function EmxPage() {
  const { user } = useAuth()
  const { selectedSiteId, selectSite } = useSite()
  const [sites, setSites] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [date, setDate] = useState(todayAsIsoDate)
  const [time, setTime] = useState('06:00')

  const [formData, setFormData] = useState({
    area: '',
    inspector: '',
    year: String(new Date().getFullYear()),
  })
  
  const [deviations, setDeviations] = useState({
    emx: buildInitialDeviationState(EMX_ITEMS),
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
    if (!selectedSiteId) return

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

  function handleStatusChange(sectionKey, itemKey, status) {
    setDeviations((previous) => ({
      ...previous,
      [sectionKey]: {
        ...previous[sectionKey],
        [itemKey]: {
          status,
          issues: status === 'pass' ? [] : previous[sectionKey][itemKey].issues,
        },
      },
    }))
  }

  function handleIssueToggle(sectionKey, itemKey, issueValue) {
    setDeviations((previous) => {
      const currentIssues = previous[sectionKey][itemKey].issues
      const newIssues = currentIssues.includes(issueValue)
        ? currentIssues.filter((i) => i !== issueValue)
        : [...currentIssues, issueValue]

      return {
        ...previous,
        [sectionKey]: {
          ...previous[sectionKey],
          [itemKey]: {
            ...previous[sectionKey][itemKey],
            issues: newIssues,
          },
        },
      }
    })
  }

  function getValidationErrors() {
    const errors = []
    if (!selectedSiteId) errors.push('Please select a site.')
    if (!selectedLocationId) errors.push('Please select a location.')
    if (!time) errors.push('Please provide inspection time.')
    if (!period) errors.push('Time must be between 06:00 and 18:00 local time.')
    if (!formData.area.trim()) errors.push('AREA is required.')
    if (!formData.inspector.trim()) errors.push('INSPECTOR is required.')
    if (!formData.year.trim()) errors.push('YEAR is required.')
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

    const sectionToLabels = (items, sectionValues, optionsMap) =>
      items.reduce((accumulator, item) => {
        const itemState = sectionValues[item.key]
        if (itemState.status === 'pass') {
          accumulator[item.label] = 'Pass'
        } else if (itemState.status === 'fail') {
          if (itemState.issues.length === 0) {
            accumulator[item.label] = 'Fail (No specific reason selected)'
          } else {
            const issueLabels = itemState.issues.map(val => 
              optionsMap.find(opt => opt.value === val)?.label || val
            )
            accumulator[item.label] = `Fail: ${issueLabels.join(', ')}`
          }
        } else {
          accumulator[item.label] = 'Not Inspected'
        }
        return accumulator
      }, {})

      const payload = {
        date,
        time,
        period,
        site: selectedSiteId,
        location: selectedLocationId,
        employee: user.id,
        inspectionType: 'EMERGENCY_EXITS', // Matches naming convention
        formPayload: {
          details: {
            area: formData.area,
            inspector: formData.inspector,
            year: formData.year,
          },
          deviations: {
            emx: sectionToLabels(EMX_ITEMS, deviations.emx, EMX_CODES),
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
    const issueOptions = options.filter(opt => opt.value !== '')

    return (
      <div className="space-y-4 rounded-3xl border border-white/40 bg-white/35 p-5 shadow-sm backdrop-blur-md mb-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 ml-1 mb-3">{title}</h3>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const itemState = deviations[sectionKey][item.key]
            
            return (
              <div key={item.key} className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/30 bg-white/30 px-3 py-4 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.6)] backdrop-blur-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400/30 to-teal-600/20 shadow-sm text-teal-700 ring-1 ring-white/40">
                  <svg 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    dangerouslySetInnerHTML={{ __html: ITEM_METADATA[item.key]?.svg || '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />' }}
                  />
                </div>

                <span className="text-xs font-bold text-slate-900 leading-tight text-center">{ITEM_METADATA[item.key]?.label || item.label}</span>

                <div className="flex bg-slate-300/50 rounded-full p-0.5 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15)]">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(sectionKey, item.key, 'pass')}
                    className={"rounded-full px-3 py-1 text-[11px] font-bold transition-all " + (itemState.status === 'pass' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800')}
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(sectionKey, item.key, 'fail')}
                    className={"rounded-full px-3 py-1 text-[11px] font-bold transition-all " + (itemState.status === 'fail' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800')}
                  >
                    Fail
                  </button>
                </div>

                {itemState.status === 'fail' && (
                  <div className="mt-1 w-full animate-in fade-in slide-in-from-top-2 border-t border-slate-200/60 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 text-center">
                      Select deviations:
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {issueOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleIssueToggle(sectionKey, item.key, option.value)}
                          className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition-colors text-center ${
                            itemState.issues.includes(option.value)
                              ? 'border-rose-400 bg-rose-500 text-white shadow-md shadow-rose-500/30'
                              : 'border-slate-300 bg-white/60 text-slate-600 shadow-sm hover:bg-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <section className="pb-32 flex flex-col items-center">
      <header className="w-full flex items-center justify-between px-4 pt-3 pb-4 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm rounded-none mb-4">
        <div className="flex items-center gap-3">
          <InspectionHeaderIcon />
          <div className="flex flex-col">
            <span className="text-slate-600 font-semibold text-xs leading-tight tracking-wide uppercase">Health & Safety</span>
            <span className="text-slate-900 font-bold text-base leading-tight">Emergency Exits</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center overflow-hidden shadow-sm">
               <svg className="w-7 h-7 text-slate-600 mt-2" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
               </svg>
            </div>
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 border-[1.5px] border-white rounded-full"></span>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-[1.5px] border-white rounded-full"></span>
          </div>
          
          <button type="button" className="flex flex-col items-center justify-center bg-white/70 hover:bg-white/90 border border-white/80 shadow-sm rounded-xl w-11 h-11 transition-colors">
            <svg className="w-4 h-4 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[9px] font-bold text-slate-800 mt-0.5">Logout</span>
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 w-full">
        <div className="rounded-3xl border border-white/40 bg-white/30 p-5 shadow-sm backdrop-blur-md mb-5">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="site" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">Site</label>
              <select
                id="site"
                value={selectedSiteId}
                onChange={(event) => {
                  selectSite(event.target.value)
                  setSelectedLocationId('')
                  setLocations([])
                }}
                className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
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
              <label htmlFor="siteLocation" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">Location</label>
              <select
                id="siteLocation"
                value={selectedLocationId}
                onChange={(event) => setSelectedLocationId(event.target.value)}
                disabled={!selectedSiteId}
                className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
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
              <label htmlFor="date" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label htmlFor="time" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">Time</label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="mt-1 text-xs text-slate-500 ml-1">Detected period: {period || 'Invalid time window'}</p>
            </div>

            <div>
              <label htmlFor="area" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">AREA</label>
              <input
                id="area"
                type="text"
                value={formData.area}
                onChange={(event) => updateField('area', event.target.value)}
                className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label htmlFor="year" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">YEAR</label>
              <input
                id="year"
                type="text"
                value={formData.year}
                onChange={(event) => updateField('year', event.target.value)}
                className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="inspector" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">INSPECTOR</label>
            <input
              id="inspector"
              type="text"
              value={formData.inspector}
              onChange={(event) => updateField('inspector', event.target.value)}
              className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {renderSection('emx', 'Emergency Exits', EMX_ITEMS, EMX_CODES)}

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
          className="sticky bottom-6 z-50 mt-8 w-full rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-4 text-center text-base font-bold text-white shadow-[0_8px_20px_rgba(20,184,166,0.4)] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Register'}
        </button>
      </form>

      <Link
        to="/healthandwealth"
        className="inline-flex w-[calc(100%-2rem)] justify-center rounded-md bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 mt-4 mx-4"
      >
        Back To Health And Welfare
      </Link>
    </section>
  )
}

export default EmxPage

