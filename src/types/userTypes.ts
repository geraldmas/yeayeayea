import type { Json } from './database.types';

export interface UserSettings {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    language?: string;
    [key: string]: any;
}

export interface User {
    id: string;
    username: string;
    password_hash: string;
    experience_points: number;
    level: number;
    currency: number;
    settings: Json;
    created_at: string;
    last_login: string | null;
}

export interface CardInventoryItem {
    user_id: string;
    card_id: number;
    quantity: number;
    favorite: boolean;
    acquired_at: string;
}

export interface Deck {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface DeckCard {
    deck_id: string;
    card_id: number;
    quantity: number;
}

export interface Achievement {
    id: number;
    name: string;
    description: string | null;
    points: number;
    icon_url: string | null;
}

export interface UserAchievement {
    user_id: string;
    achievement_id: number;
    unlocked_at: string;
}

export interface GameSave {
    id: number;
    user_id: string;
    state: Json;
    history: Json;
    created_at: string;
    updated_at: string;
}
