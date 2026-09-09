import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import InspectionHeaderIcon from '../components/InspectionHeaderIcon'
import { queueInspectionSubmission } from '../offline/syncService'
import { fetchLocations, fetchSites, submitHealthSafetyInspection } from '../services/inspectionApi'
import { useAuth } from '../store/authContext'
import { useSite } from '../store/siteContext'
import { derivePeriodFromTime, todayAsIsoDate } from '../utils/inspectionTime'



const FORKLIFT_ITEMS = [
  { key: 'lubricationAdequate', label: 'Lubrication adequate' },
  { key: 'switchesGaugesBrakes', label: 'Switches, Gauges, and Brakes in good working order' },
  { key: 'hoistingAndHorn', label: 'Hoisting mechanisms and Horn in good working order' },
  { key: 'lights', label: 'Lights in good working order' },
  { key: 'pedalsRimsTyresPipes', label: 'Pedal rubbers, Wheel rims and tyres, and All pipes in good condition' },
  { key: 'wheelNutsAndBolts', label: 'Wheel nuts and bolts secure' },
  { key: 'oilCoolantLevelsAndLeaks', label: 'Oil and coolant levels and leaks' },
  { key: 'fanbeltsConditionTension', label: 'Fanbelt/s in good condition and correct tension' },
  { key: 'capsAndBatteryMounting', label: 'Caps (i.e. oil, petrol, etc.) and Battery mounting secure' },
  { key: 'controlLevers', label: 'Control levers in good working order' },
  { key: 'compartmentSeatBelt', label: 'Compartment/seat and Safety belt in good condition' },
  { key: 'hydraulicOilLevel', label: 'Hydraulic oil level correct' },
  { key: 'gasShutOffAndHose', label: 'Gas shut-off valve operational/hose not damaged' },
  { key: 'gasTankMountings', label: 'Gas tank mountings secure' },
  { key: 'reverseSirenAndBeacon', label: 'Reverse siren and Beacon or strobe warning light' }
]

const ITEM_METADATA = {};

function buildInitialDeviationState(items) {
  return items.reduce((accumulator, item) => {
    accumulator[item.key] = { status: null, issues: [] }
    return accumulator
  }, {})
}

function VehiclesForkliftDailyInspectionPage() {
  const { user } = useAuth()
  const { selectedSiteId, selectSite } = useSite()
  const [sites, setSites] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [date, setDate] = useState(todayAsIsoDate)
  const [time, setTime] = useState('06:00')

  const [formData, setFormData] = useState({
    regNo: '',    dateFrom: '',    dateTo: '',    driver: '',    timeOut: '',    timeIn: '',


  })
  
  const [deviations, setDeviations] = useState({
    forklift: buildInitialDeviationState(FORKLIFT_ITEMS),
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
    if (!formData.regNo.trim()) errors.push('REG. No is required.')
    
    
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
        } else if (itemState.status === 'na') {
          accumulator[item.label] = 'N/A'
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
        inspectionType: 'VEHICLES_FORKLIFT_DAILY_INSPECTION', // Matches naming convention
                formPayload: {
          details: {
            regNo: formData.regNo,
            dateFrom: formData.dateFrom,
            dateTo: formData.dateTo,
            driver: formData.driver,
            timeOut: formData.timeOut,
            timeIn: formData.timeIn,
          },
          itemStatus: Object.keys(deviations.forklift).reduce((acc, key) => {
            const status = deviations.forklift[key].status;
            acc[key] = status === 'pass' ? 'OK' : status === 'fail' ? 'DEF' : status === 'na' ? 'N/A' : '';
            return acc;
          }, {}),
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
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(sectionKey, item.key, 'fail')}
                    className={"rounded-full px-3 py-1 text-[11px] font-bold transition-all " + (itemState.status === 'fail' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800')}
                  >
                    DEF
                  </button>
                </div>

                {false && (
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
            <span className="text-slate-900 font-bold text-base leading-tight">Vehicles / Forklift Daily Inspection</span>
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          <div className="rounded-3xl border border-white/40 bg-white/30 p-5 shadow-sm backdrop-blur-md mb-5 mx-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="site" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">SITE</label>
                <select id="site" value={selectedSiteId} onChange={(event) => { selectSite(event.target.value); setSelectedLocationId(''); setLocations([]) }} className="w-full rounded-full border-none bg-white/40 px-3 py-2 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select site</option>
                  {sites.map((site) => (<option key={site._id} value={site._id}>{site.siteCode} - {site.siteName}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="location" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">LOCATION</label>
                <select id="location" value={selectedLocationId} onChange={(event) => setSelectedLocationId(event.target.value)} disabled={!selectedSiteId} className="w-full rounded-full border-none bg-white/40 px-3 py-2 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50">
                  <option value="">Select location</option>
                  {locations.map((loc) => (<option key={loc._id} value={loc._id}>{loc.name}</option>))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="date" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">DATE</label>
                <input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-full border-none bg-white/40 px-3 py-2 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label htmlFor="time" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">TIME</label>
                <input id="time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="w-full rounded-full border-none bg-white/40 px-3 py-2 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
                <p className="mt-1 text-[10px] text-slate-500 ml-1">Detected: {period || 'Invalid'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="regNo" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">REG. NO</label>
                <input type="text" id="regNo" value={formData.regNo || ''} onChange={(e) => updateField('regNo', e.target.value)} className="w-full rounded-full border-none bg-white/40 px-3 py-2 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label htmlFor="driver" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">DRIVER</label>
                <input type="text" id="driver" value={formData.driver || ''} onChange={(e) => updateField('driver', e.target.value)} className="w-full rounded-full border-none bg-white/40 px-3 py-2 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="dateFrom" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">DATE FROM</label>
                <input type="date" id="dateFrom" value={formData.dateFrom || ''} onChange={(e) => updateField('dateFrom', e.target.value)} className="w-full rounded-full border-none bg-white/40 px-3 py-2 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label htmlFor="dateTo" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">DATE TO</label>
                <input type="date" id="dateTo" value={formData.dateTo || ''} onChange={(e) => updateField('dateTo', e.target.value)} className="w-full rounded-full border-none bg-white/40 px-3 py-2 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="timeOut" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">TIME OUT</label>
                <input type="time" id="timeOut" value={formData.timeOut || ''} onChange={(e) => updateField('timeOut', e.target.value)} className="w-full rounded-full border-none bg-white/40 px-3 py-2 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label htmlFor="timeIn" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">TIME IN</label>
                <input type="time" id="timeIn" value={formData.timeIn || ''} onChange={(e) => updateField('timeIn', e.target.value)} className="w-full rounded-full border-none bg-white/40 px-3 py-2 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>

            <div className="mb-2">
              <label htmlFor="inspector" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">INSPECTOR</label>
              <input type="text" id="inspector" value={formData.inspector || ''} onChange={(event) => updateField('inspector', event.target.value)} className="w-full rounded-full border-none bg-white/40 px-3 py-2 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
        <div className="px-4 w-full">
{renderSection('forklift', 'Vehicles / Forklift Daily Inspection', FORKLIFT_ITEMS, [])}

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

export default VehiclesForkliftDailyInspectionPage



