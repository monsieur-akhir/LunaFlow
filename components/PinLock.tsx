import React, { useState, useEffect } from 'react';

interface PinLockProps {
  correctPin: string;
  onUnlock: () => void;
  isSettingUp?: boolean; // Mode "Création de code"
  onSetPin?: (pin: string) => void;
  onCancelSetup?: () => void;
}

const PinLock: React.FC<PinLockProps> = ({ correctPin, onUnlock, isSettingUp = false, onSetPin, onCancelSetup }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (input.length === 4) {
      if (isSettingUp) {
          if(onSetPin) onSetPin(input);
      } else {
        if (input === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setInput('');
            setError(false);
          }, 500);
        }
      }
    }
  }, [input, correctPin, onUnlock, isSettingUp, onSetPin]);

  const handlePress = (num: string) => {
    if (input.length < 4) {
      setInput(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-white animate-fade-in">
      <div className="mb-8 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-bold mb-2">
            {isSettingUp ? "Définir votre code secret" : "LunaFlow Verrouillé"}
        </h2>
        <p className="text-slate-400 text-sm">
            {isSettingUp ? "Entrez 4 chiffres" : "Entrez votre code pour accéder"}
        </p>
      </div>

      {/* Dots Indicator */}
      <div className="flex gap-4 mb-12">
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < input.length 
                ? error ? 'bg-red-500 scale-125' : 'bg-pink-500 scale-110' 
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-xs px-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handlePress(num.toString())}
            className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 text-2xl font-bold transition active:scale-95 border border-slate-700"
          >
            {num}
          </button>
        ))}
        <div className="w-16 h-16"></div> {/* Spacer */}
        <button
            onClick={() => handlePress("0")}
            className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 text-2xl font-bold transition active:scale-95 border border-slate-700"
          >
            0
        </button>
        <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95"
          >
            ⌫
        </button>
      </div>

      {isSettingUp && onCancelSetup && (
          <button onClick={onCancelSetup} className="mt-8 text-sm text-slate-400 hover:text-white underline">
              Annuler
          </button>
      )}
      
      {!isSettingUp && (
          <p className="mt-8 text-xs text-slate-600">Code oublié ? Réinstallez l'app.</p>
      )}
    </div>
  );
};

export default PinLock;