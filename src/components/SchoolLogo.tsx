/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '../lib/utils';

interface SchoolLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'light' | 'dark' | 'color';
}

export const SchoolLogo = ({ className, size = 48, variant = 'color' }: SchoolLogoProps) => {
  return (
    <div 
      className={cn("relative flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Main Circle */}
        <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" className={cn(
          variant === 'light' ? "text-white" : variant === 'dark' ? "text-slate-900" : "text-indigo-600"
        )} />
        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />

        {/* Text along path */}
        <defs>
          <path id="circlePath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
        </defs>
        <text className="text-[7px] font-bold uppercase tracking-[0.2em] fill-current">
          <textPath xlinkHref="#circlePath" startOffset="0%">
            SHULE YA SEKONDARI MIYOMBONI 
          </textPath>
        </text>

        {/* Central Emblems */}
        <g className="opacity-80">
          {/* Open Book */}
          <path 
            d="M50 75L35 68V48L50 55L65 48V68L50 75Z" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinejoin="round"
          />
          <path d="M50 55V75" stroke="currentColor" strokeWidth="1" />
          
          {/* Torch */}
          <path d="M50 45V25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M45 28C45 28 47 22 50 20C53 22 55 28 55 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Ball (Soccer) */}
          <circle cx="72" cy="40" r="8" stroke="currentColor" strokeWidth="1" />
          <path d="M68 36L76 44M76 36L68 44" stroke="currentColor" strokeWidth="0.5" />
          
          {/* Pens */}
          <path d="M28 40L35 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M32 42L40 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Inner Details */}
        <circle cx="50" cy="50" r="2" fill="currentColor" opacity="0.1" />
      </svg>
      
      {/* Fallback image if user provides one in static path */}
      <img 
        src="/logo.png" 
        alt="Miyomboni Secondary School Logo"
        className="absolute inset-0 w-full h-full object-contain opacity-0 hover:opacity-100 transition-opacity"
        onError={(e) => (e.currentTarget.style.display = 'none')}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
