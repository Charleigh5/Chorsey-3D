
import React from 'react';
import { CubeIcon } from './icons';

export const ScenePlaceholder: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-0 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center justify-center overflow-hidden p-8">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(55, 65, 81, 0.5)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Gradient Glow */}
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -top-1/4 -right-1/4 w-2/3 h-2/3 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center text-gray-400">
        <CubeIcon className="w-24 h-24 text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-300">3D Home Environment</h2>
        <p className="mt-2 max-w-sm">
          This is where the interactive 3D model of your home will be displayed. Select tasks from the list to see their location highlighted here.
        </p>
      </div>
    </div>
  );
};
