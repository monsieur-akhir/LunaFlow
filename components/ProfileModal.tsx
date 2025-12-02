import React, { useState } from 'react';
import { UserSettings } from '../types';

interface ProfileModalProps {
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ settings, onSave, onClose }) => {
  const [localName, setLocalName] = useState(settings.name);
  const [partnerInput, setPartnerInput] = useState(settings.partnerName || '');
  const [pairingInput, setPairingInput] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'pairing'>('profile');

  const handleSaveProfile = () => {
    onSave({ ...settings, name: localName, partnerName: partnerInput });
    onClose();
  };

  const handleSimulatePairing = () => {
    if (pairingInput.length > 3) {
      // Simulation d'une connexion réussie
      onSave({ 
        ...settings, 
        isConnectedToPartner: true, 
        partnerName: partnerInput || 'Partenaire' // Fallback si pas de nom
      });
      alert(`Connexion réussie avec le code ${pairingInput} ! Les données sont maintenant partagées.`);
      onClose();
    } else {
      alert("Code invalide (trop court)");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-float">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-4 text-sm font-bold ${activeTab === 'profile' ? 'text-pink-500 bg-pink-50' : 'text-slate-400'}`}
          >
            Mon Profil
          </button>
          <button
            onClick={() => setActiveTab('pairing')}
            className={`flex-1 py-4 text-sm font-bold ${activeTab === 'pairing' ? 'text-indigo-500 bg-indigo-50' : 'text-slate-400'}`}
          >
            Partage Duo
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'profile' ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-pink-100 rounded-full mx-auto flex items-center justify-center text-3xl mb-2">
                  👩‍🦰
                </div>
                <h3 className="font-bold text-slate-700">Identité</h3>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Votre Prénom</label>
                <input
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom du Partenaire (Affichage)</label>
                <input
                  type="text"
                  value={partnerInput}
                  onChange={(e) => setPartnerInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl mt-4 shadow-lg shadow-pink-200 active:scale-95 transition"
              >
                Enregistrer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto flex items-center justify-center text-3xl mb-2">
                  🔗
                </div>
                <h3 className="font-bold text-slate-700">Lier un compte</h3>
                <p className="text-xs text-slate-500 px-4">Partagez votre cycle, vos envies et vos rendez-vous médicaux avec votre moitié.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-300">
                <p className="text-xs text-slate-400 mb-1">Votre Code de Partage</p>
                <p className="text-2xl font-mono font-bold text-slate-700 tracking-widest">{settings.pairingCode}</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">Ou entrer un code</span>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Code du partenaire (ex: A7B2)"
                  value={pairingInput}
                  onChange={(e) => setPairingInput(e.target.value.toUpperCase())}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none text-center font-mono uppercase"
                />
              </div>

              <button
                onClick={handleSimulatePairing}
                disabled={settings.isConnectedToPartner}
                className={`w-full py-3 rounded-xl mt-2 font-bold transition shadow-lg ${
                  settings.isConnectedToPartner 
                    ? 'bg-green-500 text-white cursor-default' 
                    : 'bg-indigo-500 text-white shadow-indigo-200 active:scale-95'
                }`}
              >
                {settings.isConnectedToPartner ? 'Compte Lié ✅' : 'Valider le lien'}
              </button>
            </div>
          )}
        </div>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          ✕
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;