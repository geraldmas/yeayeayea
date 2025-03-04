import { supabase } from './supabaseClient';  // Import the Supabase client

// Define type for card
export interface Card {
  id: string;
  // Add other card properties as needed
}

/**
 * Updates the spells associated with a card
 * @param cardId The ID of the card
 * @param spellIds Array of spell IDs to associate with the card
 */
export async function updateCardSpells(cardId: number, spellIds: number[]): Promise<void> {
  try {
    // First delete existing relationships
    await supabase
      .from('card_spells')
      .delete()
      .eq('card_id', cardId);

    // Insert new relationships
    if (spellIds.length > 0) {
      const relationships = spellIds.map(spellId => ({
        card_id: cardId,
        spell_id: spellId
      }));
      
      await supabase
        .from('card_spells')
        .insert(relationships);
    }
  } catch (error) {
    console.error('Error updating card spells:', error);
    throw error;
  }
}

/**
 * Updates the tags associated with a card
 * @param cardId The ID of the card
 * @param tagIds Array of tag IDs to associate with the card
 */
export async function updateCardTags(cardId: number, tagIds: number[]): Promise<void> {
  try {
    // First delete existing relationships
    await supabase
      .from('card_tags')
      .delete()
      .eq('card_id', cardId);

    // Insert new relationships
    if (tagIds.length > 0) {
      const relationships = tagIds.map(tagId => ({
        card_id: cardId,
        tag_id: tagId
      }));
      
      await supabase
        .from('card_tags')
        .insert(relationships);
    }
  } catch (error) {
    console.error('Error updating card tags:', error);
    throw error;
  }
}
