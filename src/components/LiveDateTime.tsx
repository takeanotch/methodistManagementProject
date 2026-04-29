// components/LiveDateTime.tsx
'use client';

import { useState, useEffect } from 'react';

export default function LiveDateTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="inline-flex  items-baseline gap-6 font-mono text-neutral-800">
      {/* Time */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono font-light tracking-tight tabular-nums">
          {formatTime(dateTime)}
        </span>
        <span className="text-sm font-mono font-normal uppercase tracking-wider text-neutral-400">
          UTC+2
        </span>
      </div>

      {/* Separator */}
      <span className="text-2xl font-thin text-neutral-300">—</span>

      {/* Date with icon */}
      <div className="flex items-center gap-3">
        <svg 
          className="h-4 w-4 text-neutral-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={1.5}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" 
          />
        </svg>
        <span className="text-md font-mo font-light capitalize tracking-wide">
          {formatDate(dateTime)}
        </span>
      </div>
    </div>
  );
}