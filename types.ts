
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
  hasCompletedOnboarding: boolean; // Nouveau flag
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

export const SYMPTOMS_LIST = [
  'Crampes', 'Maux de tête', 'Fatigue', 'Nausées', 'Ballonnements', 
  'Acné', 'Seins sensibles', 'Fringales', 'Insomnie'
];

export const MOODS_LIST = [
  'Heureuse', 'Triste', 'Irritable', 'Anxieuse', 'Énergique', 'Calme', 'Romantique'
];
