import React, { useState, useEffect } from 'react';

export default function SyncClockCard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    <div className="relative w-full max-w-[320px] mx-auto p-[3px] rounded-[2rem] overflow-hidden shadow-xl">
      
      {/* Spinning Conic Gradient Background */}
      <div 
        className="absolute inset-[-100%] animate-[spin_4s_linear_infinite]"
        style={{
          background: 'conic-gradient(from 0deg, #14b8a6, #2dd4bf, #f8fafc, #14b8a6)'
        }}
      />
      
      {/* Glassmorphic Inner Mask */}
      <div className="relative flex items-center justify-center w-full h-full rounded-[calc(2rem-3px)] bg-white/40 backdrop-blur-md px-6 py-8">
        
        {/* Tightened Inner Solid White Pill (Preserved Clock Face) */}
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
  );
}
