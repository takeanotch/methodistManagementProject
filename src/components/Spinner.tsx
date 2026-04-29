// components/Spinner.tsx
'use client';

import React from 'react';

export const Spinner = () => {
  return (
   <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border  rounded-full border-gray-300 border-t-black animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-light">Chargement...</p>
        </div>
      </div>
  );
};