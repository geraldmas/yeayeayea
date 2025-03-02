import { supabase } from './supabaseClient';
import { Card, Spell, Tag, SpellEffect, Alteration } from '../types';

interface OldCard {
  id: number;
  name: string;
  description: string | null;
  type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
  rarity: string;
  health: number;
  image: string | null;
  passive_effect: string | null;
  spells: number[];
  tags: number[];
  is_wip: boolean;
  is_crap: boolean;
  created_at?: string;
  updated_at?: string;
}

export const migrationService = {
  async migrateToNewSchema() {
    try {
      // 1. Créer les altérations de base
      const baseAlterations: Omit<Alteration, 'id'>[] = [
        {
          name: 'Poison',
          description: 'Inflige des dégâts continus chaque tour',
          effect: 'damage_over_time',
          icon: '☠️',
          stackable: true,
          unique_effect: false,
          type: 'debuff',
          duration: 3
        },
        {
          name: 'Confusion',
          description: 'Chance de rater son action',
          effect: 'miss_chance',
          icon: '💫',
          stackable: false,
          unique_effect: true,
          type: 'status',
          duration: 2
        },
        {
          name: 'Régénération',
          description: 'Récupère des PV chaque tour',
          effect: 'heal_over_time',
          icon: '💚',
          stackable: true,
          unique_effect: false,
          type: 'buff',
          duration: 3
        }
      ];

      // Créer les altérations
      for (const alteration of baseAlterations) {
        const { error } = await supabase
          .from('alterations')
          .insert(alteration);
        if (error) throw error;
      }

      // 2. Migrer les cartes
      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('*');
      if (cardsError) throw cardsError;

      for (const card of cards) {
        const oldCard = card as unknown as OldCard;
        
        // Migrer les sorts
        for (const spellId of oldCard.spells) {
          const { error: spellError } = await supabase
            .from('card_spells')
            .insert({ card_id: oldCard.id, spell_id: spellId });
          if (spellError) throw spellError;
        }

        // Migrer les tags
        for (const tagId of oldCard.tags) {
          const { error: tagError } = await supabase
            .from('card_tags')
            .insert({ card_id: oldCard.id, tag_id: tagId });
          if (tagError) throw tagError;
        }
      }

      // Convertir les anciens effets de statut en altérations
      const { data: allSpells, error: spellsError } = await supabase
        .from('spells')
        .select('*');
      if (spellsError) throw spellsError;

      for (const spell of allSpells) {
        const effects = spell.effects as unknown as { type: 'poison' | 'confusion' | SpellEffect['type']; value: number; }[];
        const updatedEffects = effects.map(effect => {
          const legacyType = effect.type as 'poison' | 'confusion' | SpellEffect['type'];
          if (legacyType === 'poison') {
            return {
              ...effect,
              type: 'apply_alteration' as const,
              alteration: 'poison'
            };
          }
          if (legacyType === 'confusion') {
            return {
              ...effect,
              type: 'apply_alteration' as const,
              alteration: 'confusion'
            };
          }
          return effect;
        });

        await supabase
          .from('spells')
          .update({ effects: updatedEffects })
          .eq('id', spell.id);
      }

      return { success: true };
    } catch (error) {
      console.error('Error during migration:', error);
      return { success: false, error };
    }
  }
};