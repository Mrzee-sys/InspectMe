import { useEffect, useMemo, useState } from 'react'
import { queueInspectionSubmission } from '../offline/syncService'
import { fetchLocations, fetchSites, submitInspection } from '../services/inspectionApi'
import { useAuth } from '../store/authContext'
import { derivePeriodFromTime, todayAsIsoDate } from '../utils/inspectionTime'

const QUESTION_SET = [
  {
    shortLabel: 'Temp 20C',
    icon: 'temperature',
    question: 'Is the room temperature set to 20*?',
  },
  {
    shortLabel: 'Door Lock',
    icon: 'lock',
    question: 'Is the door locked and functioning correctly?',
  },
  {
    shortLabel: 'Aircon',
    icon: 'aircon',
    question: 'Is the aircon working and not leaking?',
  },
  {
    shortLabel: 'Fire System',
    icon: 'fire',
    question: 'Does the fire suppression system have any errors?',
  },
  {
    shortLabel: 'UPS',
    icon: 'power',
    question: 'Does the UPS have any errors?',
  },
  {
    shortLabel: 'Issues Logged',
    icon: 'report',
    question: 'Were there any issues, and was it reported?',
  },
]

function buildInitialAnswers() {
  return QUESTION_SET.map((item) => ({
    question: item.question,
    shortLabel: item.shortLabel,
    icon: item.icon,
    result: 'Pass',
    comment: '',
    photoUrl: '',
  }))
}

function getResultConfig(answer) {
  if (answer.icon === 'report') {
    return {
      label: 'Issue',
      primaryLabel: 'No',
      secondaryLabel: 'Yes',
      primaryValue: 'Pass',
      secondaryValue: 'Fail',
      badgePass: 'No',
      badgeFail: 'Yes',
    }
  }

  return {
    label: 'Result',
    primaryLabel: 'Pass',
    secondaryLabel: 'Fail',
    primaryValue: 'Pass',
    secondaryValue: 'Fail',
    badgePass: 'Pass',
    badgeFail: 'Fail',
  }
}

function QuestionIcon({ icon }) {
  const iconClassName = 'h-5 w-5 stroke-[1.8]'

  if (icon === 'temperature') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconClassName} aria-hidden="true">
        <path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z" />
        <path d="M12 9v8" />
      </svg>
    )
  }

  if (icon === 'lock') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconClassName} aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
      </svg>
    )
  }

  if (icon === 'aircon') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconClassName} aria-hidden="true">
        <rect x="4" y="5" width="16" height="6" rx="2" />
        <path d="M7 14c0 1 .6 1.8 1.4 2.4C9.3 17 10 17.7 10 19" />
        <path d="M12 14c0 1 .6 1.8 1.4 2.4.9.6 1.6 1.3 1.6 2.6" />
        <path d="M17 14c0 1-.6 1.8-1.4 2.4-.9.6-1.6 1.3-1.6 2.6" />
      </svg>
    )
  }

  if (icon === 'fire') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconClassName} aria-hidden="true">
        <path d="M12 3c1.8 2.3 3 4.3 3 6.5 0 1.4-.5 2.5-1.4 3.5 2.1-.4 4.4 1.5 4.4 4.4A6 6 0 0 1 6 17c0-2.7 1.8-4.5 3.6-5.8.6-.4 1.1-1.1 1.2-1.9.2-.9.1-2-.8-3.3Z" />
      </svg>
    )
  }

  if (icon === 'power') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconClassName} aria-hidden="true">
        <path d="M12 3v8" />
        <path d="M7.8 5.8a8 8 0 1 0 8.4 0" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconClassName} aria-hidden="true">
      <path d="M10 3h4l7 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5Z" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16.5" r=".5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function flattenPhotos(answers) {
  return answers
    .map((answer) => answer.photoUrl)
    .filter((photoUrl) => typeof photoUrl === 'string' && photoUrl.length > 0)
}

function getValidationErrors({ selectedSiteId, selectedLocationId, time, period, answers }) {
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

  answers.forEach((answer, index) => {
    if (answer.result === 'Fail') {
      if (!answer.comment.trim()) {
        errors.push(`Question ${index + 1}: comment is required when result is Fail.`)
      }

      if (!answer.photoUrl.trim()) {
        errors.push(`Question ${index + 1}: photo is required when result is Fail.`)
      }
    }
  })

  return errors
}

function InspectionsPage({ inspectionType = 'IT Inspections' }) {
  const { user } = useAuth()
  const [sites, setSites] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [date, setDate] = useState(todayAsIsoDate)
  const [time, setTime] = useState('06:00')
  const [answers, setAnswers] = useState(buildInitialAnswers)
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

  function updateAnswer(index, patch) {
    setAnswers((current) => current.map((answer, i) => (i === index ? { ...answer, ...patch } : answer)))
  }

  async function handlePhotoUpload(index, file) {
    if (!file) {
      updateAnswer(index, { photoUrl: '' })
      return
    }

    const photoUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => reject(new Error('Failed to read image file.'))
      reader.readAsDataURL(file)
    })

    updateAnswer(index, { photoUrl })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSuccessMessage('')

    const validationErrors = getValidationErrors({
      selectedSiteId,
      selectedLocationId,
      time,
      period,
      answers,
    })

    if (validationErrors.length > 0) {
      setErrorMessages(validationErrors)
      return
    }

    setErrorMessages([])
    setIsSubmitting(true)

    const payload = {
      date,
      time,
      period,
      site: selectedSiteId,
      location: selectedLocationId,
      type: inspectionType,
      employee: user.id,
      answers,
      photos: flattenPhotos(answers),
    }

    try {
      if (!navigator.onLine) {
        const queuedId = await queueInspectionSubmission(payload)
        setSuccessMessage(`Offline: inspection queued locally (${queuedId}).`)
      } else {
        await submitInspection(payload)
        setSuccessMessage('Inspection submitted successfully.')
      }

      setAnswers(buildInitialAnswers())
    } catch (error) {
      setErrorMessages([error?.response?.data?.message || 'Failed to submit inspection.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-3 sm:space-y-5">
      <header className="rounded-2xl border border-white/40 bg-white/30 px-4 py-4 shadow-soft backdrop-blur-xl sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:backdrop-blur-none sm:border-transparent">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-600">Live Inspection</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{inspectionType}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          Select a site and complete all checks for this category. If you choose Fail, a comment and photo are required.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-white/45 bg-white/35 p-3 shadow-soft backdrop-blur-xl sm:space-y-5 sm:p-6">
        <div className="rounded-2xl bg-white/20 p-3 sm:bg-transparent sm:p-0">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Inspection Setup</span>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">{period || 'Out of Window'}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="site">
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
                className="min-h-11 w-full rounded-md border border-white/55 bg-white/60 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
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
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="location">
                Location
              </label>
              <select
                id="location"
                value={selectedLocationId}
                onChange={(event) => setSelectedLocationId(event.target.value)}
                className="min-h-11 w-full rounded-md border border-white/55 bg-white/60 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
                disabled={!selectedSiteId}
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
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="time">
                Time
              </label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-2"
              />
              <p className="mt-1 text-xs text-slate-500">Detected period: {period || 'Invalid time window'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {answers.map((answer, index) => (
            <article key={answer.question} className="rounded-2xl border border-white/40 bg-white/25 p-3 backdrop-blur-sm sm:p-4">
              {(() => {
                const resultConfig = getResultConfig(answer)

                return (
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    answer.result === 'Fail' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'
                  }`}
                >
                  <QuestionIcon icon={answer.icon} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {index + 1}. {answer.shortLabel}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        answer.result === 'Fail' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {answer.result === 'Fail' ? resultConfig.badgeFail : resultConfig.badgePass}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">{answer.question}</p>

                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3">
                    <div>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                        {resultConfig.label}
                      </span>
                      <div className="grid min-h-11 grid-cols-2 rounded-xl border border-white/55 bg-white/60 p-1 backdrop-blur-sm">
                        <button
                          type="button"
                          onClick={() => updateAnswer(index, { result: resultConfig.primaryValue })}
                          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                            answer.result === resultConfig.primaryValue ? 'bg-emerald-600 text-white shadow-sm' : 'bg-transparent text-slate-600'
                          }`}
                          aria-pressed={answer.result === resultConfig.primaryValue}
                        >
                          {resultConfig.primaryLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAnswer(index, { result: resultConfig.secondaryValue })}
                          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                            answer.result === resultConfig.secondaryValue ? 'bg-rose-600 text-white shadow-sm' : 'bg-transparent text-slate-600'
                          }`}
                          aria-pressed={answer.result === resultConfig.secondaryValue}
                        >
                          {resultConfig.secondaryLabel}
                        </button>
                      </div>
                    </div>
                  </div>

                  {answer.result === 'Fail' && (
                    <div className="mt-3 space-y-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                      <div>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-rose-700">
                          Comment
                        </span>
                        <input
                          type="text"
                          value={answer.comment}
                          onChange={(event) => updateAnswer(index, { comment: event.target.value })}
                          placeholder="Comment required for Fail"
                          className="min-h-11 w-full rounded-md border border-rose-300 bg-white/70 px-3 py-2 text-sm outline-none ring-rose-400 backdrop-blur-sm focus:border-rose-500 focus:ring-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-rose-700">
                          Photo (required)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            void handlePhotoUpload(index, file)
                          }}
                          className="block w-full text-sm text-slate-700 file:mb-2 file:mr-0 file:block file:w-full file:rounded-md file:border-0 file:bg-rose-100 file:px-3 file:py-3 file:text-sm file:font-medium file:text-rose-800 hover:file:bg-rose-200 sm:file:mb-0 sm:file:mr-3 sm:file:inline-block sm:file:w-auto sm:file:py-2"
                        />
                        {answer.photoUrl ? (
                          <p className="mt-1 text-xs text-emerald-700">Photo attached.</p>
                        ) : (
                          <p className="mt-1 text-xs text-rose-700">A photo is required for failed checks.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
                )
              })()}
            </article>
          ))}
        </div>

        {errorMessages.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        {successMessage && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        )}

        <div className="sticky bottom-20 rounded-2xl border border-white/40 bg-white/45 pt-1 backdrop-blur-xl sm:bottom-3 sm:rounded-lg sm:bg-white/45 sm:pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-12 w-full rounded-md bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default InspectionsPage
