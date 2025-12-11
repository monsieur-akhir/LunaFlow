const getDiffDays = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((new Date(date1) - new Date(date2)) / oneDay));
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Logique métier : Jour du cycle
const getCycleDay = (lastPeriodDate) => {
  if (!lastPeriodDate) return 1;
  const diff = new Date().getTime() - new Date(lastPeriodDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days + 1;
};

// Logique métier : Semaine de grossesse
const getPregnancyWeek = (dueDate) => {
  if (!dueDate) return 0;
  const today = new Date();
  const conceptionEstimated = addDays(dueDate, -280); // 40 semaines avant terme
  const daysPassed = getDiffDays(today, conceptionEstimated);
  const weeks = Math.floor(daysPassed / 7);
  return Math.max(0, Math.min(42, weeks));
};

// Logique métier : Retard
const getDelayDays = (lastPeriodDate, cycleLength) => {
  const currentDay = getCycleDay(lastPeriodDate);
  if (currentDay > cycleLength) {
    return currentDay - cycleLength;
  }
  return 0;
};

// Logique métier : Statut Fertilité
const getFertilityStatus = (lastPeriodDate, cycleLength) => {
  const currentDay = getCycleDay(lastPeriodDate);
  
  // Si retard, fertilité "inconnue/basse" car cycle anormal
  if (currentDay > cycleLength) return { status: 'low', label: 'Retard de règles' };

  // Ovulation estimée (14 jours avant la fin théorique)
  const ovulationDay = cycleLength - 14;
  
  if (currentDay === ovulationDay) return { status: 'peak', label: 'Ovulation (Max)' };
  if (currentDay >= ovulationDay - 5 && currentDay < ovulationDay) return { status: 'high', label: 'Fertilité Élevée' };
  
  return { status: 'low', label: 'Fertilité Faible' };
};

module.exports = {
  getCycleDay,
  getPregnancyWeek,
  getDelayDays,
  getFertilityStatus
};