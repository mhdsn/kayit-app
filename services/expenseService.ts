import { supabase } from './supabaseClient';
import { Expense } from '../types';

export const getExpenses = async (): Promise<Expense[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Erreur chargement dépenses:', error);
    return [];
  }
  return data || [];
};

export const addExpense = async (expense: Omit<Expense, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('expenses')
    .insert([{ ...expense, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteExpense = async (id: string) => {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
};