import React from 'react';
import { MedicalData, AppMode } from '../types';

interface MedicalHealthWidgetProps {
  mode: AppMode;
  data: MedicalData;
  isTryingToConceive: boolean;
  onUpdate: (data: MedicalData) => void;
}

const MedicalHealthWidget: React.FC<MedicalHealthWidgetProps> = ({ mode, data, isTryingToConceive, onUpdate }) => {
  const isPregnancy = mode === AppMode.PREGNANCY;
  
  // Si on est en mode cycle SANS désir de grossesse, on masque le widget médical lourd pour ne pas surcharger
  // On pourrait juste garder les vitamines, mais pour l'instant masquons-le si pas pertinent.
  if (!isPregnancy && !isTryingToConceive) {
      return (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex justify-between items-center opacity-70 hover:opacity-100 transition">
              <span className="text-sm text-slate-500 font-medium">✨ Pensez à vos vitamines aujourd'hui</span>
              <button
                onClick={() => onUpdate({ ...data, folicAcidTaken: !data.folicAcidTaken })}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                data.folicAcidTaken 
                    ? 'bg-yellow-400 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-300'
                }`}
            >
                {data.folicAcidTaken ? '💊' : '○'}
            </button>
          </div>
      );
  }

  const handleHCGChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...data, betaHCG: Number(e.target.value), lastHCGDate: new Date().toISOString().split('T')[0] });
  };

  const handleEchoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...data, nextEchoDate: e.target.value });
  };

  const toggleFolicAcid = () => {
    onUpdate({ ...data, folicAcidTaken: !data.folicAcidTaken });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4 animate-slide-up">
      <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
        <span className="bg-teal-100 text-teal-600 p-1 rounded-lg text-sm">⚕️</span> 
        {isPregnancy ? 'Suivi Grossesse' : 'Suivi Fertilité'}
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {/* Acide Folique - Très important */}
        <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-xl border border-yellow-100">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-yellow-800">Acide Folique (B9)</span>
            <span className="text-xs text-yellow-600">
                {isPregnancy ? 'Vital pour le bébé' : 'Prépare la conception'}
            </span>
          </div>
          <button
            onClick={toggleFolicAcid}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              data.folicAcidTaken 
                ? 'bg-yellow-400 text-white shadow-md transform scale-110' 
                : 'bg-white border-2 border-yellow-200 text-slate-300'
            }`}
          >
            {data.folicAcidTaken ? '💊' : '○'}
          </button>
        </div>

        {/* HCG - Pertinent surtout en début de grossesse ou suspicion (Essai bébé) */}
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
          <label className="block text-xs font-bold text-blue-800 mb-1 uppercase">
            {isPregnancy ? 'Dernier Taux Bêta HCG' : 'Test Grossesse (HCG)'}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Ex: 500 mIU/mL"
              value={data.betaHCG || ''}
              onChange={handleHCGChange}
              className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-blue-200"
            />
            {data.lastHCGDate && (
              <span className="text-[10px] text-blue-400 self-end mb-2 whitespace-nowrap">
                Maj: {new Date(data.lastHCGDate).getDate()}/{new Date(data.lastHCGDate).getMonth()+1}
              </span>
            )}
          </div>
        </div>

        {/* Échographie - Uniquement visible en mode Grossesse */}
        {isPregnancy && (
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
            <label className="block text-xs font-bold text-purple-800 mb-1 uppercase">
              Prochaine Échographie 📸
            </label>
            <input
              type="date"
              value={data.nextEchoDate || ''}
              onChange={handleEchoChange}
              className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-purple-700"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalHealthWidget;