import type { Json } from './database.types';

export type { Json } from './database.types';

export interface Spell {
    id: string;
    name: string;
    description: string | null;
    power: number;
    cost: number | null;
    range_min: number | null;
    range_max: number | null;
    effects: SpellEffect[];
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
        tag?: string;
    };
    multiplier?: {
        value: number;
        condition?: {
            type: 'target_has_tag' | 'target_missing_tag';
            tag: string;
        };
    };
    alteration?: string;
}

export interface Alteration {
    id: string;
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
    id: string;
    name: string;
    passive_effect: string | null;
    created_at?: string;
    updated_at?: string;
}

export type Rarity = 'gros_bodycount' | 'interessant' | 'banger' | 'cheate';

export interface Card {
    id: string;
    name: string;
    description: string;
    image: string;
    spells: Json[]; // IDs des sorts
    passiveEffect?: string;
    health: number;
    tags: Json[]; // IDs des tags
    type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
    rarity: Rarity;
    isEX?: boolean; // EX cards are worth 2 points
    talent?: Json; // ID du sort talent
    position?: 'active' | 'bench' | 'hand' | 'inventory';
    isWIP: boolean; // Nouvelle propriété
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
    type: string;
    value: number;
    duration: number;
    source: string;
}

export interface GameState {
    players: Record<string, Player>;
    currentTurn: string; // Player ID
    distance: number;
    turnNumber: number;
    log: GameEvent[]; // Record of game actions
}

export interface GameEvent {
    type: string;
    playerId: string;
    targetId?: string;
    cardId?: string;
    value?: number;
    message: string;
}