import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchLocations } from '../services/inspectionApi';
import { MapPin, ChevronLeft, Edit2, Trash2, Plus, Activity } from 'lucide-react';

export default function LocationListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract siteId from router state
  const siteId = location.state?.siteId;

  useEffect(() => {
    async function loadLocations() {
      if (!siteId) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchLocations(siteId);
        setLocations(data);
      } catch (err) {
        console.error('Error fetching locations', err);
      } finally {
        setLoading(false);
      }
    }
    loadLocations();
  }, [siteId]);

  return (
    <div className="w-full h-[100dvh] bg-transparent text-slate-900 overflow-hidden relative flex flex-col mx-auto select-none">
      
      {/* Global Scrollbar Nuke */}
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { overflow: hidden !important; touch-action: pan-y; }
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      ` }} />

      {/* Flush Header */}
      <header className="w-full px-4 pt-3 pb-4 bg-white/40 backdrop-blur-xl border-b border-white/50 flex items-center shrink-0 rounded-none z-10 shadow-sm gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white/60 border border-white/80 shadow-sm flex items-center justify-center text-slate-700 hover:bg-white/80 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-sm font-extrabold text-slate-900 leading-tight">Locations</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Manage Site Assets</p>
        </div>
      </header>
      
      {/* Main Scrollable View */}
      <main className="flex-1 overflow-y-auto w-full p-3 space-y-3 pb-32 z-0">
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Activity className="w-6 h-6 text-teal-500 animate-spin" />
          </div>
        ) : locations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm font-medium">
            No locations found for this site.
          </div>
        ) : (
          locations.map(loc => (
            <div 
              key={loc._id}
              className="p-3 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 flex items-center justify-between shadow-sm transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100/80 flex items-center justify-center text-orange-600 shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">{loc.locationName}</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{loc.inspectionType || 'Location'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button className="w-8 h-8 rounded-lg bg-white/50 border border-white/60 shadow-sm flex items-center justify-center text-blue-600 hover:bg-white/80 active:scale-95 transition-all">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button className="w-8 h-8 rounded-lg bg-white/50 border border-white/60 shadow-sm flex items-center justify-center text-rose-600 hover:bg-white/80 active:scale-95 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

      </main>

      {/* Sticky Bottom Action */}
      <div className="absolute bottom-6 left-0 w-full px-4 pointer-events-none z-10 flex justify-center">
        <button className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-500/90 hover:bg-teal-600 text-white shadow-[0_8px_20px_rgba(20,184,166,0.3)] backdrop-blur-xl border border-teal-400/50 active:scale-95 transition-all w-full max-w-sm justify-center">
          <Plus className="w-5 h-5" />
          <span className="text-sm font-bold tracking-wide">ADD NEW LOCATION</span>
        </button>
      </div>
      
    </div>
  );
}

