import React from 'react';
import { User, UserPlan } from '../types';
import { Check, X, Zap, Sparkles, Crown, ArrowRight } from 'lucide-react';

interface PricingProps {
  user: User;
  onUpgrade: (plan: UserPlan) => void;
  onDowngrade: () => void;
}

const Pricing: React.FC<PricingProps> = ({ user, onUpgrade, onDowngrade }) => {
  
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'Gratuit',
      icon: Zap,
      description: 'Pour tester Kayit sans friction.',
      features: [
        '10 factures / mois',
        'Génération PDF standard',
        'Numérotation automatique',
      ],
      missing: [
        'PDF sans logo Kayit',
        'Gestion des Dépenses',
        'Analyse Financière & Marges',
        'Support prioritaire'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '9 $US',
      period: '/mois',
      icon: Sparkles,
      description: 'Pour les freelances actifs.',
      features: [
        '100 factures / mois',
        'PDF sans logo Kayit',
        'Historique illimité',
        'Support standard'
      ],
      missing: [
        'Gestion des Dépenses',
        'Analyse Financière & Marges',
        'Calcul du Bénéfice Net'
      ]
    },
    {
      id: 'business',
      name: 'Business',
      price: '25 $US',
      period: '/mois',
      icon: Crown,
      popular: true,
      description: 'Pour piloter votre rentabilité.',
      features: [
        'Factures illimitées',
        'PDF 100% Personnalisé',
        'Gestion des Dépenses', // ✨ NOUVEAU
        'Analyse Financière (Bénéfices)', // ✨ NOUVEAU
        'Calcul des Marges en temps réel', // ✨ NOUVEAU
        'Support prioritaire'
      ],
      missing: []
    }
  ];

  return (
    <div className="pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-slate-900 font-display">
          Des tarifs simples et transparents
        </h2>
        <p className="text-slate-500 text-lg">
          Commencez gratuitement, évoluez selon vos besoins. Passez au niveau Business pour maîtriser vos coûts et vos bénéfices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto pt-8">
        {plans.map((plan) => {
          const isCurrent = user.plan === plan.id;
          const isBusiness = plan.id === 'business';

          return (
            <div 
              key={plan.id}
              className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300 ${
                isBusiness 
                  ? 'bg-slate-900 text-white shadow-2xl scale-105 border-0' 
                  : 'bg-white border border-slate-200 hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              {isBusiness && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                  Recommandé
                </div>
              )}

              <div className="mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                  isBusiness ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-900'
                }`}>
                  <plan.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm mb-6 ${isBusiness ? 'text-slate-400' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  {plan.period && <span className={`text-sm ${isBusiness ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>}
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 p-0.5 rounded-full ${isBusiness ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={`text-sm ${isBusiness ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                  </div>
                ))}
                {plan.missing.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 opacity-50">
                    <div className={`mt-0.5 p-0.5 rounded-full ${isBusiness ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                      <X className="w-3 h-3" />
                    </div>
                    <span className={`text-sm ${isBusiness ? 'text-slate-500' : 'text-slate-400'}`}>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  if (isCurrent) return;
                  if (plan.id === 'starter') onDowngrade();
                  else onUpgrade(plan.id as any);
                }}
                disabled={isCurrent}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-400 cursor-default'
                    : isBusiness
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-violet-500/25 active:scale-95'
                    : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                }`}
              >
                {isCurrent ? (
                  'Plan actuel'
                ) : (
                  <>
                    {plan.id === 'starter' ? 'Passer au gratuit' : 'Mettre à niveau'}
                    {!isCurrent && plan.id !== 'starter' && <ArrowRight className="w-4 h-4" />}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;