import React, { useState, useMemo } from 'react';
import { Invoice, User, AppRoute, formatPrice } from '../types';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  ArrowRight, 
  CalendarRange, 
  Briefcase, 
  Lock, 
  Crown,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  user: User;
  onNavigate: (route: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, user, onNavigate }) => {
  const isBusiness = user.plan === 'business';
  
  // --- STATE POUR LE FILTRE PERSONNALISÉ (BUSINESS) ---
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Début du mois
    end: new Date().toISOString().split('T')[0] // Aujourd'hui
  });

  const formatMoney = (amount: number) => formatPrice(amount, user.currency);

  // --- CALCULS STATISTIQUES ---
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Stats Globales (Visibles par tous)
    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0);
    
    const pendingAmount = invoices
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.total, 0);

    const activeClients = new Set(invoices.map(i => i.clientName)).size;

    // 2. Stats Temporelles (Business Only)
    const revenueToday = invoices
      .filter(i => i.status === 'paid' && i.date === todayStr)
      .reduce((sum, i) => sum + i.total, 0);

    const revenueMonth = invoices
      .filter(i => {
        const d = new Date(i.date);
        return i.status === 'paid' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, i) => sum + i.total, 0);

    const revenueYear = invoices
      .filter(i => {
        const d = new Date(i.date);
        return i.status === 'paid' && d.getFullYear() === currentYear;
      })
      .reduce((sum, i) => sum + i.total, 0);

    // 3. Stats Personnalisées (Business Only)
    const revenueCustom = invoices
      .filter(i => {
        return i.status === 'paid' && i.date >= customRange.start && i.date <= customRange.end;
      })
      .reduce((sum, i) => sum + i.total, 0);

    // 4. Top Clients (Business Only)
    const clientMap = new Map<string, { count: number; total: number }>();
    invoices.forEach(inv => {
        if (inv.status === 'paid') {
            const current = clientMap.get(inv.clientName) || { count: 0, total: 0 };
            clientMap.set(inv.clientName, {
                count: current.count + 1,
                total: current.total + inv.total
            });
        }
    });

    const topClients = Array.from(clientMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    return {
      totalRevenue,
      pendingAmount,
      invoiceCount: invoices.length,
      activeClients,
      revenueToday,
      revenueMonth,
      revenueYear,
      revenueCustom,
      topClients
    };
  }, [invoices, customRange]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-display">Bonjour, {user.name.split(' ')[0]} 👋</h2>
          <p className="text-slate-500 mt-1">Voici un aperçu de votre activité.</p>
        </div>
        <button 
          onClick={() => onNavigate(AppRoute.CREATE_INVOICE)}
          className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/25 active:scale-95 flex items-center gap-2"
        >
          <FileText className="w-5 h-5" />
          Nouvelle Facture
        </button>
      </div>

      {/* --- SECTION 1 : VUE D'ENSEMBLE (TOUT LE MONDE) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CA TOTAL */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between group hover:shadow-float transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-emerald-700 font-bold text-xs uppercase tracking-wide bg-emerald-50 px-2 py-1 rounded-full">CA Total</span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">{formatMoney(stats.totalRevenue)}</h3>
            <p className="text-xs text-slate-400 mt-1">Total encaissé à ce jour</p>
          </div>
        </div>

        {/* EN ATTENTE */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between group hover:shadow-float transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
            <span className="text-amber-700 font-bold text-xs uppercase tracking-wide bg-amber-50 px-2 py-1 rounded-full">En attente</span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">{formatMoney(stats.pendingAmount)}</h3>
            <p className="text-xs text-slate-400 mt-1">Factures envoyées non payées</p>
          </div>
        </div>

        {/* CLIENTS */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between group hover:shadow-float transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-blue-700 font-bold text-xs uppercase tracking-wide bg-blue-50 px-2 py-1 rounded-full">Clients</span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">{stats.activeClients}</h3>
            <p className="text-xs text-slate-400 mt-1">Clients facturés au total</p>
          </div>
        </div>
      </div>

      {/* --- SECTION 2 : BUSINESS INTELLIGENCE (BUSINESS ONLY) --- */}
      <div className="relative pt-8 border-t border-slate-200/50">
        <div className="flex items-center gap-3 mb-6">
            <Crown className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-slate-900">Analyses Détaillées</h3>
            {!isBusiness && (
                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Business
                </span>
            )}
        </div>

        {/* CONTENEUR AVEC FLOUTAGE SI PAS BUSINESS */}
        <div className={`space-y-8 transition-all duration-500 ${!isBusiness ? 'blur-md select-none opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            
            {/* 2.1 - KPI TEMPORELS PRECIS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Aujourd'hui */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Aujourd'hui</p>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className="text-2xl font-bold text-slate-900">{formatMoney(stats.revenueToday)}</span>
                    </div>
                </div>
                {/* Ce Mois */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Ce mois-ci</p>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className="text-2xl font-bold text-slate-900">{formatMoney(stats.revenueMonth)}</span>
                    </div>
                </div>
                {/* Cette Année */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Cette année</p>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className="text-2xl font-bold text-slate-900">{formatMoney(stats.revenueYear)}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 2.2 - SÉLECTEUR DE PÉRIODE */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Filter className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-900">Période personnalisée</h4>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Du</label>
                            <input 
                                type="date" 
                                value={customRange.start}
                                onChange={(e) => setCustomRange(prev => ({...prev, start: e.target.value}))}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Au</label>
                            <input 
                                type="date" 
                                value={customRange.end}
                                onChange={(e) => setCustomRange(prev => ({...prev, end: e.target.value}))}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium text-slate-700"
                            />
                        </div>
                        
                        <div className="pt-6 mt-2">
                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 text-center">
                                <p className="text-xs font-medium text-purple-600 mb-1 uppercase tracking-wide">Résultat de la période</p>
                                <p className="text-2xl font-bold text-purple-900">{formatMoney(stats.revenueCustom)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2.3 - TOP CLIENTS */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Meilleurs Clients</h4>
                                <p className="text-xs text-slate-500">Top 5 par chiffre d'affaires</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto p-2">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-50/80">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg font-semibold">Rang</th>
                                    <th className="px-4 py-3 font-semibold">Nom du client</th>
                                    <th className="px-4 py-3 text-center font-semibold">Factures</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg font-semibold">Total Généré</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.topClients.length > 0 ? (
                                    stats.topClients.map((client, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-4">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                                    index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400/20' : 
                                                    index === 1 ? 'bg-slate-200 text-slate-600' : 
                                                    index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 font-bold text-slate-700 group-hover:text-slate-900">
                                                {client.name}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                    {client.count}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-slate-900">
                                                {formatMoney(client.total)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                                            <CalendarRange className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            Pas encore de données clients.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        {/* OVERLAY DE BLOCAGE (SI PAS BUSINESS) */}
        {!isBusiness && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center top-20">
                <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/50 max-w-md text-center transform hover:scale-105 transition-all duration-300 ring-1 ring-slate-900/5">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 font-display">Débloquez la Puissance Business</h3>
                    <p className="text-slate-600 mb-8 leading-relaxed text-sm">
                        Accédez à des analyses financières précises (Jour/Mois/Année) et identifiez vos meilleurs clients pour faire croître votre chiffre d'affaires.
                    </p>
                    <button 
                        onClick={() => onNavigate(AppRoute.PRICING)}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Passer au plan Business <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

      </div>

      {/* ACTIVITÉ RÉCENTE (TOUT LE MONDE) */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Dernières factures</h3>
            </div>
            <button 
                onClick={() => onNavigate(AppRoute.INVOICES)}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
            >
                Voir tout
            </button>
          </div>
          <div className="p-4">
            {invoices.length === 0 ? (
                 <div className="text-center py-8 text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune activité récente</p>
                 </div>
            ) : (
                <div className="space-y-3">
                    {[...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((inv) => (
                    <div 
                        key={inv.id} 
                        className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-soft border border-transparent hover:border-slate-100 rounded-2xl transition-all cursor-pointer" 
                        onClick={() => onNavigate(AppRoute.INVOICES)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 
                                inv.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                                'bg-slate-200 text-slate-500'
                            }`}>
                                {inv.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : 
                                 inv.status === 'pending' ? <Clock className="w-5 h-5" /> : 
                                 <FileText className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{inv.clientName}</p>
                                <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                    <span>{inv.number}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span>{new Date(inv.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-slate-900">{formatMoney(inv.total)}</p>
                            <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpRight className="w-3 h-3 text-slate-400" />
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;