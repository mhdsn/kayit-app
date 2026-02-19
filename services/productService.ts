// ================================================================
// services/productService.ts
// CRUD Supabase pour les Produits
// ================================================================

import { supabase } from './supabaseClient';
import { Product, ProductFormData } from '../types';

export const getProducts = async (): Promise<Product[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur chargement produits:', error);
    return [];
  }
  return data || [];
};

export const addProduct = async (product: ProductFormData): Promise<Product | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('products')
    .insert([{ ...product, user_id: user.id }])
    .select()
    .single();

  if (error) { console.error('Erreur ajout produit:', error); throw error; }
  return data;
};

export const updateProduct = async (id: string, updates: Partial<ProductFormData>): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) { console.error('Erreur update produit:', error); throw error; }
  return data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) { console.error('Erreur suppression produit:', error); throw error; }
};

// Mise à jour directe du stock (utile si on bypass le trigger)
export const updateStock = async (id: string, newStock: number): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', id);
  if (error) throw error;
};
