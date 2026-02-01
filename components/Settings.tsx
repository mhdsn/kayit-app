import React, { useState, useRef } from 'react';
import { User, CURRENCIES } from '../types';
import { Save, User as UserIcon, Building, Mail, Phone, MapPin, Globe, Image as ImageIcon, Palette, Lock, Crown, Upload, Trash2, AlertCircle } from 'lucide-react';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState<User>(user);
  const [showSuccess, setShowSuccess] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusiness = user.plan === 'business';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoError(null);

    if (!file) return;

    // Validation type
    if (!file.type.startsWith('image/')) {
        setLogoError("Le fichier doit être une image (PNG, JPG).");
        return;
    }

    // Validation taille (Max 500KB pour ne pas saturer le localStorage)
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

  const removeLogo = () => {
      setFormData(prev => ({ ...prev, logo: undefined }));
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 font-display">Paramètres</h2>
        <p className="text-slate-500 mt-1">Gérez vos préférences et les informations de votre entreprise.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section Marque (Business Only) */}
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
                 <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                     {/* Overlay pour empêcher l'édition si pas business */}
                 </div>
             )}
             
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Logo de l'entreprise</label>
                
                <div className="flex items-start gap-4">
                    {/* Preview Area */}
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden relative group">
                        {formData.logo ? (
                            <>
                                <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                                {isBusiness && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            type="button" 
                                            onClick={removeLogo}
                                            className="p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLogoUpload}
                            accept="image/png, image/jpeg, image/jpg"
                            disabled={!isBusiness}
                            className="hidden"
                        />
                        <button
                            type="button"
                            disabled={!isBusiness}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Importer une image
                        </button>
                        <p className="text-[10px] text-slate-400 leading-tight">
                            Format PNG ou JPG. Fond transparent recommandé.<br/>
                            Max 500 Ko.
                        </p>
                        {logoError && (
                            <div className="flex items-center mt-2 text-[10px] text-red-600 font-medium animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {logoError}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Couleur principale</label>
                <div className="flex items-center gap-3">
                    <div className="relative w-full">
                        <Palette className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            name="brandColor"
                            disabled={!isBusiness}
                            placeholder="#2563EB"
                            value={formData.brandColor || '#2563EB'}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-mono uppercase disabled:bg-slate-50 disabled:text-slate-400"
                        />
                    </div>
                    <input 
                        type="color"
                        name="brandColor"
                        disabled={!isBusiness}
                        value={formData.brandColor || '#2563EB'}
                        onChange={handleChange}
                        className="h-11 w-11 rounded-xl cursor-pointer border-0 p-0 overflow-hidden shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                 <p className="text-[10px] text-slate-400 mt-1">Cette couleur remplacera le bleu par défaut sur vos documents.</p>
            </div>
          </div>
        </div>

        {/* Section Préférences */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-600" />
              Préférences de l'application
            </h3>
          </div>
          <div className="p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Devise par défaut</label>
            <div className="relative">
              <select
                name="currency"
                value={formData.currency || 'XOF'}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all appearance-none text-slate-900"
              >
                {CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.label} ({curr.code})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-3 pointer-events-none text-slate-500">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Cette devise sera utilisée pour toutes vos factures et les statistiques du tableau de bord.
            </p>
          </div>
        </div>

        {/* Section Profil */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-brand-600" />
              Informations personnelles
            </h3>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nom complet</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Entreprise */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-600" />
              Informations de facturation
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nom de l'entreprise / Marque</label>
                    <input
                        type="text"
                        name="businessName"
                        placeholder="Ex: Studio Design"
                        value={formData.businessName || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Téléphone</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                        type="tel"
                        name="phone"
                        placeholder="+225 07..."
                        value={formData.phone || ''}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Adresse</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                        type="text"
                        name="address"
                        placeholder="Abidjan, Cocody..."
                        value={formData.address || ''}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
            {showSuccess && (
                <span className="text-emerald-600 font-medium text-sm animate-in fade-in slide-in-from-right-4">
                    Modifications enregistrées !
                </span>
            )}
            <button
                type="submit"
                className="flex items-center px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/25 active:scale-95"
            >
                <Save className="w-5 h-5 mr-2" />
                Enregistrer
            </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;