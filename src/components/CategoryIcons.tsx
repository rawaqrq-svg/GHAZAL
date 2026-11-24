import React from 'react';

// Common visual standards: Consistent 1.75 stroke width, viewBox 0 0 24 24, Ghazal brand pink and rose hues.

export function PerfumeIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor" 
      strokeWidth={1.75} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Spray Mist */}
      <path d="M19.5 4.5l.5-.5M17 3l.5-.5M21 7l.5-.5" stroke="#E6007E" strokeWidth={2} />
      {/* Atomizer / Cap */}
      <rect x="9.5" y="3" width="5" height="3" rx="1" fill="#FADAE6" stroke="#E6007E" />
      <path d="M12 6v2" stroke="#E6007E" />
      <path d="M10 8h4" stroke="#E6007E" />
      {/* Perfume Bottle Body */}
      <path 
        d="M6 10.5C6 9.67 6.67 9 7.5 9h9c.83 0 1.5.67 1.5 1.5v8.5a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3v-8.5z" 
        fill="#FFF0F5" 
        stroke="#E6007E" 
      />
      {/* Liquid Level & Label */}
      <path d="M8.5 14h7" stroke="#E6007E" strokeDasharray="1 2" />
      <rect x="9" y="12" width="6" height="5" rx="1" fill="#FADAE6" stroke="#E6007E" />
      <circle cx="12" cy="14.5" r="1" fill="#E6007E" />
    </svg>
  );
}

export function HaircareIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor" 
      strokeWidth={1.75} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Styling Comb */}
      <path d="M4 6h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" fill="#FADAE6" stroke="#E6007E" />
      {/* Comb Teeth */}
      <path d="M6 10v4M9 10v4M12 10v4M15 10v4M18 10v4" stroke="#E6007E" />
      {/* Flowing Silky Hair Waves */}
      <path d="M5 16c2 1.5 3 3 5 1.5s3-1.5 5 0 3 2.5 5 1.5" stroke="#E6007E" strokeWidth={2} />
      {/* Care Drop */}
      <path d="M12 18.5a2 2 0 0 0 2 2c1.1 0 2-.9 2-2 0-1.2-2-3-2-3s-2 1.8-2 3z" fill="#E6007E" stroke="#E6007E" />
    </svg>
  );
}

export function SkincareIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor" 
      strokeWidth={1.75} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Pipette / Dropper Top */}
      <rect x="10.5" y="2" width="3" height="3" rx="1.5" fill="#E6007E" stroke="#E6007E" />
      <path d="M12 5v2" stroke="#E6007E" />
      <rect x="9.5" y="7" width="5" height="2" rx="0.5" fill="#FADAE6" stroke="#E6007E" />
      {/* Serum Bottle */}
      <rect x="7" y="9" width="10" height="12" rx="3" fill="#FFF0F5" stroke="#E6007E" />
      {/* Natural Botanic Leaf */}
      <path d="M12 12c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5c0-1.5-.5-2.5-2.5-2.5 1.5 0 2.5-1 2.5-2.5z" fill="#FADAE6" stroke="#E6007E" />
      {/* Essence Drop */}
      <circle cx="12" cy="18" r="1" fill="#E6007E" />
    </svg>
  );
}

export function MakeupIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor" 
      strokeWidth={1.75} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Lipstick Bullet (Slanted Tip) */}
      <path d="M9 7.5L13.5 3c.8-.8 2.2-.2 2.2 1v5.5H9v-2z" fill="#E6007E" stroke="#E6007E" />
      {/* Inner Metal Collar */}
      <rect x="8.5" y="9.5" width="7" height="3.5" fill="#FADAE6" stroke="#E6007E" />
      {/* Lipstick Case / Body */}
      <rect x="7.5" y="13" width="9" height="8.5" rx="1.5" fill="#1A1A1A" stroke="#1A1A1A" />
      <line x1="7.5" y1="16.5" x2="16.5" y2="16.5" stroke="#E6007E" strokeWidth={1.5} />
    </svg>
  );
}

export function AccessoriesIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor" 
      strokeWidth={1.75} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Gemstone Top */}
      <path d="M9 3h6l3 4-6 5-6-5 3-4z" fill="#FADAE6" stroke="#E6007E" />
      <path d="M9 3l3 9 3-9M6 7h12" stroke="#E6007E" strokeWidth={1.2} />
      {/* Golden Ring Band */}
      <ellipse cx="12" cy="15.5" rx="6.5" ry="5.5" stroke="#E6007E" strokeWidth={2} fill="none" />
      <circle cx="12" cy="12" r="1.5" fill="#E6007E" />
    </svg>
  );
}

export function ToolsIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor" 
      strokeWidth={1.75} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Angled Powder Brush */}
      <path d="M14 12l6.5-6.5a1.5 1.5 0 0 0-2.1-2.1L12 10" stroke="#1A1A1A" strokeWidth={2} />
      <path d="M12 10l2 2" stroke="#E6007E" strokeWidth={2} />
      {/* Fluffy Bristles */}
      <path d="M12 10c-1.5.5-3.5 1.5-4.5 3.5s-.5 4.5 1.5 5.5 4.5.5 5.5-1.5 1-3.5-.5-5.5z" fill="#FADAE6" stroke="#E6007E" />
      {/* Precision Blender Puff */}
      <path d="M4.5 19.5a2.5 2.5 0 0 1 0-3.5l3-3a2.5 2.5 0 0 1 3.5 3.5l-3 3a2.5 2.5 0 0 1-3.5 0z" fill="#FFF0F5" stroke="#E6007E" />
    </svg>
  );
}

export function OffersIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor" 
      strokeWidth={1.75} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Gift Box Base */}
      <rect x="4" y="11" width="16" height="10" rx="2" fill="#FFF0F5" stroke="#E6007E" />
      {/* Gift Box Lid */}
      <rect x="3" y="8" width="18" height="3.5" rx="1" fill="#FADAE6" stroke="#E6007E" />
      {/* Vertical Ribbon */}
      <rect x="10.5" y="8" width="3" height="13" fill="#E6007E" stroke="#E6007E" />
      {/* Satin Bow */}
      <path d="M12 8c-1.5-2.5-4-3-5-2s-1 3.5 1.5 4c2.5.5 3.5-2 3.5-2z" fill="#FADAE6" stroke="#E6007E" />
      <path d="M12 8c1.5-2.5 4-3 5-2s1 3.5-1.5 4c-2.5.5-3.5-2-3.5-2z" fill="#FADAE6" stroke="#E6007E" />
      <circle cx="12" cy="8" r="1.5" fill="#E6007E" />
    </svg>
  );
}

export function FaceCareIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor" 
      strokeWidth={1.75} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Face Contour Oval */}
      <path d="M12 3C7 3 5 7 5 13c0 4.5 3 8 7 8s7-3.5 7-8c0-6-2-10-7-10z" fill="#FFF0F5" stroke="#E6007E" />
      {/* Sparkles of glow */}
      <path d="M12 7v2M18 6l-1 1M6 6l1 1" stroke="#E6007E" strokeWidth={1.5} />
      {/* Peaceful closed eyes */}
      <path d="M8.5 13c.8.8 2 .8 2.8 0M12.7 13c.8.8 2 .8 2.8 0" stroke="#E6007E" strokeWidth={1.5} />
      {/* Gentle smile */}
      <path d="M10 17c1 1 3 1 4 0" stroke="#E6007E" strokeWidth={1.5} />
    </svg>
  );
}

export function DeodorantsIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      stroke="currentColor" 
      strokeWidth={1.75} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Roll-on Sphere Top */}
      <ellipse cx="12" cy="6" rx="4" ry="3" fill="#FADAE6" stroke="#E6007E" />
      {/* Neck Collar */}
      <rect x="7.5" y="7" width="9" height="2.5" rx="0.5" fill="#FFF0F5" stroke="#E6007E" />
      {/* Bottle Body */}
      <path d="M7 9.5h10l-1 10.5a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L7 9.5z" fill="#FFF0F5" stroke="#E6007E" />
      {/* Freshness Wave / Breeze Lines */}
      <path d="M9.5 14c1.5 1 3.5-1 5 0" stroke="#E6007E" strokeWidth={1.5} />
      <path d="M10 17c1 .7 2.5-.7 4 0" stroke="#E6007E" strokeWidth={1.5} />
    </svg>
  );
}
