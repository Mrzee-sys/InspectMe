import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import InspectionHeaderIcon from '../components/InspectionHeaderIcon'
import { queueInspectionSubmission } from '../offline/syncService'
import { fetchLocations, fetchSites, submitHealthSafetyInspection } from '../services/inspectionApi'
import { useAuth } from '../store/authContext'
import { useSite } from '../store/siteContext'
import { derivePeriodFromTime, todayAsIsoDate } from '../utils/inspectionTime'

const CHSWS_CODES = [
  { value: '', label: 'Select code (no deviation if blank)' },
  { value: 'CHSWS1', label: 'CHSWS1 - Walking pathways blocked or hazardous' },
  { value: 'CHSWS2', label: 'CHSWS2 - Fire corridors blocked by inventory/machinery' },
  { value: 'CHSWS3', label: 'CHSWS3 - Floors/walkways unclean, wet, or pooled water' },
  { value: 'CHSWS4', label: 'CHSWS4 - Other' },
]

const CHSWS_ITEMS = [
  { key: 'chswsPathways', label: 'Are designated walking pathways clear of pallet wraps, timber splinters, strapping band hazards, and oils?' },
  { key: 'chswsFireCorridors', label: 'Are primary egress fire corridors completely unblocked by raw inventory, heavy pallets, or machinery?' },
  { key: 'chswsFloors', label: 'Are all floors and walkways cleaned regularly, dry, and free from standing wastewater pools?' },
]

const ITEM_METADATA = {
  chswsPathways: { label: 'Clear Walking Pathways', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />' },
  chswsFireCorridors: { label: 'Unblocked Fire Corridors', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />' },
  chswsFloors: { label: 'Clean & Dry Floors', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />' },
};

function buildInitialDeviationState(items) {
  return items.reduce((accumulator, item) => {
    accumulator[item.key] = { status: null, issues: [] }
    return accumulator
  }, {})
}

function ChswsPage() {
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
    chsws: buildInitialDeviationState(CHSWS_ITEMS),
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
        inspectionType: 'CLEAN_HOUSEKEEPING_SAFE_WALKING', // Matches naming convention
        formPayload: {
          details: {
            area: formData.area,
            inspector: formData.inspector,
            year: formData.year,
          },
          deviations: {
            chsws: sectionToLabels(CHSWS_ITEMS, deviations.chsws, CHSWS_CODES),
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
            <span className="text-slate-900 font-bold text-base leading-tight">Clean Housekeeping</span>
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

        {renderSection('chsws', 'Clean Housekeeping & Safe Walking Surfaces', CHSWS_ITEMS, CHSWS_CODES)}

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

export default ChswsPage

