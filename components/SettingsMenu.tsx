import React, { useState } from 'react';
import { UserSettings } from '../types';
import PinLock from './PinLock';

interface SettingsMenuProps {
  settings: UserSettings;
  onUpdateSettings: (s: UserSettings) => void;
  onExportData: () => void;
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ settings, onUpdateSettings, onExportData, onClose }) => {
  const [showPinSetup, setShowPinSetup] = useState(false);

  const togglePin = () => {
    if (settings.pinCode) {
        // Disable
        if(confirm("Désactiver le verrouillage par code ?")) {
            onUpdateSettings({ ...settings, pinCode: undefined });
        }
    } else {
        // Enable -> Show setup
        setShowPinSetup(true);
    }
  };

  const handleSetPin = (code: string) => {
      onUpdateSettings({ ...settings, pinCode: code });
      setShowPinSetup(false);
  };

  if (showPinSetup) {
      return (
          <PinLock 
            correctPin="" 
            onUnlock={() => {}} 
            isSettingUp={true} 
            onSetPin={handleSetPin} 
            onCancelSetup={() => setShowPinSetup(false)}
          />
      );
  }

  return (
    <div className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Paramètres</h3>
                <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200">✕</button>
            </div>

            <div className="space-y-4">
                {/* Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">🔔</div>
                        <div>
                            <p className="font-bold text-slate-700 text-sm">Notifications</p>
                            <p className="text-xs text-slate-400">Rappels pilule & règles</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onUpdateSettings({...settings, enableNotifications: !settings.enableNotifications})}
                        className={`w-12 h-6 rounded-full relative transition ${settings.enableNotifications ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.enableNotifications ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>

                {/* Sécurité */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">🔒</div>
                        <div>
                            <p className="font-bold text-slate-700 text-sm">Verrouillage App</p>
                            <p className="text-xs text-slate-400">{settings.pinCode ? 'Activé' : 'Désactivé'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={togglePin}
                        className={`w-12 h-6 rounded-full relative transition ${settings.pinCode ? 'bg-indigo-500' : 'bg-slate-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.pinCode ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>

                {/* Export Data */}
                <button 
                    onClick={onExportData}
                    className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-left"
                >
                    <div className="bg-teal-100 text-teal-600 p-2 rounded-lg">📂</div>
                    <div>
                        <p className="font-bold text-slate-700 text-sm">Exporter mes données</p>
                        <p className="text-xs text-slate-400">Format CSV pour le médecin</p>
                    </div>
                </button>

                {/* Reset Data (Danger Zone) */}
                <button 
                    onClick={() => {
                        if(confirm("Êtes-vous sûre de vouloir tout effacer ? Cette action est irréversible.")) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                    className="w-full p-4 text-center text-xs text-red-400 hover:text-red-600 font-bold uppercase tracking-wide mt-4"
                >
                    Effacer toutes les données
                </button>
            </div>
        </div>
    </div>
  );
};

export default SettingsMenu;