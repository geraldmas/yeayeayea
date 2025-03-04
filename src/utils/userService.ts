import { supabase } from './supabaseClient';
import type {
    User,
    CardInventoryItem,
    Deck,
    Achievement,
    UserAchievement
} from '../types/userTypes';

export const userService = {
    // Authentification
    async signUp(username: string, password: string) {
        // Créer le profil utilisateur
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([
                {
                    username,
                    password_hash: password, // Note: Dans une vraie application, le mot de passe devrait être hashé
                    level: 1,
                    experience_points: 0,
                    currency: 0
                }
            ])
            .select()
            .single();

        if (userError) throw userError;
        return userData;
    },

    async signIn(username: string, password: string) {
        const { data, error } = await supabase
            .from('users')
            .select()
            .eq('username', username)
            .eq('password_hash', password) // Note: Dans une vraie application, on comparerait avec le hash
            .single();

        if (error) throw error;

        // Mettre à jour last_login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.id);

        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // Gestion du profil
    async updateProfile(userId: string, updates: Partial<User>) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Gestion de l'inventaire
    async getInventory(userId: string) {
        const { data, error } = await supabase
            .from('card_inventory')
            .select(`
                *,
                cards (*)
            `)
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    },

    async addToInventory(item: Omit<CardInventoryItem, 'acquired_at'>) {
        const { data, error } = await supabase
            .from('card_inventory')
            .upsert({
                ...item,
                acquired_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Gestion des decks
    async getDecks(userId: string) {
        const { data, error } = await supabase
            .from('decks')
            .select(`
                *,
                deck_cards (
                    *,
                    cards (*)
                )
            `)
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    },

    async createDeck(deck: Omit<Deck, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('decks')
            .insert([deck])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateDeck(deckId: string, updates: Partial<Deck>) {
        const { data, error } = await supabase
            .from('decks')
            .update(updates)
            .eq('id', deckId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Gestion des réalisations
    async getAchievements(userId: string) {
        const { data, error } = await supabase
            .from('user_achievements')
            .select(`
                *,
                achievements (*)
            `)
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    },

    async unlockAchievement(userId: string, achievementId: number) {
        const { data, error } = await supabase
            .from('user_achievements')
            .insert([
                {
                    user_id: userId,
                    achievement_id: achievementId,
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Statistiques et progression
    async addExperience(userId: string, amount: number) {
        const { data, error } = await supabase.rpc('add_experience', {
            user_id: userId,
            amount: amount
        });

        if (error) throw error;
        return data;
    },

    async updateCurrency(userId: string, amount: number) {
        const { data, error } = await supabase.rpc('update_currency', {
            user_id: userId,
            amount: amount
        });

        if (error) throw error;
        return data;
    }
}; 