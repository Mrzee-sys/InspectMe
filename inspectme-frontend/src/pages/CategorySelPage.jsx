import { Link } from 'react-router-dom'

const categories = [
  {
    name: 'Health & Welfare',
    description: 'First aid kits, hygiene, employee wellbeing facilities, and PPE checks.',
    to: '/healthandwealth',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 stroke-[1.8]" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
  },
  {
    name: 'Fire & Life Safety',
    description: 'Fire extinguishers, hose reels, emergency exits, and life safety systems.',
    to: '/inspections/health-safety/fire-fighting-equipment-register',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 stroke-[1.8]" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 19.5a5.5 5.5 0 0 1-11 0c0-3.5 3.5-7.5 5.5-12.5 2 5 5.5 9 5.5 12.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5a2 2 0 0 1-2-2c0-1.5 1-3 2-4.5 1 1.5 2 3 2 4.5a2 2 0 0 1-2 2z" />
      </svg>
    ),
  },
  {
    name: 'Fleet & Mobile Equipment',
    description: 'Forklifts, pallet jacks, vehicles, and operational machinery.',
    to: '/inspections/health-safety/vehicles-forklift-daily',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 stroke-[1.8]" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2l2 3h10l2-3h2M3 13v6h18v-6M5 13l2-5h10l2 5" />
        <circle cx="8" cy="19" r="2" />
        <circle cx="16" cy="19" r="2" />
      </svg>
    ),
  },
  {
    name: 'Infrastructure & Facilities',
    description: 'Building structures, electrical panels, lighting, and general site conditions.',
    to: '/inspections/health-safety',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 stroke-[1.8]" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    name: 'Risk & Compliance',
    description: 'Operational risk signals, compliance audits, and escalations.',
    to: '/inspections/risk',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 stroke-[1.8]" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
]

function CategorySel() {
  return (
    <div className="min-h-screen text-gray-900">
      {/* Unified Mobile Top Header */}
      <header className="w-full flex items-center justify-between px-4 pt-3 pb-4 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm rounded-none mb-3">
        
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
            <span className="text-slate-600 font-semibold text-sm leading-tight tracking-wide">InspectMe</span>
            <span className="text-slate-900 font-bold text-[1.15rem] leading-tight">Category Selection</span>
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
          <button className="flex flex-col items-center justify-center bg-white/70 hover:bg-white/90 border border-white/80 shadow-sm rounded-xl w-11 h-11 transition-colors">
            <svg className="w-4 h-4 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[9px] font-bold text-slate-800 mt-0.5">Logout</span>
          </button>

        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="px-4 pb-24 space-y-4 max-w-2xl mx-auto">
        {/* 
          Updated Grid: 
          grid-cols-1 ensures they stack nicely on the Samsung A54.
          sm:grid-cols-2 ensures they sit side-by-side on larger screens.
        */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={category.to}
              className="group rounded-2xl border border-white/45 bg-white/35 p-4 shadow-soft backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 flex items-start gap-4"
            >
              <div className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700 transition group-hover:bg-teal-200">
                {category.icon}
              </div>
              <div className="flex flex-col pt-0.5 pr-2">
                <h3 className="text-base font-bold leading-snug text-slate-900">{category.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Inspection Launchpad ── */}
        <div className="pt-2">
          <h3 className="text-slate-900 font-bold text-lg mb-3 px-1">Quick Launchpad</h3>
          <div className="grid grid-cols-3 gap-3 px-4">
            <Link to="/inspections/health-safety/fire-fighting-equipment-register" className="flex flex-col items-center justify-center py-4 px-2 bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm hover:bg-white/40 active:bg-white/50 transition-all">
              <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
              </svg>
              <span className="text-xs font-bold text-slate-800 mt-2">Extinguisher</span>
            </Link>
            <Link to="/inspections/health-safety/first-aid-box-contents" className="flex flex-col items-center justify-center py-4 px-2 bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm hover:bg-white/40 active:bg-white/50 transition-all">
              <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-bold text-slate-800 mt-2">First Aid</span>
            </Link>
            <Link to="/inspections/health-safety/vehicles-forklift-daily" className="flex flex-col items-center justify-center py-4 px-2 bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm hover:bg-white/40 active:bg-white/50 transition-all">
              <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <span className="text-xs font-bold text-slate-800 mt-2">Forklift</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CategorySel