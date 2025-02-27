import { Card, Spell, SpellEffect, Tag } from '../types';

export const validateCard = (card: Card): string[] => {
  const errors: string[] = [];

  // Validation des champs obligatoires
  if (!card.id) errors.push("L'ID de la carte est obligatoire");
  if (!card.name) errors.push("Le nom de la carte est obligatoire");
  if (!card.type) errors.push("Le type de la carte est obligatoire");
  if (card.health < 0) errors.push("Les points de vie ne peuvent pas être négatifs");

  // Validation des sorts
  card.spells.forEach((spell, index) => {
    const spellErrors = validateSpell(spell);
    spellErrors.forEach(error => errors.push(`Sort #${index + 1}: ${error}`));
  });

  // Validation du talent si présent
  if (card.talent) {
    const talentErrors = validateSpell(card.talent);
    talentErrors.forEach(error => errors.push(`Talent: ${error}`));
  }

  // Validation des tags
  card.tags.forEach((tag, index) => {
    const tagErrors = validateTag(tag);
    tagErrors.forEach(error => errors.push(`Tag #${index + 1}: ${error}`));
  });

  return errors;
};

export const validateSpell = (spell: Spell): string[] => {
  const errors: string[] = [];

  // Validation des champs obligatoires
  if (!spell.name) errors.push("Le nom du sort est obligatoire");
  if (spell.power < 0) errors.push("La puissance ne peut pas être négative");
  if (spell.cost !== undefined && spell.cost < 0) errors.push("Le coût ne peut pas être négatif");

  // Validation de la portée
  if (spell.range) {
    if (spell.range.min < 0) errors.push("La portée minimale ne peut pas être négative");
    if (spell.range.max < spell.range.min) errors.push("La portée maximale doit être supérieure ou égale à la portée minimale");
  }

  // Validation des effets
  spell.effects.forEach((effect, index) => {
    const effectErrors = validateEffect(effect);
    effectErrors.forEach(error => errors.push(`Effet #${index + 1}: ${error}`));
  });

  return errors;
};

export const validateEffect = (effect: SpellEffect): string[] => {
  const errors: string[] = [];

  if (effect.chance !== undefined && (effect.chance < 0 || effect.chance > 100)) {
    errors.push("La chance doit être entre 0 et 100%");
  }

  if (effect.duration !== undefined && effect.duration < 0) {
    errors.push("La durée ne peut pas être négative");
  }

  if (effect.targetType === 'tagged' && !effect.tagTarget) {
    errors.push("Un tag cible doit être spécifié pour le type de cible 'tagged'");
  }

  return errors;
};

export const validateTag = (tag: Tag): string[] => {
  const errors: string[] = [];

  if (!tag.name) {
    errors.push("Le nom du tag est obligatoire");
  }

  return errors;
};

// Ajout d'une exportation vide pour s'assurer que le fichier est traité comme un module
export {};