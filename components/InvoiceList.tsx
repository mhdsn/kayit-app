import React, { useState, useRef, useEffect } from 'react';
import { Invoice, User, formatPrice } from '../types';
import { generateInvoicePDF } from '../services/pdfService';
// 👇 AJOUT DE 'Wallet' DANS LES IMPORTS
import { Download, Trash2, Search, Filter, FileText, Pencil, Check, AlertTriangle, Lock, Loader2, Wallet } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  user: User;
  onDelete: (id: string) => void;
  onEdit?: (invoice: Invoice) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, user, onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'draft'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const isStarter = user.plan === 'starter';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (invoice: Invoice) => {
    setDownloadingId(invoice.id); 
    
    setTimeout(async () => {
        try {
            await generateInvoicePDF(invoice, user);
        } catch (error) {
            console.error("Erreur génération PDF", error);
        } finally {
            setDownloadingId(null); 
        }
    }, 50);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      onDelete(invoiceToDelete);
      setInvoiceToDelete(null);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const term = searchTerm.toLowerCase();
    
    const invoiceNum = invoice.number || ''; 

    const matchesSearch = 
      invoice.clientName.toLowerCase().includes(term) ||
      invoiceNum.toLowerCase().includes(term) ||
      (invoice.clientEmail && invoice.clientEmail.toLowerCase().includes(term));
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    let matchesHistory = true;
    if (isStarter) {
        const invoiceDate = new Date(invoice.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        matchesHistory = invoiceDate >= thirtyDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesHistory;
  });
  
  const hiddenCount = isStarter ? invoices.length - invoices.filter(inv => {
      const invoiceDate = new Date(inv.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return invoiceDate >= thirtyDaysAgo;
  }).length : 0;

  const statusConfig: Record<string, { label: string, classes: string, dot: string }> = {
    paid: { label: 'Payée', classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20', dot: 'bg-emerald-500' },
    pending: { label: 'En attente', classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20', dot: 'bg-amber-500' },
    draft: { label: 'Brouillon', classes: 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/20', dot: 'bg-slate-400' }
  };

  const filterOptions = [
    { value: 'all', label: 'Toutes les factures' },
    { value: 'paid', label: 'Payées' },
    { value: 'pending', label: 'En attente' },
    { value: 'draft', label: 'Brouillons' }
  ];

  return (
    <div className="space-y-6 pb-10">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-900 font-display">Mes factures</h2>
            <p className="text-slate-500 mt-1">Gérez et suivez l'état de vos facturations.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative group flex-1 md:flex-none">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Rechercher (Client, N°...)" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none w-full md:w-64 transition-all shadow-sm"
                />
            </div>
            
            <div className="relative" ref={filterMenuRef}>
                <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={`p-2 border rounded-xl transition-all shadow-sm flex items-center justify-center ${
                        statusFilter !== 'all' || showFilterMenu
                        ? 'bg-brand-50 border-brand-200 text-brand-600' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                    title="Filtrer par statut"
                >
                    <Filter className="w-4 h-4" />
                </button>

                {showFilterMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                            Filtrer par statut
                        </div>
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    setStatusFilter(option.value as any);
                                    setShowFilterMenu(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                    statusFilter === option.value ? 'text-brand-600 font-medium bg-brand-50/50' : 'text-slate-600'
                                }`}
                            >
                                {option.label}
                                {statusFilter === option.value && <Check className="w-3.5 h-3.5" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Aucune facture</h3>
             <p className="text-slate-500 max-w-sm mx-auto">
                 Vous n'avez pas encore créé de facture. Commencez dès maintenant pour suivre vos paiements.
             </p>
          </div>
        ) : filteredInvoices.length === 0 && hiddenCount === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
             </div>
             <p className="text-slate-900 font-medium mb-1">Aucun résultat trouvé</p>
             <p className="text-slate-500 text-sm">
                Essayez de modifier vos filtres ou votre recherche.
             </p>
             {statusFilter !== 'all' && (
                 <button 
                    onClick={() => setStatusFilter('all')}
                    className="mt-4 text-sm text-brand-600 font-medium hover:text-brand-700"
                 >
                    Effacer le filtre
                 </button>
             )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Numéro</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Montant</th>
                  {/* 👇 NOUVELLE COLONNE VIA */}
                  <th className="px-6 py-4 text-center">Via</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                    const status = statusConfig[invoice.status] || statusConfig.draft;
                    const isDownloading = downloadingId === invoice.id;

                    return (
                    <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4 font-mono font-medium text-slate-600">{invoice.number}</td>
                        <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900 block">{invoice.clientName}</span>
                            {invoice.clientEmail && <span className="text-xs text-slate-400">{invoice.clientEmail}</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{new Date(invoice.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {formatPrice(invoice.total, user.currency)}
                        </td>
                        
                        {/* 👇 NOUVELLE CELLULE VIA */}
                        <td className="px-6 py-4 text-center">
                            {invoice.paymentMethod ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                                    <Wallet className="w-3 h-3 text-slate-400" />
                                    {invoice.paymentMethod}
                                </span>
                            ) : (
                                <span className="text-slate-300">-</span>
                            )}
                        </td>

                        <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.classes}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot}`}></span>
                                {status.label}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                            {!isStarter ? (
                                <>
                                    {onEdit && (
                                    <button
                                        onClick={() => onEdit(invoice)}
                                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200"
                                        title="Modifier"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    )}
                                    
                                    <button
                                        onClick={() => handleDownload(invoice)}
                                        disabled={isDownloading}
                                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200"
                                        title={isDownloading ? "Génération..." : "Télécharger PDF"}
                                    >
                                        {isDownloading ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setInvoiceToDelete(invoice.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                     <button
                                        onClick={() => handleDownload(invoice)}
                                        disabled={isDownloading}
                                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200"
                                        title={isDownloading ? "Génération..." : "Télécharger PDF"}
                                    >
                                        {isDownloading ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                    </button>
                                     <button
                                      disabled
                                      className="p-2 text-slate-200 cursor-not-allowed"
                                      title="Modification disponible en version Pro"
                                     >
                                      <Lock className="w-4 h-4" />
                                     </button>
                                </div>
                            )}
                        </div>
                        </td>
                    </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {hiddenCount > 0 && isStarter && (
            <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-500">
                    <span className="font-semibold">{hiddenCount} factures anciennes</span> masquées par le plan Starter.
                </p>
                <p className="text-xs text-brand-600 font-medium mt-1 cursor-pointer">Passez au plan Pro pour voir tout l'historique.</p>
            </div>
        )}
      </div>

      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Supprimer la facture ?</h3>
                            <p className="text-slate-500 mt-1 text-sm leading-relaxed">
                                Cette action est irréversible. La facture sera définitivement retirée de votre historique.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={() => setInvoiceToDelete(null)}
                        className="px-4 py-2.5 text-slate-700 font-medium hover:bg-white hover:shadow-sm rounded-xl border border-transparent hover:border-slate-200 transition-all text-sm"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all text-sm active:scale-95"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;