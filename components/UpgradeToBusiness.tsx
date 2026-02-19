import React from 'react';
import { Crown, CheckCircle2, ArrowRight } from 'lucide-react';

interface UpgradeProps {
  onUpgrade: () => void;
}

const UpgradeToBusiness: React.FC<UpgradeProps> = ({ onUpgrade }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-violet-500/30 mb-8 transform rotate-3 hover:rotate-0 transition-all duration-500">
        <Crown className="w-10 h-10 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-slate-900 mb-4 font-display">
        Passez au niveau supérieur
      </h2>
      <p className="text-slate-500 max-w-md mb-8 text-lg">
        La gestion des <strong>Dépenses</strong> et l'<strong>Analyse Financière</strong> détaillée sont réservées aux membres du plan Business.
      </p>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg text-left max-w-md w-full mb-8">
        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="bg-violet-100 text-violet-700 text-xs px-2 py-1 rounded">PLAN BUSINESS</span>
            Ce que vous débloquez :
        </h4>
        <ul className="space-y-3">
            <li className="flex items-start gap-3 text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
                <span>Suivi illimité des dépenses</span>
            </li>
            <li className="flex items-start gap-3 text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
                <span>Calcul automatique du Bénéfice Net</span>
            </li>
            <li className="flex items-start gap-3 text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
                <span>Analyses graphiques (Croissance, Marges)</span>
            </li>
            <li className="flex items-start gap-3 text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
                <span>Export comptable complet</span>
            </li>
        </ul>
      </div>

      <button 
        onClick={onUpgrade}
        className="group bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center gap-2"
      >
        Débloquer le Plan Business <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default UpgradeToBusiness;