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

const ITEM_METADATA = {
  // Fire Extinguishers
  feSignageAndLabel: { label: 'Signage & Label', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 7L8 11m4-4l4 4M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6zM6 14a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4z" />' },
  feSealAndPin: { label: 'Safety Pin & Seal', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 20l.1-.1M7 17l6.5-6.5M12.5 11.5A5 5 0 1 0 19.5 4.5 A 5 5 0 1 0 12.5 11.5L10.5 12" />' },
  fePressureGauge: { label: 'Pressure Gauge', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 14l4-4" /><path stroke-linecap="round" stroke-linejoin="round" d="M3.34 17a10 10 0 1117.32 0" />' },
  feBodyCorrosion: { label: 'Body & Corrosion', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />' },
  feHoseNozzle: { label: 'Hose & Nozzle', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 21h14M5 18h14M5 15h14M11 15C4 15 4 8 14 8h1M15 6v4M15 6.5l4 .5M15 9.5l4-.5M19 6.5v3" />' },
  
  // Hose Reels (Fallbacks if missing)
  hrSigns: { label: 'Signage', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 7L8 11m4-4l4 4M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6zM6 14a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4z" />' },
  hrNozzleValve: { label: 'Nozzle & Valve', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 21h14M5 18h14M5 15h14M11 15C4 15 4 8 14 8h1M15 6v4M15 6.5l4 .5M15 9.5l4-.5M19 6.5v3" />' },
  hrAccessibility: { label: 'Accessibility', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />' },
  hrRolledUp: { label: 'Correctly Rolled', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 21h14M5 18h14M5 15h14M11 15C4 15 4 8 14 8h1M15 6v4M15 6.5l4 .5M15 9.5l4-.5M19 6.5v3" />' },
  hrGeneralCondition: { label: 'General Condition', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-6 9l2 2 4-4" />' },
  
  // Hydrants (Fallbacks if missing)
  hySigns: { label: 'Hydrant Signs', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 7L8 11m4-4l4 4M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6zM6 14a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4z" />' },
  hyLeaks: { label: 'Leak Check', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />' },
  hyWheelValve: { label: 'Wheel Valve', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />' },
  hyLugsAndCouplings: { label: 'Lugs & Couplings', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />' },
  hyGeneralCondition: { label: 'General Condition', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-6 9l2 2 4-4" />' }
};

function buildInitialDeviationState(items) {
  return items.reduce((accumulator, item) => {
    // New state structure handles Pass/Fail status and an array of multiple issues
    accumulator[item.key] = { status: null, issues: [] }
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

  // Handle Pass/Fail button clicks
  function handleStatusChange(sectionKey, itemKey, status) {
    setDeviations((previous) => ({
      ...previous,
      [sectionKey]: {
        ...previous[sectionKey],
        [itemKey]: {
          status,
          // Clear issues if passing
          issues: status === 'pass' ? [] : previous[sectionKey][itemKey].issues,
        },
      },
    }))
  }

  // Handle selecting/deselecting multiple deviation chips
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

    // Convert our status & issues array into a readable string for the backend
    const sectionToLabels = (items, sectionValues, optionsMap) =>
      items.reduce((accumulator, item) => {
        const itemState = sectionValues[item.key]
        if (itemState.status === 'pass') {
          accumulator[item.label] = 'Pass'
        } else if (itemState.status === 'fail') {
          if (itemState.issues.length === 0) {
            accumulator[item.label] = 'Fail (No specific reason selected)'
          } else {
            // Map the selected issue codes back to their full labels
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
      inspectionType: 'FIRE_FIGHTING_EQUIPMENT_INSPECTION_REGISTER',
      formPayload: {
        details: {
          area: formData.area,
          inspector: formData.inspector,
          year: formData.year,
        },
        deviations: {
          fireExtinguishers: sectionToLabels(FIRE_EXTINGUISHER_ITEMS, deviations.fireExtinguishers, FE_CODES),
          hoseReels: sectionToLabels(HOSE_REEL_ITEMS, deviations.hoseReels, HR_CODES),
          hydrants: sectionToLabels(HYDRANT_ITEMS, deviations.hydrants, HY_CODES),
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
    // Filter out the blank/placeholder option for our clickable chips
    const issueOptions = options.filter(opt => opt.value !== '')

    return (
      <div className="space-y-4 rounded-3xl border border-white/40 bg-white/35 p-5 shadow-sm backdrop-blur-md mb-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 ml-1 mb-3">{title}</h3>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const itemState = deviations[sectionKey][item.key]
            
            return (
              <div key={item.key} className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/30 bg-white/30 px-3 py-4 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.6)] backdrop-blur-md">
                
                {/* Prominent Icon Badge */}
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

                {/* Short Label */}
                <span className="text-xs font-bold text-slate-900 leading-tight text-center">{ITEM_METADATA[item.key]?.label || item.label}</span>

                {/* Compact Pass/Fail Pill Toggle */}
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

                {/* Conditional Multiple Issue Chips */}
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
      {/* Unified Mobile Top Header */}
      <header className="w-full flex items-center justify-between px-4 pt-3 pb-4 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm rounded-none mb-4">
        
        {/* Left: Logo & Titles */}
        <div className="flex items-center gap-3">
          {/* Shield Logo SVG */}
          <div className="relative flex items-center justify-center w-9 h-11">
            <svg className="w-full h-full text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="absolute text-teal-600 font-extrabold text-[11px] mt-0.5">IM</span>
          </div>
          
          {/* Text Group */}
          <div className="flex flex-col">
            <span className="text-slate-600 font-semibold text-xs leading-tight tracking-wide uppercase">Health & Safety</span>
            <span className="text-slate-900 font-bold text-base leading-tight">Fire Equipment</span>
          </div>
        </div>

        {/* Right: Profile & Logout */}
        <div className="flex items-center gap-3">
          
          {/* User Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center overflow-hidden shadow-sm">
               <svg className="w-7 h-7 text-slate-600 mt-2" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
               </svg>
            </div>
            {/* Online Status Dots */}
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 border-[1.5px] border-white rounded-full"></span>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-[1.5px] border-white rounded-full"></span>
          </div>
          
          {/* Logout Button */}
          <button type="button" className="flex flex-col items-center justify-center bg-white/70 hover:bg-white/90 border border-white/80 shadow-sm rounded-xl w-11 h-11 transition-colors">
            <svg className="w-4 h-4 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[9px] font-bold text-slate-800 mt-0.5">Logout</span>
          </button>

        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded-3xl border border-white/40 bg-white/30 p-5 shadow-sm backdrop-blur-md mb-5">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="site" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">
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
              <label htmlFor="siteLocation" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">
                Location
              </label>
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
              <label htmlFor="date" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label htmlFor="time" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">
                Time
              </label>
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
              <label htmlFor="area" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">
                AREA
              </label>
              <input
                id="area"
                type="text"
                value={formData.area}
                onChange={(event) => updateField('area', event.target.value)}
                className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label htmlFor="year" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">
                YEAR
              </label>
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
            <label htmlFor="inspector" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">
              INSPECTOR
            </label>
            <input
              id="inspector"
              type="text"
              value={formData.inspector}
              onChange={(event) => updateField('inspector', event.target.value)}
              className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
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
          className="sticky bottom-6 z-50 mt-8 w-full rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-4 text-center text-base font-bold text-white shadow-[0_8px_20px_rgba(20,184,166,0.4)] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Register'}
        </button>
      </form>

      <Link
        to="/inspections/health-safety"
        className="inline-flex w-full justify-center rounded-md bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
      >
        Back To Health And Safety Inspections
      </Link>
    </section>
  )
}

export default FireFightingEquipmentInspectionRegisterPage