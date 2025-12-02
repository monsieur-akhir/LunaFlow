

export const diffDays = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatDateFr = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date);
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const getPregnancyWeek = (dueDate: Date): number => {
  const today = new Date();
  // Standard pregnancy is 40 weeks (280 days)
  const conceptionEstimated = addDays(dueDate, -280);
  const daysPassed = diffDays(today, conceptionEstimated);
  const weeks = Math.floor(daysPassed / 7);
  return Math.max(0, Math.min(42, weeks));
};

export const getCycleDay = (lastPeriod: Date, targetDate: Date = new Date()): number => {
  const diff = targetDate.getTime() - lastPeriod.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days + 1; // Day 1 is the start date
};

// --- NOUVELLES FONCTIONS DE FERTILITÉ ---

export const getOvulationDay = (cycleLength: number): number => {
  // L'ovulation se produit généralement 14 jours avant les prochaines règles
  return cycleLength - 14;
};

export const getFertileWindow = (lastPeriod: Date, cycleLength: number): { start: Date, end: Date, ovulation: Date } => {
  const ovulationDayIndex = getOvulationDay(cycleLength); 
  const ovulationDate = addDays(lastPeriod, ovulationDayIndex - 1); // -1 car jour 1 = lastPeriod
  
  // Fenêtre fertile : 5 jours avant ovulation + jour de l'ovulation
  const start = addDays(ovulationDate, -5);
  const end = addDays(ovulationDate, 1);

  return { start, end, ovulation: ovulationDate };
};

export const getFertilityStatus = (lastPeriod: Date, cycleLength: number, targetDate: Date = new Date()): { status: 'low' | 'high' | 'peak', label: string } => {
  const currentDay = getCycleDay(lastPeriod, targetDate);
  
  // Si le jour est négatif (avant les dernières règles), on ne calcule pas
  if (currentDay < 1) return { status: 'low', label: '' };

  // On module par la longueur du cycle pour gérer les cycles suivants (prévisionnel simple)
  const dayInCycle = ((currentDay - 1) % cycleLength) + 1;

  const ovulationDay = getOvulationDay(cycleLength);
  
  if (dayInCycle === ovulationDay) return { status: 'peak', label: 'Ovulation (Max)' };
  if (dayInCycle >= ovulationDay - 5 && dayInCycle < ovulationDay) return { status: 'high', label: 'Fertilité Élevée' };
  return { status: 'low', label: 'Fertilité Faible' };
};

export const getCyclePhase = (day: number, cycleLength: number): { phase: string, description: string, icon: string } => {
  // Normalize day for visual widget
  const normalizedDay = ((day - 1) % cycleLength) + 1;
  const ovulationDay = getOvulationDay(cycleLength);
  
  if (normalizedDay <= 5) {
    return { 
      phase: 'Menstruations', 
      description: 'Niveau d\'énergie bas. Prenez du temps pour vous reposer.',
      icon: '🩸' 
    };
  } else if (normalizedDay < ovulationDay - 5) {
    return { 
      phase: 'Phase Folliculaire', 
      description: 'L\'énergie remonte ! L\'œstrogène augmente, vous vous sentez dynamique.',
      icon: '🌱' 
    };
  } else if (normalizedDay <= ovulationDay) {
    return { 
      phase: 'Fenêtre Fertile', 
      description: 'Pic de libido et d\'énergie. Moment idéal pour concevoir.',
      icon: '🌸' 
    };
  } else {
    return { 
      phase: 'Phase Lutéale', 
      description: 'La progestérone domine. Humeur plus calme, cocooning recommandé.',
      icon: '🌙' 
    };
  }
};

export const getNextCycleEvent = (lastPeriod: Date, cycleLength: number): { title: string; daysLeft: number; date: Date; icon: string; color: string } => {
  const today = new Date();
  const currentCycleDay = getCycleDay(lastPeriod, today);
  const normalizedDay = ((currentCycleDay - 1) % cycleLength) + 1;
  
  const ovulationDay = getOvulationDay(cycleLength);
  const fertileStartDay = ovulationDay - 5;
  
  // Cibles
  const nextPeriodDate = addDays(lastPeriod, cycleLength);
  const ovulationDate = addDays(lastPeriod, ovulationDay - 1);
  const fertileStartDate = addDays(lastPeriod, fertileStartDay - 1);

  // 1. Avant fenêtre fertile
  if (normalizedDay < fertileStartDay) {
    const diff = diffDays(fertileStartDate, today);
    // Si c'est aujourd'hui ou demain
    if (diff <= 0) return { title: "Fenêtre Fertile", daysLeft: 0, date: fertileStartDate, icon: "🌸", color: "text-teal-500" };
    return { title: "Période Fertile", daysLeft: diff, date: fertileStartDate, icon: "🌱", color: "text-teal-500" };
  }
  
  // 2. Pendant fenêtre fertile mais avant ovulation
  if (normalizedDay >= fertileStartDay && normalizedDay < ovulationDay) {
    const diff = diffDays(ovulationDate, today);
    return { title: "Ovulation", daysLeft: diff, date: ovulationDate, icon: "🥚", color: "text-purple-500" };
  }

  // 3. Jour d'ovulation
  if (normalizedDay === ovulationDay) {
    return { title: "Ovulation", daysLeft: 0, date: ovulationDate, icon: "✨", color: "text-purple-600" };
  }

  // 4. Après ovulation (Phase lutéale) -> Prochaines règles
  // Si on a dépassé le cycleLength, c'est du retard ou un nouveau cycle non loggé, mais ici on vise la fin théorique
  let targetNextPeriod = nextPeriodDate;
  // Si on est déjà après la date théorique (retard), on vise demain pour dire "Retard" ou on garde la date
  const diff = Math.ceil((targetNextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff <= 0) {
     return { title: "Règles prévues", daysLeft: 0, date: targetNextPeriod, icon: "🩸", color: "text-rose-500" };
  }

  return { title: "Prochaines Règles", daysLeft: diff, date: targetNextPeriod, icon: "🩸", color: "text-rose-500" };
};

// --- CALENDAR HELPERS ---

export const getDaysInMonth = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  
  const result: Date[] = [];
  for (let i = 1; i <= days; i++) {
    result.push(new Date(year, month, i));
  }
  return result;
};

export const getMonthGrid = (date: Date): (Date | null)[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = getDaysInMonth(date);
  
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  // Adjust so 0 = Monday (Europe style)
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  
  const grid: (Date | null)[] = Array(startOffset).fill(null);
  return grid.concat(daysInMonth);
};
