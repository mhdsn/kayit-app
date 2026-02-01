import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Settings as SettingsIcon, 
  LogOut, 
  CreditCard,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Zap,
  Building2,
  Infinity
} from 'lucide-react';
import { AppRoute, Invoice, User } from '../types';

interface SidebarProps {
  currentRoute: AppRoute;
  onChangeRoute: (route: AppRoute) => void;
  onLogout: () => void;
  user: User;
  invoices: Invoice[]; // Ajout des factures pour le calcul
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentRoute, 
  onChangeRoute, 
  onLogout, 
  user,
  invoices,
  isMobileOpen,
  setIsMobileOpen
}) => {
  
  const navItems = [
    { id: AppRoute.DASHBOARD, label: 'Tableau de bord', icon: LayoutDashboard },
    { id: AppRoute.INVOICES, label: 'Mes factures', icon: FileText },
    { id: AppRoute.CREATE_INVOICE, label: 'Créer une facture', icon: PlusCircle },
  ];

  // Calcul du quota
  const calculateQuota = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyCount = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    let limit = 0;
    if (user.plan === 'starter') limit = 10;
    else if (user.plan === 'pro') limit = 100;
    else limit = -1; // Illimité

    const remaining = limit === -1 ? -1 : Math.max(0, limit - monthlyCount);
    const percentage = limit === -1 ? 0 : Math.min(100, (monthlyCount / limit) * 100);

    return { monthlyCount, limit, remaining, percentage };
  };

  const quota = calculateQuota();

  const getBadge = () => {
    if (user.plan === 'business') {
        return (
            <span className="px-1.5 py-0.5 rounded-md bg-violet-600 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
               BIZ
            </span>
        );
    }
    if (user.plan === 'pro') {
        return (
            <span className="px-1.5 py-0.5 rounded-md bg-brand-600 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
               PRO
            </span>
        );
    }
    return null;
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 shadow-[2px_0_24px_-12px_rgba(0,0,0,0.1)]">
      {/* Logo Area */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          {user.logo ? (
             <img 
               src={user.logo} 
               alt={user.businessName || 'Logo'} 
               className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-black/5 border border-slate-100" 
             />
          ) : (
            <div className="relative w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-brand-500/30">
                K
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20"></div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">Kayit</h1>
                {getBadge()}
            </div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Gestion de factures</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        <div className="mb-6">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Principal</p>
            {navItems.map((item) => (
            <button
                key={item.id}
                onClick={() => {
                onChangeRoute(item.id);
                setIsMobileOpen(false);
                }}
                className={`group flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentRoute === item.id 
                    ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
                <div className="flex items-center">
                    <item.icon className={`w-5 h-5 mr-3 transition-colors ${currentRoute === item.id ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span>{item.label}</span>
                </div>
                {currentRoute === item.id && <ChevronRight className="w-4 h-4 text-brand-400" />}
            </button>
            ))}
        </div>

        <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Compte</p>
            <button
                onClick={() => {
                    onChangeRoute(AppRoute.SETTINGS);
                    setIsMobileOpen(false);
                }}
                className={`group flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentRoute === AppRoute.SETTINGS
                    ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
                <div className="flex items-center">
                    <SettingsIcon className={`w-5 h-5 mr-3 transition-colors ${currentRoute === AppRoute.SETTINGS ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span>Paramètres</span>
                </div>
                 {currentRoute === AppRoute.SETTINGS && <ChevronRight className="w-4 h-4 text-brand-400" />}
            </button>

            <button
                onClick={() => {
                    onChangeRoute(AppRoute.PRICING);
                    setIsMobileOpen(false);
                }}
                className={`group flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentRoute === AppRoute.PRICING 
                    ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
                <div className="flex items-center">
                    <CreditCard className={`w-5 h-5 mr-3 transition-colors ${currentRoute === AppRoute.PRICING ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span>Abonnement</span>
                </div>
                 {currentRoute === AppRoute.PRICING && <ChevronRight className="w-4 h-4 text-brand-400" />}
            </button>
        </div>
      </nav>

      {/* Quota Widget & Upsell */}
      <div className="px-4 mb-4 mt-auto">
        
        {/* Affichage du Quota (Sauf si Business Illimité où on affiche un style différent) */}
        {user.plan !== 'business' ? (
             <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-3">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Quota mensuel</span>
                    <span className="text-xs font-bold text-slate-900">{quota.monthlyCount} / {quota.limit}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                            quota.percentage > 90 ? 'bg-red-500' : 'bg-brand-600'
                        }`} 
                        style={{ width: `${quota.percentage}%` }}
                    ></div>
                </div>
                <p className={`text-xs font-medium ${quota.remaining === 0 ? 'text-red-600' : 'text-slate-500'}`}>
                    {quota.remaining === 0 
                        ? "Limite atteinte !" 
                        : `${quota.remaining} facture${quota.remaining > 1 ? 's' : ''} restante${quota.remaining > 1 ? 's' : ''}`}
                </p>
             </div>
        ) : (
            <div className="bg-violet-50 rounded-xl p-3 border border-violet-100 mb-3 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-violet-600">
                    <Infinity className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs font-bold text-violet-900">Illimité</p>
                    <p className="text-[10px] text-violet-600">Plan Business actif</p>
                </div>
            </div>
        )}

        {/* Upsell Card (Si pas Business) */}
        {user.plan !== 'business' && (
            <div className={`rounded-xl p-4 text-white shadow-lg relative overflow-hidden group cursor-pointer ${
                user.plan === 'pro' 
                ? 'bg-gradient-to-br from-violet-900 to-slate-900' 
                : 'bg-gradient-to-br from-slate-900 to-slate-800'
            }`} onClick={() => onChangeRoute(AppRoute.PRICING)}>
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    {user.plan === 'pro' ? <Building2 className="w-12 h-12" /> : <Sparkles className="w-12 h-12" />}
                </div>
                <h4 className="text-sm font-bold mb-1">
                    {user.plan === 'pro' ? 'Passez Business' : 'Passez Pro'}
                </h4>
                <p className="text-xs text-slate-300 mb-3">
                    {user.plan === 'pro' ? 'Débloquez tout.' : 'Augmentez votre quota.'}
                </p>
                <div className="text-xs font-semibold bg-white/10 w-fit px-2 py-1 rounded border border-white/10 hover:bg-white/20 transition-colors">
                    Voir les offres
                </div>
            </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-brand-600 shadow-sm">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1">
                {user.name}
                {user.plan === 'business' && <Building2 className="w-3 h-3 text-violet-500" />}
                {user.plan === 'pro' && <Sparkles className="w-3 h-3 text-brand-500" />}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center justify-center w-full px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-colors shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen w-72 sticky top-0 z-20">
        <NavContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 animate-in slide-in-from-left duration-300">
            <NavContent />
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 -right-10 w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-900 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;