import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SyncClockCard from '../components/SyncClockCard';
import { 
  User, 
  WifiOff, 
  LayoutGrid, 
  ChevronRight, 
  MapPin,
  Shield,
  Activity,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuth } from '../store/authContext';
import { useSite } from '../store/siteContext';
import { fetchSites, fetchLocations, fetchHealthSafetyInspections } from '../services/inspectionApi';

export default function HomePage() {
  const { user, logout } = useAuth();
  const { selectedSiteId, selectSite } = useSite();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [sites, setSites] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allInspections, setAllInspections] = useState([]);
  
  // Real calendar/sync state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // 1. Initial Load: Grab everything to feed the calendar and offline cache
  useEffect(() => {
    async function loadGlobalData() {
      try {
        const [siteData, inspectionsData] = await Promise.all([
          fetchSites(),
          fetchHealthSafetyInspections()
        ]);
        setSites(siteData);
        setAllInspections(inspectionsData);
        
        // TODO: Wire into syncService.js to get exact idb outbox count
      } catch (err) {
        console.error('Error fetching global data', err);
      }
    }
    loadGlobalData();
  }, []);

  // 2. Fetch locations when site changes
  useEffect(() => {
    if (!selectedSiteId) {
      setLocations([]);
      return;
    }
    fetchLocations(selectedSiteId).then(setLocations).catch(console.error);
  }, [selectedSiteId]);

  // 3. Network listeners for offline-first UI
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- DERIVED STATE ---
  // Filter inspections strictly for the selected site
  const currentSiteInspections = selectedSiteId 
    ? allInspections.filter(i => {
        if (!i.site) return false;
        const siteId = typeof i.site === 'object' ? i.site._id : i.site;
        return siteId === selectedSiteId;
      })
    : [];

  // Calculate compliance based on filtered site inspections
  const complianceScore = (() => {
    if (!selectedSiteId || currentSiteInspections.length === 0) return null;
    const greenCount = currentSiteInspections.filter(i => i.status === 'Green').length;
    return Math.round((greenCount / currentSiteInspections.length) * 100);
  })();

  const getSmartRingGradient = () => {
    if (!selectedSiteId || complianceScore === null) return 'conic-gradient(from 0deg, #cbd5e1, #f8fafc, #94a3b8, #cbd5e1)';
    if (complianceScore < 50) return 'conic-gradient(from 0deg, #ef4444, #f97316, #dc2626, #ef4444)';
    return 'conic-gradient(from 0deg, #eab308, #22c55e, #06b6d4, #eab308)';
  };

  // 4. Dynamic Calendar Generator - now strictly bound to currentSiteInspections
  const generateWeek = (baseDate) => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const dayInspections = currentSiteInspections.filter(ins => {
        const insDate = ins.date || ins.createdAt || new Date().toISOString();
        return insDate.includes(dateStr);
      });

      days.push({
        date: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        dayNum: d.getDate(),
        isToday: d.toDateString() === new Date().toDateString(),
        isSelected: d.toDateString() === baseDate.toDateString(),
        hasBooked: dayInspections.some(i => i.status === 'Pending' || i.status === 'Amber'),
        hasCompleted: dayInspections.some(i => i.status === 'Completed' || i.status === 'Green'),
      });
    }
    return days;
  };

  const weekDays = generateWeek(selectedDate);
  
  // Calculate summary for the selected day based on the active site
  const selectedDayDateStr = selectedDate.toISOString().split('T')[0];
  const selectedDayInspections = currentSiteInspections.filter(ins => {
    const insDate = ins.date || ins.createdAt || new Date().toISOString();
    return insDate.includes(selectedDayDateStr);
  });
  const completedToday = selectedDayInspections.filter(i => i.status === 'Completed' || i.status === 'Green').length;

  return (
    <div className="w-full h-[100dvh] bg-transparent text-slate-900 overflow-hidden relative flex flex-col mx-auto select-none">
      
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { overflow: hidden !important; touch-action: pan-y; }
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      ` }} />

      <header className="w-full px-4 py-4 bg-white/40 backdrop-blur-xl border-b border-white/50 flex items-center justify-between shrink-0 rounded-none z-10 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-teal-100/80 border border-white/50 flex items-center justify-center text-teal-600 shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Welcome Back</p>
            <h1 className="text-sm font-bold leading-tight text-slate-900">{user?.username || 'Inspector'}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isOnline && (
            <span className="flex items-center space-x-1 bg-rose-100/80 border border-white/50 text-rose-600 text-[10px] px-2 py-1 rounded-full font-medium shadow-sm">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </span>
          )}
          <button onClick={() => logout()} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center relative shadow-sm hover:bg-slate-300 transition-colors">
            <User className="w-4 h-4 text-slate-500" />
            {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-[1.5px] border-white" />}
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto w-full p-3 space-y-3 pb-28 z-0">
        
        <div className="mb-2">
          <SyncClockCard ringGradient={getSmartRingGradient()} />
        </div>

        <div className="p-2 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 flex items-center space-x-2 shadow-sm">
          <span className="text-xs font-semibold text-slate-900 pl-2">Site:</span>
          <select 
            value={selectedSiteId}
            onChange={(e) => selectSite(e.target.value)}
            className="w-full bg-white/50 border border-white/40 rounded-xl px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none shadow-sm font-medium"
          >
            <option value="">Select a site...</option>
            {sites.map(site => (
              <option key={site._id} value={site._id}>
                {site.siteCode} - {site.siteName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={
              selectedSiteId 
                ? () => navigate('/inspections/health-safety', { state: { siteId: selectedSiteId } }) 
                : undefined
            }
            className={`relative rounded-2xl p-[2px] overflow-hidden transition-transform h-28 ${
              selectedSiteId ? 'cursor-pointer active:scale-[0.98]' : 'cursor-not-allowed opacity-60'
            } ${selectedSiteId && (complianceScore !== null && complianceScore < 50) ? 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'shadow-sm'}`}
          >
            <div className="absolute inset-[-150%] animate-[spin_4s_linear_infinite]" style={{ background: getSmartRingGradient() }} />
            <div className="relative z-10 flex flex-col justify-between rounded-[calc(1rem-2px)] bg-slate-400/95 backdrop-blur-xl border border-white/20 p-2.5 h-full w-full">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 shadow-sm ${selectedSiteId ? 'bg-blue-100/90 text-blue-600' : 'bg-slate-200/50 text-slate-400'}`}>
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-wider leading-tight drop-shadow-sm ${!selectedSiteId ? 'text-slate-500' : 'text-slate-700'}`}>Compliance</p>
                <p className={`text-2xl font-black font-sans tracking-tight drop-shadow-sm mt-0.5 ${!selectedSiteId || complianceScore === null ? 'text-slate-400' : complianceScore < 50 ? 'text-red-600' : 'text-slate-900'}`}>
                  {selectedSiteId && complianceScore !== null ? `${complianceScore}%` : "-"}
                </p>
              </div>
            </div>
          </div>
          
          <div 
            onClick={
              selectedSiteId 
                ? () => navigate('/locations', { state: { siteId: selectedSiteId } }) 
                : undefined
            }
            className={`p-2.5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 flex flex-col justify-between transition-all h-28 ${
              selectedSiteId ? 'cursor-pointer hover:bg-white/50 active:scale-[0.98] shadow-sm' : 'cursor-not-allowed opacity-60 shadow-sm'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 shadow-sm ${selectedSiteId ? 'bg-orange-100/80 text-orange-600' : 'bg-slate-200/50 text-slate-400'}`}>
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 leading-tight">Locations</p>
              <p className={`text-2xl font-black mt-0.5 font-sans tracking-tight ${!selectedSiteId ? 'text-slate-400' : 'text-slate-900'}`}>
                {selectedSiteId ? locations.length : "0"} <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest">items</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full p-3 rounded-xl bg-white/40 backdrop-blur-xl border border-white/50 flex items-center justify-center space-x-2 cursor-pointer hover:bg-white/60 active:scale-[0.98] transition-all shadow-sm text-slate-800"
          >
            <LayoutGrid className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-widest">Start Inspection</span>
          </button>
        </div>

        {/* Real Data Calendar Mini-Strip */}
        <div className="p-3 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Schedule</span>
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase">{selectedDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
          </div>

          <div className="flex justify-between items-center mb-2 px-1">
            {weekDays.map((day, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedDate(day.date)}
                className={`flex flex-col items-center justify-center w-8 h-10 rounded-lg cursor-pointer transition-all ${
                  day.isSelected 
                    ? 'bg-teal-500 text-white shadow-md scale-110' 
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                <span className="text-[8px] font-bold">{day.dayName}</span>
                <span className={`text-xs font-black ${day.isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {day.dayNum}
                </span>
                <div className="flex space-x-0.5 mt-0.5 min-h-[4px]">
                  {day.hasBooked && <div className={`w-1 h-1 rounded-full ${day.isSelected ? 'bg-white' : 'bg-blue-400'}`} />}
                  {day.hasCompleted && <div className={`w-1 h-1 rounded-full ${day.isSelected ? 'bg-teal-200' : 'bg-green-400'}`} />}
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Summary Panel */}
          <div className="bg-white/50 border border-white/60 rounded-xl p-2.5 flex items-center justify-between cursor-pointer hover:bg-white/70 transition-colors">
            <div className="flex items-center space-x-2">
              {completedToday > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400" />
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-800">
                  {!selectedSiteId 
                    ? 'Select a site to view schedule' 
                    : selectedDayInspections.length === 0 
                      ? 'No Inspections Scheduled' 
                      : `${completedToday} of ${selectedDayInspections.length} Completed`}
                </p>
                <p className="text-[9px] font-medium text-slate-500">
                  {!selectedSiteId ? '-' : pendingSyncCount > 0 ? `${pendingSyncCount} pending sync` : 'All data synced'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

      </main>
    </div>
  );
}