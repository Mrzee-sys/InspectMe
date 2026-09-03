import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Settings, Database } from 'lucide-react';
import { fetchSites, fetchHealthSafetyInspections, submitHealthSafetyInspection } from '../services/inspectionApi';
import { useAuth } from '../store/authContext';

/* ── Thematic icons for each inspection type ── */
const inspectionTypeIcons = {
  'FIRE_FIGHTING_EQUIPMENT_INSPECTION_REGISTER': (
    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  ),
  'FIRST_AID_BOX_CONTENTS_CHECKLIST': (
    <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'VEHICLES_FORKLIFT_DAILY_INSPECTION': (
    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
};

/* Fallback icon for unknown types */
const DefaultInspectionIcon = () => (
  <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.251 2.251 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
  </svg>
);

const HealthSafetyAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(location.state?.siteId || 'All');
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

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

  const handleSeedData = async () => {
    if (!sites.length) return alert('No sites found! Please create a site first.');
    setIsSeeding(true);
    try {
      const siteId = sites[0]._id;
      const dummyRecords = [
        { date: '2026-09-03', time: '10:00', period: 'Morning', site: siteId, location: siteId, employee: user?._id || siteId, inspectionType: 'FIRST_AID_BOX_CONTENTS_CHECKLIST', status: 'Green', formPayload: {} },
        { date: '2026-09-03', time: '11:00', period: 'Morning', site: siteId, location: siteId, employee: user?._id || siteId, inspectionType: 'FIRE_FIGHTING_EQUIPMENT_INSPECTION_REGISTER', status: 'Red', formPayload: {} },
        { date: '2026-09-03', time: '14:00', period: 'Afternoon', site: siteId, location: siteId, employee: user?._id || siteId, inspectionType: 'VEHICLES_FORKLIFT_DAILY_INSPECTION', status: 'Green', formPayload: {} },
      ];
      for (const record of dummyRecords) {
        await submitHealthSafetyInspection(record);
      }
      alert('Data seeded successfully!');
      loadData();
    } catch (err) {
      console.error('Failed to seed', err);
      alert('Failed to seed data. Check console.');
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredInspections = useMemo(() => {
    if (selectedSite === 'All') {
      return inspections;
    }
    return inspections.filter(i => {
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
    const compliantInspections = filteredInspections.filter(i => i.errors === 0).length;
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

        {/* Right: User / Logout */}
        <div className="flex items-center gap-2">
          
          <button 
            onClick={handleSeedData}
            disabled={isSeeding}
            className="flex flex-col items-center justify-center bg-teal-500 hover:bg-teal-600 text-white shadow-sm rounded-xl px-3 h-11 transition-colors disabled:opacity-50"
          >
            <Database className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-bold uppercase">{isSeeding ? 'Seeding...' : 'Seed'}</span>
          </button>

          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-teal-100 border border-white/80 shadow-sm flex items-center justify-center text-teal-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-[1.5px] border-white rounded-full"></span>
          </div>
          
          {/* Text Group */}
          <div className="flex flex-col">
            <span className="text-slate-600 font-semibold text-sm leading-tight tracking-wide">InspectMe</span>
            <span className="text-slate-900 font-bold text-[1.15rem] leading-tight">Analytics Dashboard</span>
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
            <h2 className="text-base font-bold text-slate-900">Inspection Volume by Type</h2>
          </div>

          <div className="divide-y divide-slate-200">
            {Object.keys(inspectionVolume).length > 0 ? (
              Object.entries(inspectionVolume).map(([type, count]) => (
                <button
                  key={type}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/40 active:bg-white/50 transition-colors text-left"
                >
                  {/* Thematic Icon */}
                  <div className="w-10 h-10 rounded-xl bg-white/60 border border-white/50 flex items-center justify-center shrink-0 shadow-sm">
                    {inspectionTypeIcons[type] || <DefaultInspectionIcon />}
                  </div>

                  {/* Title */}
                  <p className="flex-1 text-sm font-medium text-slate-900 truncate">{type}</p>

                  {/* Count Badge */}
                  <span className="text-sm font-bold text-slate-900 bg-white/80 border border-white/50 rounded-lg px-2.5 py-0.5 shadow-sm tabular-nums">
                    {count}
                  </span>

                  {/* Chevron */}
                  <svg className="w-4 h-4 text-slate-400 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ))
            ) : (
              <p className="px-5 py-4 text-sm text-slate-700">No inspections found for this site.</p>
            )}
          </div>

          <div className="px-5 py-3 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-700">
              Total inspections this period: {filteredInspections.length}
            </p>
          </div>
        </div>

      </main>

    </div>
  );
};

export default HealthSafetyAnalyticsDashboard;
