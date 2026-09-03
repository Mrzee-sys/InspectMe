import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  WifiOff, 
  LayoutGrid, 
  ChevronRight, 
  MapPin,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '../store/authContext';
import { fetchSites, fetchLocations, fetchHealthSafetyInspections } from '../services/inspectionApi';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [locations, setLocations] = useState([]);
  
  // Real compliance state derived from Mongo
  const [complianceScore, setComplianceScore] = useState(null);

  useEffect(() => {
    async function loadSites() {
      try {
        const siteData = await fetchSites();
        setSites(siteData);
      } catch (err) {
        console.error('Error fetching sites', err);
      }
    }
    loadSites();
  }, []);

  useEffect(() => {
    async function loadLocationsAndCompliance() {
      if (!selectedSiteId) {
        setLocations([]);
        setComplianceScore(null);
        return;
      }
      try {
        const [locationData, inspectionsData] = await Promise.all([
          fetchLocations(selectedSiteId),
          fetchHealthSafetyInspections()
        ]);
        setLocations(locationData);
        
        // Filter inspections to this specific site
        const siteInspections = inspectionsData.filter(i => {
          const siteId = typeof i.site === 'object' ? i.site._id : i.site;
          return siteId === selectedSiteId;
        });

        if (siteInspections.length === 0) {
          setComplianceScore(0);
        } else {
          const greenCount = siteInspections.filter(i => i.status === 'Green').length;
          const score = Math.round((greenCount / siteInspections.length) * 100);
          setComplianceScore(score);
        }
      } catch (err) {
        console.error('Error fetching locations or compliance data', err);
      }
    }
    loadLocationsAndCompliance();
  }, [selectedSiteId]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  // Retro Digital Clock Formatting
  const year = currentTime.getFullYear();
  const month = String(currentTime.getMonth() + 1).padStart(2, '0');
  const day = String(currentTime.getDate()).padStart(2, '0');
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekDay = days[currentTime.getDay()];
  const digitalDate = `${year}-${month}-${day} ${weekDay}`;

  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');
  const digitalTime = `${hours}:${minutes}:${seconds}`;

  return (
    <div className="w-full h-[100dvh] bg-transparent text-slate-900 overflow-hidden relative flex flex-col mx-auto select-none">
      
      {/* Global Scrollbar Nuke & Custom Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { overflow: hidden !important; touch-action: pan-y; }
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        
        @keyframes stroke-chase {
          to { stroke-dashoffset: -200; }
        }
        .animate-stroke-chase {
          animation: stroke-chase 4s linear infinite;
        }
      ` }} />

      {/* Flush Header */}
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
      
      {/* Main Scrollable View */}
      <main className="flex-1 overflow-y-auto w-full p-3 space-y-4 pb-28 z-0">
        
        {/* 3D Layered Digital Clock with Animated Compliance Ring */}
        <div className="relative p-1.5 rounded-[2.5rem] bg-slate-400/20 shadow-[inset_0_4px_8px_rgba(0,0,0,0.1)] border border-white/20 backdrop-blur-md">
          
          {/* Glassmorphic Intermediate Layer */}
          <div className="relative p-4 rounded-[2.25rem] bg-white/20 shadow-[inset_0_2px_8px_rgba(255,255,255,0.4)] border border-white/30 flex items-center justify-center overflow-hidden backdrop-blur-lg">
            
            {/* SVG Animated Gradient Border */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#facc15" /> {/* yellow-400 */}
                  <stop offset="100%" stopColor="#14b8a6" /> {/* teal-500 */}
                </linearGradient>
              </defs>
              {/* Subtle Base Track */}
              <rect 
                x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="34" 
                fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" 
              />
              {/* Glowing Animated Progress Track */}
              <rect 
                x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="34" 
                fill="none" 
                stroke={selectedSiteId ? "url(#score-gradient)" : "transparent"} 
                strokeWidth="4" 
                pathLength="100"
                strokeDasharray={selectedSiteId && complianceScore ? `${complianceScore} ${100 - complianceScore}` : "100 0"}
                strokeLinecap="round"
                className="animate-stroke-chase"
                style={{ filter: 'drop-shadow(0 0 6px rgba(20,184,166,0.6))' }}
              />
            </svg>

            {/* Tightened Inner Solid White Pill */}
            <div className="px-6 py-4 w-full max-w-[240px] rounded-[1.75rem] bg-gradient-to-b from-white to-white/95 shadow-[0_10px_20px_rgba(0,0,0,0.1),0_2px_4px_rgba(255,255,255,1)_inset] border border-white flex flex-col items-center justify-center space-y-0.5 relative z-10">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white to-transparent pointer-events-none rounded-t-[1.75rem]" />
              
              <div className="text-[11px] text-teal-900 font-mono font-extrabold tracking-[0.2em] uppercase z-10 drop-shadow-sm">
                {digitalDate}
              </div>
              <div className="text-4xl font-black text-slate-800 font-mono tracking-[0.1em] z-10 drop-shadow-md">
                {digitalTime}
              </div>
              <div className="text-[7px] text-teal-800/60 font-mono font-extrabold tracking-widest uppercase z-10 mt-1">
                InspectMe Sync Time
              </div>
            </div>
          </div>
        </div>

        {/* Site Selector */}
        <div className="p-2 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 flex items-center space-x-2 shadow-sm">
          <span className="text-xs font-semibold text-slate-900 pl-2">Site:</span>
          <select 
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
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

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Smart Routable Compliance Block */}
          <div 
            onClick={
              selectedSiteId 
                ? () => navigate('/inspections/health-safety', { state: { siteId: selectedSiteId } }) 
                : undefined
            }
            className={`p-3 rounded-2xl bg-white/40 backdrop-blur-xl border flex flex-col justify-between transition-all ${
              selectedSiteId 
                ? 'cursor-pointer hover:bg-white/50 active:scale-[0.98]' 
                : 'cursor-not-allowed opacity-60'
            } ${
              selectedSiteId && complianceScore < 50 
                ? 'shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-400/60' 
                : 'shadow-sm border-white/50'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 shadow-sm ${
              selectedSiteId ? 'bg-blue-100/80 text-blue-600' : 'bg-slate-200/50 text-slate-400'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 leading-tight">Compliance Overview</p>
              <p className={`text-xl font-bold mt-0.5 ${
                !selectedSiteId 
                  ? 'text-slate-400' 
                  : complianceScore < 50 
                    ? 'text-red-600' 
                    : 'text-slate-900'
              }`}>
                {selectedSiteId ? `${complianceScore}%` : "-"}
              </p>
            </div>
          </div>
          
          {/* Location Block */}
          <div 
            onClick={
              selectedSiteId 
                ? () => navigate('/locations', { state: { siteId: selectedSiteId } }) 
                : undefined
            }
            className={`p-3 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 flex flex-col justify-between transition-all ${
              selectedSiteId 
                ? 'cursor-pointer hover:bg-white/50 active:scale-[0.98] shadow-sm' 
                : 'cursor-not-allowed opacity-60 shadow-sm'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 shadow-sm ${
              selectedSiteId ? 'bg-orange-100/80 text-orange-600' : 'bg-slate-200/50 text-slate-400'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 leading-tight">Locations</p>
              <p className={`text-xl font-bold mt-0.5 ${!selectedSiteId ? 'text-slate-400' : 'text-slate-900'}`}>
                {selectedSiteId ? locations.length : "0"} <span className="text-[9px] font-semibold text-slate-600">items</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div 
          onClick={() => navigate('/dashboard')}
          className="p-3 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 flex items-center justify-between cursor-pointer hover:bg-white/60 active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100/80 flex items-center justify-center text-teal-600 shadow-sm">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Start Inspection</h2>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">Select a category</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/60 border border-white/80 shadow-sm flex items-center justify-center text-slate-700">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

      </main>
    </div>
  );
}