import React, { useState, useEffect, useCallback } from 'react';
import { AppMode, UserSettings, DailyLog, MedicalData } from './types';
import { getCycleDay, getPregnancyWeek, addDays, getFertilityStatus, getOvulationDay, getCyclePhase, getDelayDays } from './utils/dateUtils';
import { exportToCSV } from './utils/exportUtils';
import CircularTracker from './components/CircularTracker';
import SymptomLogger from './components/SymptomLogger';
import InsightCard from './components/InsightCard';
import PartnerWidget from './components/PartnerWidget';
import DynamicInfoWidget from './components/DynamicInfoWidget';
import MedicalHealthWidget from './components/MedicalHealthWidget';
import ProfileModal from './components/ProfileModal';
import SettingsMenu from './components/SettingsMenu';
import PinLock from './components/PinLock';
import OnboardingWizard from './components/OnboardingWizard';
import CalendarHistoryWidget from './components/CalendarHistoryWidget';
import FertilityForecastWidget from './components/FertilityForecastWidget';
import PregnancyTipsWidget from './components/PregnancyTipsWidget';
import CycleCountdownWidget from './components/CycleCountdownWidget';
import AdminDashboard from './components/AdminDashboard';
import SplashScreen from './components/SplashScreen'; // Ajout
import { getDailyInsight } from './services/geminiService';

const STORAGE_KEY = 'lunaflow_user_data_v1';

const App: React.FC = () => {
  // --- State ---
  const [loadingApp, setLoadingApp] = useState(true); // État de chargement initial
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'health' | 'profile'>('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Security State
  const [isLocked, setIsLocked] = useState(false);

  const [settings, setSettings] = useState<UserSettings>({
    mode: AppMode.CYCLE,
    lastPeriodDate: new Date(),
    cycleLength: 28,
    pregnancyDueDate: null,
    name: '',
    partnerName: '',
    isTryingToConceive: false,
    usesContraception: false,
    pairingCode: 'LUNA-' + Math.floor(1000 + Math.random() * 9000), 
    isConnectedToPartner: false,
    hasCompletedOnboarding: false,
    enableNotifications: true,
    pinCode: undefined
  });

  const [medicalData, setMedicalData] = useState<MedicalData>({
    betaHCG: null,
    lastHCGDate: null,
    nextEchoDate: null,
    folicAcidTaken: false
  });

  const [todayLog, setTodayLog] = useState<DailyLog>({
    date: new Date().toISOString().split('T')[0],
    symptoms: [],
    mood: '',
    sexualActivity: false,
    contraceptiveTaken: false,
    libido: 'medium'
  });

  const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);
  const [insight, setInsight] = useState<{ title: string; content: string } | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // --- PERSISTENCE & INIT EFFECT ---
  
  // 1. Load Data on Mount
  useEffect(() => {
    const loadData = async () => {
      // Simulation petit délai pour le splash screen
      await new Promise(r => setTimeout(r, 1500));
      
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          
          // Rehydrate Dates (JSON stores them as strings)
          const hydratedSettings = {
            ...parsed.settings,
            lastPeriodDate: new Date(parsed.settings.lastPeriodDate),
            pregnancyDueDate: parsed.settings.pregnancyDueDate ? new Date(parsed.settings.pregnancyDueDate) : null
          };

          setSettings(hydratedSettings);
          setMedicalData(parsed.medicalData);
          setHistoryLogs(parsed.historyLogs);
          
          // Check Lock
          if (hydratedSettings.hasCompletedOnboarding && hydratedSettings.pinCode) {
            setIsLocked(true);
          }
          
          // Restore TodayLog if exists in history
          const todayStr = new Date().toISOString().split('T')[0];
          const existingToday = parsed.historyLogs.find((l: DailyLog) => l.date === todayStr);
          if (existingToday) {
            setTodayLog(existingToday);
          } else {
             setTodayLog(prev => ({ ...prev, date: todayStr }));
          }

        } catch (e) {
          console.error("Error loading save data", e);
        }
      }
      setLoadingApp(false);
    };
    loadData();
  }, []);

  // 2. Save Data on Change
  useEffect(() => {
    if (!loadingApp && settings.hasCompletedOnboarding) {
      const dataToSave = {
        settings,
        medicalData,
        historyLogs
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [settings, medicalData, historyLogs, loadingApp]);

  // Sync todayLog with historyLogs (Existing logic wrapped in effect)
  useEffect(() => {
    if(loadingApp) return;
    setHistoryLogs(prev => {
        const others = prev.filter(l => l.date !== todayLog.date);
        return [...others, todayLog];
    });
  }, [todayLog, loadingApp]);

  // --- Handlers ---
  const toggleMode = () => {
    setSettings(prev => ({
      ...prev,
      mode: prev.mode === AppMode.CYCLE ? AppMode.PREGNANCY : AppMode.CYCLE,
      pregnancyDueDate: prev.mode === AppMode.CYCLE && !prev.pregnancyDueDate 
        ? addDays(new Date(), 200) 
        : prev.pregnancyDueDate
    }));
  };

  const handleSymptomToggle = (symptom: string) => {
    setTodayLog(prev => {
      const exists = prev.symptoms.includes(symptom);
      return {
        ...prev,
        symptoms: exists 
          ? prev.symptoms.filter(s => s !== symptom)
          : [...prev.symptoms, symptom]
      };
    });
  };

  const handleMoodSelect = (mood: string) => {
    setTodayLog(prev => ({ ...prev, mood: prev.mood === mood ? '' : mood }));
  };

  const handlePartnerNotification = (msg: string) => {
    if (!settings.isConnectedToPartner) {
        setNotification("Partenaire non lié. Liez un compte dans le profil !");
    } else {
        setNotification(msg);
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOnboardingComplete = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      hasCompletedOnboarding: true
    }));

    if (newSettings.lastPeriodDate && newSettings.mode === AppMode.CYCLE) {
       const dateStr = newSettings.lastPeriodDate.toISOString().split('T')[0];
       setHistoryLogs(prev => {
           if (prev.some(l => l.date === dateStr)) return prev;
           return [...prev, {
               date: dateStr,
               symptoms: [],
               mood: '',
               sexualActivity: false,
               contraceptiveTaken: false,
               libido: 'medium',
               flow: 'medium'
           }];
       });
    }
  };

  const handleHistoryUpdate = (date: string, updates: Partial<DailyLog>) => {
      setHistoryLogs(prev => {
          const existingIndex = prev.findIndex(l => l.date === date);
          let newLogs = [...prev];
          if (existingIndex >= 0) {
              newLogs[existingIndex] = { ...newLogs[existingIndex], ...updates };
          } else {
              newLogs.push({
                  date,
                  symptoms: [],
                  mood: '',
                  sexualActivity: false,
                  contraceptiveTaken: false,
                  libido: 'medium',
                  ...updates
              });
          }
          return newLogs;
      });

      if (updates.flow !== undefined && updates.flow !== null) {
          const logDate = new Date(date);
          const currentStart = settings.lastPeriodDate;
          const diff = (logDate.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24);

          if (diff > 10) {
              setSettings(prev => ({ ...prev, lastPeriodDate: logDate }));
              setNotification("Nouveau cycle détecté ! 🔄");
              setTimeout(() => setNotification(null), 3000);
          } 
          else if (diff < 0 && diff > -7) {
              setSettings(prev => ({ ...prev, lastPeriodDate: logDate }));
              setNotification("Début de cycle mis à jour.");
              setTimeout(() => setNotification(null), 3000);
          }
      }
  };

  const handlePeriodStartedToday = () => {
    handleHistoryUpdate(todayLog.date, { flow: 'medium' });
    setSettings(prev => ({ ...prev, lastPeriodDate: new Date() }));
    setNotification("Cycle mis à jour !");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRetroactivePeriod = (dateStr: string) => {
    if(!dateStr) return;
    const newDate = new Date(dateStr);
    handleHistoryUpdate(dateStr, { flow: 'medium' });
    setSettings(prev => ({ ...prev, lastPeriodDate: newDate }));
    setNotification("Cycle corrigé avec succès ✅");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportData = () => {
      exportToCSV(historyLogs, settings);
      setNotification("Export CSV généré ! 📂");
      setTimeout(() => setNotification(null), 3000);
  };

  // --- AI Insight Effect ---
  const fetchInsight = useCallback(async () => {
    if (!process.env.API_KEY || !settings.hasCompletedOnboarding) return;
    setLoadingInsight(true);
    const data = await getDailyInsight(
      settings, 
      todayLog.symptoms, 
      todayLog.mood,
      todayLog.sexualActivity,
      todayLog.libido,
      todayLog.contraceptiveTaken,
      medicalData
    );
    setInsight(data);
    setLoadingInsight(false);
  }, [settings, todayLog, medicalData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInsight();
    }, 2000);
    return () => clearTimeout(timer);
  }, [fetchInsight]);


  // --- Render Helpers ---
  const renderCycleView = () => {
    const absoluteDay = getCycleDay(settings.lastPeriodDate);
    const daysLate = getDelayDays(settings.lastPeriodDate, settings.cycleLength);
    const isLate = daysLate > 0;
    const isVeryLate = daysLate > 5;

    const progress = isLate ? 100 : Math.min(Math.max((absoluteDay / settings.cycleLength) * 100, 0), 100);
    const phaseInfo = getCyclePhase(absoluteDay, settings.cycleLength);
    const ovulationDay = getOvulationDay(settings.cycleLength);

    let trackerLabel = "Jour";
    let trackerSubLabel = phaseInfo.phase;
    let trackerColor = isLate ? 'red' : phaseInfo.color;
    let trackerIcon = phaseInfo.icon;

    if (isLate) {
        trackerLabel = "Retard";
        trackerSubLabel = `J+${daysLate} jours`;
        if (isVeryLate) {
            trackerLabel = "Attention";
            trackerSubLabel = "Test / Médecin ?";
            trackerIcon = "🩺";
        }
    }
    
    return (
      <div className="flex flex-col items-center pb-2">
        <CircularTracker 
          progress={progress}
          total={settings.cycleLength}
          current={isLate ? daysLate : absoluteDay}
          label={trackerLabel}
          subLabel={trackerSubLabel}
          color={trackerColor}
          icon={trackerIcon}
          ovulationDay={!isLate ? ovulationDay : undefined}
        />
        
        {isLate && (
           <div className="mt-2 w-full px-4 animate-slide-up">
              <div className={`border rounded-2xl p-4 shadow-inner text-center ${isVeryLate ? 'bg-red-50 border-red-200' : 'bg-rose-50 border-rose-100'}`}>
                 <p className={`text-sm font-bold mb-3 ${isVeryLate ? 'text-red-800' : 'text-rose-800'}`}>
                    {isVeryLate ? "Retard > 5 jours : Un avis médical ou un test est recommandé." : "Léger retard détecté."}
                 </p>
                 <div className="flex flex-col gap-2">
                    <button onClick={handlePeriodStartedToday} className="w-full py-3 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold shadow-sm hover:bg-rose-50 transition flex items-center justify-center gap-2">
                        <span>🩸</span> Elles sont arrivées aujourd'hui
                    </button>
                    <div className="bg-white/50 rounded-xl p-2 border border-rose-100 mt-1">
                        <label className="text-[10px] text-rose-600 font-bold block mb-1">Oublié de noter ? Elles ont commencé avant ?</label>
                        <input type="date" max={new Date().toISOString().split('T')[0]} className="w-full text-xs p-2 rounded-lg border border-rose-200 bg-white text-rose-800 focus:outline-none focus:ring-1 focus:ring-rose-300" onChange={(e) => handleRetroactivePeriod(e.target.value)} />
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>
    );
  };

  const renderPregnancyView = () => {
    if (!settings.pregnancyDueDate) return null;
    const currentWeek = getPregnancyWeek(settings.pregnancyDueDate);
    const progress = Math.min((currentWeek / 40) * 100, 100);
    return (
      <div className="flex flex-col items-center pb-2">
        <CircularTracker progress={progress} total={40} current={currentWeek} label="Semaine" subLabel="de grossesse" color="teal" icon="🤰" />
      </div>
    );
  };

  const renderHomeTab = () => (
    <div className="space-y-6 animate-fade-in">
        <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-4 relative overflow-hidden transition-all duration-500 group hover:shadow-2xl hover:shadow-slate-200/60">
           <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${settings.mode === AppMode.CYCLE ? 'from-pink-300 to-purple-400' : 'from-teal-300 to-blue-400'}`}></div>
           {settings.mode === AppMode.CYCLE ? renderCycleView() : renderPregnancyView()}
           <DynamicInfoWidget mode={settings.mode} cycleDay={getCycleDay(settings.lastPeriodDate)} cycleLength={settings.cycleLength} pregnancyWeek={settings.pregnancyDueDate ? getPregnancyWeek(settings.pregnancyDueDate) : 0} lastPeriodDate={settings.lastPeriodDate} />
        </section>

        <section className="animate-slide-up">
           {settings.mode === AppMode.CYCLE ? (
             <>
                <CycleCountdownWidget lastPeriodDate={settings.lastPeriodDate} cycleLength={settings.cycleLength} />
                <FertilityForecastWidget lastPeriodDate={settings.lastPeriodDate} cycleLength={settings.cycleLength} />
             </>
           ) : (
             <PregnancyTipsWidget week={settings.pregnancyDueDate ? getPregnancyWeek(settings.pregnancyDueDate) : 0} />
           )}
        </section>

        <section>
          <InsightCard title={insight?.title || `Bonjour ${settings.name} !`} content={insight?.content || "Analyse de vos données pour un conseil personnalisé..."} loading={loadingInsight} type={settings.mode === AppMode.CYCLE ? 'cycle' : 'pregnancy'} />
        </section>

        <section>
          <SymptomLogger selectedSymptoms={todayLog.symptoms} selectedMood={todayLog.mood} sexualActivity={todayLog.sexualActivity} contraceptiveTaken={todayLog.contraceptiveTaken} libido={todayLog.libido} usesContraception={settings.usesContraception} onToggleSymptom={handleSymptomToggle} onSelectMood={handleMoodSelect} onToggleSex={() => setTodayLog(p => ({...p, sexualActivity: !p.sexualActivity}))} onToggleContraceptive={() => setTodayLog(p => ({...p, contraceptiveTaken: !p.contraceptiveTaken}))} onSelectLibido={(l) => setTodayLog(p => ({...p, libido: l}))} />
        </section>
    </div>
  );

  const renderCalendarTab = () => (
    <div className="animate-fade-in">
       <CalendarHistoryWidget logs={historyLogs} settings={settings} onUpdateLog={handleHistoryUpdate} />
    </div>
  );

  const renderHealthTab = () => (
    <div className="space-y-6 animate-fade-in">
        <PartnerWidget partnerName={settings.partnerName || 'Partenaire'} fertilityStatus={settings.mode === AppMode.CYCLE ? getFertilityStatus(settings.lastPeriodDate, settings.cycleLength).label : `Semaine ${settings.pregnancyDueDate ? getPregnancyWeek(settings.pregnancyDueDate) : 0}`} onSendNotification={handlePartnerNotification} />
        <MedicalHealthWidget mode={settings.mode} isTryingToConceive={settings.isTryingToConceive} data={medicalData} onUpdate={setMedicalData} />
    </div>
  );

  const renderProfileTab = () => (
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 animate-slide-up space-y-6">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-2xl text-slate-700">Paramètres</h3>
            <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100">
                ⚙️
            </button>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{settings.mode === AppMode.CYCLE ? 'Date dernières règles' : 'Date prévue accouchement'}</label>
          <input type="date" className="w-full p-4 border border-slate-200 rounded-xl text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-300" value={settings.mode === AppMode.CYCLE ? settings.lastPeriodDate.toISOString().split('T')[0] : settings.pregnancyDueDate ? settings.pregnancyDueDate.toISOString().split('T')[0] : ''} onChange={(e) => { if(!e.target.value) return; const newDate = new Date(e.target.value); if(settings.mode === AppMode.CYCLE) { setSettings(s => ({...s, lastPeriodDate: newDate})); } else { setSettings(s => ({...s, pregnancyDueDate: newDate})); }}} />
        </div>

        {settings.mode === AppMode.CYCLE && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Durée moyenne du cycle (Jours)</label>
              <input type="number" className="w-full p-4 border border-slate-200 rounded-xl text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-300" value={settings.cycleLength} onChange={(e) => setSettings(s => ({...s, cycleLength: parseInt(e.target.value) || 28}))} />
            </div>
        )}

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">Mode Essai bébé 👶</span>
              <span className="text-xs text-slate-500">Active les conseils fertilité et HCG</span>
          </div>
          <button onClick={() => setSettings(s => ({...s, isTryingToConceive: !s.isTryingToConceive, usesContraception: !s.isTryingToConceive ? false : s.usesContraception}))} className={`w-12 h-6 rounded-full transition-colors relative ${settings.isTryingToConceive ? 'bg-green-400' : 'bg-slate-300'}`}>
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.isTryingToConceive ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>
        
        <button onClick={() => setShowProfileModal(true)} className="w-full py-4 border border-slate-200 rounded-xl text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 transition">
            Gérer mon Profil & Partage Duo
        </button>

        <div className="pt-4 border-t border-slate-100">
             <p className="text-xs text-slate-400 text-center">Version 1.4.2 • LunaFlow Premium</p>
        </div>
      </div>
  );

  // --- MAIN RENDER ---
  
  if (loadingApp) {
    return <SplashScreen />;
  }
  
  // 1. PIN LOCK CHECK
  if (isLocked && settings.pinCode) {
      return (
          <PinLock 
            correctPin={settings.pinCode} 
            onUnlock={() => setIsLocked(false)} 
          />
      );
  }

  // 2. Admin Mode
  if (isAdminMode) {
      return <AdminDashboard onExit={() => setIsAdminMode(false)} />;
  }

  // 3. Onboarding
  if (!settings.hasCompletedOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // 4. Normal App
  return (
    <div className="min-h-screen bg-slate-50 pb-safe">
      
      {notification && (
        <div className="fixed top-safe left-1/2 transform -translate-x-1/2 z-[100] mt-4 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce whitespace-nowrap">
          {notification}
        </div>
      )}

      {showProfileModal && (
        <ProfileModal settings={settings} onSave={(newSettings) => setSettings(newSettings)} onClose={() => setShowProfileModal(false)} onOpenAdmin={() => { setShowProfileModal(false); setIsAdminMode(true); }} />
      )}

      {showSettings && (
          <SettingsMenu 
            settings={settings} 
            onUpdateSettings={(s) => setSettings(s)} 
            onExportData={handleExportData}
            onClose={() => setShowSettings(false)} 
          />
      )}

      <header className="px-6 py-4 pt-safe flex justify-between items-center sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition transform ${settings.mode === AppMode.CYCLE ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gradient-to-br from-teal-400 to-emerald-600'}`}>
            {settings.name ? settings.name.charAt(0).toUpperCase() : 'L'}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600 leading-none">LunaFlow</h1>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{settings.isConnectedToPartner ? `Lié à ${settings.partnerName}` : 'Mode Solo'}</span>
          </div>
        </div>
        <button onClick={toggleMode} className="text-xs font-semibold px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
          {settings.mode === AppMode.CYCLE ? '→ Grossesse' : '→ Cycle'}
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 pb-28">
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'calendar' && renderCalendarTab()}
        {activeTab === 'health' && renderHealthTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 pb-safe pt-2 z-40">
        <div className="max-w-md mx-auto flex justify-around items-center">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 w-16 transition-all ${activeTab === 'home' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}>
               <span className={`text-2xl transition-transform ${activeTab === 'home' ? 'scale-110' : ''}`}>🏠</span>
               <span className="text-[10px] font-bold mt-1">Accueil</span>
            </button>
            <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center p-2 w-16 transition-all ${activeTab === 'calendar' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}>
               <span className={`text-2xl transition-transform ${activeTab === 'calendar' ? 'scale-110' : ''}`}>📅</span>
               <span className="text-[10px] font-bold mt-1">Journal</span>
            </button>
            <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center p-2 w-16 transition-all ${activeTab === 'health' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}>
               <span className={`text-2xl transition-transform ${activeTab === 'health' ? 'scale-110' : ''}`}>❤️</span>
               <span className="text-[10px] font-bold mt-1">Santé</span>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center p-2 w-16 transition-all ${activeTab === 'profile' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}>
               <span className={`text-2xl transition-transform ${activeTab === 'profile' ? 'scale-110' : ''}`}>👤</span>
               <span className="text-[10px] font-bold mt-1">Profil</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;