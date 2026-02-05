import React, { useState, useMemo } from 'react';
import { Invoice, Expense, User, formatPrice } from '../types';
import { 
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, Target, Calendar, 
  ArrowUpRight, ArrowDownRight, Activity, Percent
} from 'lucide-react';

interface RevenueProps {
  invoices: Invoice[];
  expenses: Expense[];
  user: User;
}

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const Revenue: React.FC<RevenueProps> = ({ invoices, expenses, user }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'flow' | 'cumulative'>('flow'); // 👇 NOUVEAU : Mode de vue

  // --- HELPER : Calculer les stats pour une année donnée ---
  const getStatsForYear = (targetYear: number) => {
      // Revenus
      const revenue = invoices
        .filter(i => new Date(i.date).getFullYear() === targetYear && i.status === 'paid')
        .reduce((sum, i) => sum + i.total, 0);
      
      // Dépenses
      const expense = expenses
        .filter(e => new Date(e.date).getFullYear() === targetYear)
        .reduce((sum, e) => sum + e.amount, 0);
      
      // Nombre de factures payées (pour panier moyen)
      const count = invoices.filter(i => new Date(i.date).getFullYear() === targetYear && i.status === 'paid').length;

      return { revenue, expense, profit: revenue - expense, count };
  };

  const currentStats = useMemo(() => getStatsForYear(year), [year, invoices, expenses]);
  const previousStats = useMemo(() => getStatsForYear(year - 1), [year, invoices, expenses]);

  // --- CALCUL CROISSANCE (%) ---
  const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
  };

  // --- DONNÉES GRAPHIQUE ---
  const chartData = useMemo(() => {
    let accRevenue = 0;
    let accProfit = 0;

    return MONTHS.map((m, index) => {
        // Flux mensuel
        let monthlyRevenue = 0;
        let monthlyExpense = 0;

        invoices.forEach(inv => {
            const d = new Date(inv.date);
            if (d.getFullYear() === year && d.getMonth() === index && inv.status === 'paid') {
                monthlyRevenue += inv.total;
            }
        });

        expenses.forEach(exp => {
            const d = new Date(exp.date);
            if (d.getFullYear() === year && d.getMonth() === index) {
                monthlyExpense += exp.amount;
            }
        });

        const monthlyProfit = monthlyRevenue - monthlyExpense;

        // Cumul
        accRevenue += monthlyRevenue;
        accProfit += monthlyProfit;

        return {
            name: m,
            revenue: viewMode === 'flow' ? monthlyRevenue : accRevenue,
            expense: viewMode === 'flow' ? monthlyExpense : 0, // On masque les dépenses en cumulé pour lisibilité
            profit: viewMode === 'flow' ? monthlyProfit : accProfit,
        };
    });
  }, [invoices, expenses, year, viewMode]);

  // KPIs supplémentaires
  const averageBasket = currentStats.count > 0 ? currentStats.revenue / currentStats.count : 0;
  const pendingAmount = invoices
    .filter(i => new Date(i.date).getFullYear() === year && i.status === 'pending')
    .reduce((sum, i) => sum + i.total, 0);

  // Composant Badge Croissance
  const GrowthBadge = ({ current, previous }: { current: number, previous: number }) => {
      const growth = calculateGrowth(current, previous);
      const isPositive = growth >= 0;
      return (
          <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(growth).toFixed(0)}%
          </div>
      );
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-display">Analyse Financière</h2>
          <p className="text-slate-500 mt-1">Comparaison des performances {year} vs {year - 1}.</p>
        </div>
        <div className="flex items-center gap-4">
            {/* Toggle Vue */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('flow')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'flow' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Flux</button>
                <button onClick={() => setViewMode('cumulative')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'cumulative' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Cumulé</button>
            </div>

            {/* Sélecteur Année */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                <button onClick={() => setYear(year - 1)} className="px-3 py-1 hover:bg-slate-50 rounded-lg text-slate-500">←</button>
                <span className="px-4 py-1.5 text-sm font-bold text-slate-900 bg-slate-50 rounded-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {year}
                </span>
                <button onClick={() => setYear(year + 1)} className="px-3 py-1 hover:bg-slate-50 rounded-lg text-slate-500">→</button>
            </div>
        </div>
      </div>

      {/* 1. CARTES KPI PRINCIPALES AVEC COMPARAISON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* CA */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
                  <GrowthBadge current={currentStats.revenue} previous={previousStats.revenue} />
              </div>
              <p className="text-slate-500 text-sm font-medium">Chiffre d'Affaires</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(currentStats.revenue, user.currency)}</h3>
              <p className="text-xs text-slate-400 mt-2">vs {formatPrice(previousStats.revenue, user.currency)} en {year-1}</p>
          </div>

          {/* Dépenses */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl"><TrendingDown className="w-6 h-6" /></div>
                  {/* Pour les dépenses, on inverse la logique : moins c'est mieux, mais gardons la croissance simple pour l'instant */}
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                     {currentStats.expense > previousStats.expense ? '↗ En hausse' : '↘ En baisse'}
                  </div>
              </div>
              <p className="text-slate-500 text-sm font-medium">Total Dépenses</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(currentStats.expense, user.currency)}</h3>
              <p className="text-xs text-slate-400 mt-2">vs {formatPrice(previousStats.expense, user.currency)} en {year-1}</p>
          </div>

          {/* Bénéfice Net */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-2">
                  <div className={`p-3 rounded-xl ${currentStats.profit >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      <Wallet className="w-6 h-6" />
                  </div>
                  <GrowthBadge current={currentStats.profit} previous={previousStats.profit} />
              </div>
              <p className="text-slate-500 text-sm font-medium">Bénéfice Net</p>
              <h3 className={`text-2xl font-bold mt-1 ${currentStats.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {currentStats.profit > 0 ? '+' : ''}{formatPrice(currentStats.profit, user.currency)}
              </h3>
              <p className="text-xs text-slate-400 mt-2">Marge: {currentStats.revenue > 0 ? ((currentStats.profit / currentStats.revenue)*100).toFixed(1) : 0}%</p>
          </div>

          {/* Panier Moyen (NOUVEAU) */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Activity className="w-6 h-6" /></div>
                  <div className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center">
                      <Percent className="w-3 h-3 mr-1" /> Moy.
                  </div>
              </div>
              <p className="text-slate-500 text-sm font-medium">Panier Moyen</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(averageBasket, user.currency)}</h3>
              <p className="text-xs text-slate-400 mt-2">Sur {currentStats.count} factures payées</p>
          </div>
      </div>

      {/* 2. GRAPHIQUE INTELLIGENT (Flux ou Cumulé) */}
      <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200">
          <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  {viewMode === 'flow' ? <TrendingUp className="w-5 h-5 text-brand-600" /> : <Target className="w-5 h-5 text-brand-600" />}
                  {viewMode === 'flow' ? 'Flux de Trésorerie Mensuel' : 'Croissance Cumulée Annuelle'}
              </h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Revenus</div>
                  {viewMode === 'flow' && <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Dépenses</div>}
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Net</div>
              </div>
          </div>
          
          <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  {viewMode === 'flow' ? (
                      // VUE FLUX (Barres + Ligne)
                      <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                          <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                              formatter={(value: number) => formatPrice(value, user.currency)}
                          />
                          <Bar dataKey="revenue" barSize={20} fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                          <Bar dataKey="expense" barSize={20} fill="#ef4444" radius={[4, 4, 0, 0]} stackId="b" />
                          <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                      </ComposedChart>
                  ) : (
                      // VUE CUMULÉE (Aires)
                      <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
                          <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                              formatter={(value: number) => formatPrice(value, user.currency)}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                          <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                      </AreaChart>
                  )}
              </ResponsiveContainer>
          </div>
      </div>

      {/* 3. SECTION TRÉSORERIE FUTURE */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 p-8 opacity-10"><Target className="w-48 h-48" /></div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                  <h3 className="text-2xl font-bold mb-2 font-display">Trésorerie Potentielle</h3>
                  <p className="text-slate-400 mb-6">Montant total des factures émises en {year} mais non encore réglées.</p>
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                          <Clock className="w-8 h-8" />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-amber-400 uppercase tracking-wider">En attente</p>
                          <h2 className="text-4xl font-bold">{formatPrice(pendingAmount, user.currency)}</h2>
                      </div>
                  </div>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                  <h4 className="font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400" /> Analyse rapide</h4>
                  <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          Si tout est payé, votre CA annuel sera de <strong className="text-white">{formatPrice(currentStats.revenue + pendingAmount, user.currency)}</strong>.
                      </li>
                      <li className="flex items-start gap-2">
                          <span className="text-blue-400 font-bold">•</span>
                          Cela représenterait une marge nette globale de <strong className="text-white">{((currentStats.profit + pendingAmount) / (currentStats.revenue + pendingAmount) * 100).toFixed(1)}%</strong>.
                      </li>
                  </ul>
              </div>
          </div>
      </div>

    </div>
  );
};

export default Revenue;