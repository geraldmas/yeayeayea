import { createClient } from '@supabase/supabase-js';
import type { Card } from '../types';
import type { Database } from '../types/database.types';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function saveCard(card: Card) {
  // Adapter les données au format de la table
  const cardData = {
    id: card.id,
    name: card.name,
    description: card.description || null,
    type: card.type,
    rarity: card.rarity,
    health: card.health,
    image: card.image || null,
    passive_effect: card.passiveEffect || null,
    spells: card.spells || [],
    talent: card.talent || null,
    tags: card.tags || [],
    is_wip: card.isWIP,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('cards')
    .upsert(cardData)
    .select();

  if (error) {
    console.error('Erreur de sauvegarde:', error);
    throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
  }
  return data;
}

export async function getAllCards() {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  
  // Convertir le format des données et s'assurer que les tableaux sont initialisés
  return (data || []).map(card => ({
    ...card,
    passiveEffect: card.passive_effect,
    spells: Array.isArray(card.spells) ? card.spells : [],
    tags: Array.isArray(card.tags) ? card.tags.filter((tag: unknown) => tag && typeof tag === 'object') : [],
    isWIP: card.is_wip ?? true, // Si is_wip est null, on considère la carte comme WIP
    passive_effect: undefined,
    is_wip: undefined
  })) as Card[];
}

export async function searchCards(query: string) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,type.ilike.%${query}%`)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  
  // Convertir le format des données et s'assurer que les tableaux sont initialisés
  return (data || []).map(card => ({
    ...card,
    passiveEffect: card.passive_effect,
    spells: Array.isArray(card.spells) ? card.spells : [],
    tags: Array.isArray(card.tags) ? card.tags.filter((tag: unknown) => tag && typeof tag === 'object') : [],
    isWIP: card.is_wip ?? true, // Si is_wip est null, on considère la carte comme WIP
    passive_effect: undefined,
    is_wip: undefined
  })) as Card[];
}

export async function deleteCard(id: string) {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id);

  if (error) throw error;
}