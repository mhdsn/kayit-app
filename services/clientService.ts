import { supabase } from './supabaseClient';
import { Client } from '../types';

// Récupérer tous les clients de l'utilisateur
export const getClients = async (): Promise<Client[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erreur chargement clients:', error);
    return [];
  }

  return data || [];
};

// Sauvegarder ou Mettre à jour un client (Basé sur le nom)
export const upsertClient = async (client: Client) => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user || !client.name) return;

  const { error } = await supabase
    .from('clients')
    .upsert({ 
        user_id: user.id,
        name: client.name,
        email: client.email,
        address: client.address,
        phone: client.phone
    }, { onConflict: 'user_id, name' }); // Utilise la contrainte unique qu'on a créée en SQL

  if (error) {
    console.error('Erreur sauvegarde client:', error);
  }
};