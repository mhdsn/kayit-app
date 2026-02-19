// ================================================================
// components/Orders.tsx
// Gestion des commandes : création, statut, lien facture
// ================================================================

import React, { useState, useMemo } from 'react';
import {
  ShoppingCart, Plus, X, Check, Search, ChevronDown,
  Phone, User as UserIcon, Trash2, PackageCheck,
  XCircle, Clock, FileText, AlertCircle
} from 'lucide-react';
import {
  Commande, CommandeFormData, CommandeStatut, Product, User,
  formatPrice, COMMANDE_STATUT_LABELS, COMMANDE_STATUT_COLORS,
  formatDate, AppRoute
} from '../types';
import {
  createCommande, updateCommandeStatut, deleteCommande
} from '../services/commandeService';

interface OrdersProps {
  commandes: Commande[];
  products: Product[];
  user: User;
  onCommandesChange: () => void;
  onNavigate: (route: AppRoute) => void;
  onGenerateInvoice: (commande: Commande) => void;
}

const MODES_PAIEMENT = ['Espèces', 'Mobile Money', 'Virement', 'Carte bancaire', 'Chèque'];

const EMPTY_FORM: CommandeFormData = {
  client_nom: '',
  client_telephone: '',
  mode_paiement: '',
  notes: '',
  items: [],
};

const Orders: React.FC<OrdersProps> = ({
  commandes, products, user, onCommandesChange, onNavigate, onGenerateInvoice
}) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CommandeFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<CommandeStatut | 'tous'>('tous');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fmt = (n: number) => formatPrice(n, user.currency);

  // Stats
  const stats = useMemo(() => {
    const validees = commandes.filter(c => c.statut === 'validee');
    const enAttente = commandes.filter(c => c.statut === 'en_attente');
    return {
      totalVentes: validees.reduce((s, c) => s + c.total, 0),
      nbValidees: validees.length,
      nbEnAttente: enAttente.length,
    };
  }, [commandes]);

  const filtered = useMemo(() => {
    return commandes.filter(c => {
      const matchSearch =
        c.client_nom.toLowerCase().includes(search.toLowerCase()) ||
        (c.client_telephone || '').includes(search);
      const matchStatut = filterStatut === 'tous' || c.statut === filterStatut;
      return matchSearch && matchStatut;
    });
  }, [commandes, search, filterStatut]);

  // --- Gestion du formulaire ---
  const addItem = () => {
    if (products.length === 0) return;
    const firstProduct = products[0];
    setForm(f => ({
      ...f,
      items: [
        ...f.items,
        { produit_id: firstProduct.id, quantite: 1, prix_unitaire: firstProduct.prix_vente }
      ]
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setForm(f => {
      const items = [...f.items];
      if (field === 'produit_id') {
        const prod = products.find(p => p.id === value);
        items[index] = {
          ...items[index],
          produit_id: value,
          prix_unitaire: prod?.prix_vente || 0,
        };
      } else {
        items[index] = { ...items[index], [field]: value };
      }
      return { ...f, items };
    });
  };

  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const totalCommande = form.items.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.client_nom) { setFormError('Le nom du client est requis.'); return; }
    if (form.items.length === 0) { setFormError('Ajoutez au moins un produit.'); return; }

    setSaving(true);
    try {
      await createCommande(form);
      onCommandesChange();
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatutChange = async (id: string, statut: CommandeStatut) => {
    setUpdatingId(id);
    try {
      await updateCommandeStatut(id, statut);
      onCommandesChange();
      // Si validée → proposer la génération de facture
      if (statut === 'validee') {
        const commande = commandes.find(c => c.id === id);
        if (commande && !commande.invoice_id) {
          onGenerateInvoice({ ...commande, statut: 'validee' });
        }
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette commande ?')) return;
    try {
      await deleteCommande(id);
      onCommandesChange();
    } catch {
      alert('Erreur suppression.');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commandes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{commandes.length} commande{commandes.length > 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nouvelle commande
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Chiffre d\'affaires', value: fmt(stats.totalVentes), icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
          { label: 'Validées', value: stats.nbValidees, icon: PackageCheck, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'En attente', value: stats.nbEnAttente, icon: Clock, color: 'bg-amber-50 text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* FILTRES */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par client ou téléphone..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value as any)}
            className="appearance-none pl-4 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="tous">Tous les statuts</option>
            {(['en_attente', 'validee', 'annulee'] as CommandeStatut[]).map(s => (
              <option key={s} value={s}>{COMMANDE_STATUT_LABELS[s]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* LISTE */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(commande => (
            <div key={commande.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                {/* Info client */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{commande.client_nom}</p>
                    {commande.client_telephone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {commande.client_telephone}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{formatDate(commande.created_at)}</p>
                  </div>
                </div>

                {/* Total + Statut */}
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{fmt(commande.total)}</p>
                  <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${COMMANDE_STATUT_COLORS[commande.statut]}`}>
                    {COMMANDE_STATUT_LABELS[commande.statut]}
                  </span>
                </div>
              </div>

              {/* Items */}
              {commande.items && commande.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-50">
                  <div className="flex flex-wrap gap-2">
                    {commande.items.map((item, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                        {item.produit_nom} × {item.quantite}
                      </span>
                    ))}
                  </div>
                  {commande.mode_paiement && (
                    <p className="text-xs text-slate-400 mt-1.5">Paiement : {commande.mode_paiement}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                {commande.statut === 'en_attente' && (
                  <>
                    <button
                      disabled={updatingId === commande.id}
                      onClick={() => handleStatutChange(commande.id, 'validee')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-200 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Valider
                    </button>
                    <button
                      disabled={updatingId === commande.id}
                      onClick={() => handleStatutChange(commande.id, 'annulee')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Annuler
                    </button>
                    <button
                      onClick={() => handleDelete(commande.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer
                    </button>
                  </>
                )}
                {commande.statut === 'validee' && !commande.invoice_id && (
                  <button
                    onClick={() => onGenerateInvoice(commande)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> Générer facture
                  </button>
                )}
                {commande.invoice_id && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 rounded-lg text-xs font-semibold">
                    <FileText className="w-3.5 h-3.5" /> Facture liée
                  </span>
                )}
                {commande.statut === 'validee' && (
                  <button
                    disabled={updatingId === commande.id}
                    onClick={() => handleStatutChange(commande.id, 'annulee')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Annuler & restaurer stock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALE FORMULAIRE */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Nouvelle commande</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* Client */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Client</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Nom *</label>
                    <input
                      required
                      value={form.client_nom}
                      onChange={e => setForm({ ...form, client_nom: e.target.value })}
                      placeholder="Mamadou Diallo"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Téléphone</label>
                    <input
                      value={form.client_telephone}
                      onChange={e => setForm({ ...form, client_telephone: e.target.value })}
                      placeholder="+221 77 000 00 00"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Mode paiement */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Mode de paiement</label>
                <div className="relative">
                  <select
                    value={form.mode_paiement}
                    onChange={e => setForm({ ...form, mode_paiement: e.target.value })}
                    className="appearance-none w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Choisir —</option>
                    {MODES_PAIEMENT.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Produits */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-slate-700">Produits</label>
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={products.length === 0}
                    className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-700 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter ligne
                  </button>
                </div>

                {products.length === 0 && (
                  <div className="bg-amber-50 text-amber-700 text-xs rounded-xl px-4 py-3">
                    Aucun produit disponible. Créez d'abord des produits.
                  </div>
                )}

                {form.items.length === 0 && products.length > 0 && (
                  <p className="text-sm text-slate-400 italic">Cliquez sur "Ajouter ligne" pour commencer.</p>
                )}

                <div className="space-y-3">
                  {form.items.map((item, idx) => {
                    const prod = products.find(p => p.id === item.produit_id);
                    return (
                      <div key={idx} className="bg-slate-50 rounded-xl p-3 space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <select
                              value={item.produit_id}
                              onChange={e => updateItem(idx, 'produit_id', e.target.value)}
                              className="appearance-none w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.nom} (stock: {p.stock})
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Qté</p>
                            <input
                              type="number"
                              min="1"
                              max={prod?.stock || 9999}
                              value={item.quantite}
                              onChange={e => updateItem(idx, 'quantite', parseInt(e.target.value) || 1)}
                              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Prix unitaire</p>
                            <input
                              type="number"
                              min="0"
                              value={item.prix_unitaire}
                              onChange={e => updateItem(idx, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Sous-total</p>
                            <p className="py-2 text-sm font-semibold text-slate-800 truncate">
                              {fmt(item.quantite * item.prix_unitaire)}
                            </p>
                          </div>
                        </div>
                        {prod && item.quantite > prod.stock && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Quantité dépasse le stock ({prod.stock})
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {form.items.length > 0 && (
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Total commande</span>
                    <span className="text-xl font-bold text-blue-600">{fmt(totalCommande)}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Notes (optionnel)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Instructions spéciales, adresse de livraison..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Création...' : <><Check className="w-4 h-4" /> Créer la commande</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
