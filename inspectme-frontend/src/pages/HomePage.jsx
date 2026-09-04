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
  Activity
} from 'lucide-react';
import { useAuth } from '../store/authContext';
import { fetchSites, fetchLocations, fetchHealthSafetyInspections } from '../services/inspectionApi';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
          if (!i.site) return false;
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


    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);



  const getSmartRingStyle = () => {
    if (!selectedSiteId || complianceScore === null) {
      return {
        background: 'conic-gradient(from 0deg, #cbd5e1, #f8fafc, #cbd5e1)',
        animationDuration: '4s'
      };
    }
    if (complianceScore < 50) {
      return {
        background: 'conic-gradient(from 0deg, #ef4444, #fca5a5, #ef4444)',
        animationDuration: '1.5s'
      };
    }
    if (complianceScore < 80) {
      return {
        background: 'conic-gradient(from 0deg, #f59e0b, #fde047, #f59e0b)',
        animationDuration: '3s'
      };
    }
    return {
      background: 'conic-gradient(from 0deg, #10b981, #67e8f9, #10b981)',
      animationDuration: '4s'
    };
  };

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
        <div className="mb-4">
          <SyncClockCard />
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
          {/* Smart Routable Compliance Block with Animated Ring */}
          <div 
            onClick={
              selectedSiteId 
                ? () => navigate('/inspections/health-safety', { state: { siteId: selectedSiteId } }) 
                : undefined
            }
            className={`relative p-3 rounded-2xl bg-white/40 backdrop-blur-xl flex flex-col justify-between transition-all ${
              selectedSiteId 
                ? 'cursor-pointer hover:bg-white/50 active:scale-[0.98]' 
                : 'cursor-not-allowed opacity-60'
            } ${
              selectedSiteId && complianceScore < 50 
                ? 'shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                : 'shadow-sm'
            }`}
          >
            {/* Animated Gradient Border */}
            <div 
              className="absolute inset-0 rounded-2xl p-[2px] pointer-events-none"
              style={{
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude'
              }}
            >
              <div 
                className="absolute inset-[-100%] animate-spin"
                style={getSmartRingStyle()}
              />
            </div>

            {/* Card Content */}
            <div className="relative z-10 flex flex-col justify-between h-full">
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