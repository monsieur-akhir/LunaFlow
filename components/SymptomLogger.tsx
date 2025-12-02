import React from 'react';
import { SYMPTOMS_LIST, MOODS_LIST } from '../types';

interface SymptomLoggerProps {
  selectedSymptoms: string[];
  selectedMood: string;
  sexualActivity: boolean;
  contraceptiveTaken: boolean;
  libido: 'low' | 'medium' | 'high';
  usesContraception: boolean;
  onToggleSymptom: (symptom: string) => void;
  onSelectMood: (mood: string) => void;
  onToggleSex: () => void;
  onToggleContraceptive: () => void;
  onSelectLibido: (level: 'low' | 'medium' | 'high') => void;
}

const SymptomLogger: React.FC<SymptomLoggerProps> = ({
  selectedSymptoms,
  selectedMood,
  sexualActivity,
  contraceptiveTaken,
  libido,
  usesContraception,
  onToggleSymptom,
  onSelectMood,
  onToggleSex,
  onToggleContraceptive,
  onSelectLibido
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
      <h3 className="text-lg font-semibold text-slate-700">Journal du jour</h3>
      
      {/* Humeur */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Humeur</h4>
        <div className="flex flex-wrap gap-2">
          {MOODS_LIST.map((mood) => (
            <button
              key={mood}
              onClick={() => onSelectMood(mood)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedMood === mood
                  ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-md transform scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Intimité & Santé */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Intimité & Santé</h4>
        <div className="flex flex-wrap gap-3">
          {/* Libido Selector */}
          <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-100">
             <span className="text-xs text-slate-400 px-2">Désir</span>
             {(['low', 'medium', 'high'] as const).map((l) => (
               <button
                key={l}
                onClick={() => onSelectLibido(l)}
                className={`w-8 h-8 rounded-full text-xs flex items-center justify-center transition-all ${
                  libido === l 
                  ? 'bg-rose-500 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-200'
                }`}
               >
                 {l === 'low' ? '☁️' : l === 'medium' ? '🔥' : '❤️‍🔥'}
               </button>
             ))}
          </div>

          {/* Rapport Sexuel */}
          <button
            onClick={onToggleSex}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              sexualActivity
                ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-inner'
                : 'bg-white border-slate-200 text-slate-500 hover:border-rose-200'
            }`}
          >
            <span>❤️</span> Rapport
          </button>

          {/* Contraception (si activé) */}
          {usesContraception && (
            <button
              onClick={onToggleContraceptive}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                contraceptiveTaken
                  ? 'bg-teal-50 border-teal-200 text-teal-600 shadow-inner'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-teal-200'
              }`}
            >
              <span>💊</span> Pilule
            </button>
          )}
        </div>
      </div>

      {/* Symptômes */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Symptômes Physiques</h4>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS_LIST.map((symptom) => (
            <button
              key={symptom}
              onClick={() => onToggleSymptom(symptom)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                selectedSymptoms.includes(symptom)
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-600 shadow-inner'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200'
              }`}
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SymptomLogger;