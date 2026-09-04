import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Settings, Database, Activity, Droplets, Shirt, Coffee, Flame, Truck, ClipboardList } from 'lucide-react';
import { fetchSites, fetchHealthSafetyInspections, submitHealthSafetyInspection } from '../services/inspectionApi';
import { useAuth } from '../store/authContext';

const inspectionConfig = {
  'FIRST_AID_BOX_CONTENTS_CHECKLIST': { icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50 border border-rose-100', name: 'First Aid' },
  'ABLUTION_TOILET_SANITATION': { icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50 border border-blue-100', name: 'Ablution' },
  'CHANGE_ROOMS_SECURE_STORAGE': { icon: Shirt, color: 'text-amber-500', bg: 'bg-amber-50 border border-amber-100', name: 'Lockers' },
  'DINING_CANTEEN_EATING_FACILITIES': { icon: Coffee, color: 'text-orange-500', bg: 'bg-orange-50 border border-orange-100', name: 'Dining' },
  'FIRE_FIGHTING_EQUIPMENT_INSPECTION_REGISTER': { icon: Flame, color: 'text-red-500', bg: 'bg-red-50 border border-red-100', name: 'Fire' },
  'VEHICLES_FORKLIFT_DAILY_INSPECTION': { icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50 border border-indigo-100', name: 'Vehicles' },
};



const HealthSafetyAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(location.state?.siteId || 'All');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [siteData, inspectionData] = await Promise.all([
        fetchSites(),
        fetchHealthSafetyInspections()
      ]);
      setSites(siteData);
      setInspections(inspectionData);
    } catch (err) {
      console.error('Error fetching data in Analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInspections = useMemo(() => {
    if (selectedSite === 'All') {
      return inspections;
    }
    return inspections.filter(i => {
      if (!i.site) return false;
      const siteId = typeof i.site === 'object' ? i.site._id : i.site;
      return siteId === selectedSite;
    });
  }, [inspections, selectedSite]);

  const inspectionVolume = useMemo(() => {
    return filteredInspections.reduce((acc, inspection) => {
      acc[inspection.inspectionType] = (acc[inspection.inspectionType] || 0) + 1;
      return acc;
    }, {});
  }, [filteredInspections]);

    const compliancePercentage = useMemo(() => {
      if (filteredInspections.length === 0) {
        return 0;
      }
      const compliantInspections = filteredInspections.filter(i => i.status === 'Green').length;
      return (compliantInspections / filteredInspections.length) * 100;
    }, [filteredInspections]);

  if (loading) {
    return <div className="p-8 text-center text-gray-700">Loading dashboard...</div>;
  }

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
            <h1 className="text-sm font-extrabold text-slate-900 leading-tight">Health & Safety</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Analytics</p>
          </div>
        </div>

        {/* Right: Logout */}
        <div className="flex items-center gap-3">
          
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
      <main className="px-4 pb-24 space-y-6 max-w-2xl mx-auto">

        {/* ── Site Filter Card ── */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl px-4 py-3 shadow-xl">
          <div className="flex items-center gap-3">
            <label htmlFor="site-code-filter" className="text-sm font-bold text-slate-900 whitespace-nowrap">
              Site:
            </label>
            <select
              id="site-code-filter"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="flex-1 bg-white/50 backdrop-blur-sm border border-white/40 text-sm text-gray-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm appearance-none"
            >
              <option value="All">All</option>
              {sites.map(site => (
                <option key={site._id} value={site._id}>{site.siteCode}</option>
              ))}
            </select>
            {/* Filter Funnel Icon */}
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
            </div>
          </div>
        </div>


        {/* ── Overall Compliance Card ── */}
        <div className="w-full bg-white/40 backdrop-blur-xl border border-white/50 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Overall Compliance</h2>

          {/* Outer Sunken Track */}
          <div className="relative w-56 h-56 rounded-full flex items-center justify-center bg-white/20 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.1),_inset_-6px_-6px_12px_rgba(255,255,255,0.7)]">
            
            {/* SVG Glowing Gradient Ring */}
            <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0px 0px 8px rgba(45,212,191,0.8))' }}>
              <defs>
                <linearGradient id="complianceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#facc15" />
                </linearGradient>
              </defs>
              {/* Background Track */}
              <circle cx="112" cy="112" r="96" fill="none" className="stroke-white/30" strokeWidth="12" />
              {/* Foreground Progress */}
              <circle cx="112" cy="112" r="96" fill="none" stroke="url(#complianceGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray="603" strokeDashoffset={603 - (603 * Math.min(compliancePercentage, 100)) / 100} className="transition-all duration-1000 ease-out -rotate-90 origin-center" />
            </svg>

            {/* Inner Raised Plate */}
            <div className="relative z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center bg-white/40 backdrop-blur-md border border-white/60 shadow-[6px_6px_12px_rgba(0,0,0,0.1),_-6px_-6px_12px_rgba(255,255,255,1)]">
              <p className="text-5xl font-extrabold text-teal-900 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]">
                {compliancePercentage.toFixed(1)}%
              </p>
            </div>

          </div>

          <div className="text-center mt-6">
            <p className="text-sm font-bold text-slate-800">Based on {filteredInspections.length} inspections</p>
            <p className="text-xs text-slate-600 mt-1">Average score: 71% (Past 30 days)</p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full mt-6 pt-4 border-t border-white/40">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-700 font-semibold text-xs transition-all shadow-sm"
            >
              <LayoutGrid className="w-4 h-4" />
              Categories
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/40 hover:bg-white/60 border border-white/60 text-slate-700 font-semibold text-xs transition-all shadow-sm"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              Settings
            </button>
          </div>
        </div>

        {/* ── Inspection Volume Card ── */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-base font-bold text-slate-900">Inspection Type and Count </h2>
          </div>

          <div className="p-4 grid grid-cols-4 gap-3">
            {Object.keys(inspectionVolume).length > 0 ? (
              Object.entries(inspectionVolume).map(([type, count]) => {
                const config = inspectionConfig[type] || { icon: ClipboardList, color: 'text-teal-500', bg: 'bg-teal-50 border border-teal-100', name: 'Other' };
                const Icon = config.icon;
                return (
                  <div key={type} className="flex flex-col items-center justify-center gap-1.5">
                    <div className={`relative w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-sm ${config.bg}`}>
                      <Icon className={`w-7 h-7 ${config.color}`} />
                      <span className="absolute -top-1.5 -right-1.5 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                        {count}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 text-center leading-tight w-full line-clamp-2">{config.name}</span>
                  </div>
                );
              })
            ) : (
              <p className="col-span-4 text-center py-4 text-sm text-slate-700">No inspections found for this site.</p>
            )}
          </div>

          <div className="px-5 py-3 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-700">
              Total inspections: {filteredInspections.length}
            </p>
          </div>
        </div>

      </main>

    </div>
  );
};

export default HealthSafetyAnalyticsDashboard;
