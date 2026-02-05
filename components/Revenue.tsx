import React, { useState, useMemo } from 'react';
import { Invoice, Expense, User, formatPrice } from '../types';
import { 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ComposedChart, 
  AreaChart, 
  Area,
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Percent,
  Users,
  Package, 
  CreditCard,
  Clock,
  ArrowRight
} from 'lucide-react';

interface RevenueProps {
  invoices?: Invoice[];
  expenses?: Expense[];
  user: User;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
type TimeRange = 'day' | 'month' | 'year' | 'all' | 'custom';

// --- 1. FONCTIONS UTILITAIRES ---
const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

// --- 2. SOUS-COMPOSANT BADGE ---
const GrowthBadge = ({ current, previous, show }: { current: number, previous: number, show: boolean }) => {
    if (!show) return null;
    const growth = calculateGrowth(current, previous);
    const isPositive = growth >= 0;
    return (
        <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(growth).toFixed(0)}%
        </div>
    );
};

// --- 3. COMPOSANT PRINCIPAL ---
const Revenue: React.FC<RevenueProps> = ({ invoices = [], expenses = [], user }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('year');
  const [viewMode, setViewMode] = useState<'flow' | 'cumulative'>('flow');
  
  const [customRange, setCustomRange] = useState({
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
  });

  // --- LOGIQUE DE DATES INTELLIGENTE ---
  const getDateRange = (range: TimeRange, offset: number = 0) => {
      const now = new Date();
      const start = new Date();
      const end = new Date();

      if (range === 'day') {
          start.setDate(now.getDate() - offset);
          end.setDate(now.getDate() - offset);
          start.setHours(0,0,0,0);
          end.setHours(23,59,59,999);
      } else if (range === 'month') {
          start.setMonth(now.getMonth() - offset, 1);
          end.setMonth(now.getMonth() - offset + 1, 0);
      } else if (range === 'year') {
          start.setFullYear(now.getFullYear() - offset, 0, 1);
          end.setFullYear(now.getFullYear() - offset, 11, 31);
      } else if (range === 'custom') {
          const s = new Date(customRange.start);
          const e = new Date(customRange.end);
          e.setHours(23, 59, 59, 999);

          if (offset > 0) {
              const duration = e.getTime() - s.getTime();
              const prevEnd = new Date(s.getTime() - 86400000);
              const prevStart = new Date(prevEnd.getTime() - duration);
              return { start: prevStart, end: prevEnd };
          }
          return { start: s, end: e };
      } else {
          start.setFullYear(2000, 0, 1);
          end.setFullYear(2100, 11, 31);
      }
      return { start, end };
  };

  // --- CALCUL DES KPIS ---
  const stats = useMemo(() => {
    const getStatsForRange = (range: TimeRange, offset: number) => {
        const { start, end } = getDateRange(range, offset);
        const isAllTime = range === 'all';

        const rangeInvoices = invoices.filter(i => {
            if (isAllTime && offset === 0) return i.status === 'paid';
            const d = new Date(i.date);
            return d >= start && d <= end && i.status === 'paid';
        });

        const rangeExpenses = expenses.filter(e => {
            if (isAllTime && offset === 0) return true;
            const d = new Date(e.date);
            return d >= start && d <= end;
        });

        const revenue = rangeInvoices.reduce((sum, i) => sum + i.total, 0);
        const expense = rangeExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        return { 
            revenue, 
            expense, 
            profit: revenue - expense, 
            count: rangeInvoices.length 
        };
    };

    return {
        current: getStatsForRange(timeRange, 0),
        previous: getStatsForRange(timeRange, 1) 
    };
  }, [timeRange, invoices, expenses, customRange]);

  // --- DONNÉES DU GRAPHIQUE ---
  const chartData = useMemo(() => {
    let data = [];
    const now = new Date();

    function calculatePeriodData(name: string, start: Date, end: Date) {
        let revenue = 0;
        let expense = 0;
        invoices.forEach(inv => {
            const d = new Date(inv.date);
            if (d >= start && d <= end && inv.status === 'paid') revenue += inv.total;
        });
        expenses.forEach(exp => {
            const d = new Date(exp.date);
            if (d >= start && d <= end) expense += exp.amount;
        });
        return { name, revenue, expense, profit: revenue - expense };
    }

    if (timeRange === 'year') {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        data = months.map((m, i) => {
            const start = new Date(now.getFullYear(), i, 1);
            const end = new Date(now.getFullYear(), i + 1, 0);
            return calculatePeriodData(m, start, end);
        });
    } 
    else if (timeRange === 'month') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const start = new Date(now.getFullYear(), now.getMonth(), i);
            const end = new Date(now.getFullYear(), now.getMonth(), i, 23, 59, 59);
            data.push(calculatePeriodData(String(i), start, end));
        }
    }
    else if (timeRange === 'all') {
        const currentYear = now.getFullYear();
        const allDates = [...invoices.map(i => i.date), ...expenses.map(e => e.date)].map(d => new Date(d).getFullYear());
        const minYear = allDates.length > 0 ? Math.min(...allDates) : currentYear;
        for (let i = minYear; i <= currentYear; i++) {
            const start = new Date(i, 0, 1);
            const end = new Date(i, 11, 31);
            data.push(calculatePeriodData(String(i), start, end));
        }
    }
    else if (timeRange === 'day') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const start = new Date(d.setHours(0,0,0,0));
            const end = new Date(d.setHours(23,59,59,999));
            const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
            const dayNum = d.getDate();
            const label = i === 0 ? 'Auj.' : `${dayName} ${dayNum}`;
            data.push(calculatePeriodData(label, start, end));
        }
    }
    else if (timeRange === 'custom') {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 31) {
            for (let i = 0; i <= diffDays; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                const s = new Date(d.setHours(0,0,0,0));
                const e = new Date(d.setHours(23,59,59,999));
                data.push(calculatePeriodData(`${d.getDate()}/${d.getMonth()+1}`, s, e));
            }
        } else {
            let d = new Date(start);
            d.setDate(1);
            while (d <= end) {
                const s = new Date(d.getFullYear(), d.getMonth(), 1);
                const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
                data.push(calculatePeriodData(label, s, e));
                d.setMonth(d.getMonth() + 1);
            }
        }
    }

    if (viewMode === 'cumulative') {
        let accRevenue = 0;
        let accProfit = 0;
        return data.map(item => {
            accRevenue += item.revenue;
            accProfit += item.profit;
            return { ...item, revenue: accRevenue, profit: accProfit, expense: 0 };
        });
    }

    return data;
  }, [invoices, expenses, timeRange, viewMode, customRange]);

  // --- KPIS DÉTAILLÉS ---
  const detailedStats = useMemo(() => {
      const { start, end } = getDateRange(timeRange);
      const isAllTime = timeRange === 'all';

      const filterDate = (dateStr: string) => {
          if (isAllTime) return true;
          const d = new Date(dateStr);
          return d >= start && d <= end;
      };

      const clientMap = new Map<string, number>();
      invoices.filter(i => filterDate(i.date) && i.status === 'paid').forEach(inv => {
          clientMap.set(inv.clientName, (clientMap.get(inv.clientName) || 0) + inv.total);
      });
      const topClients = Array.from(clientMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

      const servicesMap = new Map<string, number>();
      invoices.filter(i => filterDate(i.date) && i.status === 'paid').forEach(inv => {
          inv.items.forEach(item => {
              servicesMap.set(item.description, (servicesMap.get(item.description) || 0) + (item.price * item.quantity));
          });
      });
      const topServices = Array.from(servicesMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

      const paymentMap = new Map<string, number>();
      invoices.filter(i => filterDate(i.date) && i.status === 'paid').forEach(inv => {
          const method = inv.paymentMethod || 'Autre';
          paymentMap.set(method, (paymentMap.get(method) || 0) + inv.total);
      });
      const paymentMethods = Array.from(paymentMap.entries()).map(([name, value]) => ({ name, value }));

      return { topClients, topServices, paymentMethods };
  }, [invoices, expenses, timeRange, customRange]);

  const pendingAmount = useMemo(() => {
      const { start, end } = getDateRange(timeRange);
      return invoices
        .filter(i => {
            if (timeRange === 'all') return i.status === 'pending';
            const d = new Date(i.date);
            return d >= start && d <= end && i.status === 'pending';
        })
        .reduce((sum, i) => sum + i.total, 0);
  }, [invoices, timeRange, customRange]);

  const averageBasket = stats.current.count > 0 ? stats.current.revenue / stats.current.count : 0;

  return (
    <div className="space-y-8 pb-20">
      
      {/* HEADER AVEC FILTRES */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-display">Analyse Financière</h2>
          <p className="text-slate-500 mt-1">
              {timeRange === 'day' ? "Aperçu des 7 derniers jours" : 
               timeRange === 'month' ? `Détail du mois de ${new Date().toLocaleDateString('fr-FR', {month:'long'})}` :
               timeRange === 'year' ? `Année ${new Date().getFullYear()}` : 
               timeRange === 'custom' ? "Période personnalisée" : "Historique complet"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
            {/* Toggle Vue */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('flow')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'flow' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Flux</button>
                <button onClick={() => setViewMode('cumulative')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'cumulative' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Cumulé</button>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                {(['day', 'month', 'year', 'all', 'custom'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTimeRange(t)}
                        className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${
                            timeRange === t 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        {t === 'day' ? 'Auj.' : t === 'month' ? 'Mois' : t === 'year' ? 'Année' : t === 'all' ? 'Max' : 'Perso'}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* SÉLECTEUR DE DATE CUSTOM */}
      {timeRange === 'custom' && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2">
              <span className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Définir la période :
              </span>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-400">Du</span>
                  <input 
                      type="date" 
                      value={customRange.start} 
                      onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                      className="text-sm font-bold text-slate-700 outline-none"
                  />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-400">Au</span>
                  <input 
                      type="date" 
                      value={customRange.end} 
                      onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                      className="text-sm font-bold text-slate-700 outline-none"
                  />
              </div>
          </div>
      )}

      {/* 1. KPIS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CA */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
                  <GrowthBadge current={stats.current.revenue} previous={stats.previous.revenue} show={timeRange !== 'all'} />
              </div>
              <p className="text-slate-500 text-sm font-medium">Chiffre d'Affaires</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(stats.current.revenue, user.currency)}</h3>
          </div>

          {/* Dépenses */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl"><TrendingDown className="w-6 h-6" /></div>
              </div>
              <p className="text-slate-500 text-sm font-medium">Total Dépenses</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(stats.current.expense, user.currency)}</h3>
          </div>

          {/* Bénéfice Net */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-2">
                  <div className={`p-3 rounded-xl ${stats.current.profit >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      <Wallet className="w-6 h-6" />
                  </div>
                  <GrowthBadge current={stats.current.profit} previous={stats.previous.profit} show={timeRange !== 'all'} />
              </div>
              <p className="text-slate-500 text-sm font-medium">Bénéfice Net</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.current.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {stats.current.profit > 0 ? '+' : ''}{formatPrice(stats.current.profit, user.currency)}
              </h3>
          </div>

          {/* Marge */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Activity className="w-6 h-6" /></div>
                  <div className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center">
                      <Percent className="w-3 h-3 mr-1" /> Marge
                  </div>
              </div>
              <p className="text-slate-500 text-sm font-medium">Marge Nette</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.current.revenue > 0 ? ((stats.current.profit / stats.current.revenue) * 100).toFixed(1) : 0}%
              </h3>
          </div>
      </div>

      {/* 2. GRAPHIQUE PRINCIPAL */}
      <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200">
          <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  {viewMode === 'flow' ? <TrendingUp className="w-5 h-5 text-brand-600" /> : <Target className="w-5 h-5 text-brand-600" />}
                  Evolution {timeRange === 'custom' ? '(Période perso)' : timeRange === 'day' ? '(7 derniers jours)' : timeRange === 'month' ? '(Ce mois)' : timeRange === 'year' ? '(Cette année)' : '(Global)'}
              </h3>
              <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Revenus</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Dépenses</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Net</div>
              </div>
          </div>
          
          <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  {viewMode === 'flow' ? (
                      <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                          <CartesianGrid stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} formatter={(value: number) => formatPrice(value, user.currency)} />
                          {/* 👇 MODIFICATION ICI : name="Revenus", etc. */}
                          <Bar dataKey="revenue" name="Revenus" barSize={30} fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" name="Dépenses" barSize={30} fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="profit" name="Bénéfice Net" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                      </ComposedChart>
                  ) : (
                      <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                          <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} formatter={(value: number) => formatPrice(value, user.currency)} />
                          {/* 👇 MODIFICATION ICI AUSSI */}
                          <Area type="monotone" dataKey="revenue" name="Revenus" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                          <Area type="monotone" dataKey="profit" name="Bénéfice Net" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} />
                      </AreaChart>
                  )}
              </ResponsiveContainer>
          </div>
      </div>

      {/* 3. NOUVELLE SECTION DÉTAILLÉE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COL 1: TOP CLIENTS */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" /> Meilleurs Clients
              </h4>
              <div className="space-y-4">
                  {detailedStats.topClients.length > 0 ? detailedStats.topClients.map((client, i) => (
                      <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i===0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                              <span className="text-sm font-medium text-slate-700 truncate max-w-[100px]">{client.name}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{formatPrice(client.value, user.currency)}</span>
                      </div>
                  )) : <p className="text-xs text-slate-400 text-center py-4">Pas de données sur cette période</p>}
              </div>
          </div>

          {/* COL 2: TOP SERVICES */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" /> Produits Stars
              </h4>
              <div className="space-y-4">
                  {detailedStats.topServices.length > 0 ? detailedStats.topServices.map((service, i) => (
                      <div key={i} className="flex flex-col gap-1">
                          <div className="flex justify-between items-end">
                              <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">{service.name}</span>
                              <span className="text-xs font-bold text-slate-900">{formatPrice(service.value, user.currency)}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${(service.value / detailedStats.topServices[0].value) * 100}%` }}></div>
                          </div>
                      </div>
                  )) : <p className="text-xs text-slate-400 text-center py-4">Pas de données sur cette période</p>}
              </div>
          </div>

          {/* COL 3: MÉTHODES DE PAIEMENT */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" /> Paiements
              </h4>
              <div className="h-[180px] mb-2">
                  {detailedStats.paymentMethods.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={detailedStats.paymentMethods}
                                  cx="50%" cy="50%"
                                  innerRadius={40} outerRadius={60}
                                  paddingAngle={5}
                                  dataKey="value"
                              >
                                  {detailedStats.paymentMethods.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatPrice(value, user.currency)} />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                          </PieChart>
                      </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-xs text-slate-400">Pas de données</div>}
              </div>
          </div>

      </div>

      {/* 4. TRÉSORERIE FUTURE */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 p-8 opacity-10"><Target className="w-48 h-48" /></div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                  <h3 className="text-2xl font-bold mb-2 font-display">Trésorerie Potentielle</h3>
                  <p className="text-slate-400 mb-6">Montant total en attente sur la période sélectionnée.</p>
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><Clock className="w-8 h-8" /></div>
                      <div>
                          <p className="text-sm font-medium text-amber-400 uppercase tracking-wider">Montant dû</p>
                          <h2 className="text-4xl font-bold">{formatPrice(pendingAmount, user.currency)}</h2>
                      </div>
                  </div>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                  <h4 className="font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400" /> Analyse rapide</h4>
                  <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          Si tout est payé, votre CA période sera de <strong className="text-white">{formatPrice(stats.current.revenue + pendingAmount, user.currency)}</strong>.
                      </li>
                  </ul>
              </div>
          </div>
      </div>

    </div>
  );
};

export default Revenue;