import { createClient } from '@supabase/supabase-js';
import type { Card } from '../types';
import type { Database } from '../types/database.types';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const saveCard = async (card: Card) => {
  try {
    const formattedCard = {
      ...card,
      properties: card.properties || {},
    };

    if (card.id) {
      const { data, error } = await supabase
        .from('cards')
        .update(formattedCard)
        .eq('id', card.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } else {
      const { data, error } = await supabase
        .from('cards')
        .insert(formattedCard)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la carte:', error);
    return { data: null, error };
  }
};

export async function getAllCards() {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Convertir le format des données et s'assurer que les tableaux sont initialisés
  return (data || []).map(card => ({
    ...card,
    passive_effect: card.passive_effect,
    is_wip: card.is_wip ?? true, // Si is_wip est null, on considère la carte comme WIP
    is_crap: card.is_crap ?? false
  })) as Card[];
}

export async function searchCards(query: string) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,type.ilike.%${query}%`)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Réutiliser la même logique de conversion que dans getAllCards
  return (data || []).map(card => ({
    ...card,
    passive_effect: card.passive_effect,
    is_wip: card.is_wip ?? true, // Si is_wip est null, on considère la carte comme WIP
    is_crap: card.is_crap ?? false
  })) as Card[];
}

export async function deleteCard(id: number) {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getAutocompleteValues() {
  try {
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
  } catch (error) {
    console.error('Erreur lors du chargement des suggestions:', error);
    throw error;
  }
}

export const updateCard = async (card: Card) => {
  const { data, error } = await supabase
    .from('cards')
    .update(card)
    .eq('id', card.id)
    .select() // Make sure to add .select() to return the updated data
    .single();
    
  if (error) {
    console.error('Error updating card:', error);
    throw error;
  }
  
  return data;
};

export const insertCard = async (card: Card) => {
  // Remove id field for new cards
  const { id, ...cardWithoutId } = card;
  
  const { data, error } = await supabase
    .from('cards')
    .insert(cardWithoutId)
    .select() // Make sure to add .select() to return the inserted data
    .single();
    
  if (error) {
    console.error('Error inserting card:', error);
    throw error;
  }
  
  return data;
};

/**
 * Updates the spells associated with a card
 */
export const updateCardSpells = async (cardId: number, spellIds: number[]) => {
  const { error: deleteError } = await supabase
    .from('card_spells')
    .delete()
    .eq('card_id', cardId);
  
  if (deleteError) throw deleteError;
  
  // Only insert if there are spells to add
  if (spellIds.length > 0) {
    const spellRelations = spellIds.map(spellId => ({
      card_id: cardId,
      spell_id: spellId
    }));
    
    const { error: insertError } = await supabase
      .from('card_spells')
      .insert(spellRelations);
    
    if (insertError) throw insertError;
  }
  
  return true;
};

/**
 * Updates the tags associated with a card
 */
export const updateCardTags = async (cardId: number, tagIds: number[]) => {
  const { error: deleteError } = await supabase
    .from('card_tags')
    .delete()
    .eq('card_id', cardId);
  
  if (deleteError) throw deleteError;
  
  // Only insert if there are tags to add
  if (tagIds.length > 0) {
    const tagRelations = tagIds.map(tagId => ({
      card_id: cardId,
      tag_id: tagId
    }));
    
    const { error: insertError } = await supabase
      .from('card_tags')
      .insert(tagRelations);
    
    if (insertError) throw insertError;
  }
  
  return true;
};