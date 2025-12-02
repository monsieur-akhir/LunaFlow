
import React, { useState, useEffect, useCallback } from 'react';
import { AppMode, UserSettings, DailyLog, MedicalData } from './types';
import { getCycleDay, getPregnancyWeek, addDays, diffDays, getFertilityStatus, getOvulationDay, getCyclePhase } from './utils/dateUtils';
import CircularTracker from './components/CircularTracker';
import SymptomLogger from './components/SymptomLogger';
import InsightCard from './components/InsightCard';
import PartnerWidget from './components/PartnerWidget';
import DynamicInfoWidget from './components/DynamicInfoWidget';
import MedicalHealthWidget from './components/MedicalHealthWidget';
import ProfileModal from './components/ProfileModal';
import OnboardingWizard from './components/OnboardingWizard';
import CalendarHistoryWidget from './components/CalendarHistoryWidget';
import FertilityForecastWidget from './components/FertilityForecastWidget';
import PregnancyTipsWidget from './components/PregnancyTipsWidget';
import CycleCountdownWidget from './components/CycleCountdownWidget';
import { getDailyInsight } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'health' | 'profile'>('home');

  const [settings, setSettings] = useState<UserSettings>({
    mode: AppMode.CYCLE,
    lastPeriodDate: new Date(),
    cycleLength: 28,
    pregnancyDueDate: null,
    name: 'Moi',
    partnerName: '',
    isTryingToConceive: false,
    usesContraception: false,
    pairingCode: 'LUNA-' + Math.floor(1000 + Math.random() * 9000), 
    isConnectedToPartner: false,
    hasCompletedOnboarding: false 
  });

  const [medicalData, setMedicalData] = useState<MedicalData>({
    betaHCG: null,
    lastHCGDate: null,
    nextEchoDate: null,
    folicAcidTaken: false
  });

  // State for TODAY's log
  const [todayLog, setTodayLog] = useState<DailyLog>({
    date: new Date().toISOString().split('T')[0],
    symptoms: [],
    mood: '',
    sexualActivity: false,
    contraceptiveTaken: false,
    libido: 'medium'
  });

  // State for HISTORY logs (Array of DailyLog)
  const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);

  const [insight, setInsight] = useState<{ title: string; content: string } | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync todayLog with historyLogs whenever todayLog changes
  useEffect(() => {
      setHistoryLogs(prev => {
          const others = prev.filter(l => l.date !== todayLog.date);
          return [...others, todayLog];
      });
  }, [todayLog]);

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
          if (existingIndex >= 0) {
              const newLogs = [...prev];
              newLogs[existingIndex] = { ...newLogs[existingIndex], ...updates };
              return newLogs;
          } else {
              return [...prev, {
                  date,
                  symptoms: [],
                  mood: '',
                  sexualActivity: false,
                  contraceptiveTaken: false,
                  libido: 'medium',
                  ...updates
              }];
          }
      });

      if (updates.flow && new Date(date) > settings.lastPeriodDate) {
          setSettings(prev => ({ ...prev, lastPeriodDate: new Date(date) }));
          setNotification("Cycle mis à jour : Nouvelles règles détectées !");
          setTimeout(() => setNotification(null), 3000);
      }
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
    const currentDay = getCycleDay(settings.lastPeriodDate);
    const progress = Math.min(Math.max((currentDay / settings.cycleLength) * 100, 0), 100);
    const nextPeriod = addDays(settings.lastPeriodDate, settings.cycleLength);
    const daysLeft = diffDays(nextPeriod, new Date());
    
    const dayInCycle = ((currentDay - 1) % settings.cycleLength) + 1;
    const ovulationDay = getOvulationDay(settings.cycleLength);
    const phaseInfo = getCyclePhase(currentDay, settings.cycleLength);

    let trackerColor: 'red' | 'blue' | 'purple' | 'orange' = 'red';
    let subLabelText = `${daysLeft}j avant règles`;

    if (dayInCycle <= 5) {
      trackerColor = 'red';
      subLabelText = 'Période de règles';
    } else if (dayInCycle < ovulationDay - 5) {
      trackerColor = 'blue';
      subLabelText = 'Phase Folliculaire';
    } else if (dayInCycle <= ovulationDay) {
      trackerColor = 'purple';
      subLabelText = 'Fenêtre Fertile';
    } else {
      trackerColor = 'orange';
      subLabelText = 'Phase Lutéale';
    }
    
    return (
      <div className="flex flex-col items-center pb-2">
        <CircularTracker 
          progress={progress}
          total={settings.cycleLength}
          current={currentDay}
          label="Jour"
          subLabel={subLabelText}
          color={trackerColor}
          icon={phaseInfo.icon}
        />
      </div>
    );
  };

  const renderPregnancyView = () => {
    if (!settings.pregnancyDueDate) return null;
    const currentWeek = getPregnancyWeek(settings.pregnancyDueDate);
    const progress = Math.min((currentWeek / 40) * 100, 100);
    
    return (
      <div className="flex flex-col items-center pb-2">
        <CircularTracker 
          progress={progress}
          total={40}
          current={currentWeek}
          label="Semaine"
          subLabel="de grossesse"
          color="teal"
          icon="🤰"
        />
      </div>
    );
  };

  // --- VIEW RENDERERS ---

  const renderHomeTab = () => (
    <div className="space-y-6 animate-fade-in">
        {/* Main Tracker Visualization */}
        <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-4 relative overflow-hidden transition-all duration-500 group hover:shadow-2xl hover:shadow-slate-200/60">
           <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${settings.mode === AppMode.CYCLE ? 'from-pink-300 to-purple-400' : 'from-teal-300 to-blue-400'}`}></div>
           
           {settings.mode === AppMode.CYCLE ? renderCycleView() : renderPregnancyView()}

           <DynamicInfoWidget 
             mode={settings.mode}
             cycleDay={getCycleDay(settings.lastPeriodDate)}
             cycleLength={settings.cycleLength}
             pregnancyWeek={settings.pregnancyDueDate ? getPregnancyWeek(settings.pregnancyDueDate) : 0}
             lastPeriodDate={settings.lastPeriodDate}
           />
        </section>

        {/* Countdown & Forecast */}
        <section className="animate-slide-up">
           {settings.mode === AppMode.CYCLE ? (
             <>
                <CycleCountdownWidget 
                  lastPeriodDate={settings.lastPeriodDate}
                  cycleLength={settings.cycleLength}
                />
                <FertilityForecastWidget 
                    lastPeriodDate={settings.lastPeriodDate}
                    cycleLength={settings.cycleLength}
                />
             </>
           ) : (
             <PregnancyTipsWidget 
                week={settings.pregnancyDueDate ? getPregnancyWeek(settings.pregnancyDueDate) : 0}
             />
           )}
        </section>

        {/* AI Insight */}
        <section>
          <InsightCard 
            title={insight?.title || `Bonjour ${settings.name} !`} 
            content={insight?.content || "Analyse de vos données pour un conseil personnalisé..."}
            loading={loadingInsight}
            type={settings.mode === AppMode.CYCLE ? 'cycle' : 'pregnancy'}
          />
        </section>

        {/* Logger */}
        <section>
          <SymptomLogger 
            selectedSymptoms={todayLog.symptoms}
            selectedMood={todayLog.mood}
            sexualActivity={todayLog.sexualActivity}
            contraceptiveTaken={todayLog.contraceptiveTaken}
            libido={todayLog.libido}
            usesContraception={settings.usesContraception}
            onToggleSymptom={handleSymptomToggle}
            onSelectMood={handleMoodSelect}
            onToggleSex={() => setTodayLog(p => ({...p, sexualActivity: !p.sexualActivity}))}
            onToggleContraceptive={() => setTodayLog(p => ({...p, contraceptiveTaken: !p.contraceptiveTaken}))}
            onSelectLibido={(l) => setTodayLog(p => ({...p, libido: l}))}
          />
        </section>
    </div>
  );

  const renderCalendarTab = () => (
    <div className="animate-fade-in">
       <CalendarHistoryWidget 
          logs={historyLogs}
          settings={settings}
          onUpdateLog={handleHistoryUpdate}
       />
    </div>
  );

  const renderHealthTab = () => (
    <div className="space-y-6 animate-fade-in">
        <PartnerWidget 
              partnerName={settings.partnerName || 'Partenaire'}
              fertilityStatus={
                settings.mode === AppMode.CYCLE 
                  ? getFertilityStatus(settings.lastPeriodDate, settings.cycleLength).label 
                  : `Semaine ${settings.pregnancyDueDate ? getPregnancyWeek(settings.pregnancyDueDate) : 0}`
              }
              onSendNotification={handlePartnerNotification}
        />
        
        <MedicalHealthWidget 
            mode={settings.mode}
            isTryingToConceive={settings.isTryingToConceive}
            data={medicalData}
            onUpdate={setMedicalData}
        />
    </div>
  );

  const renderProfileTab = () => (
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 animate-slide-up space-y-6">
        <h3 className="font-bold text-2xl text-slate-700 mb-4">Paramètres</h3>
        
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
              {settings.mode === AppMode.CYCLE ? 'Date dernières règles' : 'Date prévue accouchement'}
          </label>
          <input 
            type="date" 
            className="w-full p-4 border border-slate-200 rounded-xl text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-300"
            value={
                settings.mode === AppMode.CYCLE 
                ? settings.lastPeriodDate.toISOString().split('T')[0]
                : settings.pregnancyDueDate ? settings.pregnancyDueDate.toISOString().split('T')[0] : ''
            }
            onChange={(e) => {
              if(!e.target.value) return;
              const newDate = new Date(e.target.value);
              if(settings.mode === AppMode.CYCLE) {
                  setSettings(s => ({...s, lastPeriodDate: newDate}));
              } else {
                  setSettings(s => ({...s, pregnancyDueDate: newDate}));
              }
            }}
          />
        </div>

        {settings.mode === AppMode.CYCLE && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Durée moyenne du cycle (Jours)
              </label>
              <input 
                type="number" 
                className="w-full p-4 border border-slate-200 rounded-xl text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={settings.cycleLength}
                onChange={(e) => setSettings(s => ({...s, cycleLength: parseInt(e.target.value) || 28}))}
              />
            </div>
        )}

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">Mode Essai bébé 👶</span>
              <span className="text-xs text-slate-500">Active les conseils fertilité et HCG</span>
          </div>
          <button 
          onClick={() => setSettings(s => ({...s, isTryingToConceive: !s.isTryingToConceive, usesContraception: !s.isTryingToConceive ? false : s.usesContraception}))}
          className={`w-12 h-6 rounded-full transition-colors relative ${settings.isTryingToConceive ? 'bg-green-400' : 'bg-slate-300'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.isTryingToConceive ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>
        
        <button 
          onClick={() => setShowProfileModal(true)}
          className="w-full py-4 border border-slate-200 rounded-xl text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 transition"
        >
            Gérer mon Profil & Partage Duo
        </button>

        <div className="pt-4 border-t border-slate-100">
             <p className="text-xs text-slate-400 text-center">Version 1.2.0 • LunaFlow</p>
        </div>
      </div>
  );

  // --- MAIN RENDER ---
  
  if (!settings.hasCompletedOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce whitespace-nowrap">
          {notification}
        </div>
      )}

      {/* Modal */}
      {showProfileModal && (
        <ProfileModal 
            settings={settings}
            onSave={(newSettings) => setSettings(newSettings)}
            onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Header (Visible on all tabs except potentially full screen modals) */}
      <header className="px-6 py-6 flex justify-between items-center sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition transform ${settings.mode === AppMode.CYCLE ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gradient-to-br from-teal-400 to-emerald-600'}`}>
            {settings.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600 leading-none">
                LunaFlow
            </h1>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">
                {settings.isConnectedToPartner ? `Lié à ${settings.partnerName}` : 'Mode Solo'}
            </span>
          </div>
        </div>
        <button 
          onClick={toggleMode}
          className="text-xs font-semibold px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
        >
          {settings.mode === AppMode.CYCLE ? '→ Grossesse' : '→ Cycle'}
        </button>
      </header>

      {/* Dynamic Main Content */}
      <main className="max-w-md mx-auto px-4 pt-6">
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'calendar' && renderCalendarTab()}
        {activeTab === 'health' && renderHealthTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 pb-safe pt-2 z-40">
        <div className="max-w-md mx-auto flex justify-around items-center">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center p-2 w-16 transition-all ${activeTab === 'home' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <span className={`text-2xl transition-transform ${activeTab === 'home' ? 'scale-110' : ''}`}>🏠</span>
               <span className="text-[10px] font-bold mt-1">Accueil</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`flex flex-col items-center p-2 w-16 transition-all ${activeTab === 'calendar' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <span className={`text-2xl transition-transform ${activeTab === 'calendar' ? 'scale-110' : ''}`}>📅</span>
               <span className="text-[10px] font-bold mt-1">Journal</span>
            </button>

            <button 
              onClick={() => setActiveTab('health')}
              className={`flex flex-col items-center p-2 w-16 transition-all ${activeTab === 'health' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <span className={`text-2xl transition-transform ${activeTab === 'health' ? 'scale-110' : ''}`}>❤️</span>
               <span className="text-[10px] font-bold mt-1">Santé</span>
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center p-2 w-16 transition-all ${activeTab === 'profile' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <span className={`text-2xl transition-transform ${activeTab === 'profile' ? 'scale-110' : ''}`}>👤</span>
               <span className="text-[10px] font-bold mt-1">Profil</span>
            </button>
        </div>
      </nav>

    </div>
  );
};

export default App;
