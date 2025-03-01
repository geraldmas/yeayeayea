import { Card, Spell, Tag } from '../types';
import { Json } from '../types/database.types';
import { spellService, tagService } from './dataService';

export const validateCard = async (card: Card): Promise<string[]> => {
  const errors: string[] = [];

  if (!card.name) errors.push('Le nom est requis');
  if (!card.type) errors.push('Le type est requis');
  if (!card.rarity) errors.push('La rareté est requise');
  if (typeof card.health !== 'number') errors.push('Les points de vie doivent être un nombre');

  // Load and validate spells
  if (card.spells?.length > 0) {
    try {
      const spells = await spellService.getByIds(card.spells as string[]);
      spells.forEach((spell, index) => {
        const spellErrors = validateSpell(spell);
        spellErrors.forEach(error => errors.push(`Sort #${index + 1}: ${error}`));
      });
    } catch (error) {
      errors.push('Erreur lors de la validation des sorts');
    }
  }

  // Validate talent if present
  if (card.talent) {
    try {
      const talent = await spellService.getById(card.talent as string);
      if (talent) {
        const talentErrors = validateSpell(talent);
        talentErrors.forEach(error => errors.push(`Talent: ${error}`));
      } else {
        errors.push('Talent introuvable');
      }
    } catch (error) {
      errors.push('Erreur lors de la validation du talent');
    }
  }

  // Load and validate tags
  if (card.tags?.length > 0) {
    try {
      const tags = await tagService.getByIds(card.tags as string[]);
      tags.forEach((tag, index) => {
        const tagErrors = validateTag(tag);
        tagErrors.forEach(error => errors.push(`Tag #${index + 1}: ${error}`));
      });
    } catch (error) {
      errors.push('Erreur lors de la validation des tags');
    }
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