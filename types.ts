export enum AppMode {
  CYCLE = 'CYCLE',
  PREGNANCY = 'PREGNANCY'
}

export interface UserSettings {
  mode: AppMode;
  lastPeriodDate: Date;
  cycleLength: number; // in days, default 28
  pregnancyDueDate: Date | null;
  name: string;
  age?: number;
  partnerName?: string;
  relationshipStatus?: 'single' | 'couple' | 'married';
  hasChildren?: boolean;
  isTryingToConceive: boolean;
  tryingDuration?: string; // ex: "6 mois"
  usesContraception: boolean;
  pairingCode: string; // Code unique pour le partage
  isConnectedToPartner: boolean;
  hasCompletedOnboarding: boolean;
  // New Security & Prefs fields
  pinCode?: string; // Si défini, l'app demande le code au lancement
  enableNotifications: boolean;
}

export interface MedicalData {
  betaHCG: number | null; // mIU/mL
  lastHCGDate: string | null;
  nextEchoDate: string | null;
  folicAcidTaken: boolean;
}

export interface DailyLog {
  date: string; // ISO string YYYY-MM-DD
  symptoms: string[];
  mood: string;
  flow?: 'light' | 'medium' | 'heavy' | null;
  sexualActivity: boolean; // Rapport sexuel
  contraceptiveTaken: boolean; // Pilule prise
  libido: 'low' | 'medium' | 'high'; // Niveau de désir
}

export interface InsightData {
  title: string;
  content: string;
}

// --- ADMIN / DASHBOARD TYPES ---

export interface AdminUserSummary {
  id: string;
  name: string;
  age: number;
  mode: AppMode;
  status: 'active' | 'inactive' | 'alert'; // alert = retard important ou problème
  lastActive: string;
  cycleDayOrWeek: number; // J-X ou S-Y
  symptomCountLastWeek: number;
}

export interface AdminStats {
  totalUsers: number;
  activePregnancies: number;
  tryingToConceive: number;
  alertsTriggered: number; // Retards > 7 jours non déclarés grossesse
  symptomDistribution: Record<string, number>;
}

export const SYMPTOMS_LIST = [
  'Crampes', 'Maux de tête', 'Fatigue', 'Nausées', 'Ballonnements', 
  'Acné', 'Seins sensibles', 'Fringales', 'Insomnie'
];

export const MOODS_LIST = [
  'Heureuse', 'Triste', 'Irritable', 'Anxieuse', 'Énergique', 'Calme', 'Romantique'
];