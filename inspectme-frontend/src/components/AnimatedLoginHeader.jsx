import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function AnimatedLoginHeader() {
  return (
    <div className="mb-8 flex items-center gap-5">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-400/20 to-teal-600/10 shadow-[inset_0_0_20px_rgba(20,184,166,0.3)] ring-1 ring-white/50 backdrop-blur-xl">
        
        {/* SVG Gradient definition */}
        <svg className="absolute w-0 h-0">
          <defs>
            <linearGradient id="solid-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>

        {/* Continuous rotating solid stroke ring */}
        <svg 
          className="absolute inset-0 h-full w-full animate-[spin_10s_linear_infinite]" 
          viewBox="0 0 36 36"
          fill="none"
        >
          <path
            className="text-white/10"
            stroke="currentColor"
            strokeWidth="3"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            stroke="url(#solid-ring-gradient)"
            strokeWidth="3"
            strokeDasharray="75, 25"
            strokeLinecap="round"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center p-3">
          <DotLottieReact
            src="/Ball%20playing.lottie"
            loop
            autoplay
          />
        </div>
      </div>

      <div className="flex flex-col">
        <h1 className="bg-gradient-to-br from-slate-900 to-teal-700 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          InspectMe
        </h1>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-600/90 mt-0.5">
          Secure Access
        </p>
      </div>
    </div>
  );
}
