import React from 'react';
import { User, UserPlan } from '../types';
import { Check, X as XIcon, Sparkles, Zap, Crown } from 'lucide-react';

interface PricingProps {
  user: User;
  onUpgrade: (plan: UserPlan) => void;
  onDowngrade: () => void;
}

const Pricing: React.FC<PricingProps> = ({ user, onUpgrade, onDowngrade }) => {
  
  // Tes liens LEMON SQUEEZY (J'ai renommé la variable pour être clair)
  const LEMON_LINKS = {
    pro: "https://kayit.lemonsqueezy.com/checkout/buy/2df9d7df-7bc3-4f9e-995e-112ccedff0f7",
    business: "https://kayit.lemonsqueezy.com/checkout/buy/40a27cc7-026a-42a4-bb48-2aeaab5b2f59"
  };

  const handleSubscribe = (planId: string) => {
      console.log("Tentative d'abonnement au plan :", planId); // Pour le débogage

      // 1. Si c'est le plan Starter
      if (planId === 'starter') {
          onDowngrade();
          return;
      }

      // 2. Redirection vers LEMON SQUEEZY
      if (planId === 'pro' || planId === 'business') {
          // On récupère le bon lien
          const baseUrl = LEMON_LINKS[planId as keyof typeof LEMON_LINKS];
          
          if (baseUrl) {
              // CONSTRUCTION DU LIEN ROBUSTE
              // On vérifie si l'email existe pour éviter le crash
              let finalLink = baseUrl;
              
              if (user && user.email) {
                  // NOTE: La syntaxe Lemon Squeezy est checkout[email], pas prefilled_email
                  finalLink = `${baseUrl}?checkout[email]=${encodeURIComponent(user.email)}`;
              }
              
              console.log("Redirection vers :", finalLink);
              // On utilise assign pour être sûr que le navigateur traite la demande
              window.location.assign(finalLink);
          } else {
              alert("Erreur: Lien de paiement introuvable pour ce plan.");
          }
      }
  };

  const PlanCard = ({ 
    planId, 
    title, 
    priceDisplay, 
    description, 
    features, 
    icon: Icon, 
    isPopular, 
    colorClass,
    borderColor
  }: any) => {
    const isCurrentPlan = user?.plan === planId; // Le ? protège si user est null
    
    // Logique de changement de plan
    const isDowngrade = (user?.plan === 'business' && (planId === 'pro' || planId === 'starter')) || 
                        (user?.plan === 'pro' && planId === 'starter');
    
    return (
      <div className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300 h-full ${
        planId === 'business' 
          ? 'bg-[#0f172a] text-white shadow-2xl scale-105 z-10 ring-1 ring-white/10' 
          : `bg-white text-slate-900 shadow-card border hover:shadow-lg ${borderColor || 'border-slate-200'}`
      }`}>
        {isPopular && (
          <div className="absolute -top-4 right-0 left-0 flex justify-center">
             <span className="bg-[#6366f1] text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
               Recommandé
             </span>
          </div>
        )}

        <div className="mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                planId === 'business' ? 'bg-white/10' : 'bg-slate-50 border border-slate-100'
            }`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
            <h3 className="text-xl font-bold font-display tracking-tight">{title}</h3>
            <p className={`text-sm mt-2 leading-relaxed ${planId === 'business' ? 'text-slate-400' : 'text-slate-500'}`}>
                {description}
            </p>
        </div>

        <div className="mb-8">
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">
                    {priceDisplay}
                </span>
                {planId !== 'starter' && (
                    <span className={`text-sm font-medium ${planId === 'business' ? 'text-slate-500' : 'text-slate-400'}`}>/mois</span>
                )}
            </div>
        </div>

        <div className="flex-1">
            <ul className="space-y-4 mb-8">
                {features.map((feature: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                        <div className={`mt-0.5 shrink-0 ${
                            feature.included 
                                ? (planId === 'business' ? 'text-emerald-400' : 'text-emerald-500') 
                                : (planId === 'business' ? 'text-slate-700' : 'text-slate-300')
                        }`}>
                            {feature.included ? <Check className="w-4 h-4" strokeWidth={3} /> : <XIcon className="w-4 h-4" />}
                        </div>
                        <span className={`text-sm font-medium ${
                            feature.included 
                                ? (planId === 'business' ? 'text-slate-200' : 'text-slate-700')
                                : (planId === 'business' ? 'text-slate-600' : 'text-slate-400 line-through decoration-slate-300/50')
                        }`}>
                            {feature.text}
                        </span>
                    </li>
                ))}
            </ul>
        </div>

        <button
            onClick={() => {
                if (isCurrentPlan) return;
                handleSubscribe(planId);
            }}
            disabled={isCurrentPlan}
            className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                isCurrentPlan
                    ? (planId === 'business' ? 'bg-white/10 text-white/50 border border-white/5 cursor-default' : 'bg-slate-100 text-slate-400 cursor-default')
                    : planId === 'business'
                        ? 'bg-white text-slate-900 hover:bg-slate-100' // Bouton blanc pour le plan Business
                        : 'bg-[#0f172a] text-white hover:bg-slate-800' // Bouton noir pour les autres
            }`}
        >
            {isCurrentPlan ? 'Plan actuel' : isDowngrade ? 'Passer au ' + title.toLowerCase() : (planId === 'starter' ? 'Passer au gratuit' : 'S\'abonner ->')}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 pb-20">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-4xl font-bold text-slate-900 font-display tracking-tight">Choisissez votre plan</h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Des solutions flexibles pour les freelances et les entreprises en croissance.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-4">
        {/* PLAN STARTER */}
        <PlanCard 
            planId="starter"
            title="Starter"
            priceDisplay="Gratuit"
            description="Pour tester Kayit sans friction."
            icon={Zap}
            colorClass="text-slate-900"
            features={[
                { text: "10 factures / mois", included: true },
                { text: "Génération PDF standard", included: true },
                { text: "Numérotation automatique", included: true },
                { text: "PDF sans logo Kayit", included: false },
                { text: "Gestion des Dépenses", included: false },
                { text: "Analyse Financière & Marges", included: false },
                { text: "Support prioritaire", included: false },
            ]}
        />
        
        {/* PLAN PRO */}
        <PlanCard 
            planId="pro"
            title="Pro"
            priceDisplay="9 $" 
            description="Pour les freelances actifs."
            icon={Sparkles}
            colorClass="text-slate-900"
            features={[
                { text: "100 factures / mois", included: true },
                { text: "PDF sans logo Kayit", included: true },
                { text: "Historique illimité", included: true },
                { text: "Support standard", included: true },
                { text: "Gestion des Dépenses", included: false },
                { text: "Analyse Financière & Marges", included: false },
                { text: "Calcul du Bénéfice Net", included: false },
            ]}
        />

        {/* PLAN BUSINESS */}
        <PlanCard 
            planId="business"
            title="Business"
            priceDisplay="25 $"
            description="Pour piloter votre rentabilité."
            icon={Crown}
            colorClass="text-white"
            isPopular={true}
            features={[
                { text: "Factures illimitées", included: true },
                { text: "PDF 100% Personnalisé", included: true },
                { text: "Gestion des Dépenses", included: true },
                { text: "Analyse Financière (Bénéfices)", included: true },
                { text: "Calcul des Marges en temps réel", included: true },
                { text: "Support prioritaire", included: true },
            ]}
        />
      </div>
    </div>
  );
};

export default Pricing;