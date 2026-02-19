import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  Users, FileText, TrendingUp, ShieldCheck, Activity, DollarSign, 
  ArrowUpRight, UserPlus 
} from 'lucide-react';
import { formatPrice } from '../types';

// Définition des prix pour le calcul (approximatif en FCFA pour l'affichage)
const PLAN_PRICES = {
  starter: 0,
  pro: 6000,    // ~9$
  business: 15000 // ~25$
};

const Admin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvoices: 0,
    mrr: 0,
    planDistribution: { starter: 0, pro: 0, business: 0 },
    users: [] as any[],
    recentActivity: [] as any[]
  });

  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    setLoading(true);
    
    try {
        // 1. Récupérer TOUS les profils (Vrais utilisateurs)
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profileError) throw profileError;

        // 2. Récupérer TOUTES les factures (Vrai volume)
        const { count: invoiceCount, error: invError } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true });

        if (invError) throw invError;

        // 3. Calculs des Stats
        let calculatedMRR = 0;
        let counts = { starter: 0, pro: 0, business: 0 };
        
        const formattedUsers = profiles?.map(user => {
            const plan = (user.plan || 'starter') as keyof typeof PLAN_PRICES;
            const revenue = PLAN_PRICES[plan] || 0;
            
            // Stats globales
            calculatedMRR += revenue;
            counts[plan] = (counts[plan] || 0) + 1;

            return {
                id: user.id,
                name: user.full_name || 'Utilisateur',
                email: user.email,
                plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                status: 'active', // Par défaut actif
                joined: new Date(user.created_at).toLocaleDateString('fr-FR'),
                revenue: revenue
            };
        }) || [];

        // 4. Créer un faux flux d'activité basé sur les inscriptions réelles
        const activities = profiles?.slice(0, 5).map(user => ({
            id: user.id,
            user: user.full_name || user.email?.split('@')[0],
            action: 'Inscription',
            time: new Date(user.created_at).toLocaleDateString('fr-FR'),
            amount: '-'
        })) || [];

        setStats({
            totalUsers: profiles?.length || 0,
            totalInvoices: invoiceCount || 0,
            mrr: calculatedMRR,
            planDistribution: counts,
            users: formattedUsers,
            recentActivity: activities
        });

    } catch (error) {
        console.error("Erreur chargement admin:", error);
    } finally {
        setLoading(false);
    }
  };

  // Composant Graphique Barre (Simulé pour l'instant)
  const SimpleChart = () => (
    <div className="flex items-end justify-between h-32 gap-2 mt-4 opacity-50">
      <div className="w-full text-center text-xs text-slate-400">Graphique en attente de plus de données</div>
    </div>
  );

  if (loading) return <div className="p-20 text-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto"></div></div>;

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
              <p className="text-slate-500">Données réelles de la base de données.</p>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Revenu Mensuel (Est.)</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{formatPrice(stats.mrr, 'XOF')}</h3>
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Réel
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Utilisateurs Inscrits</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalUsers}</h3>
            </div>
            <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Factures</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalInvoices}</h3>
            </div>
            <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Clients Payants</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {stats.planDistribution.pro + stats.planDistribution.business}
              </h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* GRILLE PRINCIPALE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE : LISTE UTILISATEURS */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Utilisateurs ({stats.totalUsers})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Utilisateur</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Inscrit le</th>
                    <th className="px-6 py-4 text-right">Valeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs uppercase">
                            {u.name?.charAt(0) || 'U'}
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
                      <td className="px-6 py-4 text-slate-500">
                        {u.joined}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        {formatPrice(u.revenue, 'XOF')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* COLONNE DROITE : RÉPARTITION */}
        <div className="space-y-8">
          
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold mb-1">Répartition</h3>
              <p className="text-slate-400 text-sm mb-6">Abonnés par plan (Réel)</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Starter</span>
                    <span className="text-slate-400">{stats.planDistribution.starter}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-500" style={{ width: `${(stats.planDistribution.starter / stats.totalUsers) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-brand-400 font-medium">Pro</span>
                    <span className="text-brand-400">{stats.planDistribution.pro}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${(stats.planDistribution.pro / stats.totalUsers) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-violet-400 font-medium">Business</span>
                    <span className="text-violet-400">{stats.planDistribution.business}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500" style={{ width: `${(stats.planDistribution.business / stats.totalUsers) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
             <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-600" /> Derniers inscrits
            </h3>
            <div className="space-y-4">
                {stats.recentActivity.map((act, i) => (
                    <div key={i} className="flex gap-3 items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <div className="text-sm">
                            <p className="font-semibold text-slate-900">{act.user}</p>
                            <p className="text-xs text-slate-400">{act.time}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Admin;