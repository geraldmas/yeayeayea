import { supabase } from '../utils/supabaseClient';
import { Card } from '../types';

/**
 * Partial card data used for creation or update operations.
 */
export type PartialCardInput = Partial<Omit<Card, 'id'>> & {
  id?: number;
};

/**
 * Determine if a card has all mandatory fields filled.
 * Currently name, type and rarity are considered required.
 */
function isComplete(card: PartialCardInput): boolean {
  if (!card.name || !card.type || !card.rarity) return false;
  if (card.type === 'personnage' && (!card.properties || card.properties.health === undefined)) {
    return false;
  }
  return true;
}

/**
 * Normalize card fields for the database (snake_case).
 */
function formatForDB(card: PartialCardInput) {
  const { eventDuration, ...rest } = card;
  return { ...rest, event_duration: eventDuration };
}

export const cardCreationService = {
  /**
   * Create a new card in the database. Missing required fields mark the card as WIP.
   */
  async create(card: PartialCardInput): Promise<Card> {
    const complete = isComplete(card);
    const insertData = formatForDB({
      is_wip: complete ? card.is_wip ?? false : true,
      is_crap: card.is_crap ?? false,
      properties: card.properties || {},
      ...card,
    });
    const { data, error } = await supabase
      .from('cards')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    return { ...(data as any), eventDuration: (data as any).event_duration } as Card;
  },

  /**
   * Update an existing card. If required fields become missing, it stays flagged as WIP.
   */
  async update(id: number, updates: PartialCardInput): Promise<Card> {
    const complete = isComplete(updates);
    const updateData = formatForDB({
      ...updates,
      is_wip: complete ? updates.is_wip ?? false : true,
    });
    Object.keys(updateData).forEach((k) => (updateData as any)[k] === undefined && delete (updateData as any)[k]);
    const { data, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { ...(data as any), eventDuration: (data as any).event_duration } as Card;
  },
};

export default cardCreationService;
