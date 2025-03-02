import { Card, Spell, Tag } from '../types';
import { Json } from '../types/database.types';
import { spellService, tagService, joinTableService } from './dataService';
import { supabase } from './supabaseClient';

export const validateCard = async (card: Card): Promise<string[]> => {
  const errors: string[] = [];

  if (!card.name) errors.push('Le nom est requis');
  if (!card.type) errors.push('Le type est requis');
  if (!card.rarity) errors.push('La rareté est requise');
  if (!card.properties || typeof card.properties !== 'object') errors.push('Les propriétés doivent être un objet JSON');

  // Load and validate spells
  try {
    const cardSpells = await getCardSpells(card.id);
    if (cardSpells.length > 0) {
      try {
        const spells = await spellService.getByIds(cardSpells.map((spell: { spell_id: number }) => spell.spell_id));
        spells.forEach((spell, index) => {
          const spellErrors = validateSpell(spell);
          spellErrors.forEach(error => errors.push(`Sort #${index + 1}: ${error}`));
        });
      } catch (error) {
        errors.push('Erreur lors de la validation des sorts');
      }
    }
  } catch (error) {
    console.warn('Impossible de charger les sorts de la carte, la table card_spells pourrait ne pas exister', error);
  }

  // Load and validate tags
  try {
    const cardTags = await getCardTags(card.id);
    if (cardTags.length > 0) {
      try {
        const tags = await tagService.getByIds(cardTags.map((tag: { tag_id: number }) => tag.tag_id));
        tags.forEach((tag, index) => {
          const tagErrors = validateTag(tag);
          tagErrors.forEach(error => errors.push(`Tag #${index + 1}: ${error}`));
        });
      } catch (error) {
        errors.push('Erreur lors de la validation des tags');
      }
    }
  } catch (error) {
    console.warn('Impossible de charger les tags de la carte, la table card_tags pourrait ne pas exister', error);
  }

  return errors;
};

export const validateSpell = (spell: Spell): string[] => {
  const errors: string[] = [];

  if (!spell.name) errors.push('Le nom est requis');
  if (typeof spell.power !== 'number') errors.push('La puissance doit être un nombre');
  if (spell.cost !== null && typeof spell.cost !== 'number') errors.push('Le coût doit être un nombre');

  if (spell.effects) {
    spell.effects.forEach((effect, index) => {
      if (!effect.type) errors.push(`Effet #${index + 1}: Le type est requis`);
      if (typeof effect.value !== 'number') errors.push(`Effet #${index + 1}: La valeur doit être un nombre`);
      if (effect.type === 'add_tag' && !effect.tagTarget) {
        errors.push(`Effet #${index + 1}: Un tag cible est requis pour l'effet add_tag`);
      }
      if (effect.type === 'apply_alteration' && !effect.alteration) {
        errors.push(`Effet #${index + 1}: Une altération est requise pour l'effet apply_alteration`);
      }
    });
  }

  return errors;
};

export const validateTag = (tag: Tag): string[] => {
  const errors: string[] = [];

  if (!tag.name) errors.push('Le nom est requis');

  return errors;
};

export const getCardTags = async (cardId: number) => {
  try {
    const { data, error } = await supabase
      .from('card_tags')
      .select('tag_id')
      .eq('card_id', cardId);
      
    if (error) {
      console.error('Error fetching card tags:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Fatal error fetching card tags:', error);
    return [];
  }
};

export const getCardSpells = async (cardId: number) => {
  try {
    const { data, error } = await supabase
      .from('card_spells')
      .select('spell_id')
      .eq('card_id', cardId);
      
    if (error) {
      console.error('Error fetching card spells:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Fatal error fetching card spells:', error);
    return [];
  }
};

// Extract tag IDs from CardTag objects
export const getCardTagIds = async (cardId: number): Promise<number[]> => {
  try {
    const tags = await getCardTags(cardId);
    return tags.map(tag => tag.tag_id);
  } catch (error) {
    console.warn('Error getting card tag IDs:', error);
    return [];
  }
};

// Extract spell IDs from CardSpell objects
export const getCardSpellIds = async (cardId: number): Promise<number[]> => {
  try {
    const spells = await getCardSpells(cardId);
    return spells.map(spell => spell.spell_id);
  } catch (error) {
    console.warn('Error getting card spell IDs:', error);
    return [];
  }
};