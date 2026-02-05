import React from 'react';
import { User, formatPrice, UserPlan } from '../types';
import { Check, X as XIcon, Sparkles, Zap, Building2, Crown } from 'lucide-react';

interface PricingProps {
  user: User;
  onUpgrade: (plan: UserPlan) => void;
  onDowngrade: () => void;
}

const Pricing: React.FC<PricingProps> = ({ user, onUpgrade, onDowngrade }) => {
  
  // Tes liens Stripe de base
  const STRIPE_LINKS = {
    pro: "https://buy.stripe.com/test_14A00iaAd7Ks18M6QZdQQ00",
    business: "https://buy.stripe.com/test_eVq8wO9w9d4MbNq8Z7dQQ01"
  };

  const handleSubscribe = (planId: string) => {
      console.log("Clic sur le plan :", planId);

      // 1. Si c'est le plan Starter, on utilise la fonction interne
      if (planId === 'starter') {
          onDowngrade();
          return;
      }

      // 2. Redirection vers Stripe pour PRO et BUSINESS
      if (planId === 'pro' || planId === 'business') {
          // On récupère le lien de base
          const baseUrl = STRIPE_LINKS[planId as keyof typeof STRIPE_LINKS];
          
          if (baseUrl) {
              // OPTIONNEL MAIS TOP : On ajoute l'email pour l'aider sur Stripe
              const finalLink = `${baseUrl}?prefilled_email=${encodeURIComponent(user.email)}`;
              
              // On force la redirection
              window.location.href = finalLink;
          } else {
              alert("Erreur: Lien de paiement introuvable");
          }
      }
  };

  const PlanCard = ({ 
    planId, 
    title, 
    price, 
    description, 
    features, 
    icon: Icon, 
    isPopular, 
    colorClass,
    borderColor
  }: any) => {
    const isCurrentPlan = user.plan === planId;
    
    // Logique de changement de plan
    const isDowngrade = (user.plan === 'business' && (planId === 'pro' || planId === 'starter')) || 
                        (user.plan === 'pro' && planId === 'starter');
    
    return (
      <div className={`relative flex flex-col p-6 rounded-3xl transition-all duration-300 h-full ${
        planId === 'business' 
          ? 'bg-slate-900 text-white shadow-2xl scale-105 z-10 ring-1 ring-white/20' 
          : `bg-white text-slate-900 shadow-card border hover:shadow-lg ${borderColor || 'border-slate-200'}`
      }`}>
        {isPopular && (
          <div className="absolute top-0 right-0 left-0 -mt-3 flex justify-center">
             <span className="bg-gradient-to-r from-brand-500 to-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
               <Sparkles className="w-3 h-3" /> Recommandé
             </span>
          </div>
        )}

        <div className="mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                planId === 'business' ? 'bg-white/10' : 'bg-slate-100'
            }`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
            <h3 className="text-xl font-bold font-display">{title}</h3>
            <p className={`text-sm mt-2 ${planId === 'business' ? 'text-slate-400' : 'text-slate-500'}`}>
                {description}
            </p>
        </div>

        <div className="mb-8">
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tighter">
                    {planId === 'starter' ? 'Gratuit' : formatPrice(price, 'USD').replace('USD', '$')}
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
                        <div className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                            feature.included 
                                ? (planId === 'business' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600') 
                                : (planId === 'business' ? 'bg-white/5 text-slate-600' : 'bg-slate-100 text-slate-300')
                        }`}>
                            {feature.included ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                        </div>
                        <span className={`text-sm leading-tight ${
                            feature.included 
                                ? (planId === 'business' ? 'text-slate-200' : 'text-slate-700')
                                : (planId === 'business' ? 'text-slate-600 line-through decoration-slate-600' : 'text-slate-400 line-through decoration-slate-300')
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
                        ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-900/50 hover:-translate-y-0.5'
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 hover:-translate-y-0.5'
            }`}
        >
            {isCurrentPlan ? 'Plan actuel' : isDowngrade ? 'Choisir ce plan' : 'Mettre à niveau'}
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

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {/* PLAN STARTER */}
        <PlanCard 
            planId="starter"
            title="Starter"
            price={0}
            description="Pour tester Kayit sans friction."
            icon={Zap}
            colorClass="text-slate-600"
            features={[
                { text: "10 factures / mois", included: true },
                { text: "Génération PDF standard", included: true },
                { text: "Numérotation automatique", included: true },
                { text: "Historique illimité", included: false },
                { text: "PDF sans logo Kayit", included: false },
                { text: "Modification & Suppression", included: false },
                { text: "Logo personnalisé", included: false },
            ]}
        />
        
        {/* PLAN PRO */}
        <PlanCard 
            planId="pro"
            title="Pro"
            price={9}
            description="Pour les freelances actifs."
            icon={Sparkles}
            colorClass="text-brand-600"
            borderColor="border-brand-200"
            isPopular={true}
            features={[
                { text: "100 factures / mois", included: true },
                { text: "PDF sans logo Kayit", included: true },
                { text: "Historique complet", included: true },
                { text: "Modification & Suppression", included: true },
                { text: "Support standard", included: true },
                { text: "Logo personnalisé", included: false },
                { text: "Gestion des clients", included: false },
            ]}
        />

        {/* PLAN BUSINESS */}
        <PlanCard 
            planId="business"
            title="Business"
            price={25}
            description="Pour les petits business structurés."
            icon={Crown}
            colorClass="text-violet-400"
            features={[
                { text: "Factures illimitées", included: true },
                { text: "PDF 100% Personnalisé (Logo)", included: true },
                { text: "Historique illimité", included: true },
                { text: "Modification & Suppression", included: true },
                { text: "Support prioritaire", included: true },
            ]}
        />
      </div>
    </div>
  );
};

export default Pricing;