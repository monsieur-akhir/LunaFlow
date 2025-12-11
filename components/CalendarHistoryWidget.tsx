
import React, { useState, useMemo } from 'react';
import { DailyLog, UserSettings, AppMode } from '../types';
import { getMonthGrid, isSameDay, getOvulationDay, formatDateFr, getCycleDay, diffDays } from '../utils/dateUtils';

interface CalendarHistoryWidgetProps {
  logs: DailyLog[];
  settings: UserSettings;
  onUpdateLog: (date: string, updates: Partial<DailyLog>) => void;
}

interface CycleSummary {
  startDate: string;
  endDate: string;
  length: number;
  topSymptoms: string[];
  dominantMood: string;
  periodDuration: number; // Jours de saignements
}

const CalendarHistoryWidget: React.FC<CalendarHistoryWidgetProps> = ({ logs, settings, onUpdateLog }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<'calendar' | 'list' | 'stats'>('calendar');

  const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Helper to find log for a specific day
  const getLogForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return logs.find(l => l.date === dateStr);
  };

  // --- LOGIC: ANALYSE DES CYCLES ---
  const pastCycles = useMemo(() => {
    // 1. Sort logs by date ascending
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 2. Identify Cycle Starts (First day of flow after a gap)
    const cycleStarts: number[] = []; // Indices in sortedLogs
    
    sortedLogs.forEach((log, index) => {
        if (log.flow) {
            // Check previous day
            const prevLog = sortedLogs[index - 1];
            if (!prevLog) {
                cycleStarts.push(index);
            } else {
                const dayDiff = diffDays(new Date(log.date), new Date(prevLog.date));
                // Si le log précédent date de plus de 10 jours, c'est un nouveau cycle
                // Simplification : Gap de > 10 jours entre deux logs de flow = nouveau cycle
                let isNewCycle = true;
                
                // Look back a few logs to see if belongs to same period
                for (let i = 1; i <= 5; i++) {
                   if (sortedLogs[index - i]) {
                       const d = diffDays(new Date(log.date), new Date(sortedLogs[index - i].date));
                       if (d < 10 && sortedLogs[index - i].flow) {
                           isNewCycle = false;
                           break;
                       }
                   }
                }
                
                if (isNewCycle) cycleStarts.push(index);
            }
        }
    });

    // 3. Construct Cycles
    const cycles: CycleSummary[] = [];
    
    for (let i = 0; i < cycleStarts.length; i++) {
        const startIndex = cycleStarts[i];
        const nextStartIndex = cycleStarts[i + 1]; // Can be undefined if it's the current cycle

        // Si pas de prochain cycle, c'est le cycle en cours
        if (!nextStartIndex) continue;

        const startDate = sortedLogs[startIndex].date;
        const endDate = sortedLogs[nextStartIndex].date; // Date of next period start
        const length = diffDays(new Date(endDate), new Date(startDate));

        // Gather logs within this range
        const cycleLogs = sortedLogs.slice(startIndex, nextStartIndex);

        // Analyze Symptoms
        const symptomsCount: Record<string, number> = {};
        const moodCount: Record<string, number> = {};
        let flowDays = 0;

        cycleLogs.forEach(l => {
            if (l.flow) flowDays++;
            l.symptoms.forEach(s => symptomsCount[s] = (symptomsCount[s] || 0) + 1);
            if (l.mood) moodCount[l.mood] = (moodCount[l.mood] || 0) + 1;
        });

        const topSymptoms = Object.entries(symptomsCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);

        const dominantMood = Object.entries(moodCount)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutre';

        cycles.push({
            startDate,
            endDate,
            length,
            topSymptoms,
            dominantMood,
            periodDuration: flowDays
        });
    }

    return cycles.reverse(); // Most recent first
  }, [logs]);


  // Helper to determine status (Predicted vs Actual)
  const getDayStatus = (date: Date) => {
    if (settings.mode === AppMode.PREGNANCY) return {};

    const log = getLogForDay(date);
    const cycleDay = getCycleDay(settings.lastPeriodDate, date);
    // Cycle math modulo cycleLength
    const normalizedDay = ((cycleDay - 1) % settings.cycleLength) + 1;
    
    // 1. ACTUAL (Logged)
    if (log?.flow) {
       switch(log.flow) {
           case 'light': return { type: 'period', color: 'bg-rose-300 text-white' };
           case 'medium': return { type: 'period', color: 'bg-rose-400 text-white' };
           case 'heavy': return { type: 'period', color: 'bg-rose-600 text-white shadow-md shadow-rose-200' };
           default: return { type: 'period', color: 'bg-rose-500 text-white' };
       }
    }
    if (log?.sexualActivity) return { type: 'sex', color: 'bg-pink-100 text-pink-600 border border-pink-300' };

    // 2. PREDICTED (Math) - Only show for future or if no log exists
    // Predicted Period (approx last 4 days or first 4 days of cycle)
    if (normalizedDay <= 4 || normalizedDay > settings.cycleLength - 2) {
      return { type: 'period-predicted', color: 'bg-rose-50 text-rose-400 dashed-border border border-rose-200 border-dashed' };
    }

    // Predicted Ovulation
    const ovulationDay = getOvulationDay(settings.cycleLength);
    if (normalizedDay === ovulationDay) return { type: 'ovulation', color: 'bg-purple-100 text-purple-700 ring-1 ring-purple-300' };

    // Predicted Fertile
    if (normalizedDay >= ovulationDay - 5 && normalizedDay < ovulationDay) {
      return { type: 'fertile', color: 'bg-teal-50 text-teal-600' };
    }

    return {};
  };

  const renderCalendar = () => {
    const grid = getMonthGrid(currentMonth);
    const lastCycle = pastCycles.length > 0 ? pastCycles[0] : null;

    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-7 mb-2">
          {daysOfWeek.map(d => (
            <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((date, i) => {
            if (!date) return <div key={i} className="aspect-square"></div>;

            const isToday = isSameDay(date, new Date());
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const status = getDayStatus(date);
            const log = getLogForDay(date);

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square rounded-full flex flex-col items-center justify-center relative transition-all duration-200
                  ${isSelected ? 'ring-2 ring-slate-800 scale-95 z-10' : ''}
                  ${isToday && !isSelected ? 'ring-1 ring-slate-300' : ''}
                  ${status.color || 'hover:bg-slate-100'}
                `}
              >
                <span className={`text-xs font-medium ${isToday ? 'font-bold' : ''}`}>
                  {date.getDate()}
                </span>
                
                {/* Dots indicators for logs */}
                <div className="flex gap-0.5 mt-0.5">
                   {log?.symptoms.length ? <div className="w-1 h-1 rounded-full bg-indigo-400"></div> : null}
                   {log?.mood ? <div className="w-1 h-1 rounded-full bg-yellow-400"></div> : null}
                </div>
              </button>
            );
          })}
        </div>
        
        {/* CALENDAR LEGEND */}
        {settings.mode === AppMode.CYCLE && (
          <div className="mt-4 flex flex-wrap gap-3 justify-center text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Règles</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full border border-rose-400 border-dashed bg-rose-50"></span>
              <span>Prévues</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-50 border border-teal-200"></span>
              <span>Fertile</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-100 border border-purple-300"></span>
              <span>Ovulation</span>
            </div>
          </div>
        )}

        {/* PREVIOUS CYCLE SUMMARY */}
        {lastCycle && settings.mode === AppMode.CYCLE && (
            <div className="mt-4 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-4 border border-indigo-100 shadow-sm relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-2 relative z-10">
                    <h4 className="text-xs font-bold uppercase text-indigo-900 tracking-wider">Dernier Cycle Terminé</h4>
                    <button 
                        onClick={() => setView('stats')} 
                        className="text-[10px] bg-white px-2 py-1 rounded-lg border border-indigo-100 text-indigo-600 font-bold hover:bg-indigo-50 transition"
                    >
                        Comparer
                    </button>
                 </div>

                 <div className="flex gap-4 relative z-10 items-end">
                     <div>
                         <span className="text-2xl font-bold text-slate-700">{lastCycle.length}</span>
                         <span className="text-xs text-slate-500 font-medium ml-1">jours</span>
                     </div>
                     <div className="w-px h-8 bg-indigo-200/50"></div>
                     <div>
                         <span className="text-2xl font-bold text-rose-500">{lastCycle.periodDuration}</span>
                         <span className="text-xs text-rose-400 font-medium ml-1">j règles</span>
                     </div>
                     <div className="flex-1 text-right">
                         {lastCycle.topSymptoms.length > 0 && (
                            <span className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-500">
                                {lastCycle.topSymptoms[0]}
                            </span>
                         )}
                     </div>
                 </div>

                 <p className="text-[10px] text-slate-400 mt-2 relative z-10 font-medium">
                    {new Date(lastCycle.startDate).toLocaleDateString('fr-FR', {day: 'numeric', month:'short'})} - {new Date(lastCycle.endDate).toLocaleDateString('fr-FR', {day: 'numeric', month:'short'})}
                 </p>
                 
                 <div className="absolute -right-2 -bottom-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                     🔄
                 </div>
            </div>
        )}
      </div>
    );
  };

  const renderList = () => {
    // Sort logs descending
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 animate-fade-in custom-scrollbar">
            {sortedLogs.length === 0 && <p className="text-center text-slate-400 py-4">Aucun historique pour le moment.</p>}
            {sortedLogs.map(log => (
                <div key={log.date} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-3">
                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-center min-w-[50px]">
                        <span className="block text-xs text-slate-500 uppercase">{new Date(log.date).toLocaleString('fr-FR', {month:'short'})}</span>
                        <span className="block text-xl font-bold text-slate-700">{new Date(log.date).getDate()}</span>
                    </div>
                    <div>
                        <div className="flex flex-wrap gap-2 mb-1">
                            {log.flow && <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">Règles ({log.flow === 'medium' ? 'Moyen' : log.flow === 'heavy' ? 'Abondant' : 'Léger'})</span>}
                            {log.sexualActivity && <span className="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-bold">❤️ Rapport</span>}
                        </div>
                        <p className="text-xs text-slate-600">
                           {log.mood && `Humeur: ${log.mood}. `}
                           {log.symptoms.length > 0 && `Symptômes: ${log.symptoms.join(', ')}.`}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
  };

  const renderStats = () => {
    if (pastCycles.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 animate-fade-in">
                <p className="text-4xl mb-2">📊</p>
                <p className="text-sm">Pas encore assez de données pour analyser les cycles complets.</p>
                <p className="text-xs mt-2 text-slate-400">Continuez à enregistrer vos règles pour voir apparaître vos statistiques.</p>
            </div>
        )
    }

    const avgLength = Math.round(pastCycles.reduce((acc, c) => acc + c.length, 0) / pastCycles.length);

    return (
        <div className="space-y-4 animate-slide-up max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {/* Header Stats */}
            <div className="bg-gradient-to-r from-indigo-50 to-pink-50 rounded-2xl p-4 flex justify-between items-center border border-indigo-100">
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Moyenne Cycle</p>
                    <p className="text-2xl font-bold text-indigo-900">{avgLength} Jours</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold">Cycles analysés</p>
                    <p className="text-2xl font-bold text-pink-600">{pastCycles.length}</p>
                </div>
            </div>

            {/* Cycle List */}
            {pastCycles.map((cycle, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                         <div className="flex flex-col">
                             <span className="text-xs text-slate-400 font-bold uppercase">Cycle {pastCycles.length - i}</span>
                             <span className="font-bold text-slate-700">
                                 {new Date(cycle.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short'})} 
                                 {' - '} 
                                 {new Date(cycle.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short'})}
                             </span>
                         </div>
                         <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                             Math.abs(cycle.length - settings.cycleLength) > 5 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                         }`}>
                             {cycle.length} jours
                         </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                        {cycle.dominantMood && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg border border-slate-200">
                                🧠 {cycle.dominantMood}
                            </span>
                        )}
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded-lg border border-rose-100">
                            🩸 {cycle.periodDuration}j de règles
                        </span>
                        {cycle.topSymptoms.map(s => (
                            <span key={s} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100">
                                {s}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const renderDetailsPanel = () => {
      if(!selectedDate) return null;
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      const log = logs.find(l => l.date === dateStr) || {
          date: dateStr,
          symptoms: [],
          mood: '',
          sexualActivity: false,
          contraceptiveTaken: false,
          libido: 'medium' as const,
          flow: null
      };

      const flowOptions: { id: 'light' | 'medium' | 'heavy' | null, label: string, icon: string }[] = [
        { id: null, label: 'Rien', icon: '❌' },
        { id: 'light', label: 'Léger', icon: '💧' },
        { id: 'medium', label: 'Moyen', icon: '💧💧' },
        { id: 'heavy', label: 'Abondant', icon: '🩸' }
      ];

      return (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-slide-up">
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex justify-between items-center">
                  <span>{formatDateFr(selectedDate)}</span>
                  <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                      {settings.mode === AppMode.CYCLE ? `Jour ${getCycleDay(settings.lastPeriodDate, selectedDate)}` : ''}
                  </span>
              </h4>

              {/* FLUX MENSTRUEL SELECTOR */}
              <div className="mb-4">
                 <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Flux Menstruel (Début/Fin)</p>
                 <div className="flex gap-2">
                    {flowOptions.map((opt) => {
                        const isSelected = log.flow === opt.id;
                        let activeClass = '';
                        if (isSelected) {
                            if (opt.id === 'light') activeClass = 'bg-rose-300 text-white border-rose-300 shadow-md';
                            else if (opt.id === 'medium') activeClass = 'bg-rose-400 text-white border-rose-400 shadow-md';
                            else if (opt.id === 'heavy') activeClass = 'bg-rose-500 text-white border-rose-500 shadow-md';
                            else activeClass = 'bg-slate-800 text-white border-slate-800 shadow-md';
                        } else {
                            activeClass = 'bg-white border-slate-200 text-slate-500 hover:border-slate-300';
                        }

                        return (
                            <button
                                key={opt.label}
                                onClick={() => onUpdateLog(dateStr, { flow: opt.id })}
                                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${activeClass}`}
                            >
                                <span className="text-lg">{opt.icon}</span>
                                <span>{opt.label}</span>
                            </button>
                        );
                    })}
                 </div>
              </div>

              {/* SEXUAL ACTIVITY & SYMPTOMS SUMMARY */}
              <div className="flex gap-2">
                  <button 
                    onClick={() => onUpdateLog(dateStr, { sexualActivity: !log.sexualActivity })}
                    className={`flex-1 px-4 py-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        log.sexualActivity 
                        ? 'bg-pink-500 border-pink-600 text-white shadow-lg shadow-pink-200' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-pink-300'
                    }`}
                  >
                      <span className="text-lg">❤️</span>
                      <span>Rapport {log.sexualActivity ? 'enregistré' : '?'}</span>
                  </button>
                  
                  {/* Summary Box */}
                  <div className="flex-[1.5] bg-slate-50 rounded-xl p-3 text-xs text-slate-500 border border-slate-100 flex items-center">
                     {log.symptoms.length === 0 && !log.mood ? (
                         <span className="italic text-slate-400 w-full text-center">Aucun autre symptôme.</span>
                     ) : (
                         <div className="space-y-1 w-full">
                             {log.mood && <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> <strong>{log.mood}</strong></div>}
                             {log.symptoms.length > 0 && <div className="flex flex-wrap gap-1">
                                {log.symptoms.map(s => <span key={s} className="bg-white border border-slate-200 px-1.5 rounded text-[10px]">{s}</span>)}
                             </div>}
                         </div>
                     )}
                  </div>
              </div>
          </div>
      )
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl p-6 border border-slate-100">
      
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-6">
         <h3 className="text-lg font-bold text-slate-700 capitalize">
             {view === 'calendar' ? monthName : view === 'list' ? 'Historique' : 'Analyse Cycles'}
         </h3>
         
         <div className="flex bg-slate-100 p-1 rounded-full">
             <button 
                onClick={() => setView('calendar')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${view === 'calendar' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                title="Calendrier"
             >
                 🗓️
             </button>
             <button 
                onClick={() => setView('list')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${view === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                title="Liste"
             >
                 📋
             </button>
             <button 
                onClick={() => setView('stats')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${view === 'stats' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                title="Analyse"
             >
                 📊
             </button>
         </div>
      </div>

      {view === 'calendar' && (
          <>
            <div className="flex justify-between mb-4 px-2">
                <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500">‹</button>
                <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500">›</button>
            </div>
            {renderCalendar()}
            {renderDetailsPanel()}
          </>
      )}

      {view === 'list' && renderList()}
      
      {view === 'stats' && renderStats()}

    </div>
  );
};

export default CalendarHistoryWidget;
