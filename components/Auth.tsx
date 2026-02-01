import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient'; 
import { ArrowRight, AlertCircle, Loader2, Building2, Phone, User as UserIcon, Mail, Lock, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  initialMode?: 'login' | 'signup';
  // 👇 NOUVEAU : Fonction pour revenir en arrière
  onGoBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, initialMode = 'login', onGoBack }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Champs du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setBusinessName('');
    setPhone('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isLogin && password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        setLoading(false);
        return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const savedPlan = data.user.user_metadata?.plan || 'starter';
          const appUser: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata.full_name || 'Utilisateur',
            businessName: data.user.user_metadata.business_name,
            phone: data.user.user_metadata.phone,
            plan: savedPlan,
            currency: 'USD'
          };
          onLogin(appUser);
        }

      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              business_name: businessName,
              phone: phone,
              plan: 'starter',
              currency: 'USD'
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          const appUser: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: fullName,
            businessName: businessName,
            phone: phone,
            plan: 'starter',
            currency: 'USD'
          };
          onLogin(appUser);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message === "Invalid login credentials" 
        ? "Email ou mot de passe incorrect." 
        : "Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* 👇 BOUTON RETOUR (NOUVEAU) */}
      <button 
        onClick={onGoBack}
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center text-slate-500 hover:text-brand-600 transition-colors font-medium z-20 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 hover:border-brand-200 hover:shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </button>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-200/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 mt-12 md:mt-0"> {/* Ajout marge top mobile */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl text-white text-2xl font-bold shadow-lg shadow-brand-500/30 mb-6 rotate-3">K</div>
            <h1 className="text-3xl font-bold text-slate-900 font-display tracking-tight">
                {isLogin ? 'Bon retour' : 'Créez votre espace'}
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
                {isLogin ? 'Connectez-vous pour gérer vos factures.' : 'Rejoignez les entrepreneurs qui utilisent Kayit.'}
            </p>
        </div>

        <div className="bg-white rounded-3xl shadow-float border border-slate-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100 mb-4 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {!isLogin && (
                <>
                    <div className="relative animate-in slide-in-from-bottom-2 duration-300">
                        <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder="Votre Prénom et Nom"
                            autoComplete="new-password" 
                        />
                    </div>

                    <div className="relative animate-in slide-in-from-bottom-2 duration-300 delay-75">
                        <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder="Nom de votre Entreprise"
                            autoComplete="off"
                        />
                    </div>

                    <div className="relative animate-in slide-in-from-bottom-2 duration-300 delay-100">
                        <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder="Numéro de téléphone"
                            autoComplete="off"
                        />
                    </div>
                </>
            )}

            <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                placeholder="Email professionnel"
                autoComplete="new-password"
                />
            </div>

            <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                type={showPassword ? "text" : "password"} 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                placeholder="Mot de passe"
                autoComplete="new-password"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>

            {!isLogin && (
                <div className="relative animate-in slide-in-from-top-2">
                    <CheckCircle2 className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl bg-slate-50 border focus:bg-white focus:ring-2 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400 ${
                        confirmPassword && password !== confirmPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20'
                    }`}
                    placeholder="Confirmez le mot de passe"
                    autoComplete="new-password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center group shadow-lg shadow-brand-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                        {isLogin ? 'Se connecter' : 'Créer mon compte'}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
            </form>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={toggleAuthMode}
            className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
          >
            {isLogin ? "Pas encore de compte ? Créer un compte" : 'Déjà inscrit ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;