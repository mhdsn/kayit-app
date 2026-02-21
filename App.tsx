import React, { useState, useEffect } from 'react';
import { Menu, CheckCircle2, Info, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import Expenses from './components/Expenses';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import Pricing from './components/Pricing';
import Settings from './components/Settings';
import Revenue from './components/Revenue';
import Admin from './components/Admin';
import Legal from './components/Legal';
import { AppRoute, Invoice, User, UserPlan, Expense } from './types';
import { supabase } from './services/supabaseClient';
import UpgradeToBusiness from './components/UpgradeToBusiness';
import { 
  getInvoices, 
  saveInvoice, 
  deleteInvoice 
} from './services/storageService';
import { getExpenses, addExpense, deleteExpense } from './services/expenseService';

const MY_ADMIN_EMAIL = "senemouhamed27@gmail.com"; 

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>(undefined);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showLegal, setShowLegal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
            brandColor: meta.brandColor || undefined,
            address: meta.address || '',
            defaultNote: meta.default_note || '',
            signature: meta.signature || undefined
        };
    };

    // ✅ FIX : INITIAL_SESSION remplace initSession() séparé
    // Evite le double appel réseau qui causait ERR_CONNECTION_RESET
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {

        if (event === 'INITIAL_SESSION') {
            // Déclenché automatiquement au 1er chargement (remplace getSession())
            if (session) {
                setUser(formatUserFromSession(session));
                setShowLanding(false);
            }
            setIsLoading(false);

        } else if (event === 'SIGNED_IN' && session) {
            // Nouvelle connexion (email/password, OAuth, magic link)
            setUser(formatUserFromSession(session));
            setShowLanding(false);
            setAuthInitialMode('login');

        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setInvoices([]);
            setExpenses([]);
            setShowLanding(true);
            setIsLoading(false);

        } else if (event === 'USER_UPDATED' && session) {
            // Mise à jour du profil (plan, nom, etc.)
            setUser(formatUserFromSession(session));
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ FIX : user?.id comme dépendance (pas user entier)
  // Evite de recharger les données à chaque mise à jour de métadonnées
  useEffect(() => {
    if (user?.id) { loadData(); } else { setInvoices([]); setExpenses([]); }
  }, [user?.id]);

  useEffect(() => {
    const handlePaymentReturn = async () => {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');
      const newPlan = params.get('plan');
      if (!user || paymentStatus !== 'success' || !newPlan) return;
      showNotification("Activation de votre abonnement...", 'info');
      const { error } = await supabase.auth.updateUser({ data: { plan: newPlan } });
      if (error) { 
        console.error("Erreur:", error); 
        showNotification("Erreur d'activation.", 'info'); 
      } else {
        setUser(prev => prev ? { ...prev, plan: newPlan as UserPlan } : null);
        showNotification(`Félicitations ! Vous êtes ${newPlan}.`, 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    handlePaymentReturn();
  }, [user]);

  // Ref pour éviter les appels concurrents
  const isLoadingDataRef = React.useRef(false);

  const loadData = async () => {
    if (isLoadingDataRef.current) return; // Déjà en cours, on ignore
    isLoadingDataRef.current = true;
    try {
        const [invData, expData] = await Promise.all([
            getInvoices(),
            getExpenses()
        ]);
        setInvoices(invData || []);
        setExpenses(expData || []);
    } catch (error) {
        console.error("Erreur chargement données:", error);
    } finally {
        isLoadingDataRef.current = false;
    }
  };

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = (u: User) => {
    setUser(u);
    setShowLanding(false);
    setCurrentRoute(AppRoute.DASHBOARD);
  };

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
    setUser(null);
    setShowLanding(true);
    window.location.href = '/';
  };

  const handleUpdateUser = async (u: User) => { 
      setUser(u); 
      try { 
          await supabase.auth.updateUser({ 
              data: { 
                  full_name: u.name, 
                  business_name: u.businessName, 
                  phone: u.phone, 
                  currency: u.currency, 
                  logo: u.logo, 
                  brandColor: u.brandColor,
                  address: u.address,
                  default_note: u.defaultNote,
                  signature: u.signature 
              } 
          }); 
          showNotification("Profil sauvegardé !", 'success'); 
          setHasUnsavedChanges(false);
      } catch (e) { 
          showNotification("Erreur de sauvegarde.", 'info'); 
      } 
  };

  // ✅ FIX : try/catch pour éviter Uncaught (in promise)
  const handleSaveInvoice = async (inv: Invoice) => { 
    const updated = editingInvoice ? invoices.map(i => i.id === inv.id ? inv : i) : [inv, ...invoices]; 
    setInvoices(updated); 
    setEditingInvoice(undefined); 
    setCurrentRoute(AppRoute.INVOICES); 
    showNotification(editingInvoice ? 'Facture mise à jour' : 'Nouvelle facture créée', 'success'); 
    try {
      await saveInvoice(inv); 
      loadData();
    } catch (err) {
      console.error("Erreur sauvegarde facture:", err);
      showNotification("Erreur de synchronisation, réessayez.", 'info');
    }
  };

  const handleEditInvoice = (inv: Invoice) => { 
    setEditingInvoice(inv); 
    setCurrentRoute(AppRoute.CREATE_INVOICE); 
  };

  // ✅ FIX : try/catch pour éviter Uncaught (in promise)
  const handleDeleteInvoice = async (id: string) => { 
    setInvoices(invoices.filter(i => i.id !== id)); 
    showNotification('Facture supprimée', 'info'); 
    try {
      await deleteInvoice(id);
    } catch (err) {
      console.error("Erreur suppression facture:", err);
    }
  };

  const handleCancelForm = () => { 
    setEditingInvoice(undefined); 
    setCurrentRoute(AppRoute.DASHBOARD); 
  };
  
  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    try {
        const saved = await addExpense(newExpense);
        if (saved) {
            setExpenses([saved, ...expenses]);
            showNotification("Dépense ajoutée", 'success');
        }
    } catch (e) { showNotification("Erreur ajout dépense", 'info'); }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
        await deleteExpense(id);
        setExpenses(expenses.filter(e => e.id !== id));
        showNotification("Dépense supprimée", 'info');
    } catch (e) { showNotification("Erreur suppression", 'info'); }
  };

  const handleNavigate = (route: AppRoute) => { 
      if (hasUnsavedChanges) {
          const confirm = window.confirm("Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?");
          if (!confirm) return;
          setHasUnsavedChanges(false);
      }
      if (route === AppRoute.CREATE_INVOICE) setEditingInvoice(undefined); 
      setCurrentRoute(route); 
  };

  const handleUpgrade = async (plan: UserPlan) => { 
    if (!user) return; 
    setUser({ ...user, plan: plan }); 
    try { 
      await supabase.auth.updateUser({ data: { plan: plan } }); 
      showNotification(`Bienvenue sur le plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} !`, 'success'); 
    } catch (err) { 
      showNotification("Erreur lors du changement de plan", "info"); 
    } 
  };

  const handleDowngrade = async () => { 
    if (!user) return; 
    setUser({ ...user, plan: 'starter' }); 
    try { 
      await supabase.auth.updateUser({ data: { plan: 'starter' } }); 
      showNotification('Vous êtes repassé au plan Starter.', 'info'); 
    } catch (err) { 
      showNotification("Erreur lors du changement de plan", "info"); 
    } 
  };

  if (isLoading) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50">
            <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        </div>
    );
  }

  if (showLegal) {
    return <Legal onBack={() => setShowLegal(false)} />;
  }

  if (!user && showLanding) {
    return (
        <LandingPage 
            onLoginClick={() => { setAuthInitialMode('login'); setShowLanding(false); }} 
            onSignupClick={() => { setAuthInitialMode('signup'); setShowLanding(false); }} 
            onLegalClick={() => setShowLegal(true)}
        />
    );
  }

  if (!user && !showLanding) {
    return (
        <Auth 
            onLogin={handleLogin}
            initialMode={authInitialMode}
            onGoBack={() => setShowLanding(true)} 
        />
    );
  }

  const renderContent = () => {
    const isBusiness = user?.plan === 'business';

    switch (currentRoute) {
      case AppRoute.DASHBOARD:
        return <Dashboard invoices={invoices} expenses={expenses} user={user} onNavigate={(route) => handleNavigate(route as AppRoute)} />;
      
      case AppRoute.REVENUE:
        if (!isBusiness) return <UpgradeToBusiness onUpgrade={() => handleNavigate(AppRoute.PRICING)} />;
        return <Revenue invoices={invoices} expenses={expenses} user={user} />;
        
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
      
      case AppRoute.EXPENSES:
        if (!isBusiness) return <UpgradeToBusiness onUpgrade={() => handleNavigate(AppRoute.PRICING)} />;
        return <Expenses expenses={expenses} user={user} onAdd={handleAddExpense} onDelete={handleDeleteExpense} />;
      
      case AppRoute.SETTINGS:
        return <Settings 
            user={user} 
            onUpdateUser={handleUpdateUser} 
            setHasUnsavedChanges={setHasUnsavedChanges} 
        />;
      
      case AppRoute.PRICING:
        return <Pricing user={user} onUpgrade={handleUpgrade} onDowngrade={handleDowngrade} />;
      
      case AppRoute.ADMIN:
        if (user.email !== MY_ADMIN_EMAIL) {
            return (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Accès Interdit ⛔</h2>
                    <p className="text-slate-500 mt-2">Cette page est réservée à l'administrateur.</p>
                    <button onClick={() => handleNavigate(AppRoute.DASHBOARD)} className="mt-4 px-4 py-2 bg-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-300">
                        Retour au Dashboard
                    </button>
                </div>
            );
        }
        return <Admin />;

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