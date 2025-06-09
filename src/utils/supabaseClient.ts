import { createClient } from '@supabase/supabase-js';
import type { Card } from '../types';
import type { Database } from '../types/database.types';

/**
 * @file supabaseClient.ts
 * @description Client Supabase et fonctions d'accès à la base de données
 * Ce module configure le client Supabase et fournit des fonctions pour interagir
 * avec les tables du jeu Yeayeayea (cartes, sorts, tags, etc.)
 */

// Récupération des variables d'environnement
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Instance du client Supabase typée avec le schéma de la base de données
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Upload an image file to Supabase Storage and return its public URL.
 * The file is uploaded to the `card-images` bucket.
 * @param file The image file to upload
 * @returns The public URL of the uploaded image
 */
export const uploadCardImage = async (file: File): Promise<string> => {
  const bucket = 'card-images';
  const extension = file.name.split('.').pop();
  const fileName = `${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    contentType: file.type,
    cacheControl: '3600',
  });
  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
};

/**
 * Sauvegarde une carte dans la base de données (création ou mise à jour)
 * @param card - La carte à sauvegarder
 * @returns Un objet contenant la carte sauvegardée ou une erreur
 */
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

/**
 * Récupère toutes les cartes de la base de données
 * @returns Une promesse contenant la liste de toutes les cartes
 */
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

/**
 * Met à jour une carte existante dans la base de données.
 * Si l'identifiant est manquant ou vaut 0, la carte est insérée à la place.
 * @param card Carte à mettre à jour ou à insérer
 * @returns La carte enregistrée
 */
export const updateCard = async (card: Card) => {
  try {
    // Vérifier et nettoyer les données avant l'envoi
    const cleanedCard = { ...card };
    
    // S'assurer que properties est un objet valide
    if (!cleanedCard.properties) {
      cleanedCard.properties = {};
    }
    
    // S'assurer que les valeurs numériques sont bien des nombres
    if (cleanedCard.summon_cost !== null) {
      cleanedCard.summon_cost = Number(cleanedCard.summon_cost);
    }
    
    // S'assurer que properties.health est un nombre si défini
    if (cleanedCard.properties.health !== undefined) {
      cleanedCard.properties.health = Number(cleanedCard.properties.health);
    }
    
    // Supprimer la propriété tags qui n'existe pas dans la table cards
    const { tags, ...cardWithoutTags } = cleanedCard;
    
    // Vérifier si c'est une nouvelle carte (id = 0 ou manquant)
    if (!cardWithoutTags.id || cardWithoutTags.id === 0) {
      console.log('Carte avec ID 0 ou manquant détectée - utilisation de insertCard au lieu de updateCard');
      // Utiliser insertCard pour les nouvelles cartes
      return insertCard(cardWithoutTags);
    }
    
    console.log('Envoi de la carte pour mise à jour:', JSON.stringify(cardWithoutTags));
    
    const { data, error } = await supabase
      .from('cards')
      .update(cardWithoutTags)
      .eq('id', cardWithoutTags.id)
      .select() // Make sure to add .select() to return the updated data
      .single();
      
    if (error) {
      console.error('Error updating card:', error);
      console.error('Error details:', JSON.stringify(error));
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating card:', error);
    console.error('Error stacktrace:', (error as Error).stack);
    throw error;
  }
};

/**
 * Insère une nouvelle carte dans la base de données.
 * @param card Objet carte à insérer
 * @returns La carte insérée avec son identifiant
 */
export const insertCard = async (card: Card) => {
  // Supprimer la propriété tags qui n'existe pas dans la table "cards"
  const { id, tags, ...cardWithoutIdAndTags } = card;
  
  const { data, error } = await supabase
    .from('cards')
    .insert(cardWithoutIdAndTags)
    .select() // Make sure to add .select() to return the inserted data
    .single();
    
  if (error) {
    console.error('Error inserting card:', error);
    throw error;
  }
  
  return data;
};

