export interface Card {
  id: number;
  name: string;
  type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
  rarity: Rarity;
  description: string;
  image: string;
  passive_effect: string;
  properties: {
    health?: number;
    [key: string]: any;
  };
  is_wip: boolean;
  is_crap: boolean;
  summon_cost: number;
  tags?: Array<{
    id: number;
    name: string;
    passive_effect: string | null;
  }>;
}

// Version frontend de la carte avec les propriétés en camelCase
export interface CardFrontend extends Omit<Card, 
  'passive_effect' | 
  'summon_cost' | 
  'is_wip' | 
  'is_crap'
> {
  passiveEffect: string;
  summonCost: number;
  isWIP: boolean;
  isCrap: boolean;
  spells?: Spell[];
}

export type Rarity = 'gros_bodycount' | 'interessant' | 'banger' | 'cheate';

export interface Booster {
  id: string;
  name: string;
  cards: Card[];
}

export type SpellEffectType = 
  | 'damage' 
  | 'heal' 
  | 'buff' 
  | 'debuff' 
  | 'status'
  | 'draw'
  | 'resource'
  | 'add_tag'
  | 'multiply_damage'
  | 'shield'
  | 'apply_alteration';

export interface SpellEffect {
  type: SpellEffectType;
  value: number;
  duration?: number;
  conditions?: {
    type: string;
    value: number;
  };
  target_type?: 'self' | 'opponent' | 'all' | 'tagged';
  targetType?: 'self' | 'opponent' | 'all' | 'tagged'; // Pour la rétrocompatibilité
  is_percentage?: boolean;
  alteration?: number;
  chance?: number;
  tag?: string;
  tagTarget?: string; // Pour les effets add_tag
  color?: string;
}

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
}

export interface Tag {
  id: number;
  name: string;
  passive_effect: string | null;
}

export interface Alteration {
  id?: number;
  name: string;
  description: string;
  type: 'buff' | 'debuff' | 'status' | 'other';
  duration?: number;
  stackable: boolean;
  unique_effect: boolean;
  icon?: string;
  effect: AlterationEffect;
  color?: string;
}

export interface AlterationEffect {
  action?: string;
  conditions?: {
    type: 'chance' | 'state';
    value: number;
    tag?: string;
  };
  [key: string]: any;
}

export interface User {
  id: string;
  username: string;
  is_admin: boolean;
  token: string;
}

export interface LoadedTagsMap {
  [cardId: number]: { id: number; name: string; passive_effect: string | null }[];
}

export interface LoadedSpellsMap {
  [cardId: number]: { id: number; name: string; description: string | null; power: number; cost: number | null; range_min: number | null; range_max: number | null; effects: any[]; is_value_percentage: boolean }[];
} 