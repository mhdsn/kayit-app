import { supabase } from './supabaseClient';
import { Expense } from '../types';

export const getExpenses = async (userId: string): Promise<Expense[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Erreur chargement dépenses:', error);
    return [];
  }

  return data || [];
};

export const addExpense = async (expense: Omit<Expense, 'id'>, userId: string) => {
  if (!userId) throw new Error("Utilisateur non connecté.");

  const { data, error } = await supabase
    .from('expenses')
    .insert([{ ...expense, user_id: userId }])
    .select()
    .single();

  if (error) {
    console.error("Erreur ajout dépense:", error);
    throw error;
  }

  return data;
};

export const deleteExpense = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erreur suppression dépense:", error);
    throw error;
  }
};