
import { AdminStats, AdminUserSummary, AppMode, SYMPTOMS_LIST } from '../types';

/**
 * CLIENT-SIDE DATABASE SIMULATION
 * 
 * Cette couche remplace les appels API vers le backend Node.js (dossier /backend).
 * Elle utilise localStorage pour persister les données "Admin" afin que le dashboard
 * conserve son état entre les rechargements de page.
 */

const STORAGE_KEY = 'lunaflow_admin_db_v1';

// Générateur de fausses données initiales (Seed)
const generateInitialData = (): AdminUserSummary[] => {
  return [
    { id: '1', name: 'Sophie Martin', age: 29, mode: AppMode.CYCLE, status: 'active', lastActive: '2 min', cycleDayOrWeek: 14, symptomCountLastWeek: 3 },
    { id: '2', name: 'Julie Dubois', age: 34, mode: AppMode.PREGNANCY, status: 'active', lastActive: '1 heure', cycleDayOrWeek: 22, symptomCountLastWeek: 5 },
    { id: '3', name: 'Camille Bernard', age: 24, mode: AppMode.CYCLE, status: 'alert', lastActive: '3 jours', cycleDayOrWeek: 38, symptomCountLastWeek: 0 },
    { id: '4', name: 'Léa Petit', age: 31, mode: AppMode.CYCLE, status: 'active', lastActive: '5 heures', cycleDayOrWeek: 2, symptomCountLastWeek: 8 },
    { id: '5', name: 'Manon Leroy', age: 27, mode: AppMode.CYCLE, status: 'inactive', lastActive: '15 jours', cycleDayOrWeek: 10, symptomCountLastWeek: 0 },
    { id: '6', name: 'Chloé Garcia', age: 38, mode: AppMode.PREGNANCY, status: 'active', lastActive: '1 jour', cycleDayOrWeek: 12, symptomCountLastWeek: 2 },
    { id: '7', name: 'Emma Moreau', age: 22, mode: AppMode.CYCLE, status: 'active', lastActive: '10 min', cycleDayOrWeek: 27, symptomCountLastWeek: 4 },
    { id: '8', name: 'Alice Fournier', age: 33, mode: AppMode.CYCLE, status: 'alert', lastActive: '1 jour', cycleDayOrWeek: 45, symptomCountLastWeek: 1 },
    // Ajoutons quelques profils supplémentaires pour le réalisme
    { id: '9', name: 'Nina K.', age: 26, mode: AppMode.CYCLE, status: 'active', lastActive: 'Maintenant', cycleDayOrWeek: 5, symptomCountLastWeek: 2 },
    { id: '10', name: 'Sarah B.', age: 41, mode: AppMode.PREGNANCY, status: 'active', lastActive: '2 jours', cycleDayOrWeek: 34, symptomCountLastWeek: 6 },
  ];
};

// Récupération (ou initialisation) des données
const getStoredUsers = (): AdminUserSummary[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const initial = generateInitialData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
};

// --- API METHODS SIMULATED ---

export const fetchAdminStats = async (): Promise<AdminStats> => {
  // Simule la latence réseau
  await new Promise(resolve => setTimeout(resolve, 600));

  const users = getStoredUsers();

  // Calcul dynamique des stats basé sur les données "stockées"
  const totalUsers = 1200 + users.length; // Base fictive + nos utilisateurs mockés
  const activePregnancies = users.filter(u => u.mode === AppMode.PREGNANCY).length + 180;
  const tryingToConceive = 340; // Valeur statique pour l'exemple
  const alertsTriggered = users.filter(u => u.status === 'alert').length;

  const stats: AdminStats = {
    totalUsers,
    activePregnancies,
    tryingToConceive,
    alertsTriggered,
    symptomDistribution: {}
  };

  // Génération aléatoire stable pour les symptômes
  SYMPTOMS_LIST.forEach(s => {
    // Utilise le nom du symptôme pour générer un nombre pseudo-aléatoire mais constant
    const seed = s.charCodeAt(0) + s.charCodeAt(1); 
    stats.symptomDistribution[s] = Math.floor(seed * 2.5) + 50;
  });

  return stats;
};

export const fetchUserList = async (): Promise<AdminUserSummary[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return getStoredUsers();
};
