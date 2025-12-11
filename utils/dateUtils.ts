

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

export const getDelayDays = (lastPeriod: Date, cycleLength: number): number => {
  const currentDay = getCycleDay(lastPeriod);
  if (currentDay > cycleLength) {
    return currentDay - cycleLength;
  }
  return 0;
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
  
  // Si retard important, la fertilité n'est plus calculable standard (probablement 0 ou ovulation tardive)
  if (currentDay > cycleLength) return { status: 'low', label: 'Retard de règles' };

  // Si le jour est négatif (avant les dernières règles), on ne calcule pas
  if (currentDay < 1) return { status: 'low', label: '' };

  const dayInCycle = currentDay; // Pas de modulo ici, on veut le vrai jour du cycle en cours

  const ovulationDay = getOvulationDay(cycleLength);
  
  if (dayInCycle === ovulationDay) return { status: 'peak', label: 'Ovulation (Max)' };
  if (dayInCycle >= ovulationDay - 5 && dayInCycle < ovulationDay) return { status: 'high', label: 'Fertilité Élevée' };
  return { status: 'low', label: 'Fertilité Faible' };
};

export const getCyclePhase = (day: number, cycleLength: number): { phase: string, description: string, icon: string, color: 'red' | 'blue' | 'purple' | 'orange' } => {
  const ovulationDay = getOvulationDay(cycleLength);
  
  if (day > cycleLength) {
     return {
         phase: 'Retard',
         description: 'Fin de cycle dépassée. Possibilité de grossesse ou décalage.',
         icon: '⚠️',
         color: 'red'
     };
  }

  if (day <= 5) {
    return { 
      phase: 'Menstruations', 
      description: 'Niveau d\'énergie bas. Prenez du temps pour vous reposer.',
      icon: '🩸',
      color: 'red'
    };
  } else if (day < ovulationDay - 5) {
    return { 
      phase: 'Phase Folliculaire', 
      description: 'L\'énergie remonte ! L\'œstrogène augmente, vous vous sentez dynamique.',
      icon: '🌱',
      color: 'blue'
    };
  } else if (day <= ovulationDay) {
    return { 
      phase: 'Fenêtre Fertile', 
      description: 'Pic de libido et d\'énergie. Moment idéal pour concevoir.',
      icon: '🌸',
      color: 'purple'
    };
  } else {
    return { 
      phase: 'Phase Lutéale', 
      description: 'La progestérone domine. Humeur plus calme, cocooning recommandé.',
      icon: '🌙',
      color: 'orange'
    };
  }
};

export const getNextCycleEvent = (lastPeriod: Date, cycleLength: number): { title: string; daysLeft: number; date: Date; icon: string; color: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normaliser aujourd'hui à minuit

  const lp = new Date(lastPeriod);
  lp.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lp.getTime();
  const currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const ovulationDay = getOvulationDay(cycleLength);
  const fertileStartDay = ovulationDay - 5;
  
  // Dates absolues pour ce cycle spécifique
  const fertileStartDate = addDays(lp, fertileStartDay - 1);
  const ovulationDate = addDays(lp, ovulationDay - 1);
  const nextPeriodDate = addDays(lp, cycleLength); 

  // 1. Retard
  if (currentDay > cycleLength) {
      const lateDays = currentDay - cycleLength;
      return { title: "Retard", daysLeft: lateDays, date: today, icon: "⚠️", color: "text-rose-600" };
  }

  // 2. Avant la fenêtre fertile
  if (currentDay < fertileStartDay) {
    const dLeft = diffDays(fertileStartDate, today);
    return { title: "Période Fertile", daysLeft: dLeft, date: fertileStartDate, icon: "🌱", color: "text-teal-500" };
  }
  
  // 3. Pendant la fenêtre fertile mais avant l'ovulation
  if (currentDay < ovulationDay) {
    const dLeft = diffDays(ovulationDate, today);
    return { title: "Ovulation", daysLeft: dLeft, date: ovulationDate, icon: "🥚", color: "text-purple-500" };
  }

  // 4. Jour de l'ovulation
  if (currentDay === ovulationDay) {
    return { title: "Ovulation", daysLeft: 0, date: ovulationDate, icon: "✨", color: "text-purple-600" };
  }

  // 5. Après l'ovulation -> Prochaines règles
  const dLeft = diffDays(nextPeriodDate, today);
  return { title: "Prochaines Règles", daysLeft: dLeft, date: nextPeriodDate, icon: "🩸", color: "text-rose-500" };
};

export const getProjectedOvulationDate = (lastPeriod: Date, cycleLength: number): Date => {
  // Pour la projection, on reste simple : cycle théorique actuel
  // Même si retard, on projette sur le cycle théorique "suivant" ou "actuel"
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lp = new Date(lastPeriod);
  lp.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lp.getTime();
  const diffDaysTotal = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Calcule l'index du cycle actuel (0, 1, 2...) basé sur la durée théorique
  const cycleIndex = diffDaysTotal >= 0 ? Math.floor(diffDaysTotal / cycleLength) : 0;
  
  // Date de début du cycle théorique actuel
  const currentCycleStart = addDays(lp, cycleIndex * cycleLength);
  
  const ovulationDayIndex = getOvulationDay(cycleLength);
  
  return addDays(currentCycleStart, ovulationDayIndex - 1);
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