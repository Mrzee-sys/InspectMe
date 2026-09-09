import React from 'react';
import { Link } from 'react-router-dom';
import { Tractor, Truck, Construction, ArrowUpSquare, Car } from 'lucide-react';

const fleetInspections = [
  {
    name: 'Vehicles & Forklifts',
    to: '/inspections/health-safety/vehicles-forklift-daily',
    icon: <Car className="w-8 h-8 text-blue-500" />,
    bg: 'bg-blue-50 border-blue-100',
  },
  {
    name: 'Earthmoving (TLBs)',
    to: '/inspections/health-safety/earthmoving',
    icon: <Tractor className="w-8 h-8 text-amber-500" />,
    bg: 'bg-amber-50 border-amber-100',
  },
  {
    name: 'Dump Trucks (ADTs)',
    to: '/inspections/health-safety/dump-trucks',
    icon: <Truck className="w-8 h-8 text-slate-500" />,
    bg: 'bg-slate-50 border-slate-100',
  },
  {
    name: 'Mobile Cranes',
    to: '/inspections/health-safety/mobile-cranes',
    icon: <Construction className="w-8 h-8 text-orange-500" />,
    bg: 'bg-orange-50 border-orange-100',
  },
  {
    name: 'Elevating Platforms',
    to: '/inspections/health-safety/elevating-platforms',
    icon: <ArrowUpSquare className="w-8 h-8 text-indigo-500" />,
    bg: 'bg-indigo-50 border-indigo-100',
  }
];

export default function FleetMobilePage() {
  return (
    <div className="min-h-screen text-gray-900 ">
      {/* Unified Mobile Top Header */}
      <header className="w-full flex items-center justify-between px-4 pt-3 pb-4 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm rounded-none mb-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-11">
            <svg className="w-full h-full text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="absolute text-blue-600 font-extrabold text-[11px] mt-0.5">IM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-600 font-semibold text-sm leading-tight tracking-wide">InspectMe</span>
            <span className="text-slate-900 font-bold text-[1.15rem] leading-tight">Fleet & Mobile</span>
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
          <button className="flex flex-col items-center justify-center bg-white/70 hover:bg-white/90 border border-white/80 shadow-sm rounded-xl w-11 h-11 transition-colors">
            <svg className="w-4 h-4 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[9px] font-bold text-slate-800 mt-0.5">Logout</span>
          </button>
        </div>
      </header>

      <main className="px-4 pb-24 space-y-6 max-w-2xl mx-auto">
        <div className="pt-2">
          <h3 className="text-white drop-shadow-md font-bold text-lg mb-3 px-1">Inspections</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {fleetInspections.map((item) => (
              <Link 
                key={item.name}
                to={item.to} 
                className={`flex flex-col items-center justify-center py-6 px-2 bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm hover:bg-white/40 active:bg-white/50 transition-all text-center ${item.to === '#' ? 'opacity-70' : ''}`}
              >
                <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-3 shadow-inner border ${item.bg}`}>
                  {item.icon}
                </div>
                <span className="text-sm font-bold text-slate-800 leading-tight">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      
      <div className="fixed bottom-24 w-full flex justify-center z-40 pointer-events-none">
          <Link
            to="/categories"
            className="pointer-events-auto inline-flex w-[calc(100%-2rem)] max-w-2xl justify-center rounded-md bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 shadow-lg"
          >
            Back To Categories
          </Link>
      </div>
    </div>
  );
}
