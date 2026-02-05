import React, { useState } from 'react';
import { Expense, User, formatPrice } from '../types';
import { Plus, Trash2, Calendar, Tag, TrendingDown } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  user: User;
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES = ['Loyer', 'Salaire', 'Marketing', 'Matériel', 'Logiciel', 'Transport', 'Autre'];

const Expenses: React.FC<ExpensesProps> = ({ expenses, user, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Autre',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    onAdd({
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date
    });

    setFormData({ description: '', amount: '', category: 'Autre', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-display">Dépenses</h2>
          <p className="text-slate-500 mt-1">Suivez vos coûts pour calculer vos bénéfices réels.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center justify-center px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 shadow-lg shadow-red-500/25 transition-all">
          <Plus className="w-5 h-5 mr-2" /> Ajouter une dépense
        </button>
      </div>

      {/* Résumé Rapide */}
      <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 flex items-center justify-between">
          <div>
              <p className="text-sm text-slate-500 font-medium">Total des dépenses</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPrice(totalExpenses, user.currency)}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-in slide-in-from-top-4">
          <h3 className="font-bold text-slate-900 mb-4">Nouvelle dépense</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
              {/* 👇 MODIFIÉ : Placeholder retiré */}
              <input type="text" required placeholder="" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Montant</label>
              <div className="relative">
                  {/* 👇 MODIFIÉ : pl-12 pour laisser la place au texte de la devise, affichage dynamique de user.currency */}
                  <input type="number" required min="0" placeholder="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500" />
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                      {user.currency}
                  </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catégorie</label>
              <div className="relative">
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500 appearance-none cursor-pointer">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Tag className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
              <div className="relative">
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500" />
                <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Annuler</button>
            <button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Enregistrer</button>
          </div>
        </form>
      )}

      {/* Liste des dépenses */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
        {expenses.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-slate-500">Aucune dépense enregistrée.</p>
            </div>
        ) : (
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4 text-right">Montant</th>
                <th className="px-6 py-4 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{new Date(expense.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{expense.description}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold border border-slate-200">{expense.category}</span></td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">- {formatPrice(expense.amount, user.currency)}</td>
                    <td className="px-6 py-4 text-right">
                    <button onClick={() => onDelete(expense.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
  );
};

export default Expenses;