import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  Users, FileText, TrendingUp, ShieldCheck, Activity, DollarSign, 
  Search, Download, MoreHorizontal, ArrowUpRight, ArrowDownRight, UserPlus, CreditCard 
} from 'lucide-react';
import { formatPrice } from '../types';

const Admin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'finance'>('overview');
  
  // Données simulées pour l'exemple (en attendant la connexion finale BDD)
  const [stats, setStats] = useState({
    totalUsers: 12,
    totalInvoices: 0,
    mrr: 31200,
    growth: +12.5,
    churn: 2.1,
    users: [
      { id: 1, name: 'Mouhamed Sene', email: 'junior10metzo@gmail.com', plan: 'Business', status: 'active', joined: '2026-01-15', revenue: 15000 },
      { id: 2, name: 'Jean Dupont', email: 'jean.d@example.com', plan: 'Pro', status: 'active', joined: '2026-02-01', revenue: 5400 },
      { id: 3, name: 'Aminata Diallo', email: 'amy.design@example.com', plan: 'Starter', status: 'inactive', joined: '2026-02-03', revenue: 0 },
      { id: 4, name: 'Tech Solutions', email: 'contact@techsol.sn', plan: 'Business', status: 'active', joined: '2026-02-05', revenue: 15000 },
      { id: 5, name: 'Boulangerie Mbour', email: 'pain@mbour.sn', plan: 'Pro', status: 'warning', joined: '2026-02-07', revenue: 5400 },
    ],
    recentActivity: [
      { id: 1, user: 'Mouhamed Sene', action: 'Facture créée', amount: '750 000 FCFA', time: 'Il y a 2 min' },
      { id: 2, user: 'Jean Dupont', action: 'Abonnement Pro', amount: '9 $US', time: 'Il y a 15 min' },
      { id: 3, user: 'Nouveau Visiteur', action: 'Inscription', amount: '-', time: 'Il y a 1h' },
      { id: 4, user: 'Tech Solutions', action: 'Connexion', amount: '-', time: 'Il y a 3h' },
    ]
  });

  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    setLoading(true);
    // On récupère au moins le vrai nombre de factures pour mixer avec la simulation
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
    
    setStats(prev => ({
      ...prev,
      totalInvoices: count || 0
    }));
    setLoading(false);
  };

  // Composant Graphique Barre (CSS pur)
  const SimpleChart = () => (
    <div className="flex items-end justify-between h-32 gap-2 mt-4">
      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
        <div key={i} className="w-full bg-slate-100 rounded-t-sm relative group overflow-hidden">
          <div 
            className="absolute bottom-0 w-full bg-brand-500 transition-all duration-1000 group-hover:bg-brand-400" 
            style={{ height: `${h}%` }} 
          ></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/20">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
              <h1 className="text-3xl font-bold text-slate-900 font-display">Tour de Contrôle</h1>
              <p className="text-slate-500">Vue globale sur la performance de Kayit.</p>
          </div>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          {(['overview', 'users', 'finance'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Revenu Mensuel (MRR)</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{formatPrice(stats.mrr, 'XOF')}</h3>
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-1" /> {stats.growth}%
            </span>
          </div>
          <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[70%]"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Utilisateurs Actifs</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalUsers}</h3>
            </div>
            <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">+3 inscrits cette semaine</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Volume Facturé</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalInvoices}</h3>
            </div>
            <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Sur la plateforme globale</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Taux d'Abonnement</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">33%</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">4 payants / 12 totaux</p>
        </div>
      </div>

      {/* SECTION PRINCIPALE (GRILLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE (LARGE) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* GRAPHIQUE */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" /> Croissance des revenus
              </h3>
              <select className="text-xs border-none bg-slate-50 rounded-lg px-2 py-1 text-slate-600 font-medium outline-none cursor-pointer">
                <option>Cette année</option>
                <option>Ce mois</option>
              </select>
            </div>
            <SimpleChart />
            <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
              <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span>
              <span>Juil</span><span>Août</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Déc</span>
            </div>
          </div>

          {/* TABLEAU UTILISATEURS */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Derniers Inscrits</h3>
              <button className="text-xs font-bold text-brand-600 hover:text-brand-700">Voir tout</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Utilisateur</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">LTV (Valeur)</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                          u.plan === 'Business' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                          u.plan === 'Pro' ? 'bg-brand-50 text-brand-700 border-brand-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                          <span className="text-slate-600 capitalize">{u.status === 'active' ? 'Actif' : 'Inactif'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        {formatPrice(u.revenue, 'XOF')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* COLONNE DROITE (WIDGETS) */}
        <div className="space-y-8">
          
          {/* ACTIVITÉ RÉCENTE */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-600" /> Flux en direct
            </h3>
            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:h-full before:w-0.5 before:bg-slate-100">
              {stats.recentActivity.map((act, i) => (
                <div key={i} className="relative flex gap-4">
                  <div className={`w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10 ${
                    act.action.includes('Abonnement') ? 'bg-emerald-500 text-white' :
                    act.action.includes('Facture') ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {act.action.includes('Abonnement') ? <DollarSign className="w-3 h-3" /> : 
                     act.action.includes('Facture') ? <FileText className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                  </div>
                  <div>
                    <p className="text-sm text-slate-900">
                      <span className="font-semibold">{act.user}</span> • <span className="text-slate-600">{act.action}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{act.time}</p>
                    {act.amount !== '-' && (
                      <span className="inline-block mt-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {act.amount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RÉPARTITION DES PLANS */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold mb-1">Répartition</h3>
              <p className="text-slate-400 text-sm mb-6">Abonnés par plan</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Starter (Gratuit)</span>
                    <span className="text-slate-400">65%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-500 w-[65%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-brand-400 font-medium">Pro</span>
                    <span className="text-brand-400">25%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 w-[25%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-violet-400 font-medium">Business</span>
                    <span className="text-violet-400">10%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 w-[10%]"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cercle déco */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Admin;