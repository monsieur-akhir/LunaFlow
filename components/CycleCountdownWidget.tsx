
import React from 'react';
import { getNextCycleEvent, formatDateFr } from '../utils/dateUtils';

interface CycleCountdownWidgetProps {
  lastPeriodDate: Date;
  cycleLength: number;
}

const CycleCountdownWidget: React.FC<CycleCountdownWidgetProps> = ({ lastPeriodDate, cycleLength }) => {
  const nextEvent = getNextCycleEvent(lastPeriodDate, cycleLength);

  return (
    <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 mt-4 relative overflow-hidden group hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="text-2xl animate-pulse">{nextEvent.icon}</span>
             <h3 className={`text-lg font-bold ${nextEvent.color}`}>{nextEvent.title}</h3>
           </div>
           
           <div className="text-slate-600">
             {nextEvent.daysLeft === 0 ? (
               <span className="font-bold text-xl">Aujourd'hui !</span>
             ) : (
               <div className="flex items-baseline gap-1">
                 <span className="text-sm font-medium">Dans</span>
                 <span className="text-3xl font-bold text-slate-800">{nextEvent.daysLeft}</span>
                 <span className="text-sm font-medium">jours</span>
               </div>
             )}
           </div>

           <p className="text-xs text-slate-400 mt-1 font-medium bg-slate-50 px-2 py-1 rounded-lg inline-block border border-slate-100">
              📅 {formatDateFr(nextEvent.date)}
           </p>
        </div>

        {/* Visual Timer Circle (Simple CSS) */}
        <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full rotate-[-90deg]">
               <circle className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="28" cx="32" cy="32"/>
               <circle 
                  className={nextEvent.color.replace('text-', 'text-opacity-80 text-')} 
                  strokeWidth="6" 
                  strokeDasharray={175}
                  strokeDashoffset={175 - (175 * (Math.max(1, 14 - nextEvent.daysLeft) / 14))} // Assuming max 14 days relevant view
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="28" cx="32" cy="32"
               />
            </svg>
            <span className="absolute text-xs font-bold text-slate-400">⏳</span>
        </div>
      </div>
    </div>
  );
};

export default CycleCountdownWidget;
