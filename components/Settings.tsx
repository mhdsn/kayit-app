import React, { useState, useRef, useEffect } from 'react';
import { User, CURRENCIES } from '../types';
import { Save, User as UserIcon, Building, Mail, Phone, MapPin, Globe, Image as ImageIcon, Palette, Lock, Crown, Upload, Trash2, AlertCircle, AlertTriangle, CheckCircle2, AlignLeft, X } from 'lucide-react';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, setHasUnsavedChanges }) => {
  const [formData, setFormData] = useState<User>(user);
  const [showSuccess, setShowSuccess] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  
  const [isDirty, setIsDirty] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBusiness = user.plan === 'business';

  // 1. EFFET : Détecter les changements ET informer App.tsx
  useEffect(() => {
    const normalize = (val: string | undefined) => val || '';
    
    const hasChanges = 
        normalize(formData.name) !== normalize(user.name) ||
        normalize(formData.email) !== normalize(user.email) ||
        normalize(formData.businessName) !== normalize(user.businessName) ||
        normalize(formData.phone) !== normalize(user.phone) ||
        normalize(formData.address) !== normalize(user.address) ||
        normalize(formData.currency) !== normalize(user.currency || 'XOF') ||
        normalize(formData.brandColor) !== normalize(user.brandColor || '#2563EB') ||
        normalize(formData.defaultNote) !== normalize(user.defaultNote) ||
        formData.logo !== user.logo ||
        formData.signature !== user.signature; // 👈 AJOUT : Détection changement signature

    setIsDirty(hasChanges);
    setHasUnsavedChanges(hasChanges);

    return () => setHasUnsavedChanges(false);
  }, [formData, user, setHasUnsavedChanges]);

  // 2. EFFET : Protection fermeture navigateur
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setShowSuccess(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoError(null);

    if (!file) return;

    if (!file.type.startsWith('image/')) {
        setLogoError("Le fichier doit être une image (PNG, JPG).");
        return;
    }

    if (file.size > 500 * 1024) {
        setLogoError("L'image est trop volumineuse (Max 500 Ko).");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, logo: base64String }));
    };
    reader.readAsDataURL(file);
  };

  // 👇 AJOUT : Fonction d'upload pour la signature
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 1024 * 1024) { // Limite 1MB
            alert("L'image est trop lourde (max 1MB)");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, signature: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
      setFormData(prev => ({ ...prev, logo: undefined }));
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    onUpdateUser(formData);
    
    setIsDirty(false); 
    setHasUnsavedChanges(false); 
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900 font-display">Paramètres</h2>
        <p className="text-slate-500 mt-1">Gérez vos préférences et les informations de votre entreprise.</p>
      </div>

      {/* BANNIÈRE ALERTE VISUELLE */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden mb-6 ${isDirty ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 shadow-sm animate-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
                <p className="text-sm font-bold">Modifications non enregistrées</p>
                <p className="text-xs text-amber-700">Si vous quittez, vos modifications seront perdues.</p>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section Marque */}
        <div className={`rounded-2xl shadow-card border overflow-hidden transition-all ${
             isBusiness ? 'bg-white border-violet-100 ring-1 ring-violet-500/10' : 'bg-slate-50 border-slate-200 opacity-90'
        }`}>
          <div className={`px-6 py-4 border-b flex items-center justify-between ${
               isBusiness ? 'bg-violet-50/50 border-violet-100' : 'bg-slate-100 border-slate-200'
          }`}>
            <h3 className={`font-bold flex items-center gap-2 ${isBusiness ? 'text-violet-900' : 'text-slate-500'}`}>
              <Crown className={`w-4 h-4 ${isBusiness ? 'text-violet-600' : 'text-slate-400'}`} />
              Personnalisation de la marque
            </h3>
            {!isBusiness && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 px-2 py-1 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Plan Business
                </span>
            )}
             {isBusiness && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-600 px-2 py-1 rounded flex items-center gap-1">
                    Activé
                </span>
            )}
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2 relative">
             {!isBusiness && (
                 <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center"></div>
             )}
             
             {/* LOGO */}
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Logo de l'entreprise</label>
                <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden relative group">
                        {formData.logo ? (
                            <>
                                <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                                {isBusiness && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button type="button" onClick={removeLogo} className="p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                    </div>
                    <div className="flex-1">
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/png, image/jpeg, image/jpg" disabled={!isBusiness} className="hidden" />
                        <button type="button" disabled={!isBusiness} onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm mb-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Upload className="w-4 h-4 mr-2" /> Importer une image
                        </button>
                        <p className="text-[10px] text-slate-400 leading-tight">Format PNG/JPG. Max 500 Ko.</p>
                        {logoError && <div className="flex items-center mt-2 text-[10px] text-red-600 font-medium animate-in fade-in slide-in-from-top-1"><AlertCircle className="w-3 h-3 mr-1" />{logoError}</div>}
                    </div>
                </div>
            </div>

            {/* COULEUR */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Couleur principale</label>
                <div className="flex items-center gap-3">
                    <div className="relative w-full">
                        <Palette className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input type="text" name="brandColor" disabled={!isBusiness} placeholder="#2563EB" value={formData.brandColor || '#2563EB'} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none uppercase disabled:bg-slate-50 disabled:text-slate-400" />
                    </div>
                    <input type="color" name="brandColor" disabled={!isBusiness} value={formData.brandColor || '#2563EB'} onChange={handleChange} className="h-11 w-11 rounded-xl cursor-pointer border-0 p-0 overflow-hidden shrink-0 disabled:cursor-not-allowed disabled:opacity-50" />
                </div>
                 <p className="text-[10px] text-slate-400 mt-1">Cette couleur remplacera le bleu par défaut sur vos documents.</p>
            </div>

            {/* 👇 AJOUT : SECTION CACHET / SIGNATURE */}
            <div className="col-span-1 md:col-span-2 mt-2 pt-6 border-t border-slate-100/50">
                 <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Cachet / Signature numérique
                    </label>
                    {!isBusiness && (
                        <span className="flex items-center gap-1 bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <Crown className="w-3 h-3" /> Business
                        </span>
                    )}
                 </div>

                 {isBusiness ? (
                    // VERSION DÉBLOQUÉE
                    <div className="flex items-center gap-4">
                        <div className="relative w-32 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden group hover:border-violet-400 transition-colors">
                            {formData.signature ? (
                                <img src={formData.signature} alt="Signature" className="w-full h-full object-contain p-2 mix-blend-multiply" />
                            ) : (
                                <div className="text-center">
                                    <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                                    <span className="text-[10px] text-slate-400">Vide</span>
                                </div>
                            )}
                            {formData.signature && (
                                <button onClick={() => setFormData({...formData, signature: undefined})} className="absolute top-1 right-1 bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-red-600 rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div>
                            <input type="file" id="signature-upload" className="hidden" accept="image/*" onChange={handleSignatureUpload} />
                            <label htmlFor="signature-upload" className="cursor-pointer bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors inline-block shadow-sm">
                                <Upload className="w-4 h-4 inline mr-2"/> Importer
                            </label>
                            <p className="text-[10px] text-slate-400 mt-1">PNG transparent recommandé.</p>
                        </div>
                    </div>
                 ) : (
                    // VERSION VERROUILLÉE
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center justify-center text-center">
                        <div className="relative z-10 bg-white p-1.5 rounded-full shadow-sm mb-2">
                            <Lock className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-500">
                            Ajoutez votre cachet officiel pour professionnaliser vos documents. <span className="text-violet-600 font-bold">Plan Business uniquement.</span>
                        </p>
                    </div>
                 )}
            </div>

          </div>
        </div>

        {/* Section Préférences */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Globe className="w-4 h-4 text-brand-600" /> Préférences de l'application</h3>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Devise par défaut</label>
                <div className="relative">
                <select name="currency" value={formData.currency || 'XOF'} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all appearance-none text-slate-900 cursor-pointer">
                    {CURRENCIES.map(curr => (<option key={curr.code} value={curr.code}>{curr.label} ({curr.code})</option>))}
                </select>
                <div className="absolute right-4 top-3 pointer-events-none text-slate-500"><Globe className="w-4 h-4" /></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Cette devise sera utilisée pour toutes vos factures et les statistiques.</p>
            </div>
            
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <AlignLeft className="w-4 h-4" /> Note par défaut (Pied de page)
                </label>
                <textarea 
                    name="defaultNote"
                    value={formData.defaultNote || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Ex: Merci pour votre confiance. Paiement dû sous 30 jours."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none text-slate-900 text-sm"
                />
            </div>
          </div>
        </div>

        {/* Section Profil */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><UserIcon className="w-4 h-4 text-brand-600" /> Informations personnelles</h3>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nom complet</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Section Entreprise */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Building className="w-4 h-4 text-brand-600" /> Informations de facturation</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nom de l'entreprise / Marque</label>
                    <input type="text" name="businessName" placeholder="Ex: Studio Design" value={formData.businessName || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Téléphone</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input type="tel" name="phone" placeholder="+225 07..." value={formData.phone || ''} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Adresse</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input type="text" name="address" placeholder="Abidjan, Cocody..." value={formData.address || ''} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" />
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Bouton Sauvegarder */}
        <div className="sticky bottom-4 z-20 flex items-center justify-end gap-4 pointer-events-none">
            {showSuccess && (
                <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
                    <CheckCircle2 className="w-4 h-4" /> Modifications enregistrées !
                </div>
            )}
            
            <button
                type="submit"
                disabled={!isDirty} 
                className={`pointer-events-auto flex items-center px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 ${
                    isDirty 
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/30 translate-y-0' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
                <Save className="w-5 h-5 mr-2" />
                {isDirty ? 'Enregistrer les modifications' : 'Aucune modification'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;