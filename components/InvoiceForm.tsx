import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, User, formatPrice, Client } from '../types'; 
import { Plus, Trash2, Save, ArrowLeft, Lock, Mail, User as UserIcon, Eye, X, Download, FileText, ChevronDown, Wallet, AlignLeft, Sparkles, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { getInvoicePdfBlobUrl, generateInvoicePDF } from '../services/pdfService';
import { supabase } from '../services/supabaseClient'; 
import { getClients, upsertClient } from '../services/clientService'; 

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  onGoToPricing: () => void;
  user: User;
  invoiceCount: number;
  initialData?: Invoice;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, onCancel, onGoToPricing, user, initialData }) => {
  const isEditing = !!initialData;
  
  // --- LOGIQUE METIER (Supabase & Limites) ---
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [currentMonthCount, setCurrentMonthCount] = useState(0);
  const [number, setNumber] = useState(initialData?.number || 'Chargement...');

  // État pour les clients sauvegardés
  const [savedClients, setSavedClients] = useState<Client[]>([]);

  useEffect(() => {
    const loadClients = async () => {
        const clients = await getClients();
        setSavedClients(clients);
    };
    loadClients();

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

    // 2. Génération automatique du numéro
    const generateNextNumber = async () => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('number')
                .eq('user_id', user.id)
                .not('number', 'is', null)
                .neq('number', '')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            if (data && data.length > 0) {
                const numbers = data.map(inv => {
                    const match = inv.number.match(/(\d+)$/);
                    return match ? parseInt(match[0], 10) : 0;
                });
                const maxNumber = Math.max(...numbers);
                const nextNum = maxNumber + 1;
                setNumber(`FAC-${nextNum.toString().padStart(3, '0')}`);
            } else {
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

  // --- ETATS DU FORMULAIRE ---
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || '');
  const [clientAddress, setClientAddress] = useState(initialData?.clientAddress || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  
  const [showDueDate, setShowDueDate] = useState(!!initialData?.dueDate); 
  const [dueDate, setDueDate] = useState(initialData?.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); 
  
  const [status, setStatus] = useState<Invoice['status']>(initialData?.status || 'pending');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || ''); 
  
  // Note par défaut
  const [notes, setNotes] = useState(initialData?.notes || user.defaultNote || '');
  
  const [currency, setCurrency] = useState(initialData?.currency || user.currency || 'XOF');
  
  const [items, setItems] = useState<InvoiceItem[]>(initialData?.items || [
    { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }
  ]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Gestion intelligente du changement de nom client
  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setClientName(newName);

      const existingClient = savedClients.find(c => c.name.toLowerCase() === newName.toLowerCase());
      if (existingClient) {
          if (!clientEmail) setClientEmail(existingClient.email || '');
          if (!clientAddress) setClientAddress(existingClient.address || '');
      }
  };

  // --- FONCTIONS ITEMS ---
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
      dueDate: showDueDate ? dueDate : undefined,
      items,
      total: calculateTotal(),
      status: status,
      paymentMethod: paymentMethod || undefined,
      notes: notes || undefined,
      currency: currency, 
      // 👇 IMPORTANT : On n'a pas besoin de stocker la signature dans l'objet Invoice en BDD 
      // car elle est liée au User. Le service PDF la récupérera via l'objet 'user' passé en argument.
    };
  };

  const handlePreview = () => {
    const tempInvoice = constructInvoiceData();
    // On passe 'user' qui contient maintenant potentiellement user.signature
    const url = getInvoicePdfBlobUrl(tempInvoice, user);
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleDownloadPreview = () => {
     const tempInvoice = constructInvoiceData();
     generateInvoicePDF(tempInvoice, user);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (clientName.trim()) {
        await upsertClient({
            name: clientName,
            email: clientEmail,
            address: clientAddress
        });
    }

    onSave(constructInvoiceData());
  };

  // --- RENDU BLOCAGE LIMITE ---
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
            <button onClick={onCancel} className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Retour
            </button>
            <button onClick={onGoToPricing} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30">
            Voir les offres
            </button>
        </div>
      </div>
    );
  }

  // Styles status
  const statusStyles = {
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      pending: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      overdue: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  };

  const limitCount = user.plan === 'starter' ? 10 : user.plan === 'pro' ? 100 : -1;
  const remaining = limitCount === -1 ? -1 : Math.max(0, limitCount - currentMonthCount);

  // --- RENDU PRINCIPAL ---
  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* 1. TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md py-4">
        <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 border border-transparent hover:border-slate-200">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-900 font-display">
                    {isEditing ? 'Modifier la facture' : 'Nouvelle facture'}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-slate-500">
                        {isEditing ? 'Mise à jour' : 'Remplissez les infos'}
                    </p>
                    {!isEditing && user.plan !== 'business' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                            remaining === 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-brand-50 text-brand-600 border-brand-200'
                        }`}>
                            {remaining} restante{remaining > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
             <button onClick={handlePreview} className="flex-1 md:flex-none flex items-center justify-center px-4 py-2.5 text-slate-700 font-medium bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                <Eye className="w-4 h-4 mr-2" /> Aperçu
            </button>
            <button onClick={handleSubmit} className="flex-1 md:flex-none flex items-center justify-center px-6 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 shadow-lg shadow-brand-500/25">
                <Save className="w-4 h-4 mr-2" /> Enregistrer
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* 2. GAUCHE : FORMULAIRE */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Carte Infos */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 overflow-hidden">
                <div className="h-2 bg-brand-600 w-full"></div>
                <div className="p-4 md:p-8">
                    
                    {/* Infos Client et Facture */}
                    <div className="flex flex-col gap-6 mb-8 border-b border-slate-100 pb-8">
                        {/* Client */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <UserIcon className="w-3 h-3" /> Informations Client
                            </h3>
                            
                            <div>
                                <input
                                    required 
                                    list="clients-list"
                                    type="text" 
                                    placeholder="Nom du client / Entreprise"
                                    value={clientName} 
                                    onChange={handleClientNameChange}
                                    className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none font-medium text-slate-900 placeholder:text-slate-400"
                                />
                                <datalist id="clients-list">
                                    {savedClients.map((client, index) => (
                                        <option key={index} value={client.name} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input type="email" placeholder="Email (Optionnel)" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
                                </div>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input type="text" placeholder="Adresse (Optionnel)" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="w-full pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Détails Facture (Grid Responsive) */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Détails
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Numéro</label>
                                    <input type="text" required value={number} onChange={(e) => setNumber(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-sm focus:border-brand-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Date d'émission</label>
                                    <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" />
                                </div>

                                {/* Gestion Échéance */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-semibold text-slate-500 block">Échéance</label>
                                        <div className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                id="toggleDueDate"
                                                checked={showDueDate} 
                                                onChange={(e) => setShowDueDate(e.target.checked)}
                                                className="w-3.5 h-3.5 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer accent-brand-600"
                                            />
                                            <label htmlFor="toggleDueDate" className="ml-1.5 text-[10px] text-brand-600 font-medium cursor-pointer uppercase tracking-wide hover:text-brand-700">
                                                {showDueDate ? 'Active' : 'Ajouter'}
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {showDueDate ? (
                                        <input 
                                            type="date" 
                                            value={dueDate} 
                                            onChange={(e) => setDueDate(e.target.value)} 
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none animate-in fade-in slide-in-from-top-1" 
                                        />
                                    ) : (
                                        <div className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-400 italic cursor-not-allowed select-none">
                                            Aucune (Payable à réception)
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Statut</label>
                                    <div className="relative">
                                        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={`w-full appearance-none px-3 py-2 rounded-lg text-sm font-bold border outline-none ${statusStyles[status]}`}>
                                            <option value="pending">En attente</option>
                                            <option value="paid">Payée</option>
                                            <option value="overdue">En retard</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block flex items-center gap-1">
                                        <Wallet className="w-3 h-3" /> Mode de paiement
                                    </label>
                                    <div className="relative">
                                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full appearance-none px-3 py-2 rounded-lg text-sm bg-white border border-slate-200 focus:border-brand-500 outline-none transition-all cursor-pointer text-slate-700">
                                            <option value="">Non spécifié</option>
                                            <option value="Espèces">Espèces</option>
                                            <option value="Wave">Wave</option>
                                            <option value="Orange Money">Orange Money</option>
                                            <option value="Virement">Virement</option>
                                            <option value="Chèque">Chèque</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRESTATIONS */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                             <Sparkles className="w-4 h-4 text-brand-600" /> Prestations
                        </h3>
                        
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-brand-200 transition-colors group">
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="flex-1">
                                            <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">Description</label>
                                            <input required type="text" placeholder="Description du service" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-sm"/>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-20 md:w-24">
                                                <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">Qté</label>
                                                <input required type="number" min="1" placeholder="0" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} className="w-full px-3 py-2 text-center bg-white border border-slate-200 rounded-lg outline-none text-sm"/>
                                            </div>
                                            <div className="flex-1 md:w-32">
                                                <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">Prix</label>
                                                <input required type="number" min="0" placeholder="0" value={item.price} onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} onFocus={(e) => e.target.select()} className="w-full px-3 py-2 text-right bg-white border border-slate-200 rounded-lg outline-none text-sm"/>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-3 md:w-28 pt-2 md:pt-0 border-t md:border-0 border-slate-200 mt-1 md:mt-0">
                                            <span className="md:hidden text-xs font-semibold text-slate-500">Total :</span>
                                            <span className="font-bold text-slate-700 text-sm">{formatPrice(item.quantity * item.price, currency)}</span>
                                            <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addItem} className="mt-4 w-full py-3 flex items-center justify-center text-sm font-medium text-brand-600 bg-brand-50/50 hover:bg-brand-50 border border-brand-100 rounded-xl transition-colors">
                            <Plus className="w-4 h-4 mr-2" /> Ajouter une ligne
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Notes */}
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-card border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-2"><AlignLeft className="w-3 h-3" /> Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none resize-none" placeholder="Conditions, remerciements, IBAN..." />
            </div>
        </div>

        {/* DROITE : RÉSUMÉ */}
        <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 font-display">Résumé</h3>
                    <div className="space-y-3 pb-4 border-b border-slate-100">
                        <div className="flex justify-between text-sm text-slate-500"><span>Sous-total</span><span>{formatPrice(calculateTotal(), currency)}</span></div>
                    </div>
                    <div className="pt-4">
                         <div className="flex justify-between items-end">
                            <span className="text-sm font-semibold text-slate-700">Total à payer</span>
                            <span className="text-3xl font-bold text-brand-600 tracking-tight">{formatPrice(calculateTotal(), currency)}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-brand-50/50 rounded-xl p-4 border border-brand-100 flex gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm h-fit"><Lock className="w-4 h-4 text-brand-600" /></div>
                    <div>
                        <h4 className="text-sm font-bold text-brand-900">Données sécurisées</h4>
                        <p className="text-xs text-brand-700 mt-1 leading-relaxed">Vos factures sont stockées en sécurité sur Supabase.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Aperçu du document</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleDownloadPreview} className="flex items-center px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"><Download className="w-4 h-4 mr-2" /> Télécharger</button>
                <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-4 overflow-hidden rounded-b-2xl relative">
              <object data={previewUrl} type="application/pdf" className="w-full h-full rounded-xl shadow-sm border border-slate-200 bg-white block">
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-xl border border-slate-200">
                        <FileText className="w-8 h-8 text-slate-400 mb-4" />
                        <p className="text-slate-900 font-medium mb-2">Aperçu non disponible sur mobile</p>
                        <button onClick={handleDownloadPreview} className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-medium">Télécharger le PDF</button>
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