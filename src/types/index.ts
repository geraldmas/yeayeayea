import type { Json, Database } from './database.types';

/**
 * @file index.ts
 * @description Types principaux du jeu Yeayeayea
 * Ce fichier exporte les interfaces et types utilisés dans l'ensemble de l'application
 * pour représenter les cartes, sorts, altérations et autres entités du jeu
 */

export type { Json } from './database.types';
export type {
    User,
    UserSettings,
    CardInventoryItem,
    Deck,
    DeckCard,
    Achievement,
    UserAchievement
} from './userTypes';

/**
 * Interface représentant un sort avec ses caractéristiques et effets
 */
export interface Spell {
  id: number;
  name: string;
  description: string | null;
  cost: number | null;
  effects: SpellEffect[];
  is_value_percentage: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface représentant un effet de sort avec ses caractéristiques et conditions d'application
 */
export interface SpellEffect {
  type: 'damage' | 'heal' | 'draw' | 'resource' | 'add_tag' | 'multiply_damage' | 'apply_alteration';
  value: number; 
  targetType?: 'self' | 'opponent' | 'all' | 'tagged' | 'manual';
  tagTarget?: string;
  chance?: number;
  duration?: number;
  condition?: {
    type: 'has_tag' | 'missing_tag' | 'health_below' | 'health_above';
    value?: number;
    tag?: number;
  };
  multiplier?: {
    value: number;
    condition?: {
      type: 'target_has_tag' | 'target_missing_tag';
      tag: number;
    };
  };
  alteration?: number;
  manualTargetingCriteria?: {
    byTag?: number[];
    byRarity?: string[];
    byHealthPercent?: {
      min?: number;
      max?: number;
    };
    excludeTags?: number[];
  };
}

export interface AlterationEffect {
  action?: string;
  value?: number;
  description?: string;
  targetType?: 'self' | 'opponent' | 'all' | 'tagged';
  duration?: number;
  conditions?: {
    type: 'has_tag' | 'missing_tag' | 'health_below' | 'health_above' | 'chance';
    value?: number;
    tag?: string;
  };
}

export interface Alteration {
  id: number;
  name: string;
  description: string | null;
  effect: AlterationEffect;
  icon: string;
  duration: number | null;
  stackable: boolean;
  unique_effect: boolean;
  type: 'buff' | 'debuff' | 'status' | 'other';
  created_at?: string;
  updated_at?: string;
  color?: string;
}

export interface Tag {
  id: number;
  name: string;
  passive_effect: string | null;
  created_at?: string;
  updated_at?: string;
}

export type Rarity = 'gros_bodycount' | 'interessant' | 'banger' | 'cheate';

export interface Card {
  id: number;
  name: string;
  description: string | null;
  type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
  rarity: Rarity | string;
  /**
   * Pour les cartes "evenement", indique la durée de l’effet
   * - "instantanee" : effet appliqué une seule fois
   * - "temporaire" : effet qui dure quelques tours
   * - "permanente" : effet qui reste jusqu'à la fin de la partie
   */
  eventDuration?: 'instantanee' | 'temporaire' | 'permanente';
  properties: {
    health?: number;
    [key: string]: any;
  };
  summon_cost: number | null;
  image: string | null;
  passive_effect: string | null;
  is_wip: boolean;
  is_crap: boolean;
}

export interface CardFrontend extends Omit<Card, 'passive_effect' | 'is_wip' | 'is_crap' | 'summon_cost'> {
  passiveEffect: string | null;
  isWIP: boolean;
  isCrap: boolean;
  summonCost: number | null;
  spells?: number[];
  tags?: number[];
}

export interface CardSpell {
  id?: number;
  card_id: number;
  spell_id: number;
}

export interface CardTag {
  id?: number;
  card_id: number; 
  tag_id: number;
}

export interface Booster {
  id: string;
  name: string;
  cards: Card[];
}

export interface Player {
  id: string;
  name: string;
  activeCard: Card | null;
  benchCards: Card[];
  inventory: Card[];
  hand: Card[];
  motivation: number;
  baseMotivation: number;
  motivationModifiers: MotivationModifier[];
  movementPoints: number;
  points: number;
  effects: StatusEffect[];
  charisme?: number;
  baseCharisme?: number;
  maxCharisme?: number;
  charismeModifiers?: CharismeModifier[];
}

/**
 * Interface pour les modificateurs de motivation
 */
export interface MotivationModifier {
  id: string;
  value: number;
  isPercentage: boolean;
  source: string;
  duration?: number;
}

/**
 * Interface pour les modificateurs de charisme
 */
export interface CharismeModifier {
  id: string;
  value: number;
  isPercentage: boolean;
  source: string;
  duration?: number;
  type: 'generation' | 'stockage' | 'cout';
}

export interface StatusEffect {
  id: string;
  type: string;
  value: number;
  duration: number;
  source: Card;
}

/**
 * Interface représentant l'état du jeu
 */
export interface GameState {
  players: Player[];
  currentTurn: number;
  phase: 'draw' | 'main' | 'combat' | 'end';
  activePlayer: number;
  turnCount: number;
}

export interface GameEvent {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * Interface spécifique pour les cartes de type personnage
 * avec support pour les niveaux et les PV
 */
export interface CharacterCard extends Card {
  properties: {
    /** Points de vie actuels du personnage */
    health: number;
    
    /** Points de vie de base (utilisés pour calculer les PV max selon le niveau) */
    baseHealth: number;
    
    /** Valeur d'attaque de base */
    attack: number;
    
    /** Valeur de défense de base */
    defense: number;
    
    /** Niveau actuel du personnage (commence à 1) */
    level: number;
    
    /** Niveau maximum que le personnage peut atteindre */
    maxLevel: number;
    
    /** Points d'expérience actuels */
    xp: number;
    
    /** Points d'expérience nécessaires pour passer au niveau suivant */
    xpToNextLevel: number;

    /** Table d'apprentissage des sorts, définissant quel sort est appris à quel niveau */
    spell_learning_table?: SpellLearningEntry[];

    /** Sorts initiaux avec lesquels le personnage commence (optionnel, peut être dérivé de spell_learning_table au niveau 1) */
    initial_spells?: number[]; // Array of spell_ids
    
    /** Autres propriétés spécifiques au personnage */
    [key: string]: any;
  };
}

/**
 * Entrée dans la table d'apprentissage des sorts.
 */
export interface SpellLearningEntry {
  level_learned: number;
  spell_id: number;
}

/**
 * Version frontend de la carte personnage avec les propriétés en camelCase
 */
export interface CharacterCardFrontend extends CardFrontend {
  properties: {
    /** Points de vie actuels du personnage */
    health: number;
    
    /** Points de vie de base (utilisés pour calculer les PV max selon le niveau) */
    baseHealth: number;
    
    /** Valeur d'attaque de base */
    attack: number;
    
    /** Valeur de défense de base */
    defense: number;
    
    /** Niveau actuel du personnage (commence à 1) */
    level: number;
    
    /** Niveau maximum que le personnage peut atteindre */
    maxLevel: number;
    
    /** Points d'expérience actuels */
    xp: number;
    
    /** Points d'expérience nécessaires pour passer au niveau suivant */
    xpToNextLevel: number;

    /** Table d'apprentissage des sorts, définissant quel sort est appris à quel niveau */
    spell_learning_table?: SpellLearningEntry[];

    /** Sorts initiaux avec lesquels le personnage commence (optionnel, peut être dérivé de spell_learning_table au niveau 1) */
    initial_spells?: number[]; // Array of spell_ids
    
    /** Autres propriétés spécifiques au personnage */
    [key: string]: any;
  };
}
