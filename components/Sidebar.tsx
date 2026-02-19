// ================================================================
// components/Sidebar.tsx — v2
// Ajout des entrées Produits et Commandes
// ================================================================

import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  CreditCard,
  X,
  Sparkles,
  ChevronRight,
  Building2,
  Infinity,
  BarChart3,
  PlusCircle,
  TrendingDown,
  Lock,
  ShieldCheck,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { AppRoute, Invoice, User } from '../types';

interface SidebarProps {
  currentRoute: AppRoute;
  onChangeRoute: (route: AppRoute) => void;
  onLogout: () => void;
  user: User;
  invoices: Invoice[];
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const MY_ADMIN_EMAIL = "senemouhamed27@gmail.com";

const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onChangeRoute,
  onLogout,
  user,
  invoices,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const isBusiness = user.plan === 'business';

  const navItems = [
    { id: AppRoute.DASHBOARD,  label: 'Tableau de bord',     icon: LayoutDashboard, locked: false },
    { id: AppRoute.PRODUCTS,   label: 'Produits',            icon: Package,         locked: false },
    { id: AppRoute.ORDERS,     label: 'Commandes',           icon: ShoppingCart,    locked: false },
    { id: AppRoute.INVOICES,   label: 'Factures',            icon: FileText,        locked: false },
    { id: AppRoute.EXPENSES,   label: 'Dépenses',            icon: TrendingDown,    locked: !isBusiness },
    { id: AppRoute.REVENUE,    label: 'Analyse Financière',  icon: BarChart3,       locked: !isBusiness },
    { id: AppRoute.CREATE_INVOICE, label: 'Créer une facture', icon: PlusCircle,    locked: false },
  ];

  // --- Quota ---
  const calculateQuota = () => {
    const now = new Date();
    const cm = now.getMonth();
    const cy = now.getFullYear();
    const monthlyCount = invoices.filter(inv => {
      const d = new Date(inv.date);
      return d.getMonth() === cm && d.getFullYear() === cy;
    }).length;
    let limit = user.plan === 'starter' ? 10 : user.plan === 'pro' ? 100 : -1;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - monthlyCount);
    const percentage = limit === -1 ? 0 : Math.min(100, (monthlyCount / limit) * 100);
    return { monthlyCount, limit, remaining, percentage };
  };
  const quota = calculateQuota();

  const getBadge = () => {
    if (user.plan === 'business') return (
      <span className="px-1.5 py-0.5 rounded-md bg-violet-600 text-[10px] font-bold text-white">BIZ</span>
    );
    if (user.plan === 'pro') return (
      <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-[10px] font-bold text-white">PRO</span>
    );
    return null;
  };

  const NavButton = ({ item }: { item: typeof navItems[0] }) => (
    <button
      key={item.id}
      onClick={() => { onChangeRoute(item.id); setIsMobileOpen(false); }}
      className={`group flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1 active:scale-95 ${
        currentRoute === item.id
          ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center">
        <item.icon className={`w-5 h-5 mr-3 transition-colors ${
          currentRoute === item.id ? 'text-blue-600' : item.locked ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-600'
        }`} />
        <span className={item.locked ? 'text-slate-400' : ''}>{item.label}</span>
      </div>
      {item.locked ? (
        <Lock className="w-3.5 h-3.5 text-slate-300" />
      ) : (
        currentRoute === item.id && <ChevronRight className="w-4 h-4 text-blue-400" />
      )}
    </button>
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[90] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-[100]
        w-72 bg-white border-r border-slate-200 flex flex-col
        transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        h-[100dvh] md:h-screen
      `}>

        {/* EN-TÊTE */}
        <div className="p-6 pb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {user.logo ? (
              <img src={user.logo} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-100" />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/30">K</div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">Kayit</h1>
                {getBadge()}
              </div>
              <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Gestion de business</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto overflow-x-hidden touch-pan-y">

          {/* Section Principale */}
          <div className="mb-3">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Principal</p>
            {navItems.slice(0, 4).map(item => <NavButton key={item.id} item={item} />)}
          </div>

          {/* Section Business */}
          <div className="mb-3">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Finances</p>
            {navItems.slice(4).map(item => <NavButton key={item.id} item={item} />)}
          </div>

          {/* Compte */}
          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Compte</p>
            <button
              onClick={() => { onChangeRoute(AppRoute.SETTINGS); setIsMobileOpen(false); }}
              className={`group flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1 ${
                currentRoute === AppRoute.SETTINGS ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center">
                <SettingsIcon className="w-5 h-5 mr-3 text-slate-400" />
                <span>Paramètres</span>
              </div>
            </button>
            <button
              onClick={() => { onChangeRoute(AppRoute.PRICING); setIsMobileOpen(false); }}
              className={`group flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentRoute === AppRoute.PRICING ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 mr-3 text-slate-400" />
                <span>Abonnement</span>
              </div>
            </button>
          </div>
        </nav>

        {/* WIDGETS */}
        <div className="px-4 mb-4 mt-auto pt-4 flex-shrink-0">
          {user.plan !== 'business' ? (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-3">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Quota mensuel</span>
                <span className="text-xs font-bold text-slate-900">{quota.monthlyCount} / {quota.limit}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${quota.percentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                  style={{ width: `${quota.percentage}%` }}
                />
              </div>
              <p className={`text-xs font-medium ${quota.remaining === 0 ? 'text-red-600' : 'text-slate-500'}`}>
                {quota.remaining === 0 ? "Limite atteinte !" : `${quota.remaining} facture${quota.remaining > 1 ? 's' : ''} restante${quota.remaining > 1 ? 's' : ''}`}
              </p>
            </div>
          ) : (
            <div className="bg-violet-50 rounded-xl p-3 border border-violet-100 mb-3 flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm text-violet-600"><Infinity className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-bold text-violet-900">Illimité</p>
                <p className="text-[10px] text-violet-600">Plan Business actif</p>
              </div>
            </div>
          )}

          {user.plan !== 'business' && (
            <div
              className={`rounded-xl p-4 text-white shadow-lg relative overflow-hidden group cursor-pointer active:scale-95 transition-transform ${
                user.plan === 'pro' ? 'bg-gradient-to-br from-violet-900 to-slate-900' : 'bg-gradient-to-br from-slate-900 to-slate-800'
              }`}
              onClick={() => onChangeRoute(AppRoute.PRICING)}
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                {user.plan === 'pro' ? <Building2 className="w-12 h-12" /> : <Sparkles className="w-12 h-12" />}
              </div>
              <h4 className="text-sm font-bold mb-1">{user.plan === 'pro' ? 'Passez Business' : 'Passez Pro'}</h4>
              <p className="text-xs text-slate-300 mb-3">{user.plan === 'pro' ? 'Débloquez tout.' : 'Augmentez votre quota.'}</p>
              <div className="text-xs font-semibold bg-white/10 w-fit px-2 py-1 rounded border border-white/10 hover:bg-white/20 transition-colors">
                Voir les offres
              </div>
            </div>
          )}

          {user.email === MY_ADMIN_EMAIL && (
            <div className="mt-3">
              <button
                onClick={() => { onChangeRoute(AppRoute.ADMIN); setIsMobileOpen(false); }}
                className="w-full flex items-center justify-center px-4 py-2 text-xs font-bold text-red-100 bg-red-600/90 rounded-lg hover:bg-red-600 transition-all shadow-md"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Admin Panel
              </button>
            </div>
          )}
        </div>

        {/* PROFIL */}
        <div className="p-4 pb-8 md:pb-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-blue-600 shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setIsMobileOpen(false); onLogout(); }}
            className="flex items-center justify-center w-full px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-red-600 active:bg-slate-100 active:scale-95 transition-all shadow-sm touch-manipulation"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" /> Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
