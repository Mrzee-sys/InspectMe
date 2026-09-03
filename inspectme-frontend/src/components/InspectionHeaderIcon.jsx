export default function InspectionHeaderIcon() {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/30 backdrop-blur-md">
      <svg
        className="h-6 w-6 text-teal-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Clipboard Base */}
        <rect x="5" y="4" width="14" height="18" rx="2" className="text-slate-700/80" fill="currentColor" fillOpacity="0.05" />
        
        {/* Clipboard Clip */}
        <path d="M9 4v-.5a1.5 1.5 0 0 1 3-3h0a1.5 1.5 0 0 1 3 3V4" className="text-teal-600" />

        {/* Animated Checkmark */}
        <path 
          d="M9 12l2 2 4-4" 
          className="text-teal-500 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" 
          strokeWidth="2.2" 
        />

        {/* Audit Lines */}
        <line x1="9" y1="16" x2="14" y2="16" stroke="currentColor" strokeOpacity="0.4" />
      </svg>

      {/* Subtle background glow ring */}
      <div className="absolute inset-0 rounded-xl bg-teal-400/20 animate-ping opacity-25 pointer-events-none" />
    </div>
  );
}

