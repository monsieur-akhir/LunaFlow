import React from 'react';
import { getFertilityStatus, addDays } from '../utils/dateUtils';

interface FertilityForecastWidgetProps {
  lastPeriodDate: Date;
  cycleLength: number;
}

const FertilityForecastWidget: React.FC<FertilityForecastWidgetProps> = ({ lastPeriodDate, cycleLength }) => {
  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const getStatusStyle = (status: 'low' | 'high' | 'peak') => {
    switch (status) {
      case 'peak': return 'bg-purple-500 text-white shadow-purple-200 shadow-lg scale-105';
      case 'high': return 'bg-teal-400 text-white shadow-teal-100';
      default: return 'bg-slate-50 text-slate-400 border border-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 mt-6">
      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <span>📅</span> Prévisions Fertilité (7 jours)
      </h3>
      
      <div className="flex justify-between gap-2 overflow-x-auto pb-2 no-scrollbar">
        {nextDays.map((date, i) => {
          const { status } = getFertilityStatus(lastPeriodDate, cycleLength, date);
          const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date);
          const dayNum = date.getDate();
          const isToday = i === 0;

          return (
            <div 
              key={i} 
              className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[50px] transition-all ${getStatusStyle(status)} ${isToday ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
            >
              <span className="text-[10px] font-bold uppercase opacity-80">{dayName}</span>
              <span className="text-lg font-bold">{dayNum}</span>
              <div className="mt-1">
                {status === 'peak' && <span className="text-[10px]">⭐</span>}
                {status === 'high' && <span className="text-[10px]">🌸</span>}
                {status === 'low' && <span className="text-[10px] opacity-0">.</span>}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end gap-3 mt-2 text-[10px] text-slate-400 font-medium px-1">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-400"></div> Fertile</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Ovulation</span>
      </div>
    </div>
  );
};

export default FertilityForecastWidget;