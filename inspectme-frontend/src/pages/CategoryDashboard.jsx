import { Link } from 'react-router-dom'

const categories = [
  {
    name: 'IT Inspections',
    description: 'Server rooms, network cabinets, UPS, and endpoint readiness checks.',
    to: '/inspections/it',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 stroke-[1.8]" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8" />
        <path d="M12 16v4" />
      </svg>
    ),
  },
  {
    name: 'Health And Safety Inspections',
    description: 'PPE, hazard controls, emergency access, and workplace safety checks.',
    to: '/inspections/health-safety',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 stroke-[1.8]" aria-hidden="true">
        <path d="M12 3l8 4v5c0 5.2-3.2 8.2-8 9-4.8-.8-8-3.8-8-9V7l8-4Z" />
        <path d="M9 12h6" />
        <path d="M12 9v6" />
      </svg>
    ),
  },
  {
    name: 'Risk Inspections',
    description: 'Operational risk signals, escalations, and mitigation control checks.',
    to: '/inspections/risk',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 stroke-[1.8]" aria-hidden="true">
        <path d="M12 4 3 20h18L12 4Z" />
        <path d="M12 10v5" />
        <circle cx="12" cy="17.5" r=".8" fill="currentColor" />
      </svg>
    ),
  },
]

function CategoryDashboard() {
  return (
    <section className="space-y-4 sm:space-y-6">
      <header className="rounded-2xl border border-white/40 bg-white/30 p-4 shadow-soft backdrop-blur-xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Category Dashboard</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Choose Inspection Category</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-700 sm:text-base">
          Select a category to start a guided inspection flow.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.name}
            to={category.to}
            className="group rounded-2xl border border-white/45 bg-white/35 p-5 shadow-soft backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700 transition group-hover:bg-teal-200">
              {category.icon}
            </div>
            <h3 className="text-lg font-semibold leading-snug text-slate-900">{category.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default CategoryDashboard
