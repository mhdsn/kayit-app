// ================================================================
// KAYIT v2 — types.ts
// Conserve toutes les interfaces existantes + ajout nouveaux modules
// ================================================================

// --- Interfaces existantes (inchangées) ---

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  total: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  notes?: string;
  currency: string;
  // NOUVEAU v2: lien avec une commande
  commande_id?: string;
  commande_number?: string;
}

export type UserPlan = 'starter' | 'pro' | 'business';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: UserPlan;
  signature?: string;
  businessName?: string;
  address?: string;
  phone?: string;
  currency: string;
  logo?: string;
  brandColor?: string;
  defaultNote?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface Client {
  id?: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
}

export interface Expense {
  id: string;
  titre?: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

// ================================================================
// NOUVEAUX TYPES v2
// ================================================================

// --- Produit ---
export interface Product {
  id: string;
  user_id?: string;
  nom: string;
  prix_achat: number;
  prix_vente: number;
  stock: number;
  categorie?: string;
  image_url?: string;
  created_at?: string;
}

export type ProductFormData = Omit<Product, 'id' | 'user_id' | 'created_at'>;

// --- Commande ---
export type CommandeStatut = 'en_attente' | 'validee' | 'annulee';

export interface CommandeItem {
  id?: string;
  commande_id?: string;
  produit_id: string;
  produit_nom?: string; // dénormalisé pour l'affichage
  quantite: number;
  prix_unitaire: number;
}

export interface Commande {
  id: string;
  user_id?: string;
  client_nom: string;
  client_telephone?: string;
  statut: CommandeStatut;
  mode_paiement?: string;
  total: number;
  invoice_id?: string;
  notes?: string;
  created_at?: string;
  items?: CommandeItem[];
}

export type CommandeFormData = {
  client_nom: string;
  client_telephone?: string;
  mode_paiement?: string;
  notes?: string;
  items: Array<{
    produit_id: string;
    quantite: number;
    prix_unitaire: number;
  }>;
};

// ================================================================
// ROUTES
// ================================================================

export enum AppRoute {
  DASHBOARD   = 'dashboard',
  REVENUE     = 'revenue',
  INVOICES    = 'invoices',
  EXPENSES    = 'expenses',
  CREATE_INVOICE = 'create-invoice',
  SETTINGS    = 'settings',
  PRICING     = 'pricing',
  ADMIN       = 'admin',
  // NOUVEAUX
  PRODUCTS    = 'products',
  ORDERS      = 'orders',
}

// ================================================================
// CONSTANTES
// ================================================================

export const CURRENCIES = [
  { code: 'XOF', label: 'Franc CFA (FCFA)', symbol: 'FCFA' },
  { code: 'EUR', label: 'Euro (€)', symbol: '€' },
  { code: 'USD', label: 'Dollar US ($)', symbol: '$' },
  { code: 'CAD', label: 'Dollar Canadien ($)', symbol: '$' },
  { code: 'GBP', label: 'Livre Sterling (£)', symbol: '£' },
];

export const LOW_STOCK_THRESHOLD = 5;

export const COMMANDE_STATUT_LABELS: Record<CommandeStatut, string> = {
  en_attente: 'En attente',
  validee: 'Validée',
  annulee: 'Annulée',
};

export const COMMANDE_STATUT_COLORS: Record<CommandeStatut, string> = {
  en_attente: 'bg-amber-100 text-amber-700',
  validee: 'bg-emerald-100 text-emerald-700',
  annulee: 'bg-red-100 text-red-600',
};

export const formatPrice = (amount: number, currencyCode: string = 'XOF') => {
  if (currencyCode === 'XOF') {
    return amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 }).replace(/[\u00A0\u202F]/g, ' ') + ' FCFA';
  }
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    return amount + ' ' + currencyCode;
  }
};

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
