import { supabase } from './supabaseClient';
import { Client } from '../types';

// Récupérer tous les clients de l'utilisateur
export const getClients = async (userId: string): Promise<Client[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erreur chargement clients:', error);
    return [];
  }

  return data || [];
};

// Sauvegarder ou Mettre à jour un client
export const upsertClient = async (client: Client, userId: string) => {
  if (!userId || !client.name) return;

  const { error } = await supabase
    .from('clients')
    .upsert({ 
        user_id: userId,
        name: client.name,
        email: client.email,
        address: client.address,
        phone: client.phone
    }, { onConflict: 'user_id, name' });

  if (error) {
    console.error('Erreur sauvegarde client:', error);
  }
};