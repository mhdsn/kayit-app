import React, { useState, useMemo } from 'react';
import { Expense, User, formatPrice } from '../types';
import { Plus, Trash2, Calendar, Tag, TrendingDown, Download, Filter, PieChart as PieChartIcon, ArrowUpRight, DollarSign, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface ExpensesProps {
  expenses: Expense[];
  user: User;
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onDelete: (id: string) => void;
}

// Suggestions de base (l'utilisateur peut en créer d'autres)
const SUGGESTED_CATEGORIES = ['Loyer', 'Salaire', 'Marketing', 'Matériel', 'Logiciel', 'Transport', 'Services', 'Autre'];
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#94a3b8'];

type TimeFilter = 'day' | 'month' | 'year' | 'all';

const Expenses: React.FC<ExpensesProps> = ({ expenses, user, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '', // Vide par défaut pour laisser le choix
    date: new Date().toISOString().split('T')[0]
  });

  // 👇 NOUVEAU : Calcul dynamique des catégories pour le filtre
  // Combine les suggestions de base ET les catégories créées par l'utilisateur
  const allCategories = useMemo(() => {
      const cats = new Set(SUGGESTED_CATEGORIES);
      expenses.forEach(e => cats.add(e.category));
      return Array.from(cats).sort();
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    onAdd({
      description: formData.description,
      amount: parseFloat(formData.amount),
      // Si la catégorie est vide, on met 'Autre' par défaut
      category: formData.category.trim() || 'Autre',
      date: formData.date
    });

    setFormData({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  // --- LOGIQUE DE FILTRAGE COMBINÉE ---
  const filteredExpenses = useMemo(() => {
      let data = expenses;

      if (filterCategory !== 'All') {
          data = data.filter(e => e.category === filterCategory);
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const todayStr = now.toISOString().split('T')[0];

      if (timeFilter === 'day') {
          data = data.filter(e => e.date === todayStr);
      } else if (timeFilter === 'month') {
          data = data.filter(e => {
              const d = new Date(e.date);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          });
      } else if (timeFilter === 'year') {
          data = data.filter(e => {
              const d = new Date(e.date);
              return d.getFullYear() === currentYear;
          });
      }

      return data;
  }, [expenses, filterCategory, timeFilter]);

  const stats = useMemo(() => {
      const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      const count = filteredExpenses.length;
      const average = count > 0 ? total / count : 0;
      const max = filteredExpenses.reduce((m, e) => Math.max(m, e.amount), 0);
      return { total, count, average, max };
  }, [filteredExpenses]);

  const chartData = useMemo(() => {
      const dataMap = new Map<string, number>();
      filteredExpenses.forEach(e => {
          dataMap.set(e.category, (dataMap.get(e.category) || 0) + e.amount);
      });
      return Array.from(dataMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const handleExport = () => {
      const headers = ['Date', 'Description', 'Catégorie', 'Montant'];
      const rows = filteredExpenses.map(e => [
          e.date,
          `"${e.description}"`, 
          e.category,
          e.amount
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `depenses_${timeFilter}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header & Actions */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 font-display">Dépenses</h2>
                <p className="text-slate-500 mt-1">Gérez vos coûts et analysez vos sorties d'argent.</p>
            </div>
            <div className="flex gap-3">
                <button onClick={handleExport} className="hidden md:flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all">
                    <Download className="w-4 h-4 mr-2" /> Export
                </button>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all">
                    <Plus className="w-5 h-5 mr-2" /> Ajouter
                </button>
            </div>
        </div>

        {/* Barre de Filtres */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                {(['day', 'month', 'year', 'all'] as const).map((period) => (
                    <button
                        key={period}
                        onClick={() => setTimeFilter(period)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                            timeFilter === period
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        {period === 'day' ? 'Auj.' : period === 'month' ? 'Ce mois' : period === 'year' ? 'Cette année' : 'Toujours'}
                    </button>
                ))}
            </div>
            <div className="px-2 text-sm text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {timeFilter === 'all' ? "Historique complet" : timeFilter === 'day' ? "Dépenses d'aujourd'hui" : timeFilter === 'month' ? `Dépenses de ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` : `Année ${new Date().getFullYear()}`}
            </div>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingDown className="w-16 h-16 text-red-600" /></div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Dépenses</p>
              <div>
                  <h3 className="text-3xl font-bold text-slate-900">{formatPrice(stats.total, user.currency)}</h3>
                  <p className="text-xs text-slate-400 mt-1">{stats.count} transaction{stats.count > 1 ? 's' : ''}</p>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowUpRight className="w-16 h-16 text-orange-500" /></div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Plus grosse dépense</p>
              <div>
                  <h3 className="text-3xl font-bold text-slate-900">{formatPrice(stats.max, user.currency)}</h3>
                  <p className="text-xs text-orange-500 mt-1 font-medium">Record sur la période</p>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><PieChartIcon className="w-16 h-16 text-blue-500" /></div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Panier Moyen</p>
              <div>
                  <h3 className="text-3xl font-bold text-slate-900">{formatPrice(stats.average, user.currency)}</h3>
                  <p className="text-xs text-blue-500 mt-1 font-medium">Par dépense</p>
              </div>
          </div>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 animate-in slide-in-from-top-4 ring-1 ring-slate-900/5">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-slate-900 text-lg">Nouvelle dépense</h3>
             <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><TrendingDown className="w-5 h-5 rotate-180" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
              <input type="text" required autoFocus placeholder="" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Montant</label>
              <div className="relative">
                  <input type="number" required min="0" placeholder="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all" />
                  <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-400 pointer-events-none">{user.currency}</span>
              </div>
            </div>

            {/* 👇 MODIFIÉ : INPUT AVEC DATALIST (Saisie libre + Suggestions) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Catégorie</label>
              <div className="relative">
                <input 
                    type="text" 
                    list="category-suggestions" 
                    required
                    placeholder="Ex: Marketing"
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all" 
                />
                {/* Liste des suggestions */}
                <datalist id="category-suggestions">
                    {SUGGESTED_CATEGORIES.map(c => <option key={c} value={c} />)}
                </datalist>
                <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date</label>
              <div className="relative">
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400" />
                <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="flex items-end">
                <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Enregistrer
                </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Liste des dépenses */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-slate-400" /> Historique
                </h3>
                
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    {/* 👇 MODIFIÉ : Filtre dynamique avec toutes les catégories existantes */}
                    <select 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer hover:text-slate-900 max-w-[150px]"
                    >
                        <option value="All">Toutes catégories</option>
                        {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                {filteredExpenses.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingDown className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500">Aucune dépense sur cette période.</p>
                        {timeFilter !== 'all' && (
                            <button onClick={() => setTimeFilter('all')} className="mt-2 text-sm text-red-600 hover:underline">Voir tout l'historique</button>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                        <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Catégorie</th>
                        <th className="px-6 py-4 text-right">Montant</th>
                        <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(expense.date).toLocaleDateString('fr-FR')}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{expense.description}</td>
                            <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-white text-slate-600 rounded-md text-xs font-bold border border-slate-200 shadow-sm">
                                    {expense.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">- {formatPrice(expense.amount, user.currency)}</td>
                            <td className="px-6 py-4 text-right">
                            <button onClick={() => onDelete(expense.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                )}
            </div>
          </div>

          {/* Graphique de Répartition */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 flex flex-col">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-slate-400" /> Répartition
              </h3>
              
              <div className="flex-1 min-h-[300px] relative">
                  {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value: number) => formatPrice(value, user.currency)}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                          <PieChartIcon className="w-12 h-12 mb-2 opacity-20" />
                          <p className="text-xs">Pas assez de données</p>
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};

export default Expenses;