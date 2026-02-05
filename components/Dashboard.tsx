import React, { useState, useMemo } from 'react';
import { Invoice, User, AppRoute, formatPrice } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Briefcase, 
  Lock, 
  Crown,
  Filter,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  user: User;
  onNavigate: (route: string) => void;
}

type Period = 'day' | 'month' | 'year' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ invoices, user, onNavigate }) => {
  const isBusiness = user.plan === 'business';
  
  // --- STATES ---
  const [period, setPeriod] = useState<Period>('month');
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const formatMoney = (amount: number) => formatPrice(amount, user.currency);

  // --- KPI GLOBAUX (Pour tous) ---
  const globalStats = useMemo(() => {
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0);
    const activeClients = new Set(invoices.map(i => i.clientName)).size;
    return { totalRevenue, pendingAmount, activeClients };
  }, [invoices]);

  // --- DONNÉES DU GRAPHIQUE (Business Only) ---
  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayStr = now.toISOString().split('T')[0];

    let data: { name: string; amount: number; fullDate: string }[] = [];
    const paidInvoices = invoices.filter(i => i.status === 'paid');

    if (period === 'day') {
       // Pour "Ce jour", on affiche simplement un point unique pour l'instant (ou heure par heure si on avait l'info)
       const amount = paidInvoices
        .filter(i => i.date === todayStr)
        .reduce((sum, i) => sum + i.total, 0);
       data = [{ name: 'Aujourd\'hui', amount, fullDate: todayStr }];
    } 
    else if (period === 'month') {
        // Vue par JOUR du mois (1..31)
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const amount = paidInvoices
                .filter(i => i.date === dateStr)
                .reduce((sum, i) => sum + i.total, 0);
            data.push({ name: String(d), amount, fullDate: dateStr });
        }
    } 
    else if (period === 'year') {
        // Vue par MOIS de l'année (Jan..Déc)
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        data = months.map((m, index) => {
            const amount = paidInvoices
                .filter(i => {
                    const d = new Date(i.date);
                    return d.getFullYear() === currentYear && d.getMonth() === index;
                })
                .reduce((sum, i) => sum + i.total, 0);
            return { name: m, amount, fullDate: `${m} ${currentYear}` };
        });
    } 
    else if (period === 'custom') {
        // Vue par JOUR sur la période perso
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        
        // Sécurité pour éviter boucle infinie si dates invalides
        if (start <= end) {
            for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const amount = paidInvoices
                    .filter(i => i.date === dateStr)
                    .reduce((sum, i) => sum + i.total, 0);
                data.push({ 
                    name: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), 
                    amount, 
                    fullDate: dateStr 
                });
            }
        }
    }

    return data;
  }, [invoices, period, customRange]);

  // Total sur la période sélectionnée
  const periodTotal = useMemo(() => chartData.reduce((acc, item) => acc + item.amount, 0), [chartData]);

  // --- TOP CLIENTS DÉTAILLÉ ---
  const topClients = useMemo(() => {
    const clientMap = new Map<string, { count: number; total: number; lastDate: string }>();
    invoices.filter(i => i.status === 'paid').forEach(inv => {
        const current = clientMap.get(inv.clientName) || { count: 0, total: 0, lastDate: inv.date };
        clientMap.set(inv.clientName, {
            count: current.count + 1,
            total: current.total + inv.total,
            lastDate: inv.date > current.lastDate ? inv.date : current.lastDate
        });
    });
    return Array.from(clientMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Top 5
  }, [invoices]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-display">Bonjour, {user.name.split(' ')[0]} 👋</h2>
          <p className="text-slate-500 mt-1">Vos performances en un coup d'œil.</p>
        </div>
        <button 
          onClick={() => onNavigate(AppRoute.CREATE_INVOICE)}
          className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/25 active:scale-95 flex items-center gap-2"
        >
          <FileText className="w-5 h-5" />
          Nouvelle Facture
        </button>
      </div>

      {/* --- KPI GLOBAUX --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4 hover:shadow-float transition-all group">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">CA Total Encaissé</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatMoney(globalStats.totalRevenue)}</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4 hover:shadow-float transition-all group">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Briefcase className="w-8 h-8" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">En attente</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatMoney(globalStats.pendingAmount)}</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4 hover:shadow-float transition-all group">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">Clients actifs</p>
                <h3 className="text-2xl font-bold text-slate-900">{globalStats.activeClients}</h3>
            </div>
        </div>
      </div>

      {/* --- SECTION BUSINESS (GRAPHIQUE + DÉTAILS) --- */}
      <div className="relative pt-6 border-t border-slate-200/60">
        
        {/* Titre & Filtres */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-slate-900">Analyse Détaillée</h3>
                {!isBusiness && <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded border">Business Only</span>}
            </div>
            
            {/* Filtres de Période */}
            <div className={`flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-x-auto ${!isBusiness ? 'opacity-50 pointer-events-none' : ''}`}>
                {(['day', 'month', 'year', 'custom'] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                            period === p 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        {p === 'day' ? 'Ce jour' : p === 'month' ? 'Ce mois' : p === 'year' ? 'Cette année' : 'Perso'}
                    </button>
                ))}
            </div>
        </div>

        {/* Filtre Custom (si activé) */}
        {period === 'custom' && isBusiness && (
            <div className="flex items-center gap-4 mb-6 bg-white p-3 rounded-xl border border-slate-200 w-fit shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Du</span>
                    <input type="date" value={customRange.start} onChange={e => setCustomRange(prev => ({...prev, start: e.target.value}))} className="text-sm bg-slate-50 border-none rounded-md px-2 py-1 focus:ring-2 focus:ring-purple-500/20 outline-none" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Au</span>
                    <input type="date" value={customRange.end} onChange={e => setCustomRange(prev => ({...prev, end: e.target.value}))} className="text-sm bg-slate-50 border-none rounded-md px-2 py-1 focus:ring-2 focus:ring-purple-500/20 outline-none" />
                </div>
            </div>
        )}

        {/* Contenu Principal (Flouté si pas Business) */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-500 ${!isBusiness ? 'blur-md select-none opacity-40 grayscale-[0.5] pointer-events-none' : ''}`}>
            
            {/* GRAPHIQUE */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-100 flex flex-col h-[420px]">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-slate-500">Revenus sur la période</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatMoney(periodTotal)}</h4>
                    </div>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>
                <div className="flex-1 p-4 w-full h-full">
                    {chartData.length > 0 && periodTotal > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 11}} 
                                    dy={10}
                                    interval={period === 'month' ? 2 : 0} // Pour éviter de surcharger l'axe
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 11}} 
                                    tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                                    width={35}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value: number) => [formatMoney(value), 'CA']}
                                    labelStyle={{ color: '#64748b', marginBottom: '0.25rem', fontSize: '12px' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#8b5cf6" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorRevenue)" 
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Calendar className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">Aucune donnée pour cette période</p>
                        </div>
                    )}
                </div>
            </div>

            {/* TOP CLIENTS */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 flex flex-col h-[420px]">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Top Clients
                    </h4>
                    <span className="text-xs text-slate-400">Par CA</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {topClients.length > 0 ? (
                        topClients.map((client, index) => (
                            <div key={index} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                        index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                        index === 1 ? 'bg-slate-100 text-slate-600' : 
                                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 truncate max-w-[100px]">{client.name}</p>
                                        <p className="text-[10px] text-slate-400">{client.count} factures</p>
                                    </div>
                                </div>
                                <div className="text-right flex-1 ml-2">
                                    <p className="text-sm font-bold text-slate-900">{formatMoney(client.total)}</p>
                                    {/* Barre de progression relative au meilleur client */}
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div 
                                            className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                                            style={{ width: `${(client.total / topClients[0].total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <p className="text-sm">Pas encore de clients.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>

        {/* OVERLAY SI PAS BUSINESS */}
        {!isBusiness && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center top-20">
                <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/50 max-w-md text-center transform hover:scale-105 transition-all duration-300 ring-1 ring-slate-900/5">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 font-display">Business Intelligence</h3>
                    <p className="text-slate-600 mb-8 leading-relaxed text-sm">
                        Analysez vos performances avec des graphiques interactifs (Jour/Mois/Année) et découvrez vos meilleurs clients.
                    </p>
                    <button 
                        onClick={() => onNavigate(AppRoute.PRICING)}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Passer Business <ArrowRight className="w-4 h-4" />
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