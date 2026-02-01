import { Invoice } from '../types';
import { supabase } from './supabaseClient';

// Charger toutes les factures depuis Supabase
export const getInvoices = async (): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors du chargement des factures:', error);
    return [];
  }

  if (!data) return [];

  // On convertit le format SQL (snake_case) vers ton App (camelCase)
  return data.map((inv: any) => ({
    id: inv.id,
    number: inv.number,           // Attention : bien utiliser 'number' ici
    clientName: inv.client_name,
    clientEmail: inv.client_email,
    date: inv.date,
    dueDate: inv.due_date,
    status: inv.status,
    currency: inv.currency,
    items: inv.items,
    total: inv.total,
    notes: inv.notes
  }));
};

// Sauvegarder une facture (Création ou Mise à jour)
export const saveInvoice = async (invoice: Invoice) => {
  // 1. Qui est connecté ?
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("Erreur: Utilisateur non connecté");
    return;
  }

  // 2. On prépare l'objet pour la base de données
  const invoiceData = {
    id: invoice.id,
    user_id: user.id,
    number: invoice.number,
    client_name: invoice.clientName,
    client_email: invoice.clientEmail,
    date: invoice.date,
    due_date: invoice.dueDate,
    status: invoice.status,
    currency: invoice.currency,
    items: invoice.items,
    total: invoice.total,
    notes: invoice.notes
  };

  // 3. On envoie à Supabase (Upsert = Update ou Insert)
  const { error } = await supabase
    .from('invoices')
    .upsert(invoiceData);

  if (error) {
    console.error('Erreur sauvegarde:', error);
    throw error;
  }
};

// Supprimer une facture
export const deleteInvoice = async (id: string) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression:', error);
    throw error;
  }
};