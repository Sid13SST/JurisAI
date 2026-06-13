import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  iconSize?: number;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  showText = true, 
  iconSize = 32 
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* SVG Icon */}
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Shield Outline */}
        <path 
          d="M50 85C50 85 82 70 82 40V22L50 10L18 22V40C18 70 50 85 50 85Z" 
          stroke="url(#logo-gradient)" 
          strokeWidth="5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="drop-shadow-md"
        />

        {/* Justice Scale Beam */}
        <path 
          d="M32 42H68" 
          stroke="url(#logo-gradient)" 
          strokeWidth="4" 
          strokeLinecap="round" 
        />

        {/* Justice Scale Pillars/Chains */}
        <path 
          d="M32 42L25 58H39L32 42Z" 
          stroke="url(#logo-gradient)" 
          strokeWidth="3" 
          strokeLinejoin="round" 
        />
        <path 
          d="M68 42L61 58H75L68 42Z" 
          stroke="url(#logo-gradient)" 
          strokeWidth="3" 
          strokeLinejoin="round" 
        />

        {/* Scale Central Stand & Pedestal */}
        <path 
          d="M50 25V66M40 70H60" 
          stroke="url(#logo-gradient)" 
          strokeWidth="4" 
          strokeLinecap="round" 
        />

        {/* AI Circuit Nodes (Circuits connecting to the shield and scales) */}
        <circle cx="50" cy="25" r="4.5" fill="#06B6D4" filter="url(#logo-glow)" />
        <circle cx="32" cy="42" r="3.5" fill="#7C3AED" />
        <circle cx="68" cy="42" r="3.5" fill="#7C3AED" />
        <circle cx="50" cy="66" r="4.5" fill="#4F46E5" />

        {/* Connection circuit paths */}
        <path 
          d="M50 25L32 42" 
          stroke="url(#logo-gradient)" 
          strokeWidth="1.5" 
          strokeDasharray="2 2" 
        />
        <path 
          d="M50 25L68 42" 
          stroke="url(#logo-gradient)" 
          strokeWidth="1.5" 
          strokeDasharray="2 2" 
        />
      </svg>

      {/* Brand Text */}
      {showText && (
        <span className="font-heading font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center">
          Juris<span className="bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] bg-clip-text text-transparent">AI</span>
        </span>
      )}
    </div>
  );
};
