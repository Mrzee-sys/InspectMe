import { Link } from 'react-router-dom'

const inspections = [
  {
    title: 'First Aid Box Contents Checklist',
    description: 'Review required first aid items and verify stock, expiry, and condition.',
    to: '/inspections/health-safety/first-aid-box-contents',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 stroke-[1.8]" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M9 6V4h6v2" />
        <path d="M12 9v6" />
        <path d="M9 12h6" />
      </svg>
    ),
  },
  {
    title: 'Vehicles / Forklift Daily Inspection',
    description: 'Complete pre-start safety and operating checks for vehicles and forklifts.',
    to: '/inspections/health-safety/vehicles-forklift-daily',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 stroke-[1.8]" aria-hidden="true">
        <path d="M3 14h16l2 3v2h-2" />
        <path d="M3 19H1v-3l2-2h12" />
        <circle cx="6" cy="19" r="2" />
        <circle cx="16" cy="19" r="2" />
        <path d="M8 14l2-4h4l2 4" />
      </svg>
    ),
  },
  {
    title: 'Fire Fighting Equipment Inspection Register',
    description: 'Inspect extinguishers, hoses, signage, and serviceability across locations.',
    to: '/inspections/health-safety/fire-fighting-equipment-register',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 stroke-[1.8]" aria-hidden="true">
        <path d="M9 4h6" />
        <path d="M10 4v3h4V4" />
        <path d="M8 10a4 4 0 0 1 8 0v7a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-7Z" />
        <path d="M14 9c0-1.2.7-2 2-2" />
      </svg>
    ),
  },
]

function HealthSafetyDashboard() {
  return (
    <section className="space-y-4 sm:space-y-6">
      <header className="rounded-2xl border border-white/40 bg-white/30 p-4 shadow-soft backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Health And Safety</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Inspection Types</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-700 sm:text-base">
              Select an inspection to open its dedicated form workflow.
            </p>
          </div>
          <Link
            to="/inspections/health-safety/history"
            className="inline-flex rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            View History
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        {inspections.map((inspection) => (
          <Link
            key={inspection.title}
            to={inspection.to}
            className="group rounded-2xl border border-white/45 bg-white/35 p-5 shadow-soft backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700 transition group-hover:bg-teal-200">
              {inspection.icon}
            </div>
            <h3 className="text-lg font-semibold leading-snug text-slate-900">{inspection.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{inspection.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HealthSafetyDashboard
