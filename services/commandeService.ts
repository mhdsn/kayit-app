// ================================================================
// services/commandeService.ts
// CRUD Supabase pour les Commandes + logique métier stock
// ================================================================

import { supabase } from './supabaseClient';
import { Commande, CommandeFormData, CommandeItem, CommandeStatut } from '../types';

// Charger toutes les commandes (avec leurs items + nom produit)
export const getCommandes = async (): Promise<Commande[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('commandes')
    .select(`
      *,
      commande_items (
        id,
        produit_id,
        quantite,
        prix_unitaire,
        products ( nom )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur chargement commandes:', error);
    return [];
  }

  // Normaliser la structure pour l'app
  return (data || []).map((row: any) => ({
    ...row,
    items: (row.commande_items || []).map((item: any) => ({
      id: item.id,
      commande_id: row.id,
      produit_id: item.produit_id,
      produit_nom: item.products?.nom || 'Produit supprimé',
      quantite: item.quantite,
      prix_unitaire: item.prix_unitaire,
    })),
  }));
};

// Créer une nouvelle commande avec ses items
export const createCommande = async (form: CommandeFormData): Promise<Commande | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Vérifier la disponibilité du stock avant de créer
  for (const item of form.items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock, nom')
      .eq('id', item.produit_id)
      .single();

    if (product && product.stock < item.quantite) {
      throw new Error(`Stock insuffisant pour "${product.nom}" (disponible : ${product.stock})`);
    }
  }

  // 2. Calculer le total
  const total = form.items.reduce((sum, i) => sum + i.quantite * i.prix_unitaire, 0);

  // 3. Créer la commande
  const { data: commande, error: cmdError } = await supabase
    .from('commandes')
    .insert([{
      user_id: user.id,
      client_nom: form.client_nom,
      client_telephone: form.client_telephone,
      mode_paiement: form.mode_paiement,
      notes: form.notes,
      total,
      statut: 'en_attente',
    }])
    .select()
    .single();

  if (cmdError || !commande) {
    console.error('Erreur création commande:', cmdError);
    throw cmdError;
  }

  // 4. Créer les items
  const itemsToInsert = form.items.map(i => ({
    commande_id: commande.id,
    produit_id: i.produit_id,
    quantite: i.quantite,
    prix_unitaire: i.prix_unitaire,
  }));

  const { error: itemsError } = await supabase
    .from('commande_items')
    .insert(itemsToInsert);

  if (itemsError) {
    console.error('Erreur insertion items:', itemsError);
    throw itemsError;
  }

  return commande;
};

// Changer le statut d'une commande
// Le trigger SQL gère automatiquement la mise à jour du stock
export const updateCommandeStatut = async (
  id: string,
  statut: CommandeStatut
): Promise<Commande | null> => {
  const { data, error } = await supabase
    .from('commandes')
    .update({ statut })
    .eq('id', id)
    .select()
    .single();

  if (error) { console.error('Erreur update statut:', error); throw error; }
  return data;
};

// Lier une facture à une commande
export const linkInvoiceToCommande = async (
  commandeId: string,
  invoiceId: string
): Promise<void> => {
  const { error } = await supabase
    .from('commandes')
    .update({ invoice_id: invoiceId })
    .eq('id', commandeId);

  if (error) throw error;
};

// Supprimer une commande (uniquement si en_attente)
export const deleteCommande = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('commandes')
    .delete()
    .eq('id', id);

  if (error) { console.error('Erreur suppression commande:', error); throw error; }
};
