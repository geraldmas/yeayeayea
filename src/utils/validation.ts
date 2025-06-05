import { Card, Spell, Tag } from '../types';
import { Json } from '../types/database.types';
import { spellService, tagService } from './dataService';
import { supabase } from './supabaseClient';

/**
 * @file validation.ts
 * @description Fonctions de validation pour les entités du jeu Yeayeayea
 * Ce module fournit des utilitaires pour valider les cartes, sorts, tags et 
 * vérifier la cohérence des données avant leur enregistrement en base
 */

/**
 * Valide une carte de manière asynchrone avec vérification en base de données
 * @param card - La carte à valider
 * @returns Un tableau de chaînes contenant les erreurs de validation, vide si aucune erreur
 */
export const validateCard = async (card: Card): Promise<string[]> => {
  const errors: string[] = [];

  // Validation de base
  if (!card.name) errors.push('Le nom est requis');
  if (!card.type) errors.push('Le type est requis');
  if (!card.rarity) errors.push('La rareté est requise');
  if (!card.properties || typeof card.properties !== 'object') errors.push('Les propriétés doivent être un objet JSON');

  // Validation spécifique au type de carte
  switch (card.type) {
    case 'personnage':
      if (card.properties.health === undefined) {
        errors.push('Les points de vie sont requis pour les cartes Personnage');
      } else if (card.properties.health <= 0) {
        errors.push('Les points de vie doivent être supérieurs à 0');
      }
      break;
    case 'objet':
      // Validation spécifique aux objets
      if (card.summon_cost < 0) {
        errors.push('Le coût d\'invocation ne peut pas être négatif pour les objets');
      }
      break;
    case 'lieu':
      // Validation spécifique aux lieux
      if (!card.passive_effect) {
        errors.push('Un effet passif est requis pour les cartes Lieu');
      }
      break;
    case 'action':
      if (card.summon_cost <= 0) {
        errors.push("Le coût d'invocation doit être positif pour les cartes action");
      }
      break;
    case 'evenement':
      if (!card.eventDuration) {
        errors.push("La durée d'\u00E9vénement est requise pour les cartes Evenement");
      } else if (!['instantanee', 'temporaire', 'permanente'].includes(card.eventDuration)) {
        errors.push("La durée d'\u00E9vénement doit être 'instantanee', 'temporaire' ou 'permanente'");
      }
      if (card.summon_cost <= 0) {
        errors.push("Le coût d'invocation doit être positif pour les cartes evenement");
      }
      break;
    default:
      errors.push('Type de carte non reconnu');
  }

  // Validation du coût en fonction de la rareté
  switch (card.rarity) {
    case 'gros_bodycount':
      if (card.summon_cost > 3) {
        errors.push('Le coût d\'invocation ne devrait pas dépasser 3 pour la rareté "gros_bodycount"');
      }
      break;
    case 'interessant':
      if (card.summon_cost > 5) {
        errors.push('Le coût d\'invocation ne devrait pas dépasser 5 pour la rareté "interessant"');
      }
      break;
    case 'banger':
      if (card.summon_cost > 8) {
        errors.push('Le coût d\'invocation ne devrait pas dépasser 8 pour la rareté "banger"');
      }
      break;
    case 'cheate':
      // Pas de limite stricte pour les cartes "cheate", mais on ajoute une vérification de cohérence
      if (card.summon_cost <= 0) {
        errors.push('Le coût d\'invocation doit être positif même pour les cartes "cheate"');
      }
      break;
    default:
      errors.push('Rareté non reconnue');
  }

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

/**
 * Valide une carte de manière synchrone, sans vérification en base de données
 * Utile pour les tests et les validations côté client sans accès à la base
 * @param card - La carte à valider
 * @returns Un tableau de chaînes contenant les erreurs de validation, vide si aucune erreur
 */
export const validateCardSync = (card: Card): string[] => {
  const errors: string[] = [];

  // Validation de base
  if (!card.name) errors.push('Le nom est requis');
  if (!card.type) errors.push('Le type est requis');
  if (!card.rarity) errors.push('La rareté est requise');
  if (!card.properties || typeof card.properties !== 'object') errors.push('Les propriétés doivent être un objet JSON');

  // Validation spécifique au type de carte
  switch (card.type) {
    case 'personnage':
      if (card.properties.health === undefined) {
        errors.push('Les points de vie sont requis pour les cartes Personnage');
      } else if (card.properties.health <= 0) {
        errors.push('Les points de vie doivent être supérieurs à 0');
      }
      break;
    case 'objet':
      // Validation spécifique aux objets
      if (card.summon_cost < 0) {
        errors.push('Le coût d\'invocation ne peut pas être négatif pour les objets');
      }
      break;
    case 'lieu':
      // Validation spécifique aux lieux
      if (!card.passive_effect) {
        errors.push('Un effet passif est requis pour les cartes Lieu');
      }
      break;
    case 'action':
      if (card.summon_cost <= 0) {
        errors.push("Le coût d'invocation doit être positif pour les cartes action");
      }
      break;
    case 'evenement':
      if (!card.eventDuration) {
        errors.push("La durée d'\u00E9vénement est requise pour les cartes Evenement");
      } else if (!['instantanee', 'temporaire', 'permanente'].includes(card.eventDuration)) {
        errors.push("La durée d'\u00E9vénement doit être 'instantanee', 'temporaire' ou 'permanente'");
      }
      if (card.summon_cost <= 0) {
        errors.push("Le coût d'invocation doit être positif pour les cartes evenement");
      }
      break;
    default:
      errors.push('Type de carte non reconnu');
  }

  // Validation du coût en fonction de la rareté
  switch (card.rarity) {
    case 'gros_bodycount':
      if (card.summon_cost > 3) {
        errors.push('Le coût d\'invocation ne devrait pas dépasser 3 pour la rareté "gros_bodycount"');
      }
      break;
    case 'interessant':
      if (card.summon_cost > 5) {
        errors.push('Le coût d\'invocation ne devrait pas dépasser 5 pour la rareté "interessant"');
      }
      break;
    case 'banger':
      if (card.summon_cost > 8) {
        errors.push('Le coût d\'invocation ne devrait pas dépasser 8 pour la rareté "banger"');
      }
      break;
    case 'cheate':
      // Pas de limite stricte pour les cartes "cheate", mais on ajoute une vérification de cohérence
      if (card.summon_cost <= 0) {
        errors.push('Le coût d\'invocation doit être positif même pour les cartes "cheate"');
      }
      break;
    default:
      errors.push('Rareté non reconnue');
  }

  return errors;
};

/**
 * Valide un sort
 * Vérifie les propriétés obligatoires et la cohérence des effets du sort
 * @param spell - Le sort à valider
 * @returns Un tableau de chaînes contenant les erreurs de validation, vide si aucune erreur
 */
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