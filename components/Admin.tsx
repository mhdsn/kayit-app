import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Users, FileText, TrendingUp, ShieldCheck, Activity, DollarSign } from 'lucide-react';
import { formatPrice } from '../types';

const Admin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribers: { pro: 0, business: 0 },
    totalInvoices: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    
    // 1. Récupérer le nombre total de factures (Preuve d'activité)
    const { count: invoiceCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    // 2. Pour les utilisateurs et les plans, on doit faire une astuce car on n'a pas de table 'profiles'.
    // On va récupérer tous les utilisateurs via une fonction RPC si possible, 
    // sinon on va scanner les factures uniques pour estimer les utilisateurs actifs.
    
    // 👉 NOTE : Pour avoir le VRAI nombre d'inscrits et de revenus, 
    // tu devras créer une table 'users' publique synchronisée avec Auth.
    // Pour l'instant, simulons avec les données qu'on peut atteindre.
    
    // Simulation réaliste pour ton démo (A remplacer par une vraie table profiles plus tard)
    setStats({
      totalUsers: 12, // Exemple statique ou à connecter plus tard
      activeSubscribers: { pro: 3, business: 1 },
      totalInvoices: invoiceCount || 0,
      revenue: (3 * 9) + (1 * 25) // Calcul basé sur les prix (Pro $9 + Business $25)
    });

    setLoading(false);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  if (loading) return <div className="p-10 text-center">Chargement des données secrètes...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-slate-900 rounded-xl shadow-lg">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-slate-900 font-display">Tour de Contrôle</h1>
            <p className="text-slate-500">Vue globale sur la performance de Kayit.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
            title="Utilisateurs Totaux" 
            value={stats.totalUsers} 
            icon={Users} 
            color="bg-blue-500" 
            subtext="Inscrits sur la plateforme"
        />
        <StatCard 
            title="Factures Générées" 
            value={stats.totalInvoices} 
            icon={FileText} 
            color="bg-violet-500" 
            subtext="Volume global d'activité"
        />
        <StatCard 
            title="Abonnés Payants" 
            value={stats.activeSubscribers.pro + stats.activeSubscribers.business} 
            icon={Activity} 
            color="bg-brand-500" 
            subtext={`${stats.activeSubscribers.pro} Pro / ${stats.activeSubscribers.business} Business`}
        />
        <StatCard 
            title="Revenu Mensuel (MRR)" 
            value={formatPrice(stats.revenue * 600, 'XOF')} // Conversion approx en FCFA pour le fun
            icon={DollarSign} 
            color="bg-emerald-500" 
            subtext="Estimation récurrente"
        />
      </div>

      {/* Section Graphique ou Liste (Placeholder) */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" /> 
                Utilisateurs en Simultané
            </h3>
            <div className="flex items-end gap-2">
                <span className="text-6xl font-bold text-emerald-400">1</span>
                <span className="text-slate-400 mb-2 font-medium">personne (Toi)</span>
            </div>
            <p className="text-slate-400 text-sm mt-4 max-w-md">
                Pour voir les utilisateurs en temps réel, nous devons intégrer <strong>Google Analytics</strong> ou activer <strong>Supabase Presence</strong>.
            </p>
          </div>
          
          {/* Décoration d'arrière plan */}
          <div className="absolute right-0 bottom-0 opacity-10">
              <Activity className="w-64 h-64 text-white" />
          </div>
      </div>
    </div>
  );
};

export default Admin;