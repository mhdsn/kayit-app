import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient'; 
import { ArrowRight, AlertCircle, Loader2, Building2, Phone, User as UserIcon, Mail, Lock, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
// 1. IMPORT DU CAPTCHA
import { Turnstile } from '@marsidev/react-turnstile';

// --- FONCTION DE VALIDATION (CÔTÉ CODE) ---
const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 8) return { isValid: false, error: "Le mot de passe doit faire 8 caractères minimum." };
  if (!/[A-Z]/.test(password)) return { isValid: false, error: "Il manque une majuscule." };
  if (!/[a-z]/.test(password)) return { isValid: false, error: "Il manque une minuscule." };
  if (!/[0-9]/.test(password)) return { isValid: false, error: "Il manque un chiffre." };
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { isValid: false, error: "Ajoute un caractère spécial (!@#$%)." };
  
  const weakPasswords = ["123456", "password", "qwerty", "azerty", "12345678"];
  if (weakPasswords.includes(password.toLowerCase())) return { isValid: false, error: "Ce mot de passe est trop facile à deviner." };

  return { isValid: true };
};

interface AuthProps {
  onLogin: (user: User) => void;
  initialMode?: 'login' | 'signup';
  onGoBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, initialMode = 'login', onGoBack }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2. ÉTAT POUR STOCKER LE TOKEN CAPTCHA
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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
    setCaptchaToken(null);
  };

  // --- NOUVEAU : CONNEXION GOOGLE ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Important : Utilise window.location.origin pour gérer localhost:3000 ou 5173 automatiquement
          redirectTo: `${window.location.origin}`, 
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };
  // ----------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // --- LOGIQUE POUR L'INSCRIPTION (Validation mot de passe) ---
    if (!isLogin) {
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            setLoading(false);
            return;
        }

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
            setError(passwordCheck.error || "Mot de passe invalide");
            setLoading(false);
            return;
        }
    }

    // --- MODIFICATION : Validation Captcha POUR TOUS (Login et Signup) ---
    if (!captchaToken) {
        setError("Veuillez valider la sécurité (Captcha) pour continuer.");
        setLoading(false);
        return;
    }

    try {
      if (isLogin) {
        // --- MODIFICATION : Envoi du token Captcha lors du Login ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: { captchaToken } 
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
            captchaToken: captchaToken,
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
        
      // Reset du token en cas d'erreur pour forcer une nouvelle validation
      setCaptchaToken(null); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* BOUTON RETOUR */}
      <button 
        onClick={onGoBack}
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center text-slate-500 hover:text-brand-600 transition-colors font-medium z-20 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 hover:border-brand-200 hover:shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </button>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-200/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 mt-12 md:mt-0">
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
            
            {/* --- AJOUT : BOUTON GOOGLE --- */}
            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 mb-6 shadow-sm"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuer avec Google
            </button>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">Ou avec email</span>
                </div>
            </div>
            {/* ----------------------------- */}

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

            {/* ZONE CAPTCHA TURNSTILE (POUR TOUT LE MONDE MAINTENANT) */}
            <div className="flex justify-center py-2 animate-in fade-in zoom-in-95">
                <Turnstile 
                    siteKey="0x4AAAAAACZq20k_8GcTIHkj" 
                    onSuccess={(token) => setCaptchaToken(token)}
                    options={{ theme: 'light' }}
                />
            </div>

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