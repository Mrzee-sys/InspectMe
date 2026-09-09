import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import InspectionHeaderIcon from '../components/InspectionHeaderIcon'
import { queueInspectionSubmission } from '../offline/syncService'
import { fetchLocations, fetchSites, submitHealthSafetyInspection } from '../services/inspectionApi'
import { useAuth } from '../store/authContext'
import { useSite } from '../store/siteContext'
import { derivePeriodFromTime, todayAsIsoDate } from '../utils/inspectionTime'

const REQUIRED_ITEMS = [
  { key: 'absorbentMaterial', label: 'Absorbent material for body fluids' },
  { key: 'bandageRoller', label: 'Bandage Roller (100x5m & 75x5m)' },
  { key: 'triangularBandages', label: 'Triangular Bandages' },
  { key: 'cottonWoolGauze', label: 'Cotton wool / Gauze (50g)' },
  { key: 'cprMouthpieces', label: 'CPR mouthpieces' },
  { key: 'disinfectant', label: 'Disinfectant (sterilize fluids)' },
  { key: 'dressingsFirstAid', label: 'Dressings First Aid (150x200 & 75x100)' },
  { key: 'tweezerAndGauze', label: 'Tweezer & Gauze (Sterile)' },
  { key: 'gloves', label: 'Gloves (disposable L/M, rubber L/M)' },
  { key: 'plaster', label: 'Plaster (Roll, strips, non allergic)' },
  { key: 'safetyPinsAndScissors', label: 'Safety pins and Scissors' },
  { key: 'straightSplints', label: 'Straight splints' },
  { key: 'woundCleaner', label: '100ml Wound cleaner' },
]

const ITEM_METADATA = {
  absorbentMaterial: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-9-8.25-9-8.25-9 3.694-9 8.25 4.03 8.25 9 8.25z" />' },
  bandageRoller: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />' },
  triangularBandages: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3l10 17H2L12 3z" />' },
  cottonWoolGauze: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />' },
  cprMouthpieces: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />' },
  disinfectant: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />' },
  dressingsFirstAid: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />' },
  tweezerAndGauze: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />' },
  gloves: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v-2a1.5 1.5 0 013 0m4.5 0v-4a1.5 1.5 0 113 0m-3 4v-2a1.5 1.5 0 113 0m0 0v-1a1.5 1.5 0 113 0v4.5A7.5 7.5 0 0115 21H9a7.5 7.5 0 01-7.5-7.5V11a1.5 1.5 0 013 0v1" />' },
  plaster: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />' },
  safetyPinsAndScissors: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M14.121 14.121L19 19m-4.879-4.879l-4.828-4.828m0 0l-1.414-1.414m1.414 1.414L3 14m6.172-6.172L19 3m-4.879 10.121a2 2 0 112.828-2.828 2 2 0 01-2.828 2.828zM3 3l18 18" />' },
  straightSplints: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />' },
  woundCleaner: { svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />' },
}

function buildInitialChecklistState() {
  return REQUIRED_ITEMS.reduce((accumulator, item) => {
    accumulator[item.key] = null
    return accumulator
  }, {})
}

function FirstAidBoxContentsChecklistPage() {
  const { user } = useAuth()
  const { selectedSiteId, selectSite } = useSite()
  const [sites, setSites] = useState([])
  const [locations, setLocations] = useState([])
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
    if (!selectedSiteId) return

    async function loadLocations() {
      try {
        const locationData = await fetchLocations(selectedSiteId)
        setLocations(locationData)
      } catch {
        setErrorMessages(['Unable to load locations.'])
      }
    }

    void loadLocations()
  }, [selectedSiteId])

  function updateField(field, value) {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  function handleStatusChange(itemKey, status) {
    setChecklist((previous) => ({ ...previous, [itemKey]: status }))
  }

  function getValidationErrors() {
    const errors = []
    if (!selectedSiteId) errors.push('Please select a site.')
    if (!selectedLocationId) errors.push('Please select a location.')
    if (!time) errors.push('Please provide time.')
    if (!period) errors.push('Time between 06:00 and 18:00 local time.')
    if (!formData.boxNo.trim()) errors.push('BOX NO is required.')
    if (!formData.firstAider.trim()) errors.push('FIRST AIDER is required.')
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

    const checklistByLabel = REQUIRED_ITEMS.reduce((accumulator, item) => {
      accumulator[item.label] = checklist[item.key] === 'pass'
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
    <section className="pb-32 flex flex-col items-center">
      <header className="w-full flex items-center justify-between px-4 pt-3 pb-4 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm rounded-none mb-4">
        <div className="flex items-center gap-3">
          <InspectionHeaderIcon />
          <div className="flex flex-col">
            <span className="text-slate-600 font-semibold text-xs leading-tight tracking-wide uppercase">Health & Safety</span>
            <span className="text-slate-900 font-bold text-base leading-tight">First Aid & Emergency</span>
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
        {/* Main Details Section */}
        <div className="rounded-3xl border border-white/40 bg-white/30 p-5 shadow-sm backdrop-blur-md mb-2">
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
            </div>

            <div>
              <label htmlFor="boxNo" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">BOX NO</label>
              <input
                id="boxNo"
                type="text"
                value={formData.boxNo}
                onChange={(event) => updateField('boxNo', event.target.value)}
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

          <div className="mb-4">
            <label htmlFor="firstAider" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">FIRST AIDER</label>
            <input
              id="firstAider"
              type="text"
              value={formData.firstAider}
              onChange={(event) => updateField('firstAider', event.target.value)}
              className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          
          <div className="mb-2">
            <label htmlFor="location" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">LOCATION DETAIL (Optional)</label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(event) => updateField('location', event.target.value)}
              className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Required Items Checklist */}
        <div className="rounded-3xl border border-white/40 bg-white/35 p-5 shadow-sm backdrop-blur-md mb-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 ml-1 mb-3">Required Contents Check</h3>
          <div className="grid grid-cols-2 gap-3">
            {REQUIRED_ITEMS.map((item) => {
              const itemState = checklist[item.key]
              
              return (
                <div key={item.key} className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/30 bg-white/30 px-3 py-4 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.6)] backdrop-blur-md">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400/30 to-teal-600/20 shadow-sm text-teal-700 ring-1 ring-white/40">
                    <svg 
                      className="h-5 w-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      dangerouslySetInnerHTML={{ __html: ITEM_METADATA[item.key]?.svg || '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />' }}
                    />
                  </div>

                  <span className="text-xs font-bold text-slate-900 leading-tight text-center line-clamp-3 px-1">{item.label}</span>

                  <div className="flex bg-slate-300/50 rounded-full p-0.5 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15)] mt-auto">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.key, 'pass')}
                      className={"rounded-full px-3 py-1 text-[11px] font-bold transition-all " + (itemState === 'pass' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800')}
                    >
                      Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.key, 'fail')}
                      className={"rounded-full px-3 py-1 text-[11px] font-bold transition-all " + (itemState === 'fail' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800')}
                    >
                      Fail
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Signatures */}
        <div className="rounded-3xl border border-white/40 bg-white/30 p-5 shadow-sm backdrop-blur-md mb-5">
           <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 ml-1 mb-3">Signatures</h3>
           <div className="grid grid-cols-1 gap-4">
             <div>
               <label htmlFor="signatureFirstAider" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">Signature: First Aider</label>
               <input
                 id="signatureFirstAider"
                 type="text"
                 value={formData.signatureFirstAider}
                 onChange={(event) => updateField('signatureFirstAider', event.target.value)}
                 className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
               />
             </div>
             <div>
               <label htmlFor="signatureSection16" className="mb-1.5 block text-xs font-semibold text-slate-700 ml-1">Signature: Section 16(2)</label>
               <input
                 id="signatureSection16"
                 type="text"
                 value={formData.signatureSection16_2}
                 onChange={(event) => updateField('signatureSection16_2', event.target.value)}
                 className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500"
               />
             </div>
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
          className="sticky bottom-6 z-50 mt-4 w-full rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-4 text-center text-base font-bold text-white shadow-[0_8px_20px_rgba(20,184,166,0.4)] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Checklist'}
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

export default FirstAidBoxContentsChecklistPage
