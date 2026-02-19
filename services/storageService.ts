import { supabase } from './supabaseClient';
import { Invoice } from '../types';

export const getInvoices = async (userId: string): Promise<Invoice[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erreur chargement factures:", error);
    throw error;
  }

  if (!data) return [];
  
  return data.map(inv => ({
    id: inv.id,
    number: inv.number,
    clientName: inv.client_name || 'Client Inconnu',
    clientEmail: inv.client_email || '',
    clientAddress: inv.client_address || '',
    date: inv.date || new Date().toISOString().split('T')[0],
    dueDate: inv.due_date || undefined,
    status: inv.status || 'pending',
    currency: inv.currency || 'XOF',
    items: inv.items || [],
    subtotal: inv.subtotal || 0,
    taxRate: inv.tax_rate || 0,
    taxAmount: inv.tax_amount || 0,
    total: inv.total || 0,
    notes: inv.notes || undefined,
    paymentMethod: inv.payment_method || undefined,
    userId: inv.user_id
  }));
};

export const saveInvoice = async (invoice: Invoice, userId: string) => {
  if (!userId) throw new Error("Utilisateur non connecté.");

  const invoiceData = {
    id: invoice.id,
    user_id: userId,
    number: invoice.number,
    client_name: invoice.clientName,
    client_email: invoice.clientEmail,
    client_address: invoice.clientAddress,
    date: invoice.date,
    due_date: invoice.dueDate || null,
    status: invoice.status,
    currency: invoice.currency,
    items: invoice.items,
    subtotal: invoice.subtotal || 0,
    tax_rate: invoice.taxRate || 0,
    tax_amount: invoice.taxAmount || 0,
    total: invoice.total || 0,
    notes: invoice.notes,
    payment_method: invoice.paymentMethod
  };

  const { error } = await supabase
    .from('invoices')
    .upsert(invoiceData);

  if (error) {
    console.error('Erreur sauvegarde:', error.message);
    throw new Error("Erreur lors de la sauvegarde : " + error.message);
  }
};

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