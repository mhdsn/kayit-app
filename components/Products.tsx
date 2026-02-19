// ================================================================
// components/Products.tsx
// Gestion des produits : CRUD + alertes stock + calcul marge
// ================================================================

import React, { useState, useMemo } from 'react';
import {
  Package, Plus, Pencil, Trash2, AlertTriangle, Search,
  X, Tag, TrendingUp, BarChart2, ChevronDown, Image, Check
} from 'lucide-react';
import { Product, ProductFormData, User, formatPrice, LOW_STOCK_THRESHOLD } from '../types';
import { addProduct, updateProduct, deleteProduct } from '../services/productService';

interface ProductsProps {
  products: Product[];
  user: User;
  onProductsChange: () => void; // callback pour recharger
}

const EMPTY_FORM: ProductFormData = {
  nom: '',
  prix_achat: 0,
  prix_vente: 0,
  stock: 0,
  categorie: '',
  image_url: '',
};

const CATEGORIES = ['Électronique', 'Vêtements', 'Alimentation', 'Cosmétiques', 'Mobilier', 'Services', 'Autre'];

const Products: React.FC<ProductsProps> = ({ products, user, onProductsChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tous');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fmt = (n: number) => formatPrice(n, user.currency);

  // Catégories disponibles (union fixe + dynamique)
  const allCategories = useMemo(() => {
    const cats = new Set<string>(CATEGORIES);
    products.forEach(p => { if (p.categorie) cats.add(p.categorie); });
    return ['Tous', ...Array.from(cats).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === 'Tous' || p.categorie === filterCat;
      return matchSearch && matchCat;
    });
  }, [products, search, filterCat]);

  const lowStockItems = products.filter(p => p.stock < LOW_STOCK_THRESHOLD);

  // Statistiques rapides
  const stats = useMemo(() => {
    const totalStock = products.reduce((s, p) => s + p.stock, 0);
    const totalValeur = products.reduce((s, p) => s + p.stock * p.prix_achat, 0);
    const avgMarge = products.length > 0
      ? products.reduce((s, p) => s + (p.prix_vente - p.prix_achat), 0) / products.length
      : 0;
    return { totalStock, totalValeur, avgMarge };
  }, [products]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      nom: p.nom,
      prix_achat: p.prix_achat,
      prix_vente: p.prix_vente,
      stock: p.stock,
      categorie: p.categorie || '',
      image_url: p.image_url || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, form);
      } else {
        await addProduct(form);
      }
      onProductsChange();
      setShowForm(false);
    } catch (err) {
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      onProductsChange();
    } catch {
      alert('Impossible de supprimer ce produit (peut-être lié à des commandes).');
    }
    setDeleteConfirm(null);
  };

  const marge = (p: ProductFormData) => {
    if (p.prix_vente === 0) return 0;
    return ((p.prix_vente - p.prix_achat) / p.prix_vente * 100);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produits</h1>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} produit{products.length > 1 ? 's' : ''} au catalogue</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Ajouter un produit
        </button>
      </div>

      {/* ALERTES STOCK */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Stock faible détecté</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {lowStockItems.map(p => `${p.nom} (${p.stock} restant${p.stock > 1 ? 's' : ''})`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Unités en stock', value: stats.totalStock.toLocaleString('fr-FR'), icon: Package, color: 'text-blue-600 bg-blue-50' },
          { label: 'Valeur du stock', value: fmt(stats.totalValeur), icon: BarChart2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Marge moyenne', value: `${stats.avgMarge.toFixed(0)} ${user.currency === 'XOF' ? 'FCFA' : user.currency}`, icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-lg font-bold text-slate-900 truncate">{s.value}</p>
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
            placeholder="Rechercher un produit..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="relative">
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* LISTE PRODUITS */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aucun produit trouvé</p>
          <p className="text-xs text-slate-400 mt-1">Ajoutez votre premier produit pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => {
            const margeVal = product.prix_vente > 0
              ? ((product.prix_vente - product.prix_achat) / product.prix_vente * 100)
              : 0;
            const isLowStock = product.stock < LOW_STOCK_THRESHOLD;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3"
              >
                {/* Image / Placeholder */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.nom} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{product.nom}</h3>
                    {product.categorie && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                        {product.categorie}
                      </span>
                    )}
                  </div>
                </div>

                {/* Prix */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-500">Prix achat</p>
                    <p className="font-semibold text-slate-800">{fmt(product.prix_achat)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-blue-600">Prix vente</p>
                    <p className="font-semibold text-blue-700">{fmt(product.prix_vente)}</p>
                  </div>
                </div>

                {/* Stock + Marge */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isLowStock ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isLowStock && <AlertTriangle className="w-3 h-3" />}
                    Stock : {product.stock}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Marge : <span className="text-emerald-600 font-bold">{margeVal.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => openEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Modifier
                  </button>
                  {deleteConfirm === product.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="px-3 py-2 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >Confirmer</button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-2 text-xs bg-slate-100 text-slate-700 rounded-lg"
                      >Non</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE FORMULAIRE */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du produit *</label>
                <input
                  required
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: T-shirt blanc M"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prix d'achat *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.prix_achat}
                    onChange={e => setForm({ ...form, prix_achat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prix de vente *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.prix_vente}
                    onChange={e => setForm({ ...form, prix_vente: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Aperçu marge en temps réel */}
              {form.prix_vente > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 flex justify-between items-center">
                  <span className="text-sm text-emerald-700">Marge calculée</span>
                  <span className="font-bold text-emerald-700">
                    {marge(form).toFixed(1)}% — {fmt(form.prix_vente - form.prix_achat)} / unité
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Stock initial</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Catégorie</label>
                <div className="relative">
                  <select
                    value={form.categorie}
                    onChange={e => setForm({ ...form, categorie: e.target.value })}
                    className="appearance-none w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Choisir —</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">URL de l'image (optionnel)</label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={form.image_url}
                    onChange={e => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  {saving ? 'Enregistrement...' : (
                    <><Check className="w-4 h-4" /> {editingId ? 'Mettre à jour' : 'Ajouter'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
