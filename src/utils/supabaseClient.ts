import { createClient } from '@supabase/supabase-js';
import type { Card } from '../types';
import type { Database } from '../types/database.types';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function saveCard(card: Omit<Card, 'id'>) {
  console.log('Card input:', JSON.stringify(card, null, 2));
  
  // Convert spells and tags to numbers to match database schema
  const spells = Array.isArray(card.spells) 
    ? card.spells.map((spell: { id: string | number } | string | number) => 
        parseInt(typeof spell === 'object' ? spell.id.toString() : spell.toString(), 10))
    : [];
  const tags = Array.isArray(card.tags)
    ? card.tags.map((tag: { id: string | number } | string | number) => 
        parseInt(typeof tag === 'object' ? tag.id.toString() : tag.toString(), 10))
    : [];
  
  try {
    const cardData = {
      name: card.name,
      description: card.description || null,
      type: card.type,
      rarity: card.rarity,
      health: card.health,
      image: card.image || null,
      passive_effect: card.passiveEffect || null,
      spells,  // Now sending as number[]
      tags,    // Now sending as number[]
      updated_at: new Date().toISOString(),
      is_wip: card.isWIP,
      is_crap: card.isCrap || false
    };

    console.log('Saving card data:', JSON.stringify(cardData, null, 2));

    const { data, error } = await supabase
      .from('cards')
      .insert([cardData])
      .select();

    if (error) {
      console.error('Erreur de sauvegarde:', error);
      console.error('Données envoyées qui ont causé l\'erreur:', JSON.stringify(cardData, null, 2));
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
    }
    return data;
  } catch (e) {
    console.error('Exception lors de la sauvegarde:', e);
    throw e;
  }
}

export async function getAllCards() {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  
  // Convertir le format des données et s'assurer que les tableaux sont initialisés
  return (data || []).map(card => {
    // Conversion des tableaux PostgreSQL en tableaux JavaScript
    let spells = [];
    let tags = [];
    
    if (typeof card.spells === 'string' && card.spells.startsWith('{') && card.spells.endsWith('}')) {
      try {
        const content = card.spells.substring(1, card.spells.length - 1);
        spells = content ? content.split(',').map((s: string) => parseInt(s.trim(), 10)) : [];
      } catch (e) {
        console.error('Erreur lors de la conversion des spells:', e);
        spells = [];
      }
    } else if (Array.isArray(card.spells)) {
      spells = card.spells.map((s: number | string) => parseInt(String(s), 10));
    }
    
    if (typeof card.tags === 'string' && card.tags.startsWith('{') && card.tags.endsWith('}')) {
      try {
        const content = card.tags.substring(1, card.tags.length - 1);
        tags = content ? content.split(',').map((t: string) => parseInt(t.trim(), 10)) : [];
      } catch (e) {
        console.error('Erreur lors de la conversion des tags:', e);
        tags = [];
      }
    } else if (Array.isArray(card.tags)) {
      tags = card.tags.map((t: number | string) => parseInt(String(t), 10));
    }

    return {
      ...card,
      passiveEffect: card.passive_effect,
      spells,
      tags,
      isWIP: card.is_wip ?? true, // Si is_wip est null, on considère la carte comme WIP
      isCrap: card.is_crap ?? false,
      passive_effect: undefined,
      is_wip: undefined,
      is_crap: undefined
    };
  }) as Card[];
}

export async function searchCards(query: string) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,type.ilike.%${query}%`)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  
  // Réutiliser la même logique de conversion que dans getAllCards
  return (data || []).map(card => {
    // Conversion des tableaux PostgreSQL en tableaux JavaScript
    let spells = [];
    let tags = [];
    
    if (typeof card.spells === 'string' && card.spells.startsWith('{') && card.spells.endsWith('}')) {
      try {
        const content = card.spells.substring(1, card.spells.length - 1);
        spells = content ? content.split(',').map((s: string) => parseInt(s.trim(), 10)) : [];
      } catch (e) {
        console.error('Erreur lors de la conversion des spells:', e);
        spells = [];
      }
    } else if (Array.isArray(card.spells)) {
      spells = card.spells.map((s: number | string) => parseInt(String(s), 10));
    }
    
    if (typeof card.tags === 'string' && card.tags.startsWith('{') && card.tags.endsWith('}')) {
      try {
        const content = card.tags.substring(1, card.tags.length - 1);
        tags = content ? content.split(',').map((t: string) => parseInt(t.trim(), 10)) : [];
      } catch (e) {
        console.error('Erreur lors de la conversion des tags:', e);
        tags = [];
      }
    } else if (Array.isArray(card.tags)) {
      tags = card.tags.map((t: number | string) => parseInt(String(t), 10));
    }

    return {
      ...card,
      passiveEffect: card.passive_effect,
      spells,
      tags,
      isWIP: card.is_wip ?? true, // Si is_wip est null, on considère la carte comme WIP
      isCrap: card.is_crap ?? false,
      passive_effect: undefined,
      is_wip: undefined,
      is_crap: undefined
    };
  }) as Card[];
}

export async function deleteCard(id: string) {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getAutocompleteValues() {
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('name, description, image, passive_effect');
  
  if (cardsError) throw cardsError;

  const suggestions = {
    names: Array.from(new Set(cards?.map(card => card.name) || [])),
    descriptions: Array.from(new Set(cards?.map(card => card.description).filter(Boolean) || [])),
    images: Array.from(new Set(cards?.map(card => card.image).filter(Boolean) || [])),
    passive_effects: Array.from(new Set(cards?.map(card => card.passive_effect).filter(Boolean) || []))
  };

  return suggestions;
}