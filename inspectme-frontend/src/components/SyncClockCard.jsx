import React, { useState, useEffect } from 'react';

export default function SyncClockCard({ ringGradient }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString('en-CA'); 
  const dayOfWeek = time.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const timeString = time.toLocaleTimeString('en-GB', { hour12: false }); 

  // Fallback to the standard Emerald/Cyan if no site is selected
  const activeGradient = ringGradient || 'conic-gradient(from 0deg, #eab308, #22c55e, #06b6d4, #eab308)';

  return (
    /* Outer Boundary */
    <div className="relative overflow-hidden rounded-[2rem] p-[2px] w-full shadow-lg">
      
      {/* Dynamic Spinning Gradient */}
      <div 
        className="absolute inset-[-150%] animate-[spin_4s_linear_infinite]" 
        style={{ background: activeGradient }}
      />
      
      {/* HIGH OPACITY MASK: bg-slate-400/95 blocks the gradient bleed */}
      <div className="relative z-10 flex flex-col items-center justify-center rounded-[calc(2rem-2px)] bg-slate-400/95 backdrop-blur-xl p-3 sm:p-4 w-full h-full border border-white/20">
        
        {/* Solid White Inner Content Block */}
        <div className="bg-white rounded-[1.25rem] w-full py-6 flex flex-col items-center justify-center shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 tracking-widest mb-2">
            {formattedDate} {dayOfWeek}
          </p>
          <h1 className="text-5xl font-black text-slate-800 tracking-widest mb-1 font-mono drop-shadow-sm">
            {timeString}
          </h1>
          <p className="text-[8px] font-bold text-slate-400 tracking-[0.2em] mt-1 uppercase">
            InspectMe Sync Time
          </p>
        </div>

      </div>
    </div>
  );
}