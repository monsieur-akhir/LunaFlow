import React, { useState } from 'react';

interface PartnerWidgetProps {
  partnerName: string;
  fertilityStatus: string;
  onSendNotification: (type: string) => void;
}

const PartnerWidget: React.FC<PartnerWidgetProps> = ({ partnerName, fertilityStatus, onSendNotification }) => {
  const [lastSent, setLastSent] = useState<string | null>(null);

  const handleSend = (type: string, label: string) => {
    onSendNotification(label);
    setLastSent(type);
    setTimeout(() => setLastSent(null), 3000);
  };

  if (!partnerName) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Deco */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">Espace Couple</h3>
            <p className="text-indigo-100 text-sm">Connecté avec {partnerName}</p>
          </div>
          <div className="bg-white/20 p-2 rounded-full">
            👥
          </div>
        </div>

        <p className="text-sm mb-4 bg-black/20 p-2 rounded-lg inline-block">
          Statut partagé : <span className="font-semibold">{fertilityStatus}</span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleSend('mood', `Envie partagée avec ${partnerName}`)}
            className="bg-white/10 hover:bg-white/20 transition p-2 rounded-xl flex flex-col items-center justify-center gap-1 backdrop-blur-sm border border-white/10"
          >
            <span className="text-xl">😏</span>
            <span className="text-xs font-medium">J'ai envie...</span>
          </button>

          <button 
             onClick={() => handleSend('fertile', `Alerte fertilité envoyée à ${partnerName}`)}
            className="bg-white/10 hover:bg-white/20 transition p-2 rounded-xl flex flex-col items-center justify-center gap-1 backdrop-blur-sm border border-white/10"
          >
            <span className="text-xl">👶</span>
            <span className="text-xs font-medium">C'est le moment !</span>
          </button>
        </div>

        {lastSent && (
          <div className="absolute inset-0 bg-indigo-600/90 flex items-center justify-center rounded-3xl animate-pulse">
            <span className="font-bold">Message envoyé ! 🚀</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerWidget;