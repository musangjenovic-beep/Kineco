import React from 'react';

interface MasomoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const MasomoLogo: React.FC<MasomoLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 'w-8 h-8', text: 'text-base', sub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  // Pure modern open book logo - no background box, clean monochrome black / dark:white
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${currentSize.icon} text-slate-950 dark:text-white shrink-0`}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Central spine curve */}
        <path d="M24 10 L24 38" />

        {/* Left page contour */}
        <path d="M24 12 C18 9 10 9 6 12 L6 36 C10 33 18 33 24 36" fill="currentColor" fillOpacity="0.08" />
        
        {/* Right page contour */}
        <path d="M24 12 C30 9 38 9 42 12 L42 36 C38 33 30 33 24 36" fill="currentColor" fillOpacity="0.08" />

        {/* Left page lines */}
        <path d="M10 18 C14 16.5 18 16.5 21 17.5" strokeWidth="1.8" />
        <path d="M10 23 C14 21.5 18 21.5 21 22.5" strokeWidth="1.8" />
        <path d="M10 28 C14 26.5 18 26.5 21 27.5" strokeWidth="1.8" />

        {/* Right page lines */}
        <path d="M27 17.5 C30 16.5 34 16.5 38 18" strokeWidth="1.8" />
        <path d="M27 22.5 C30 21.5 34 21.5 38 23" strokeWidth="1.8" />
        <path d="M27 27.5 C30 26.5 34 26.5 38 28" strokeWidth="1.8" />

        {/* Bottom spine curve */}
        <path d="M6 36 C12 39 18 39 24 38 C30 39 36 39 42 36" strokeWidth="2.2" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-black tracking-tight text-slate-900 dark:text-white ${currentSize.text}`}>
            Masomo
          </span>
          <span className={`font-medium text-slate-500 dark:text-slate-400 ${currentSize.sub}`}>
            Plateforme Scolaire RDC
          </span>
        </div>
      )}
    </div>
  );
};
