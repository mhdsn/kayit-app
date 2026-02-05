import React, { useState, useMemo } from 'react';
import { Invoice, Expense, User, formatPrice } from '../types';
import { 
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, 
  Target, Users, CreditCard, Calendar 
} from 'lucide-react';

interface RevenueProps {
  invoices: Invoice[];
  expenses: Expense[];
  user: User;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const Revenue: React.FC<RevenueProps> = ({ invoices, expenses, user }) => {
  const [year, setYear] = useState(new Date().getFullYear());

  // --- 1. CALCULS DES DONNÉES MENSUELLES (Graphique Principal) ---
  const monthlyData = useMemo(() => {
    const data = MONTHS.map(m => ({ name: m, revenue: 0, expense: 0, profit: 0 }));

    // Revenus (Basés sur la date de facture, status 'paid' uniquement pour le CA réel)
    invoices.forEach(inv => {
        const d = new Date(inv.date);
        if (d.getFullYear() === year && inv.status === 'paid') {
            data[d.getMonth()].revenue += inv.total;
        }
    });

    // Dépenses
    expenses.forEach(exp => {
        const d = new Date(exp.date);
        if (d.getFullYear() === year) {
            data[d.getMonth()].expense += exp.amount;
        }
    });

    // Bénéfice
    data.forEach(item => {
        item.profit = item.revenue - item.expense;
    });

    return data;
  }, [invoices, expenses, year]);

  // --- 2. KPIS ANNUELS ---
  const stats = useMemo(() => {
      const totalRevenue = monthlyData.reduce((acc, curr) => acc + curr.revenue, 0);
      const totalExpense = monthlyData.reduce((acc, curr) => acc + curr.expense, 0);
      const netProfit = totalRevenue - totalExpense;
      const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      // Factures en attente (Cashflow potentiel)
      const pending = invoices
        .filter(i => new Date(i.date).getFullYear() === year && i.status === 'pending')
        .reduce((sum, i) => sum + i.total, 0);

      return { totalRevenue, totalExpense, netProfit, margin, pending };
  }, [monthlyData, invoices, year]);

  // --- 3. RÉPARTITION PAR MÉTHODE DE PAIEMENT ---
  const paymentMethodData = useMemo(() => {
      const map = new Map<string, number>();
      invoices.filter(i => i.status === 'paid' && new Date(i.date).getFullYear() === year).forEach(inv => {
          const method = inv.paymentMethod || 'Autre';
          map.set(method, (map.get(method) || 0) + inv.total);
      });
      return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [invoices, year]);

  // --- 4. TOP CLIENTS (Baleines) ---
  const topClients = useMemo(() => {
      const map = new Map<string, number>();
      invoices.filter(i => i.status === 'paid' && new Date(i.date).getFullYear() === year).forEach(inv => {
          map.set(inv.clientName, (map.get(inv.clientName) || 0) + inv.total);
      });
      return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
  }, [invoices, year]);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-display">Analyse Financière</h2>
          <p className="text-slate-500 mt-1">Vue détaillée de votre rentabilité pour {year}.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button onClick={() => setYear(year - 1)} className="px-3 py-1 hover:bg-slate-50 rounded-lg text-slate-500">←</button>
            <span className="px-4 py-1.5 text-sm font-bold text-slate-900 bg-slate-50 rounded-lg flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {year}
            </span>
            <button onClick={() => setYear(year + 1)} className="px-3 py-1 hover:bg-slate-50 rounded-lg text-slate-500">→</button>
        </div>
      </div>

      {/* 1. CARTES KPI PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 group hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">Encaissé</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Chiffre d'Affaires</p>
              <h3 className="text-2xl font-bold text-slate-900">{formatPrice(stats.totalRevenue, user.currency)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 group hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl"><TrendingDown className="w-6 h-6" /></div>
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-lg">Sorties</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Total Dépenses</p>
              <h3 className="text-2xl font-bold text-slate-900">{formatPrice(stats.totalExpense, user.currency)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 group hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${stats.netProfit >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      <Wallet className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      {stats.margin.toFixed(1)}% Marge
                  </div>
              </div>
              <p className="text-slate-500 text-sm font-medium">Bénéfice Net</p>
              <h3 className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {stats.netProfit > 0 ? '+' : ''}{formatPrice(stats.netProfit, user.currency)}
              </h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 group hover:shadow-float transition-all relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-5"><Target className="w-24 h-24" /></div>
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Target className="w-6 h-6" /></div>
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">Potentiel</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">En attente de paiement</p>
              <h3 className="text-2xl font-bold text-slate-900">{formatPrice(stats.pending, user.currency)}</h3>
          </div>
      </div>

      {/* 2. GRAPHIQUE PRINCIPAL (Revenus vs Dépenses vs Profit) */}
      <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200">
          <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-600" /> Flux de Trésorerie
              </h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Revenus</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Dépenses</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Net</div>
              </div>
          </div>
          <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
              </ResponsiveContainer>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 3. TOP CLIENTS */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" /> Meilleurs Clients
              </h3>
              <div className="space-y-4">
                  {topClients.length > 0 ? topClients.map((client, i) => (
                      <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i===0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                              <span className="font-medium text-slate-700 truncate max-w-[120px]">{client.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{formatPrice(client.value, user.currency)}</span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500" style={{ width: `${(client.value / topClients[0].value) * 100}%` }}></div>
                              </div>
                          </div>
                      </div>
                  )) : (
                      <p className="text-center text-slate-400 text-sm py-10">Aucune donnée client</p>
                  )}
              </div>
          </div>

          {/* 4. MODES DE PAIEMENT */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-card border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" /> Canaux d'encaissement
              </h3>
              <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-full md:w-1/2 h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={paymentMethodData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                              >
                                  {paymentMethodData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatPrice(value, user.currency)} />
                              <Legend />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 space-y-3">
                      {paymentMethodData.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                  <span className="font-medium text-slate-700">{item.name}</span>
                              </div>
                              <span className="font-bold text-slate-900">{formatPrice(item.value, user.currency)}</span>
                          </div>
                      ))}
                      {paymentMethodData.length === 0 && <p className="text-center text-slate-400 text-sm">Aucun paiement enregistré</p>}
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};

export default Revenue;