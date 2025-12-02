import React from 'react';
import { AppMode } from '../types';
import { getCyclePhase, getOvulationDay, addDays, formatDateFr } from '../utils/dateUtils';

interface DynamicInfoWidgetProps {
  mode: AppMode;
  cycleDay: number;
  cycleLength: number;
  pregnancyWeek: number;
  lastPeriodDate?: Date; // Ajout de la date pour le calcul calendaire
}

const DynamicInfoWidget: React.FC<DynamicInfoWidgetProps> = ({ mode, cycleDay, cycleLength, pregnancyWeek, lastPeriodDate }) => {

  // --- LOGIQUE GROSSESSE ---
  const getBabyInfo = (week: number) => {
    if (week < 4) return { fruit: 'Graine de pavot', size: '1 mm', weight: '< 1g', icon: '🌱' };
    if (week < 8) return { fruit: 'Myrtille', size: '1.3 cm', weight: '1g', icon: '🫐' };
    if (week < 12) return { fruit: 'Citron vert', size: '5 cm', weight: '14g', icon: '🍋' };
    if (week < 16) return { fruit: 'Avocat', size: '11 cm', weight: '100g', icon: '🥑' };
    if (week < 20) return { fruit: 'Banane', size: '16 cm', weight: '300g', icon: '🍌' };
    if (week < 24) return { fruit: 'Maïs', size: '30 cm', weight: '600g', icon: '🌽' };
    if (week < 28) return { fruit: 'Aubergine', size: '38 cm', weight: '1 kg', icon: '🍆' };
    if (week < 32) return { fruit: 'Chou', size: '42 cm', weight: '1.7 kg', icon: '🥬' };
    if (week < 36) return { fruit: 'Melon', size: '47 cm', weight: '2.6 kg', icon: '🍈' };
    return { fruit: 'Pastèque', size: '50+ cm', weight: '3.3+ kg', icon: '🍉' };
  };

  // --- RENDER ---
  if (mode === AppMode.PREGNANCY) {
    const info = getBabyInfo(pregnancyWeek);
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-white/50 animate-float mt-4 mx-2">
        <div className="flex items-center gap-4">
          <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-inner">
            {info.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">Votre bébé cette semaine</h4>
            <p className="text-xl font-bold text-teal-700">{info.fruit}</p>
            <div className="flex gap-3 mt-1 text-xs text-slate-600 font-medium">
              <span className="bg-teal-50 px-2 py-1 rounded-md border border-teal-100">📏 Env. {info.size}</span>
              <span className="bg-teal-50 px-2 py-1 rounded-md border border-teal-100">⚖️ Env. {info.weight}</span>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // MODE CYCLE
    const info = getCyclePhase(cycleDay, cycleLength);
    const gradient = cycleDay <= 5 ? 'from-rose-400 to-rose-600' // Menstruation
      : cycleDay < (cycleLength - 14) ? 'from-green-400 to-teal-500' // Follicular
      : cycleDay <= (cycleLength - 14) ? 'from-purple-400 to-indigo-600' // Ovulation
      : 'from-orange-300 to-amber-500'; // Luteal

    // Calcul date ovulation probable
    let ovulationDateStr = '';
    if (lastPeriodDate) {
        const ovulationDayIndex = getOvulationDay(cycleLength);
        // lastPeriodDate est jour 1, donc on ajoute ovulationDayIndex - 1
        const ovulationDate = addDays(lastPeriodDate, ovulationDayIndex - 1);
        ovulationDateStr = formatDateFr(ovulationDate);
    }

    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-white/50 mt-4 mx-2">
         <div className="flex items-start justify-between">
           <div className="flex-1">
              <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">Phase du cycle</h4>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{info.icon}</span>
                <p className="text-lg font-bold text-slate-800">{info.phase}</p>
              </div>
              <p className="text-sm text-slate-600 leading-snug mb-3">{info.description}</p>
              
              {ovulationDateStr && (
                <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-1.5 mt-1">
                    <span className="text-xs font-bold text-purple-400 uppercase">Ovulation probable</span>
                    <span className="text-sm font-bold text-purple-700">{ovulationDateStr}</span>
                </div>
              )}
           </div>
           {/* Mini visual indicator */}
           <div className={`w-2 h-16 rounded-full bg-gradient-to-b ${gradient} shadow-lg opacity-80 ml-2`}></div>
         </div>
      </div>
    );
  }
};

export default DynamicInfoWidget;