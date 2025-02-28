export interface Spell {
    name: string;
    description: string;
    power: number;
    range?: { min: number, max: number }; // For targeting based on distance
    effects: SpellEffect[];
    cost?: number; // Action points cost
}

export interface SpellEffect {
    type: 'damage' | 'heal' | 'status' | 'draw' | 'poison' | 'resource' | 'special';
    value: number; // Amount or percentage
    targetType?: 'self' | 'opponent' | 'all' | 'tagged'; // Who is affected
    tagTarget?: string; // For effects that target specific tags
    chance?: number; // For probabilistic effects
    duration?: number; // For effects that last multiple turns
}

export interface Tag {
    name: string;
    passiveEffect: string;
}

export type Rarity = 'gros_bodycount' | 'interessant' | 'banger' | 'cheate';

export interface Card {
    id: string;
    name: string;
    description: string;
    image: string;
    spells: Spell[];
    passiveEffect?: string;
    health: number;
    tags: Tag[];
    type: 'personnage' | 'objet' | 'evenement' | 'lieu';
    rarity: Rarity;
    isEX?: boolean; // EX cards are worth 2 points
    talent?: Spell; // Special ability usable from bench
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