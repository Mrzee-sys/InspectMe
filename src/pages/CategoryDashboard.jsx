import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export default function CategoryDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full bg-slate-950 p-4 pb-24 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400 mb-1">Category Dashboard</p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Choose Inspection Category</h1>
          <p className="text-xs text-slate-300 mt-1">Select a category to start a guided inspection flow.</p>
        </div>
        <div className="space-y-3">
          <div
            onClick={() => navigate('/inspections/health-safety')}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-500/50 rounded-2xl p-4 transition-all duration-300 cursor-pointer backdrop-blur-md flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Health & Safety</h3>
                <p className="text-[11px] text-slate-400">PPE, hazard control, emergency access</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div
            onClick={() => navigate('/inspections/risk')}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/50 rounded-2xl p-4 transition-all duration-300 cursor-pointer backdrop-blur-md flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Risk Inspections</h3>
                <p className="text-[11px] text-slate-400">Operational risk, escalations, mitigation</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
}
