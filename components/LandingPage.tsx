import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Menu, 
  X, 
  LogIn,
  Globe,
  ChevronDown,
  Star,
  TrendingUp,
  Users,
  FileText,
  Shield,
  FileCheck
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  // onLegalClick n'est plus nécessaire car on utilise des liens directs
  onLegalClick: () => void; 
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // DONNÉES DES AVIS CLIENTS
  const testimonials = [
    {
      name: "Aminata Diallo",
      role: "Développeuse Freelance",
      text: "J'ai créé ma première facture pour un client en France. Il m'a payé en 2 jours car le document faisait très professionnel. C'est magique !",
      stars: 5,
      tag: "Freelance"
    },
    {
      name: "Moussa Fall",
      role: "Commerçant à Dakar",
      text: "Avant j'utilisais des carnets à souche. Avec Kayit, je suis mes impayés et je sais exactement ce que je gagne à la fin du mois.",
      stars: 5,
      tag: "Commerce"
    },
    {
      name: "Cheikh Ndiaye",
      role: "Consultant Marketing",
      text: "Simple, efficace et en FCFA. C'est exactement ce qu'il manquait aux entrepreneurs sénégalais. Le support est top.",
      stars: 5,
      tag: "Agence"
    }
  ];

  const faqs = [
    {
      question: "Est-ce que Kayit est vraiment gratuit ?",
      answer: "Oui ! Le plan Starter est 100% gratuit à vie. Il vous permet de créer jusqu'à 10 factures par mois, ce qui est idéal pour les freelances et les débutants au Sénégal."
    },
    {
      question: "Puis-je facturer en FCFA (XOF) ?",
      answer: "Absolument. Kayit est conçu pour le marché ouest-africain. Vos factures sont générées par défaut en Francs CFA, avec un formatage adapté."
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "La sécurité est notre priorité. Vos données sont chiffrées et stockées sur des serveurs sécurisés. Vous pouvez exporter vos données à tout moment."
    },
    {
      question: "Puis-je utiliser Kayit sur mon téléphone ?",
      answer: "Oui, Kayit est une application web responsive. Vous pouvez créer vos factures directement depuis votre smartphone, tablette ou ordinateur."
    }
  ];

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

          {/* MENUS DESKTOP */}
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

          {/* CONTROLES MOBILE */}
          <div className="flex items-center gap-3 md:hidden">
            <button 
                onClick={onLoginClick}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 rounded-full border border-brand-100 active:bg-brand-100 transition-colors"
            >
                <LogIn className="w-3.5 h-3.5" />
                Connexion
            </button>

            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MENU MOBILE */}
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

      {/* 2. HERO SECTION OPTIMISÉE SEO + STATS */}
      <section className="pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold uppercase tracking-wide mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 bg-brand-600 rounded-full animate-pulse"></span>
          Nouveau : Facturation en FCFA
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Le Logiciel de Facturation <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">qu'il vous faut.</span>
        </h1>
        
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Créez des <strong>factures professionnelles</strong> en quelques secondes. 
          La solution idéale pour les freelances, PME et commerçants en Afrique de l'Ouest.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
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

        {/* SECTION STATS */}
        <div className="mt-12 relative mx-auto max-w-5xl animate-in fade-in zoom-in-95 duration-1000 delay-500">
            {/* Arrière-plan décoratif bleu */}
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/10 via-blue-400/10 to-brand-500/10 rounded-3xl blur-2xl opacity-50"></div>
            
            <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 md:p-12 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                    
                    {/* Stat 1 */}
                    <div className="flex flex-col items-center justify-center p-4 space-y-2">
                        <div className="p-3 bg-brand-50 rounded-2xl mb-2">
                            <TrendingUp className="w-8 h-8 text-brand-600" />
                        </div>
                        <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">50M+</h3>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">FCFA Sécurisés</p>
                    </div>

                    {/* Stat 2 */}
                    <div className="flex flex-col items-center justify-center p-4 space-y-2">
                        <div className="p-3 bg-blue-50 rounded-2xl mb-2">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">10 000+</h3>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Factures Générées</p>
                    </div>

                    {/* Stat 3 */}
                    <div className="flex flex-col items-center justify-center p-4 space-y-2">
                        <div className="p-3 bg-indigo-50 rounded-2xl mb-2">
                            <Users className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">1 200+</h3>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Entrepreneurs Actifs</p>
                    </div>
                </div>
            </div>
        </div>

      </section>

      {/* 3. FEATURES */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Pourquoi les entrepreneurs sénégalais choisissent Kayit ?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Tout ce dont vous avez besoin pour gérer votre business à Dakar ou ailleurs.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Adapté au marché local</h3>
              <p className="text-slate-500 leading-relaxed">
                Facturez en FCFA (XOF) par défaut. Nos modèles sont clairs et adaptés aux standards des entreprises locales.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">PDF Professionnels</h3>
              <p className="text-slate-500 leading-relaxed">
                Téléchargez des factures propres que vous pouvez envoyer directement par WhatsApp ou Email à vos clients.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Sécurisé & Cloud</h3>
              <p className="text-slate-500 leading-relaxed">
                Fini les fichiers Excel perdus. Vos données sont sauvegardées en ligne et accessibles depuis votre téléphone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION AVIS CLIENTS (BLUE THEME) */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Ils ont transformé leur business</h2>
                <p className="text-slate-500 max-w-xl mx-auto text-lg">Découvrez comment Kayit aide les entrepreneurs locaux à se professionnaliser.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {testimonials.map((review, idx) => (
                    <div key={idx} className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-brand-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex gap-1 mb-4">
                            {[...Array(review.stars)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            ))}
                        </div>
                        <p className="text-slate-700 leading-relaxed mb-6 italic">
                            "{review.text}"
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold">
                                {review.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">{review.name}</h4>
                                <span className="text-xs text-brand-700 font-medium bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                                    {review.tag}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 4. FAQ SEO */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Questions Fréquentes</h2>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <button 
                            onClick={() => toggleFaq(index)}
                            className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-slate-50 transition-colors"
                        >
                            <span className="font-bold text-slate-800">{faq.question}</span>
                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                        </button>
                        {openFaq === index && (
                            <div className="p-6 pt-0 bg-white text-slate-600 leading-relaxed border-t border-slate-100">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 5. PRICING PREVIEW */}
      <section className="py-24 px-4 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-20 -ml-16 -mb-16"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Commencez gratuitement dès aujourd'hui</h2>
                <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
                    Rejoignez les entrepreneurs qui modernisent leur gestion au Sénégal. Pas de carte bancaire requise.
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

      {/* 6. FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">K</div>
                <span className="font-bold text-slate-900">Kayit</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">
                Le logiciel de facturation préféré des freelances à Dakar.
            </p>
            <p className="text-slate-400 text-sm mb-6">
                &copy; {new Date().getFullYear()} Kayit. Fait avec passion au Sénégal 🇸🇳.
            </p>

            {/* 👇 MODIFICATION : LIENS DIRECTS POUR GOOGLE */}
            <div className="flex justify-center gap-6 mt-4">
                <a href="/privacy.html" className="text-sm text-slate-400 hover:text-brand-600 underline transition-colors">
                    Politique de Confidentialité
                </a>
                <a href="/terms.html" className="text-sm text-slate-400 hover:text-brand-600 underline transition-colors">
                    Conditions d'Utilisation
                </a>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;