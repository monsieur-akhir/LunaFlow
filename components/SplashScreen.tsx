import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 mb-6">
        {/* Cercles animés */}
        <div className="absolute inset-0 bg-pink-200 rounded-full opacity-20 animate-ping"></div>
        <div className="absolute inset-2 bg-pink-300 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-4xl">🌙</span>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
        LunaFlow
      </h1>
      <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">Chargement...</p>
    </div>
  );
};

export default SplashScreen;