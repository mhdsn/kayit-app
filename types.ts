// --- 1. Les Interfaces de base ---

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  // J'ai renommé 'invoiceNumber' en 'number' pour coller à ta base de données Supabase
  number: string; 
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  date: string;
  dueDate: string;      // AJOUTÉ : Indispensable pour Supabase
  items: InvoiceItem[];
  total: number;
  status: 'paid' | 'pending' | 'overdue'; // AJOUTÉ : 'overdue' pour les retards
  paymentMethod?: string;
  notes?: string;
  currency: string;     // AJOUTÉ : Pour savoir si c'est en XOF ou EUR
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

// --- 2. Utilitaires (On garde ton code existant !) ---

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  REVENUE = 'revenue',
  INVOICES = 'invoices',
  EXPENSES = 'expenses',
  CREATE_INVOICE = 'create-invoice',
  SETTINGS = 'settings',
  PRICING = 'pricing',
  ADMIN = 'admin'
}

export const CURRENCIES = [
  { code: 'XOF', label: 'Franc CFA (FCFA)', symbol: 'FCFA' },
  { code: 'EUR', label: 'Euro (€)', symbol: '€' },
  { code: 'USD', label: 'Dollar US ($)', symbol: '$' },
  { code: 'CAD', label: 'Dollar Canadien ($)', symbol: '$' },
  { code: 'GBP', label: 'Livre Sterling (£)', symbol: '£' },
];

export const formatPrice = (amount: number, currencyCode: string = 'XOF') => {
  if (currencyCode === 'XOF') {
    return amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 }).replace(/[\u00A0\u202F]/g, ' ') + ' FCFA';
  }
  
  try {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: currencyCode,
      maximumFractionDigits: 0 
    }).format(amount);
  } catch (e) {
    return amount + ' ' + currencyCode;
  }
};


export interface Client {
  id?: string; // Optionnel car généré par la DB
  name: string;
  email?: string;
  address?: string;
  phone?: string;
}
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}