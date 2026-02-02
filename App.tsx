import React, { useState, useEffect } from 'react';
import { Menu, CheckCircle2, Info, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import Pricing from './components/Pricing';
import Settings from './components/Settings';
import { AppRoute, Invoice, User, UserPlan } from './types';
import { supabase } from './services/supabaseClient';
import { 
  getInvoices, 
  saveInvoice, 
  deleteInvoice 
} from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>(undefined);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // GESTION LANDING & AUTH
  const [showLanding, setShowLanding] = useState(true);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const formatUserFromSession = (session: any): User => {
        const meta = session.user.user_metadata;
        return {
            id: session.user.id,
            email: session.user.email || '',
            name: meta.full_name || '',
            businessName: meta.business_name || '',
            phone: meta.phone || '',
            plan: meta.plan || 'starter',
            currency: meta.currency || 'XOF',
            logo: meta.logo || undefined,
            brandColor: meta.brandColor || undefined
        };
    };

    // 1. Vérification initiale
    const initSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setUser(formatUserFromSession(session));
            setShowLanding(false);
        }
        setIsLoading(false);
    };

    initSession();

    // 2. Écouteur d'événements (C'est ici que la magie opère ✨)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
            // 👇 FORCE L'AFFICHAGE DE LA LANDING PAGE EN CAS DE DÉCONNEXION
            setShowLanding(true); 
            setUser(null);
            setInvoices([]);
            setAuthInitialMode('login');
        } else if (session) {
            setUser(formatUserFromSession(session));
            setShowLanding(false);
        } else {
            // Cas rare (token expiré sans logout explicite)
            setUser(null);
            setInvoices([]);
        }
        setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) { loadInvoicesData(); } else { setInvoices([]); }
  }, [user]);

  useEffect(() => {
    const handlePaymentReturn = async () => {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');
      const newPlan = params.get('plan');
      if (!user || paymentStatus !== 'success' || !newPlan) return;
      showNotification("Activation de votre abonnement...", 'info');
      const { error } = await supabase.auth.updateUser({ data: { plan: newPlan } });
      if (error) { console.error("Erreur:", error); showNotification("Erreur d'activation.", 'info'); } 
      else {
        setUser(prev => prev ? { ...prev, plan: newPlan as UserPlan } : null);
        showNotification(`Félicitations ! Vous êtes ${newPlan}.`, 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    handlePaymentReturn();
  }, [user]);

  const loadInvoicesData = async () => {
    const data = await getInvoices();
    setInvoices(data);
  };

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = () => {
    setCurrentRoute(AppRoute.DASHBOARD);
  };

  // 👇 LOGOUT (Sert de déclencheur manuel)
  const handleLogout = async () => {
    setIsLoading(true);
    try {
        await supabase.auth.signOut(); // Ceci va déclencher l'événement SIGNED_OUT plus haut
        setIsMobileOpen(false);
    } catch (error) {
        console.error("Erreur déconnexion", error);
    }
    // Pas besoin de setIsLoading(false) ici, l'événement SIGNED_OUT le fera
  };

  const handleUpdateUser = async (u: User) => { setUser(u); try { await supabase.auth.updateUser({ data: { full_name: u.name, business_name: u.businessName, phone: u.phone, currency: u.currency, logo: u.logo, brandColor: u.brandColor } }); showNotification("Profil sauvegardé !", 'success'); } catch (e) { showNotification("Erreur de sauvegarde.", 'info'); } };
  const handleSaveInvoice = async (inv: Invoice) => { const updated = editingInvoice ? invoices.map(i => i.id === inv.id ? inv : i) : [inv, ...invoices]; setInvoices(updated); setEditingInvoice(undefined); setCurrentRoute(AppRoute.INVOICES); showNotification(editingInvoice ? 'Facture mise à jour' : 'Nouvelle facture créée', 'success'); await saveInvoice(inv); loadInvoicesData(); };
  const handleEditInvoice = (inv: Invoice) => { setEditingInvoice(inv); setCurrentRoute(AppRoute.CREATE_INVOICE); };
  const handleDeleteInvoice = async (id: string) => { setInvoices(invoices.filter(i => i.id !== id)); showNotification('Facture supprimée', 'info'); await deleteInvoice(id); };
  const handleCancelForm = () => { setEditingInvoice(undefined); setCurrentRoute(AppRoute.DASHBOARD); };
  const handleNavigate = (route: AppRoute) => { if (route === AppRoute.CREATE_INVOICE) setEditingInvoice(undefined); setCurrentRoute(route); };
  const handleUpgrade = async (plan: UserPlan) => { if (!user) return; setUser({ ...user, plan: plan }); try { await supabase.auth.updateUser({ data: { plan: plan } }); showNotification(`Bienvenue sur le plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} !`, 'success'); } catch (err) { showNotification("Erreur lors du changement de plan", "info"); } };
  const handleDowngrade = async () => { if (!user) return; setUser({ ...user, plan: 'starter' }); try { await supabase.auth.updateUser({ data: { plan: 'starter' } }); showNotification('Vous êtes repassé au plan Starter.', 'info'); } catch (err) { showNotification("Erreur lors du changement de plan", "info"); } };

  if (isLoading) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50">
            <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        </div>
    );
  }

  // GESTION DE L'AFFICHAGE PRINCIPAL
  if (!user) {
    if (showLanding) {
        return (
            <LandingPage 
                onLoginClick={() => { setAuthInitialMode('login'); setShowLanding(false); }} 
                onSignupClick={() => { setAuthInitialMode('signup'); setShowLanding(false); }} 
            />
        );
    }
    return (
        <Auth 
            onLogin={handleLogin} 
            initialMode={authInitialMode}
            onGoBack={() => setShowLanding(true)} 
        />
    );
  }

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.DASHBOARD:
        return <Dashboard invoices={invoices} user={user} onNavigate={(route) => handleNavigate(route as AppRoute)} />;
      case AppRoute.INVOICES:
        return <InvoiceList invoices={invoices} user={user} onDelete={handleDeleteInvoice} onEdit={handleEditInvoice} />;
      case AppRoute.CREATE_INVOICE:
        return (
          <InvoiceForm 
            onSave={handleSaveInvoice} 
            onCancel={handleCancelForm}
            onGoToPricing={() => handleNavigate(AppRoute.PRICING)} 
            user={user} 
            invoiceCount={invoices.length} 
            initialData={editingInvoice} 
          />
        );
      case AppRoute.SETTINGS:
        return <Settings user={user} onUpdateUser={handleUpdateUser} />;
      case AppRoute.PRICING:
        return <Pricing user={user} onUpgrade={handleUpgrade} onDowngrade={handleDowngrade} />;
      default:
        return <div>Introuvable</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      <Sidebar 
        currentRoute={currentRoute} 
        onChangeRoute={handleNavigate} 
        onLogout={handleLogout}
        user={user}
        invoices={invoices} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative w-full">
        
        {notification && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
                <div className="flex items-center gap-3 px-6 py-3 rounded-full shadow-lg border pointer-events-auto bg-white">
                     {notification.type === 'success' 
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        : <Info className="w-5 h-5 text-brand-600" />
                     }
                    <span className={`font-medium text-sm ${
                        notification.type === 'success' ? 'text-emerald-700' : 'text-brand-700'
                    }`}>
                        {notification.message}
                    </span>
                </div>
            </div>
        )}

        <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">K</div>
            <span className="font-bold text-slate-900">Kayit</span>
          </div>
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
           {renderContent()}
        </div>

      </main>
    </div>
  );
};

export default App;