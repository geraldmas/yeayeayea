import { supabase } from './supabaseClient';
import { Card, Spell, Tag, SpellEffect, Alteration } from '../types';

interface OldCard {
  spells: Spell[];
  talent?: Spell;
  tags: Tag[];
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
        for (const spell of oldCard.spells) {
          const { data: spellData, error: spellError } = await supabase
            .from('spells')
            .insert({
              name: spell.name,
              description: spell.description,
              power: spell.power,
              cost: spell.cost,
              range_min: spell.range_min || 0,
              range_max: spell.range_max || 0,
              effects: spell.effects
            })
            .select()
            .single();
          if (spellError) throw spellError;

          // Mise à jour des références de sorts dans la carte
          await supabase
            .from('cards')
            .update({
              spells: [...(card.spells || []), spellData.id]
            })
            .eq('id', card.id);
        }

        // Migrer le talent si présent
        if (oldCard.talent) {
          const { data: talentData, error: talentError } = await supabase
            .from('spells')
            .insert({
              name: oldCard.talent.name,
              description: oldCard.talent.description,
              power: oldCard.talent.power,
              cost: oldCard.talent.cost,
              range_min: oldCard.talent.range_min || 0,
              range_max: oldCard.talent.range_max || 0,
              effects: oldCard.talent.effects
            })
            .select()
            .single();
          if (talentError) throw talentError;

          await supabase
            .from('cards')
            .update({
              talent: talentData.id
            })
            .eq('id', card.id);
        }

        // Migrer les tags
        for (const tag of oldCard.tags) {
          const { data: tagData, error: tagError } = await supabase
            .from('tags')
            .insert({
              name: tag.name,
              passive_effect: tag.passive_effect
            })
            .select()
            .single();
          if (tagError) throw tagError;

          await supabase
            .from('cards')
            .update({
              tags: [...(card.tags || []), tagData.id]
            })
            .eq('id', card.id);
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