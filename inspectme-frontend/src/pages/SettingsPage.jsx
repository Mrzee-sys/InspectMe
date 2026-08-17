import { useEffect, useState } from 'react'
import { createLocation, createSite, fetchLocations, fetchSites } from '../services/inspectionApi'

function SettingsPage() {
  const [sites, setSites] = useState([])
  const [locations, setLocations] = useState([])
  const [siteForm, setSiteForm] = useState({ siteCode: '', siteName: '' })
  const [locationForm, setLocationForm] = useState({
    siteCode: '',
    locationName: '',
    inspectionType: 'Server Room',
    active: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSite, setIsSavingSite] = useState(false)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function loadSettingsData() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [siteData, locationData] = await Promise.all([fetchSites(), fetchLocations()])
        setSites(siteData)
        setLocations(locationData)
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Unable to load settings data.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadSettingsData()
  }, [])

  async function refreshData() {
    const [siteData, locationData] = await Promise.all([fetchSites(), fetchLocations()])
    setSites(siteData)
    setLocations(locationData)
  }

  async function handleCreateSite(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!siteForm.siteCode.trim() || !siteForm.siteName.trim()) {
      setErrorMessage('Site code and site name are required.')
      return
    }

    setIsSavingSite(true)

    try {
      const site = await createSite({
        siteCode: siteForm.siteCode.trim(),
        siteName: siteForm.siteName.trim(),
      })

      setSiteForm({ siteCode: '', siteName: '' })
      setLocationForm((current) => ({
        ...current,
        siteCode: current.siteCode || site._id,
      }))
      await refreshData()
      setSuccessMessage('Site created successfully.')
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to create site.')
    } finally {
      setIsSavingSite(false)
    }
  }

  async function handleCreateLocation(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!locationForm.siteCode) {
      setErrorMessage('Please select a site for the location.')
      return
    }

    if (!locationForm.locationName.trim()) {
      setErrorMessage('Location name is required.')
      return
    }

    setIsSavingLocation(true)

    try {
      await createLocation({
        siteCode: locationForm.siteCode,
        locationName: locationForm.locationName.trim(),
        inspectionType: locationForm.inspectionType.trim() || 'Server Room',
        active: locationForm.active,
      })

      setLocationForm((current) => ({
        ...current,
        locationName: '',
        inspectionType: 'Server Room',
        active: true,
      }))
      await refreshData()
      setSuccessMessage('Location created successfully.')
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to create location.')
    } finally {
      setIsSavingLocation(false)
    }
  }

  return (
    <section className="space-y-4 sm:space-y-6">
      <header className="rounded-2xl border border-white/40 bg-white/30 p-4 shadow-soft backdrop-blur-xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Settings</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Sites And Locations</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-700 sm:text-base">
          Manage the sites and locations linked to your signed-in account.
        </p>
      </header>

      {errorMessage && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form onSubmit={handleCreateSite} className="space-y-4 rounded-2xl border border-white/45 bg-white/35 p-4 shadow-soft backdrop-blur-xl sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Create Site</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">Add A Site</h3>
          </div>

          <div>
            <label htmlFor="siteCode" className="mb-1 block text-sm font-semibold text-slate-700">
              Site Code
            </label>
            <input
              id="siteCode"
              type="text"
              value={siteForm.siteCode}
              onChange={(event) => setSiteForm((current) => ({ ...current, siteCode: event.target.value.toUpperCase() }))}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
              placeholder="e.g. JHB01"
            />
          </div>

          <div>
            <label htmlFor="siteName" className="mb-1 block text-sm font-semibold text-slate-700">
              Site Name
            </label>
            <input
              id="siteName"
              type="text"
              value={siteForm.siteName}
              onChange={(event) => setSiteForm((current) => ({ ...current, siteName: event.target.value }))}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
              placeholder="Johannesburg Warehouse"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingSite}
            className="inline-flex rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
          >
            {isSavingSite ? 'Saving Site...' : 'Save Site'}
          </button>
        </form>

        <form onSubmit={handleCreateLocation} className="space-y-4 rounded-2xl border border-white/45 bg-white/35 p-4 shadow-soft backdrop-blur-xl sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Create Location</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">Add A Location</h3>
          </div>

          <div>
            <label htmlFor="locationSite" className="mb-1 block text-sm font-semibold text-slate-700">
              Site
            </label>
            <select
              id="locationSite"
              value={locationForm.siteCode}
              onChange={(event) => setLocationForm((current) => ({ ...current, siteCode: event.target.value }))}
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
            <label htmlFor="locationName" className="mb-1 block text-sm font-semibold text-slate-700">
              Location Name
            </label>
            <input
              id="locationName"
              type="text"
              value={locationForm.locationName}
              onChange={(event) => setLocationForm((current) => ({ ...current, locationName: event.target.value }))}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
              placeholder="Server Room 1"
            />
          </div>

          <div>
            <label htmlFor="inspectionType" className="mb-1 block text-sm font-semibold text-slate-700">
              Inspection Type
            </label>
            <select
              id="inspectionType"
              value={locationForm.inspectionType}
              onChange={(event) => setLocationForm((current) => ({ ...current, inspectionType: event.target.value }))}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm outline-none ring-teal-500 backdrop-blur-sm focus:border-teal-500 focus:ring-2"
            >
              <option value="IT Inspections">IT Inspections</option>
              <option value="Health And Safety Inspections">Health And Safety Inspections</option>
              <option value="Risk Inspections">Risk Inspections</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={locationForm.active}
              onChange={(event) => setLocationForm((current) => ({ ...current, active: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Active
          </label>

          <button
            type="submit"
            disabled={isSavingLocation || sites.length === 0}
            className="inline-flex rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
          >
            {isSavingLocation ? 'Saving Location...' : 'Save Location'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/45 bg-white/35 p-4 shadow-soft backdrop-blur-xl sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Your Sites</h3>
            {isLoading && <span className="text-xs text-slate-500">Loading...</span>}
          </div>

          <div className="mt-4 space-y-3">
            {sites.length === 0 ? (
              <p className="text-sm text-slate-600">No sites have been added for your account yet.</p>
            ) : (
              sites.map((site) => (
                <article key={site._id} className="rounded-xl border border-white/40 bg-white/45 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{site.siteCode}</p>
                  <h4 className="mt-1 text-sm font-semibold text-slate-900">{site.siteName}</h4>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/45 bg-white/35 p-4 shadow-soft backdrop-blur-xl sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Your Locations</h3>
            {isLoading && <span className="text-xs text-slate-500">Loading...</span>}
          </div>

          <div className="mt-4 space-y-3">
            {locations.length === 0 ? (
              <p className="text-sm text-slate-600">No locations have been added for your account yet.</p>
            ) : (
              locations.map((location) => (
                <article key={location._id} className="rounded-xl border border-white/40 bg-white/45 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{location.locationName}</h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {location.siteCode?.siteCode || 'Unknown Site'} - {location.inspectionType}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${location.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {location.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

export default SettingsPage
