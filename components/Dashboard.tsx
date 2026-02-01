import React, { useState, useMemo } from 'react';
import { Invoice, User, AppRoute, formatPrice } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Wallet, 
  FileText, 
  Plus, 
  CalendarRange, 
  ArrowRight, 
  TrendingUp, 
  Users, 
  ArrowUpRight,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  user: User;
  onNavigate: (route: string) => void;
}

type TimeFrame = 'all' | 'day' | 'month' | 'year' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ invoices, user, onNavigate }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  
  // Dates par défaut pour la période personnalisée (début du mois à aujourd'hui)
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Filtrage des factures selon la période
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    // Réinitialiser l'heure pour comparer uniquement les dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return invoices.filter((inv) => {
      if (timeFrame === 'all') return true;

      const invDate = new Date(inv.date);
      const invTime = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate()).getTime();
      const invDateString = inv.date; // Format YYYY-MM-DD

      if (timeFrame === 'day') {
        return invTime === today;
      }
      if (timeFrame === 'month') {
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      }
      if (timeFrame === 'year') {
        return invDate.getFullYear() === currentYear;
      }
      if (timeFrame === 'custom') {
        return invDateString >= customRange.start && invDateString <= customRange.end;
      }
      return true;
    });
  }, [invoices, timeFrame, customRange]);

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalInvoices = filteredInvoices.length;
  
  // Clients uniques sur la période
  const uniqueClients = new Set(filteredInvoices.map(inv => inv.clientName)).size;
  
  // Group invoices by client for the chart based on FILTERED data
  const chartData = filteredInvoices.reduce((acc: any[], inv) => {
    const existing = acc.find(item => item.name === inv.clientName);
    if (existing) {
      existing.amount += inv.total;
    } else {
      acc.push({ name: inv.clientName, amount: inv.total });
    }
    return acc;
  }, [])
  .sort((a, b) => b.amount - a.amount) // Sort by amount descending
  .slice(0, 5); // Take top 5

  const formatMoney = (amount: number) => {
    return formatPrice(amount, user.currency);
  };

  const truncate = (str: string, n: number) => {
    return (str.length > n) ? str.slice(0, n-1) + '...' : str;
  };

  const periods: { id: TimeFrame; label: string }[] = [
    { id: 'day', label: "Aujourd'hui" },
    { id: 'month', label: 'Ce mois' },
    { id: 'year', label: 'Cette année' },
    { id: 'custom', label: 'Personnalisé' },
    { id: 'all', label: 'Tout' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Tableau de bord</h2>
          <p className="text-slate-500 mt-1">Aperçu de votre activité financière.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-wrap">
            {/* Time Filter & Custom Range */}
            <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1 overflow-x-auto max-w-full">
                {periods.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setTimeFrame(p.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                            timeFrame === p.id 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Custom Date Inputs */}
            {timeFrame === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative group">
                    <input 
                        type="date" 
                        value={customRange.start}
                        max={customRange.end}
                        onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                        className="pl-2 pr-1 py-1 bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                    />
                </div>
                <span className="text-slate-300">→</span>
                <div className="relative group">
                    <input 
                        type="date" 
                        value={customRange.end}
                        min={customRange.start}
                        onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                        className="pl-1 pr-2 py-1 bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                    />
                </div>
            </div>
            )}

            <button 
                onClick={() => onNavigate(AppRoute.CREATE_INVOICE)}
                className="flex items-center px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/25 active:scale-95 shrink-0 ml-auto md:ml-0"
            >
                <Plus className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Nouvelle facture</span>
                <span className="sm:hidden">Créer</span>
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CA Card */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-float transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                    <Wallet className="w-6 h-6" />
                </div>
                <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3 mr-1" /> Revenus
                </span>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Chiffre d'affaires</p>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{formatMoney(totalRevenue)}</h3>
            </div>
        </div>

        {/* Invoices Card */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-float transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-6 h-6" />
                </div>
                 <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    Total
                </span>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Factures émises</p>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{totalInvoices}</h3>
            </div>
        </div>

        {/* Clients Card */}
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-float transition-all duration-300 group">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-violet-50 rounded-xl text-violet-600 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6" />
                </div>
                 <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-1 rounded-full">
                    Actifs
                </span>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Clients facturés</p>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{uniqueClients}</h3>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                 <h3 className="text-lg font-bold text-slate-900 font-display">Top Clients</h3>
                 <p className="text-sm text-slate-500">Répartition du CA par client</p>
            </div>
            <div className="flex items-center gap-2">
                 <span className="text-xs font-semibold text-slate-500">Période :</span>
                 <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                    {timeFrame === 'day' ? "Aujourd'hui" : 
                     timeFrame === 'month' ? "Ce mois" : 
                     timeFrame === 'year' ? "Cette année" : 
                     timeFrame === 'custom' ? "Personnalisé" : "Global"}
                </span>
            </div>
          </div>
          
          <div className="p-6 flex-1 min-h-[320px]">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData} barSize={40} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                        tickFormatter={(value) => truncate(value, 12)}
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 11}} 
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                        width={35}
                    />
                    <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // shadow-float
                            padding: '12px 16px',
                            backgroundColor: '#ffffff'
                        }}
                        itemStyle={{ color: '#0f172a', fontWeight: 600, fontSize: '14px' }}
                        formatter={(value: number) => [formatMoney(value), 'Chiffre d\'affaires']}
                        labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <CalendarRange className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">Pas de données pour cette période</p>
                </div>
            )}
          </div>
        </div>

        {/* Recent Activity / Mini List */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 flex flex-col min-w-0 h-full max-h-[500px]">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center shrink-0">
            <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Activité récente</h3>
                <p className="text-sm text-slate-500">Dernières factures générées</p>
            </div>
            <button 
                onClick={() => onNavigate(AppRoute.INVOICES)}
                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                title="Voir tout"
            >
                <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {invoices.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <FileText className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm">Aucune activité récente</p>
                 </div>
            ) : (
                <div className="space-y-3">
                    {[...invoices].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map((inv) => (
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
                                    <span>{inv.invoiceNumber}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span>{new Date(inv.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-slate-900">{formatMoney(inv.total)}</p>
                            <div className="flex justify-end mt-1">
                                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-brand-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;