import { DailyLog, UserSettings } from '../types';

export const exportToCSV = (logs: DailyLog[], settings: UserSettings) => {
  // 1. Définir les en-têtes
  const headers = ['Date', 'Flux', 'Humeur', 'Symptômes', 'Libido', 'Rapport Sexuel', 'Contraception'];
  
  // 2. Transformer les logs en lignes CSV
  const rows = logs.map(log => [
    log.date,
    log.flow || '',
    log.mood || '',
    log.symptoms.join('; '), // Point-virgule pour séparer la liste dans une cellule
    log.libido,
    log.sexualActivity ? 'Oui' : 'Non',
    log.contraceptiveTaken ? 'Oui' : 'Non'
  ]);

  // 3. Ajouter des métadonnées utilisateur en haut
  const meta = [
    ['Utilisatrice', settings.name],
    ['Mode', settings.mode],
    ['Dernières règles', settings.lastPeriodDate.toISOString().split('T')[0]],
    ['Durée cycle', settings.cycleLength.toString()],
    [] // Ligne vide
  ];

  // 4. Combiner le tout
  const csvContent = [
    ...meta.map(e => e.join(',')),
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  // 5. Créer le fichier Blob et le télécharger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `LunaFlow_Export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};