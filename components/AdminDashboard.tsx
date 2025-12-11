import React, { useEffect, useState } from 'react';
import { AdminStats, AdminUserSummary, AppMode } from '../types';
import { fetchAdminStats, fetchUserList } from '../services/mockDatabase';

interface AdminDashboardProps {
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, usersData] = await Promise.all([
          fetchAdminStats(),
          fetchUserList()
        ]);
        setStats(statsData);
        setUsers(usersData);
      } catch (e) {
        console.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold">Chargement des données chiffrées...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar / Navbar */}
      <nav className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500 p-2 rounded-lg font-bold">LF</div>
          <div>
            <h1 className="font-bold text-lg leading-none">LunaFlow Admin</h1>
            <p className="text-[10px] text-slate-400">Panel Praticien & Support</p>
          </div>
        </div>
        <button 
          onClick={onExit}
          className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 transition"
        >
          Quitter
        </button>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs text-slate-400 font-bold uppercase">Utilisatrices Totales</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{stats.totalUsers}</p>
            <span className="text-xs text-green-500 font-medium">+12% ce mois-ci</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs text-slate-400 font-bold uppercase">Grossesses Actives</p>
            <p className="text-3xl font-bold text-teal-600 mt-2">{stats.activePregnancies}</p>
            <span className="text-xs text-slate-500">Suivi hebdomadaire</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <p className="text-xs text-slate-400 font-bold uppercase">En Essai Bébé</p>
             <p className="text-3xl font-bold text-purple-600 mt-2">{stats.tryingToConceive}</p>
             <span className="text-xs text-slate-500">Besoin de conseils fertilité</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden">
             <div className="absolute right-0 top-0 w-16 h-16 bg-red-500/10 rounded-bl-full"></div>
             <p className="text-xs text-red-400 font-bold uppercase">Alertes Médicales</p>
             <p className="text-3xl font-bold text-red-600 mt-2">{stats.alertsTriggered}</p>
             <p className="text-xs text-red-500 mt-1 font-medium">Retards non justifiés &gt; 7j</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart: Symptom Distribution */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg mb-6">Répartition des Symptômes (24h)</h3>
                <div className="space-y-4">
                    {(Object.entries(stats.symptomDistribution) as [string, number][])
                       .sort((a,b) => b[1] - a[1])
                       .slice(0, 5) // Top 5
                       .map(([name, count], index) => (
                           <div key={name}>
                               <div className="flex justify-between text-sm mb-1">
                                   <span className="font-medium text-slate-600">{name}</span>
                                   <span className="font-bold text-slate-800">{count}</span>
                               </div>
                               <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                   <div 
                                     className={`h-full rounded-full ${index === 0 ? 'bg-rose-500' : 'bg-slate-400'}`}
                                     style={{ width: `${(count / 400) * 100}%` }}
                                   ></div>
                               </div>
                           </div>
                       ))
                    }
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg mb-4">Actions Rapides</h3>
                <div className="space-y-3">
                    <button className="w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-100 transition text-left flex justify-between">
                        <span>Envoyer Push Notification (Tous)</span>
                        <span>🔔</span>
                    </button>
                    <button className="w-full py-3 px-4 bg-teal-50 text-teal-700 font-bold rounded-xl text-sm hover:bg-teal-100 transition text-left flex justify-between">
                        <span>Exporter Données (CSV)</span>
                        <span>📂</span>
                    </button>
                    <button className="w-full py-3 px-4 bg-slate-50 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-100 transition text-left flex justify-between">
                        <span>Maintenance Système</span>
                        <span>⚙️</span>
                    </button>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                    <p className="text-xs font-bold text-yellow-800 uppercase mb-1">État du système</p>
                    <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-sm font-medium text-yellow-900">Base de données synchronisée</span>
                    </div>
                </div>
            </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg">Dernières Activités Utilisatrices</h3>
                <input type="text" placeholder="Rechercher une patiente..." className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-rose-200" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-4">Nom</th>
                            <th className="px-6 py-4">Mode</th>
                            <th className="px-6 py-4">Statut Cycle</th>
                            <th className="px-6 py-4">État</th>
                            <th className="px-6 py-4">Dernière activité</th>
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 transition">
                                <td className="px-6 py-4 font-bold text-slate-700">
                                    {user.name} <span className="text-slate-400 font-normal ml-1">({user.age} ans)</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.mode === AppMode.PREGNANCY ? 'bg-teal-100 text-teal-700' : 'bg-pink-100 text-pink-700'}`}>
                                        {user.mode === AppMode.PREGNANCY ? 'Grossesse' : 'Cycle'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.mode === AppMode.CYCLE 
                                      ? `J-${user.cycleDayOrWeek}` 
                                      : `Semaine ${user.cycleDayOrWeek}`}
                                    {user.status === 'alert' && <span className="ml-2 text-xs">⚠️</span>}
                                </td>
                                <td className="px-6 py-4">
                                     {user.status === 'alert' 
                                        ? <span className="text-red-500 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Alerte Retard</span>
                                        : <span className="text-green-500 font-medium flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Normal</span>
                                     }
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {user.lastActive}
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline">Dossier</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 font-medium cursor-pointer hover:text-slate-600">
                Voir toutes les utilisatrices ↓
            </div>
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;