import React, { useEffect, useState } from 'react';

interface CircularTrackerProps {
  progress: number; // 0 to 100
  total: number;
  current: number;
  label: string;
  subLabel: string;
  color: 'pink' | 'purple' | 'teal' | 'red' | 'blue' | 'orange';
  icon?: React.ReactNode;
}

const CircularTracker: React.FC<CircularTrackerProps> = ({ 
  progress, 
  total, 
  current, 
  label, 
  subLabel, 
  color,
  icon 
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animationFinished, setAnimationFinished] = useState(false);
  
  const radius = 120;
  const stroke = 15;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    // Reset animation state when target progress changes significantly
    setAnimationFinished(false);
    
    // Start the fill animation
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);

    // Trigger the "breathing" pulse effect after the fill transition is roughly done
    const finishTimer = setTimeout(() => {
      setAnimationFinished(true);
    }, 1600); // 1.5s transition + 100ms delay

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [progress]);

  // Mapping des couleurs vers des codes RGB pour l'animation de l'ombre (CSS variable)
  const colorMap = {
    pink: '236, 72, 153',   // pink-500
    purple: '168, 85, 247', // purple-500
    teal: '20, 184, 166',   // teal-500
    red: '244, 63, 94',     // rose-500
    blue: '14, 165, 233',   // sky-500
    orange: '245, 158, 11', // amber-500
  };

  const colorClasses = {
    pink: 'text-pink-500 stroke-pink-500',
    purple: 'text-purple-500 stroke-purple-500',
    teal: 'text-teal-500 stroke-teal-500',
    red: 'text-rose-500 stroke-rose-500',
    blue: 'text-sky-500 stroke-sky-500',
    orange: 'text-amber-500 stroke-amber-500',
  };

  const bgClasses = {
    pink: 'stroke-pink-100',
    purple: 'stroke-purple-100',
    teal: 'stroke-teal-100',
    red: 'stroke-rose-100',
    blue: 'stroke-sky-100',
    orange: 'stroke-amber-100',
  };

  return (
    <div className="relative flex items-center justify-center p-4 animate-float">
      {/* Inline styles for custom animations that Tailwind doesn't handle easily with dynamic colors */}
      <style>{`
        @keyframes breathe {
          0%, 100% { 
            filter: drop-shadow(0 0 4px rgba(var(--shadow-color), 0.4)); 
          }
          50% { 
            filter: drop-shadow(0 0 15px rgba(var(--shadow-color), 0.7)); 
          }
        }
        .circle-progress {
          transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .circle-breathing {
          animation: breathe 3s infinite ease-in-out;
        }
      `}</style>

      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg]"
        style={{ 
          '--shadow-color': colorMap[color] 
        } as React.CSSProperties}
      >
        {/* Background Circle */}
        <circle
          className={bgClasses[color]}
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        
        {/* Progress Circle */}
        <circle
          className={`
            ${colorClasses[color]} 
            circle-progress 
            ${animationFinished ? 'circle-breathing' : ''}
          `}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      
      {/* Center Text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        {icon && <div className="mb-2 text-3xl animate-bounce">{icon}</div>}
        <span className={`text-4xl font-bold ${colorClasses[color].split(' ')[0]} transition-all duration-500`}>
          {current}
        </span>
        <span className="text-slate-400 text-sm font-medium uppercase tracking-wider mt-1">
          {label}
        </span>
        <span className="text-slate-500 text-xs mt-1">
          {subLabel}
        </span>
      </div>
    </div>
  );
};

export default CircularTracker;