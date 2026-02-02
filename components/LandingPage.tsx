import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Shield, 
  FileCheck, 
  Menu, 
  X, 
  LogIn 
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick }) => {
  // État pour gérer l'ouverture du menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* 1. NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md shadow-brand-500/20">K</div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Kayit</span>
          </div>

          {/* MENUS DESKTOP (Caché sur mobile) */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={onLoginClick}
              className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
            >
              Se connecter
            </button>
            <button 
              onClick={onSignupClick}
              className="bg-brand-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/25 active:scale-95"
            >
              Commencer
            </button>
          </div>

          {/* CONTROLES MOBILE (Visible uniquement sur mobile) */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Petit bouton Connexion rapide */}
            <button 
                onClick={onLoginClick}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 rounded-full border border-brand-100 active:bg-brand-100 transition-colors"
            >
                <LogIn className="w-3.5 h-3.5" />
                Connexion
            </button>

            {/* Bouton Hamburger */}
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MENU DÉROULANT MOBILE */}
        {isMobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col gap-3 animate-in slide-in-from-top-2">
                <button 
                    onClick={() => { setIsMobileMenuOpen(false); onLoginClick(); }}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl active:bg-slate-50"
                >
                    Se connecter
                </button>
                <button 
                    onClick={() => { setIsMobileMenuOpen(false); onSignupClick(); }}
                    className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-md active:bg-brand-700"
                >
                    Créer un compte gratuit
                </button>
            </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold uppercase tracking-wide mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 bg-brand-600 rounded-full animate-pulse"></span>
          Nouveau : Factures illimitées
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Vos factures, <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">simplement pro.</span>
        </h1>
        
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Créez, envoyez et gérez vos factures en quelques secondes. Conçu pour les freelances et PME qui veulent gagner du temps.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <button 
            onClick={onSignupClick}
            className="group px-8 py-4 bg-brand-600 text-white rounded-full font-bold text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/30 flex items-center gap-2 active:scale-95"
          >
            Créer ma première facture
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={onSignupClick}
            className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
          >
            Voir la démo
          </button>
        </div>

        {/* IMAGE TABLEAU DE BORD */}
        <div className="mt-20 relative mx-auto max-w-5xl animate-in fade-in zoom-in-95 duration-1000 delay-500">
            {/* Lueur colorée derrière l'image */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-purple-600 rounded-2xl blur opacity-20"></div>
            
            {/* Conteneur de l'image */}
            <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-slate-200 bg-white">
                <img 
                    src="/tableauBord.png" 
                    alt="Tableau de bord Kayit" 
                    className="w-full h-auto object-cover"
                />
            </div>
        </div>

      </section>

      {/* 3. FEATURES */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Pourquoi choisir Kayit ?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Tout ce dont vous avez besoin pour gérer votre facturation sans prise de tête.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Ultra Rapide</h3>
              <p className="text-slate-500 leading-relaxed">
                Générez des factures professionnelles en moins de 2 minutes. Notre éditeur est intuitif et performant.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">PDF Professionnels</h3>
              <p className="text-slate-500 leading-relaxed">
                Téléchargez des PDF propres, conformes et élégants qui renforcent votre image de marque auprès de vos clients.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Sécurisé & Cloud</h3>
              <p className="text-slate-500 leading-relaxed">
                Vos données sont chiffrées et sauvegardées automatiquement. Accédez à vos factures depuis n'importe où.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING PREVIEW */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-20 -ml-16 -mb-16"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Commencez gratuitement dès aujourd'hui</h2>
                <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
                    Pas de carte bancaire requise. Profitez du plan Starter pour vos 10 premières factures chaque mois.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button 
                        onClick={onSignupClick}
                        className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-slate-100 transition-colors active:scale-95"
                    >
                        Créer un compte gratuit
                    </button>
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mt-2 sm:mt-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sans engagement
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">K</div>
                <span className="font-bold text-slate-900">Kayit</span>
            </div>
            <p className="text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} Kayit. Fait avec passion pour les entrepreneurs.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;