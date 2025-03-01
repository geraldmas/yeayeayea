import type { Json } from './database.types';

export type { Json } from './database.types';

export interface Spell {
  id: number;
  name: string;
  description: string | null;
  power: number;
  cost: number | null;
  range_min: number | null;
  range_max: number | null;
  effects: SpellEffect[];
  is_value_percentage: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SpellEffect {
  type: 'damage' | 'heal' | 'draw' | 'resource' | 'add_tag' | 'multiply_damage' | 'apply_alteration';
  value: number; 
  targetType?: 'self' | 'opponent' | 'all' | 'tagged';
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
}

export interface Alteration {
  id: number;
  name: string;
  description: string | null;
  effect: string;
  icon: string;
  duration: number | null;
  stackable: boolean;
  unique_effect: boolean;
  type: 'buff' | 'debuff' | 'status' | 'other';
  created_at?: string;
  updated_at?: string;
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
  image: string | null;
  spells: number[]; // IDs des sorts
  passiveEffect?: string;
  health: number;
  tags: number[]; // IDs des tags
  type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
  rarity: Rarity;
  position?: 'active' | 'bench' | 'hand' | 'inventory';
  isWIP: boolean; // Indique si la carte est en cours de travail
  isCrap: boolean; // Indique si la carte est à jeter
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
  actionPoints: number;
  movementPoints: number;
  points: number;
  effects: StatusEffect[];
}

export interface StatusEffect {
  id: string;
  type: string;
  value: number;
  duration: number;
  source: Card;
}

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