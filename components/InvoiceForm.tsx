import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, User, formatPrice } from '../types';
import { Plus, Trash2, Save, ArrowLeft, Lock, Calendar, Hash, MapPin, Mail, User as UserIcon, Eye, X, Download, FileText, ChevronDown, CheckCircle2, Clock, File, Wallet, AlignLeft } from 'lucide-react';
import { getInvoicePdfBlobUrl, generateInvoicePDF } from '../services/pdfService';
import { supabase } from '../services/supabaseClient'; 

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  onGoToPricing: () => void; // 👇 NOUVEAU : Fonction de redirection
  user: User;
  invoiceCount: number;
  initialData?: Invoice;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, onCancel, onGoToPricing, user, initialData }) => {
  const isEditing = !!initialData;
  
  // LOGIQUE DE LIMITES MENSUELLES
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [currentMonthCount, setCurrentMonthCount] = useState(0);

  // Initialisation du numéro (vide au départ si nouvelle facture)
  const [number, setNumber] = useState(initialData?.number || 'Chargement...');

  useEffect(() => {
    // Si on édite une facture existante, on ne touche à rien
    if (isEditing) return; 

    // 1. Vérification des limites
    const checkLimits = async () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { count, error } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstDay)
            .eq('user_id', user.id);

        if (!error && count !== null) {
            setCurrentMonthCount(count);
            if (user.plan === 'starter' && count >= 10) setIsLimitReached(true);
            else if (user.plan === 'pro' && count >= 100) setIsLimitReached(true);
        }
    };

    // 2. Génération automatique du numéro (ALGORITHME INTELLIGENT "MAX + 1")
    const generateNextNumber = async () => {
        try {
            // On récupère un lot des dernières factures pour être sûr de trouver le plus grand chiffre
            const { data, error } = await supabase
                .from('invoices')
                .select('number')
                .eq('user_id', user.id)
                .not('number', 'is', null) // Ignore les factures sans numéro
                .neq('number', '')        // Ignore les numéros vides
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            if (data && data.length > 0) {
                // On extrait les chiffres de tous les numéros trouvés
                const numbers = data.map(inv => {
                    const match = inv.number.match(/(\d+)$/);
                    return match ? parseInt(match[0], 10) : 0;
                });

                // On trouve le plus grand nombre parmi ceux récupérés
                const maxNumber = Math.max(...numbers);
                
                // Le prochain numéro est le Max + 1
                const nextNum = maxNumber + 1;
                
                setNumber(`FAC-${nextNum.toString().padStart(3, '0')}`);
                
            } else {
                // Aucune facture valide trouvée, on commence à 001
                setNumber('FAC-001');
            }
        } catch (err) {
            console.error("Erreur calcul numéro:", err);
            setNumber('FAC-001'); 
        }
    };

    checkLimits();
    generateNextNumber();

  }, [user.plan, isEditing, user.id]);


  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || '');
  const [clientAddress, setClientAddress] = useState(initialData?.clientAddress || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialData?.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); 
  const [status, setStatus] = useState<Invoice['status']>(initialData?.status || 'pending');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || ''); 
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [currency, setCurrency] = useState(initialData?.currency || user.currency || 'XOF');
  
  const [items, setItems] = useState<InvoiceItem[]>(initialData?.items || [
    { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }
  ]);

  // Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const constructInvoiceData = (): Invoice => {
    return {
      id: initialData?.id || crypto.randomUUID(),
      number, 
      clientName: clientName || 'Client',
      clientEmail,
      clientAddress,
      date,
      dueDate,
      items,
      total: calculateTotal(),
      status: status,
      paymentMethod: paymentMethod || undefined,
      notes: notes || undefined,
      currency: currency, 
    };
  };

  const handlePreview = () => {
    const tempInvoice = constructInvoiceData();
    const url = getInvoicePdfBlobUrl(tempInvoice, user);
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleDownloadPreview = () => {
     const tempInvoice = constructInvoiceData();
     generateInvoicePDF(tempInvoice, user);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(constructInvoiceData());
  };

  if (isLimitReached) {
    const limit = user.plan === 'starter' ? 10 : 100;
    const nextPlan = user.plan === 'starter' ? 'Pro' : 'Business';
    
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8 bg-white rounded-3xl shadow-card border border-slate-100 max-w-2xl mx-auto mt-10">
        <div className="bg-brand-50 p-6 rounded-full mb-6 ring-8 ring-brand-50/50">
          <Lock className="w-12 h-12 text-brand-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3 font-display">Limite atteinte pour ce mois</h2>
        <p className="text-slate-600 mb-8 max-w-md text-lg leading-relaxed">
          Vous avez atteint votre quota de {limit} factures mensuelles avec le plan <strong>{user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}</strong>.
          <br/><br/>
          Passez au plan <strong>{nextPlan}</strong> pour débloquer plus de factures.
        </p>
        <div className="flex gap-4">
            <button 
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
            Retour
            </button>
            <button 
            onClick={onGoToPricing} // 👈 ICI : APPEL DE LA REDIRECTION
            className="bg-brand-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30"
            >
            Voir les offres
            </button>
        </div>
      </div>
    );
  }

  // Styles pour les status
  const statusStyles = {
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      pending: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      overdue: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  };

  const StatusIcon = {
      paid: CheckCircle2,
      pending: Clock,
      overdue: File 
  }[status] || File;

  // Calcul du restant pour affichage header
  const limit = user.plan === 'starter' ? 10 : user.plan === 'pro' ? 100 : -1;
  const remaining = limit === -1 ? -1 : Math.max(0, limit - currentMonthCount);

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-8 sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md py-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={onCancel} 
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-200 text-slate-500"
            >
            <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-900 font-display">
                    {isEditing ? 'Modifier la facture' : 'Nouvelle facture'}
                </h2>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500">
                        {isEditing ? 'Mettez à jour les informations ci-dessous' : 'Remplissez les informations ci-dessous'}
                    </p>
                    {!isEditing && user.plan !== 'business' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                            remaining === 0 
                            ? 'bg-red-50 text-red-600 border-red-200' 
                            : 'bg-brand-50 text-brand-600 border-brand-200'
                        }`}>
                            {remaining} facture{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''} ce mois
                        </span>
                    )}
                </div>
            </div>
        </div>
        <div className="flex gap-3">
             <button
                onClick={handlePreview}
                className="flex items-center px-4 py-2.5 text-slate-700 font-medium hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-200"
                title="Aperçu PDF"
            >
                <Eye className="w-4 h-4 mr-2 text-slate-500" />
                <span className="hidden sm:inline">Aperçu</span>
            </button>
            <button
                onClick={onCancel}
                className="hidden sm:block px-5 py-2.5 text-slate-600 font-medium hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-200"
            >
                Annuler
            </button>
            <button
                onClick={handleSubmit}
                className="flex items-center px-6 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/25 active:scale-95"
            >
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Mettre à jour' : 'Enregistrer'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Document "Paper" Effect */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 overflow-hidden">
                <div className="h-2 bg-brand-600 w-full"></div>
                <div className="p-8">
                    
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between gap-8 mb-10 pb-8 border-b border-slate-100">
                        <div className="flex-1 space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Informations Client</h3>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    type="text"
                                    placeholder="Nom du client / Entreprise"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="Email (Optionnel)"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                                />
                            </div>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <textarea
                                    placeholder="Adresse complète (Optionnel)"
                                    value={clientAddress}
                                    onChange={(e) => setClientAddress(e.target.value)}
                                    rows={2}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 md:max-w-xs space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Détails Facture</h3>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1">
                                        <Hash className="w-3 h-3" /> Numéro
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={number}
                                        onChange={(e) => setNumber(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:border-brand-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Date d'émission
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Date d'échéance
                                    </label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1">
                                        <StatusIcon className="w-3 h-3" /> Statut
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as Invoice['status'])}
                                            className={`w-full appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-bold border outline-none transition-all cursor-pointer ${statusStyles[status]}`}
                                        >
                                            <option value="pending">En attente</option>
                                            <option value="paid">Payée</option>
                                            <option value="overdue">En retard</option>
                                        </select>
                                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                                            status === 'paid' ? 'text-emerald-600' :
                                            status === 'pending' ? 'text-amber-600' :
                                            'text-slate-500'
                                        }`}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Mode de paiement */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1">
                                        <Wallet className="w-3 h-3" /> Mode de paiement <span className="text-[10px] text-slate-400 font-normal">(Optionnel)</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg text-sm bg-white border border-slate-200 focus:border-brand-500 outline-none transition-all cursor-pointer text-slate-700"
                                        >
                                            <option value="">Non spécifié</option>
                                            <option value="Espèces">Espèces</option>
                                            <option value="Wave">Wave</option>
                                            <option value="Orange Money">Orange Money</option>
                                            <option value="Virement">Virement</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {/* Notes (Nouveau) */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1">
                                        <AlignLeft className="w-3 h-3" /> Notes <span className="text-[10px] text-slate-400 font-normal">(Optionnel)</span>
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-500 outline-none transition-all resize-none text-slate-700 placeholder:text-slate-300"
                                        placeholder="Conditions, remerciements..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-900">Prestations</h3>
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 w-1/2">Description</th>
                                        <th className="px-4 py-3 text-right w-20">Qté</th>
                                        <th className="px-4 py-3 text-right w-32">Prix</th>
                                        <th className="px-4 py-3 text-right w-32">Total</th>
                                        <th className="px-2 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {items.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="p-2">
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Description du service"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border-transparent bg-transparent hover:bg-slate-100 focus:bg-white focus:border-brand-500 border focus:ring-2 focus:ring-brand-500/20 outline-none transition-all placeholder:text-slate-300"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    required
                                                    type="number"
                                                    min="1"
                                                    placeholder="0"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                      const val = parseInt(e.target.value);
                                                      updateItem(item.id, 'quantity', isNaN(val) ? 0 : val);
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                    className="w-full px-3 py-2 text-right rounded-lg border-transparent bg-transparent hover:bg-slate-100 focus:bg-white focus:border-brand-500 border focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    required
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={item.price}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        updateItem(item.id, 'price', isNaN(val) ? 0 : val);
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                    className="w-full px-3 py-2 text-right rounded-lg border-transparent bg-transparent hover:bg-slate-100 focus:bg-white focus:border-brand-500 border focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-right font-medium text-slate-700">
                                                { formatPrice(item.quantity * item.price, currency) }
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button
                                type="button"
                                onClick={addItem}
                                className="w-full py-3 flex items-center justify-center text-sm font-medium text-slate-500 hover:text-brand-600 hover:bg-slate-50 transition-colors border-t border-slate-200"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter une ligne
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Sticky Summary */}
        <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 font-display">Résumé</h3>
                    <div className="space-y-3 pb-4 border-b border-slate-100">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Sous-total</span>
                            <span>{formatPrice(calculateTotal(), currency)}</span>
                        </div>
                    </div>
                    <div className="pt-4">
                         <div className="flex justify-between items-end">
                            <span className="text-sm font-semibold text-slate-700">Total à payer</span>
                            <span className="text-3xl font-bold text-brand-600 tracking-tight">{formatPrice(calculateTotal(), currency)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-brand-50/50 rounded-xl p-4 border border-brand-100">
                    <div className="flex gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm h-fit">
                            <Lock className="w-4 h-4 text-brand-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-brand-900">Données sécurisées</h4>
                            <p className="text-xs text-brand-700 mt-1 leading-relaxed">
                                Vos factures sont stockées en sécurité sur Supabase.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Aperçu du document</h3>
              <div className="flex items-center gap-2">
                <button
                    onClick={handleDownloadPreview}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                </button>
                <button 
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-4 overflow-hidden rounded-b-2xl relative">
              <object
                data={previewUrl}
                type="application/pdf"
                className="w-full h-full rounded-xl shadow-sm border border-slate-200 bg-white block"
              >
                  {/* Fallback for browsers that don't support object PDF viewing (mobile mainly) */}
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-xl border border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-900 font-medium mb-2">L'aperçu n'est pas disponible sur ce navigateur</p>
                        <p className="text-slate-500 text-sm mb-6 max-w-sm">
                            Certains navigateurs (notamment sur mobile) ne permettent pas d'afficher les PDF directement.
                        </p>
                        <button
                            onClick={handleDownloadPreview}
                            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors shadow-sm"
                        >
                            Télécharger le PDF
                        </button>
                  </div>
              </object>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceForm;