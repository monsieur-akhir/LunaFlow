
import React, { useState } from 'react';
import { UserSettings, AppMode } from '../types';
import { addDays } from '../utils/dateUtils';

interface OnboardingWizardProps {
  onComplete: (settings: Partial<UserSettings>) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<UserSettings>>({
    name: '',
    age: 25,
    relationshipStatus: 'single',
    hasChildren: false,
    mode: AppMode.CYCLE,
    isTryingToConceive: false,
    partnerName: '',
    tryingDuration: '',
    lastPeriodDate: new Date(),
    pregnancyDueDate: null
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => Math.max(0, prev - 1));

  const updateData = (key: keyof UserSettings, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFinish = () => {
    // Calcul automatique si grossesse
    let finalData = { ...formData };
    if (finalData.mode === AppMode.PREGNANCY && !finalData.pregnancyDueDate) {
       finalData.pregnancyDueDate = addDays(new Date(), 200); // Default estimation
    }
    onComplete(finalData);
  };

  // --- RENDERING STEPS ---

  const renderWelcome = () => (
    <div className="text-center space-y-6 animate-float">
      <div className="text-6xl mb-4">🌙</div>
      <h2 className="text-3xl font-bold text-slate-800">Bienvenue sur LunaFlow</h2>
      <p className="text-slate-600 text-lg">
        Votre compagnon de voyage intime pour comprendre votre corps, votre cycle et votre fertilité.
      </p>
      <button onClick={nextStep} className="bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-pink-600 transition">
        Commencer le voyage
      </button>
    </div>
  );

  const renderName = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Enchanté ! Comment vous appelez-vous ?</h2>
      <input
        type="text"
        placeholder="Votre prénom..."
        value={formData.name}
        onChange={(e) => updateData('name', e.target.value)}
        className="w-full text-center text-3xl border-b-2 border-pink-300 focus:border-pink-500 outline-none bg-transparent py-2 text-pink-600 placeholder-pink-200"
        autoFocus
      />
      {formData.name && (
        <div className="animate-pulse mt-4">
          <button onClick={nextStep} className="text-xl text-slate-600 font-medium">
            Enchanté, {formData.name} ! Continuer →
          </button>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Dites-nous en un peu plus...</h2>
      
      <div>
        <label className="block text-sm text-slate-500 mb-2 uppercase tracking-wide">Votre Âge</label>
        <input
          type="number"
          value={formData.age}
          onChange={(e) => updateData('age', parseInt(e.target.value))}
          className="w-24 text-center text-2xl border rounded-xl p-2 focus:ring-2 focus:ring-pink-300 outline-none"
        />
      </div>

      <div>
         <label className="block text-sm text-slate-500 mb-2 uppercase tracking-wide">Situation amoureuse</label>
         <div className="flex gap-2 justify-center">
            {[
              { id: 'single', label: 'Célibataire', icon: '💃' },
              { id: 'couple', label: 'En couple', icon: '❤️' },
              { id: 'married', label: 'Mariée', icon: '💍' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => updateData('relationshipStatus', opt.id)}
                className={`p-4 rounded-2xl border transition ${formData.relationshipStatus === opt.id ? 'bg-pink-50 border-pink-400 text-pink-700 ring-2 ring-pink-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="text-2xl mb-1">{opt.icon}</div>
                <div className="text-xs font-bold">{opt.label}</div>
              </button>
            ))}
         </div>
      </div>

      {(formData.relationshipStatus === 'couple' || formData.relationshipStatus === 'married') && (
        <div className="animate-fade-in-up">
           <label className="block text-sm text-slate-500 mb-2 uppercase tracking-wide">Prénom de votre partenaire</label>
           <input
            type="text"
            placeholder="Son prénom..."
            value={formData.partnerName}
            onChange={(e) => updateData('partnerName', e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-center"
          />
        </div>
      )}

      <div>
        <label className="block text-sm text-slate-500 mb-2 uppercase tracking-wide">Avez-vous déjà des enfants ?</label>
        <div className="flex gap-4 justify-center">
           <button onClick={() => updateData('hasChildren', true)} className={`px-6 py-2 rounded-full border ${formData.hasChildren ? 'bg-teal-100 border-teal-400 text-teal-800' : 'bg-white'}`}>Oui 👶</button>
           <button onClick={() => updateData('hasChildren', false)} className={`px-6 py-2 rounded-full border ${!formData.hasChildren ? 'bg-slate-100 border-slate-400 text-slate-800' : 'bg-white'}`}>Non</button>
        </div>
      </div>

      <button onClick={nextStep} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold mt-4">Suivant</button>
    </div>
  );

  const renderGoal = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Quel est votre objectif principal ?</h2>
      <div className="space-y-3">
        <button 
          onClick={() => {
            updateData('mode', AppMode.CYCLE);
            updateData('isTryingToConceive', false);
            nextStep();
          }}
          className="w-full p-4 text-left bg-white border border-slate-200 rounded-2xl hover:border-pink-300 hover:shadow-md transition flex items-center gap-4"
        >
          <span className="text-3xl bg-pink-100 p-2 rounded-full">🩸</span>
          <div>
            <h3 className="font-bold text-slate-700">Suivre mon cycle</h3>
            <p className="text-sm text-slate-500">Juste comprendre mon corps et mes règles.</p>
          </div>
        </button>

        <button 
          onClick={() => {
            updateData('mode', AppMode.CYCLE);
            updateData('isTryingToConceive', true);
            nextStep();
          }}
          className="w-full p-4 text-left bg-white border border-slate-200 rounded-2xl hover:border-purple-300 hover:shadow-md transition flex items-center gap-4"
        >
          <span className="text-3xl bg-purple-100 p-2 rounded-full">👶</span>
          <div>
            <h3 className="font-bold text-slate-700">Avoir un bébé</h3>
            <p className="text-sm text-slate-500">Optimiser ma fertilité pour concevoir.</p>
          </div>
        </button>

        <button 
          onClick={() => {
            updateData('mode', AppMode.PREGNANCY);
            nextStep();
          }}
          className="w-full p-4 text-left bg-white border border-slate-200 rounded-2xl hover:border-teal-300 hover:shadow-md transition flex items-center gap-4"
        >
          <span className="text-3xl bg-teal-100 p-2 rounded-full">🤰</span>
          <div>
            <h3 className="font-bold text-slate-700">Suivre ma grossesse</h3>
            <p className="text-sm text-slate-500">Je suis déjà enceinte !</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderDetails = () => {
    if (formData.mode === AppMode.PREGNANCY) {
       return (
         <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Félicitations ! 🎉</h2>
            <p className="text-slate-600">Pour calibrer l'application, avez-vous une date estimée d'accouchement ?</p>
            <input 
              type="date" 
              className="w-full p-4 bg-white border border-slate-300 rounded-xl text-xl"
              onChange={(e) => updateData('pregnancyDueDate', new Date(e.target.value))}
            />
            <button onClick={handleFinish} className="w-full bg-teal-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-teal-200 hover:bg-teal-600 transition">
              Découvrir mon espace
            </button>
         </div>
       )
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Calibrons votre cycle 🗓️</h2>
        
        <div>
           <label className="block text-sm text-slate-500 mb-2 uppercase tracking-wide">Date de début des dernières règles</label>
           <input 
              type="date" 
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-lg"
              onChange={(e) => updateData('lastPeriodDate', new Date(e.target.value))}
            />
        </div>

        {formData.isTryingToConceive && (
          <div className="animate-fade-in-up">
            <label className="block text-sm text-slate-500 mb-2 uppercase tracking-wide">Depuis combien de temps essayez-vous ?</label>
            <select 
              className="w-full p-3 bg-white border border-slate-300 rounded-xl"
              onChange={(e) => updateData('tryingDuration', e.target.value)}
            >
              <option value="">Sélectionner...</option>
              <option value="Juste commencé">Je viens de commencer</option>
              <option value="< 6 mois">Moins de 6 mois</option>
              <option value="6-12 mois">6 à 12 mois</option>
              <option value="> 1 an">Plus d'un an</option>
            </select>
          </div>
        )}

        <button onClick={handleFinish} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-purple-200 hover:scale-[1.02] transition">
          C'est parti ! 🚀
        </button>
      </div>
    );
  };

  const steps = [
    renderWelcome,
    renderName,
    renderProfile,
    renderGoal,
    renderDetails
  ];

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-center">
        
        {/* Background blobs */}
        <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50"></div>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-pink-400 to-purple-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>

        {step > 0 && (
          <button onClick={prevStep} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 text-sm font-bold">
            ← Retour
          </button>
        )}

        <div className="relative z-10 animate-fade-in">
           {steps[step]()}
        </div>
        
      </div>
      <p className="mt-6 text-slate-400 text-xs text-center max-w-xs">
        Vos données sont stockées localement sur votre appareil et utilisées uniquement pour personnaliser votre expérience.
      </p>
    </div>
  );
};

export default OnboardingWizard;
