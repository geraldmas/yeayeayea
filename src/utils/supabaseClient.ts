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
  console.log('Card input:', JSON.stringify(card, null, 2));
  
  // Ensure spells and tags are always arrays
  const spells = Array.isArray(card.spells) ? card.spells : [];
  const tags = Array.isArray(card.tags) ? card.tags : [];
  
  try {
    // Solution 1: Utiliser une fonction RPC spéciale pour gérer les tableaux
    if (hasSaveCardWithArraysFunction()) {
      const { data, error } = await supabase.rpc('save_card_with_arrays', {
        card_data: JSON.stringify({
          id: card.id,
          name: card.name,
          description: card.description || null,
          type: card.type,
          rarity: card.rarity,
          health: card.health,
          image: card.image || null,
          passive_effect: card.passiveEffect || null,
          spells,
          talent: card.talent || null,
          tags,
          is_wip: card.isWIP
        })
      });

      if (error) {
        console.error('Erreur de sauvegarde avec RPC:', error);
        throw new Error(`Erreur lors de la sauvegarde RPC: ${error.message}`);
      }
      return data;
    } 
    // Solution 2: Utiliser le format natif PostgreSQL pour les tableaux
    else {
      // Format PostgreSQL pour les tableaux: '{item1,item2}'
      // Important: pour les valeurs contenant des virgules ou des caractères spéciaux,
      // il faudrait les échapper correctement ou utiliser la solution 1
      const spellsString = Array.isArray(spells) && spells.length > 0 
        ? `{${spells.join(',')}}` 
        : '{}';
      const tagsString = Array.isArray(tags) && tags.length > 0
        ? `{${tags.join(',')}}` 
        : '{}';

      const cardData = {
        id: card.id,
        name: card.name,
        description: card.description || null,
        type: card.type,
        rarity: card.rarity,
        health: card.health,
        image: card.image || null,
        passive_effect: card.passiveEffect || null,
        spells: spellsString,  // Envoyer comme une chaîne au format PostgreSQL
        talent: card.talent || null,
        tags: tagsString,      // Envoyer comme une chaîne au format PostgreSQL
        updated_at: new Date().toISOString(),
        is_wip: card.isWIP
      };

      console.log('Saving card data:', JSON.stringify(cardData, null, 2));

      const { data, error } = await supabase
        .from('cards')
        .upsert([cardData], { onConflict: 'id' })
        .select();

      if (error) {
        console.error('Erreur de sauvegarde:', error);
        console.error('Données envoyées qui ont causé l\'erreur:', JSON.stringify(cardData, null, 2));
        throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
      }
      return data;
    }
  } catch (e) {
    console.error('Exception lors de la sauvegarde:', e);
    throw e;
  }
}

// Fonction pour vérifier si la fonction RPC est disponible
// Cette fonction peut être remplacée par une vérification réelle ou une configuration
function hasSaveCardWithArraysFunction() {
  // En production, vous pourriez avoir une variable d'environnement ou un appel pour vérifier
  // Pour l'instant, nous supposons que la fonction n'est pas disponible jusqu'à ce qu'elle soit créée
  return false;
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
      // Convertir la chaîne PostgreSQL en tableau JavaScript
      try {
        // Supprimer les accolades et diviser par les virgules
        const content = card.spells.substring(1, card.spells.length - 1);
        spells = content ? content.split(',').map((s: string) => {
          // Nettoyer les guillemets et échappements
          return s.startsWith('"') && s.endsWith('"') ? s.substring(1, s.length - 1) : s;
        }) : [];
      } catch (e) {
        console.error('Erreur lors de la conversion des spells:', e);
        spells = [];
      }
    } else if (Array.isArray(card.spells)) {
      spells = card.spells;
    }
    
    if (typeof card.tags === 'string' && card.tags.startsWith('{') && card.tags.endsWith('}')) {
      try {
        // Supprimer les accolades et diviser par les virgules
        const content = card.tags.substring(1, card.tags.length - 1);
        tags = content ? content.split(',').map((t: string) => {
          // Nettoyer les guillemets et échappements
          return t.startsWith('"') && t.endsWith('"') ? t.substring(1, t.length - 1) : t;
        }) : [];
      } catch (e) {
        console.error('Erreur lors de la conversion des tags:', e);
        tags = [];
      }
    } else if (Array.isArray(card.tags)) {
      tags = card.tags;
    }

    return {
      ...card,
      passiveEffect: card.passive_effect,
      spells,
      tags,
      isWIP: card.is_wip ?? true, // Si is_wip est null, on considère la carte comme WIP
      passive_effect: undefined,
      is_wip: undefined
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
      // Convertir la chaîne PostgreSQL en tableau JavaScript
      try {
        // Supprimer les accolades et diviser par les virgules
        const content = card.spells.substring(1, card.spells.length - 1);
        spells = content ? content.split(',').map((s: string) => {
          // Nettoyer les guillemets et échappements
          return s.startsWith('"') && s.endsWith('"') ? s.substring(1, s.length - 1) : s;
        }) : [];
      } catch (e) {
        console.error('Erreur lors de la conversion des spells:', e);
        spells = [];
      }
    } else if (Array.isArray(card.spells)) {
      spells = card.spells;
    }
    
    if (typeof card.tags === 'string' && card.tags.startsWith('{') && card.tags.endsWith('}')) {
      try {
        // Supprimer les accolades et diviser par les virgules
        const content = card.tags.substring(1, card.tags.length - 1);
        tags = content ? content.split(',').map((t: string) => {
          // Nettoyer les guillemets et échappements
          return t.startsWith('"') && t.endsWith('"') ? t.substring(1, t.length - 1) : t;
        }) : [];
      } catch (e) {
        console.error('Erreur lors de la conversion des tags:', e);
        tags = [];
      }
    } else if (Array.isArray(card.tags)) {
      tags = card.tags;
    }

    return {
      ...card,
      passiveEffect: card.passive_effect,
      spells,
      tags,
      isWIP: card.is_wip ?? true, // Si is_wip est null, on considère la carte comme WIP
      passive_effect: undefined,
      is_wip: undefined
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