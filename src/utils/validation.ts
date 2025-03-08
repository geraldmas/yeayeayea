import { Card, Spell, Tag, SpellEffect } from '../types';
import { Json } from '../types/database.types';
import { spellService, tagService, joinTableService } from './dataService';
import { supabase } from './supabaseClient';

/**
 * Valide une carte en fonction de son type et de ses propriétés
 * @param card La carte à valider
 * @returns Un tableau de messages d'erreur, vide si la carte est valide
 */
export const validateCard = async (card: Card): Promise<string[]> => {
  const errors: string[] = [];

  // Validations génériques pour toutes les cartes
  if (!card.name) errors.push('Le nom est requis');
  if (!card.type) errors.push('Le type est requis');
  if (!card.rarity) errors.push('La rareté est requise');
  if (card.summon_cost < 0) errors.push('Le coût d\'invocation ne peut pas être négatif');
  if (!card.properties || typeof card.properties !== 'object') errors.push('Les propriétés doivent être un objet JSON');

  // Validations spécifiques par type de carte
  switch (card.type) {
    case 'personnage':
      errors.push(...validatePersonnageCard(card));
      break;
    case 'lieu':
      errors.push(...validateLieuCard(card));
      break;
    case 'objet':
      errors.push(...validateObjetCard(card));
      break;
    case 'evenement':
      errors.push(...validateEvenementCard(card));
      break;
    case 'action':
      errors.push(...validateActionCard(card));
      break;
    default:
      errors.push('Type de carte invalide');
  }

  // Validation des relations (sorts et tags)
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

  // Validation des tags
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

/**
 * Valide une carte de type Personnage
 */
const validatePersonnageCard = (card: Card): string[] => {
  const errors: string[] = [];
  
  // Validation des points de vie
  if (!card.properties.health) {
    errors.push('Les points de vie sont requis pour un personnage');
  } else if (typeof card.properties.health !== 'number' || card.properties.health <= 0) {
    errors.push('Les points de vie doivent être un nombre positif');
  }

  // Validation du niveau (si présent)
  if (card.properties.level !== undefined) {
    if (typeof card.properties.level !== 'number' || card.properties.level < 1) {
      errors.push('Le niveau doit être un nombre positif à partir de 1');
    }
  }
  
  // Vérification de la cohérence des PV par rapport à la rareté
  if (card.properties.health) {
    switch (card.rarity) {
      case 'gros_bodycount':
        if (card.properties.health > 15) errors.push('Les PV sont trop élevés pour un personnage de rareté "gros_bodycount"');
        break;
      case 'interessant':
        if (card.properties.health > 25) errors.push('Les PV sont trop élevés pour un personnage de rareté "interessant"');
        break;
      case 'banger':
        if (card.properties.health > 35) errors.push('Les PV sont trop élevés pour un personnage de rareté "banger"');
        break;
      case 'cheate':
        if (card.properties.health > 50) errors.push('Les PV sont trop élevés même pour un personnage de rareté "cheate"');
        break;
    }
  }
  
  return errors;
};

/**
 * Valide une carte de type Lieu
 */
const validateLieuCard = (card: Card): string[] => {
  const errors: string[] = [];
  
  // Validation de la distribution initiale (si présente)
  if (card.properties.distribution_points !== undefined) {
    if (typeof card.properties.distribution_points !== 'number' || card.properties.distribution_points < 0) {
      errors.push('Les points de distribution doivent être un nombre positif ou nul');
    }
  }
  
  // Validation des propriétés spécifiques aux lieux
  if (card.properties.capacity !== undefined && 
      (typeof card.properties.capacity !== 'number' || card.properties.capacity < 1)) {
    errors.push('La capacité doit être un nombre positif');
  }
  
  return errors;
};

/**
 * Valide une carte de type Objet
 */
const validateObjetCard = (card: Card): string[] => {
  const errors: string[] = [];
  
  // Validation du slot d'équipement
  if (!card.properties.slot) {
    errors.push('L\'emplacement d\'équipement est requis pour un objet');
  } else if (typeof card.properties.slot !== 'string') {
    errors.push('L\'emplacement d\'équipement doit être une chaîne de caractères');
  }
  
  // Validation du prix de vente (si présent)
  if (card.properties.sell_value !== undefined) {
    if (typeof card.properties.sell_value !== 'number' || card.properties.sell_value < 0) {
      errors.push('La valeur de vente doit être un nombre positif ou nul');
    }
  }
  
  // Validation des bonus (s'ils sont présents)
  if (card.properties.bonuses) {
    if (typeof card.properties.bonuses !== 'object') {
      errors.push('Les bonus doivent être un objet');
    }
  }
  
  return errors;
};

/**
 * Valide une carte de type Evenement
 */
const validateEvenementCard = (card: Card): string[] => {
  const errors: string[] = [];
  
  // Validation de la durée (si présente)
  if (card.properties.duration !== undefined) {
    if (typeof card.properties.duration !== 'number' || card.properties.duration < 1) {
      errors.push('La durée doit être un nombre positif');
    }
  }
  
  // Validation de l'effet global (si présent)
  if (card.properties.global_effect && typeof card.properties.global_effect !== 'string') {
    errors.push('L\'effet global doit être une chaîne de caractères');
  }
  
  return errors;
};

/**
 * Valide une carte de type Action
 */
const validateActionCard = (card: Card): string[] => {
  const errors: string[] = [];
  
  // Validation du coût en motivation
  if (card.properties.motivation_cost === undefined) {
    errors.push('Le coût en motivation est requis pour une action');
  } else if (typeof card.properties.motivation_cost !== 'number' || card.properties.motivation_cost < 0) {
    errors.push('Le coût en motivation doit être un nombre positif ou nul');
  }
  
  // Validation de la puissance (si présente)
  if (card.properties.power !== undefined) {
    if (typeof card.properties.power !== 'number') {
      errors.push('La puissance doit être un nombre');
    }
  }
  
  return errors;
};

export const validateSpell = (spell: Spell): string[] => {
  const errors: string[] = [];

  if (!spell.name) errors.push('Le nom est requis');
  if (typeof spell.power !== 'number') errors.push('La puissance doit être un nombre');
  if (spell.cost !== null && typeof spell.cost !== 'number') errors.push('Le coût doit être un nombre');
  if (spell.cost !== null && spell.cost < 0) errors.push('Le coût ne peut pas être négatif');

  if (spell.effects) {
    spell.effects.forEach((effect, index) => {
      const effectErrors = validateSpellEffect(effect, index);
      errors.push(...effectErrors);
    });
  }

  return errors;
};

/**
 * Valide un effet de sort
 */
const validateSpellEffect = (effect: SpellEffect, index: number): string[] => {
  const errors: string[] = [];
  
  if (!effect.type) {
    errors.push(`Effet #${index + 1}: Le type est requis`);
  }
  
  if (typeof effect.value !== 'number') {
    errors.push(`Effet #${index + 1}: La valeur doit être un nombre`);
  }
  
  // Validations spécifiques selon le type d'effet
  switch (effect.type) {
    case 'add_tag':
      if (!effect.tagTarget) {
        errors.push(`Effet #${index + 1}: Un tag cible est requis pour l'effet add_tag`);
      }
      break;
      
    case 'apply_alteration':
      if (!effect.alteration) {
        errors.push(`Effet #${index + 1}: Une altération est requise pour l'effet apply_alteration`);
      }
      break;
      
    case 'damage':
    case 'heal':
    case 'buff':
    case 'debuff':
      if (effect.value <= 0) {
        errors.push(`Effet #${index + 1}: La valeur doit être positive pour l'effet ${effect.type}`);
      }
      break;
  }
  
  // Validation du type de cible
  const targetType = effect.target_type || effect.targetType;
  if (targetType && !['self', 'opponent', 'all', 'tagged'].includes(targetType)) {
    errors.push(`Effet #${index + 1}: Type de cible invalide`);
  }
  
  // Validation de la durée (si présente)
  if (effect.duration !== undefined && (typeof effect.duration !== 'number' || effect.duration < 1)) {
    errors.push(`Effet #${index + 1}: La durée doit être un nombre positif`);
  }
  
  // Validation de la chance (si présente)
  if (effect.chance !== undefined) {
    if (typeof effect.chance !== 'number' || effect.chance < 0 || effect.chance > 100) {
      errors.push(`Effet #${index + 1}: La chance doit être un nombre entre 0 et 100`);
    }
  }
  
  return errors;
};

export const validateTag = (tag: Tag): string[] => {
  const errors: string[] = [];

  if (!tag.name) errors.push('Le nom est requis');
  // Vérifier que le nom du tag est unique serait idéal, mais nécessiterait une requête à la base de données

  return errors;
};

// Fonctions utilitaires pour récupérer les relations de la carte
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