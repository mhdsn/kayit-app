import { Invoice } from '../types';
import { supabase } from './supabaseClient';

// Charger toutes les factures depuis Supabase
export const getInvoices = async (): Promise<Invoice[]> => {
  // 1. On récupère l'utilisateur depuis la session locale (pas de requête réseau)
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) return [];

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id) // 🔒 Sécurité supplémentaire : on filtre par user
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors du chargement des factures:', error);
    return [];
  }

  if (!data) return [];

  // 2. Mapping : Comme ta base de données utilise déjà le camelCase (grâce aux guillemets dans le SQL)
  // On récupère les données directement.
  return data.map((inv: any) => ({
    id: inv.id,
    number: inv.number,
    clientName: inv.clientName,       // Correction : clientName (pas client_name)
    clientEmail: inv.clientEmail,     // Correction : clientEmail
    clientAddress: inv.clientAddress, // Ajouté
    date: inv.date,
    dueDate: inv.dueDate,             // Correction : dueDate
    status: inv.status,
    currency: inv.currency,
    items: inv.items,                 // Supabase gère le JSON automatiquement
    total: inv.total,
    notes: inv.notes,
    paymentMethod: inv.paymentMethod  // Ajouté
  }));
};

// Sauvegarder une facture (Création ou Mise à jour)
export const saveInvoice = async (invoice: Invoice) => {
  // 1. Qui est connecté ? (session locale, pas de requête réseau)
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    console.error("Erreur: Utilisateur non connecté");
    return;
  }

  // 2. On prépare l'objet pour la base de données
  // On utilise les clés exactes de la table SQL (camelCase)
  const invoiceData = {
    id: invoice.id,
    user_id: user.id,
    number: invoice.number,
    "clientName": invoice.clientName,       // Correspond à la colonne SQL "clientName"
    "clientEmail": invoice.clientEmail,
    "clientAddress": invoice.clientAddress,
    date: invoice.date,
    "dueDate": invoice.dueDate || null,     // Gestion du null pour l'optionnel
    status: invoice.status,
    currency: invoice.currency,
    items: invoice.items,
    total: invoice.total,
    notes: invoice.notes,
    "paymentMethod": invoice.paymentMethod
  };

  // 3. On envoie à Supabase
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