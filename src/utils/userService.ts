import { supabase } from './supabaseClient';
import type {
    User,
    CardInventoryItem,
    Deck,
    Achievement,
    UserAchievement
} from '../types/userTypes';

/**
 * @file userService.ts
 * @description Service de gestion des utilisateurs pour le jeu Yeayeayea
 * Fournit des fonctions pour l'authentification, la gestion des profils,
 * des inventaires, des decks et des réalisations des joueurs.
 */

/**
 * Service pour la gestion des utilisateurs et de leurs données
 */
export const userService = {
    /**
     * Inscrit un nouvel utilisateur
     * @param username - Nom d'utilisateur
     * @param password - Mot de passe (devrait être hashé dans une vraie application)
     * @returns Données du profil utilisateur créé
     * @throws Erreur en cas d'échec de la création
     */
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

    /**
     * Connecte un utilisateur existant
     * @param username - Nom d'utilisateur
     * @param password - Mot de passe
     * @returns Données du profil utilisateur
     * @throws Erreur si les identifiants sont incorrects
     */
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

    /**
     * Déconnecte l'utilisateur actuel
     * @throws Erreur en cas d'échec de la déconnexion
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Met à jour le profil d'un utilisateur
     * @param userId - Identifiant de l'utilisateur
     * @param updates - Objet partiel contenant les champs à mettre à jour
     * @returns Profil utilisateur mis à jour
     * @throws Erreur en cas d'échec de la mise à jour
     */
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

    /**
     * Récupère l'inventaire de cartes d'un utilisateur
     * @param userId - Identifiant de l'utilisateur
     * @returns Liste des cartes dans l'inventaire avec leurs détails
     * @throws Erreur en cas d'échec de la récupération
     */
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

    /**
     * Ajoute une carte à l'inventaire d'un utilisateur
     * @param item - Objet contenant les détails de l'élément d'inventaire à ajouter
     * @returns L'élément d'inventaire créé
     * @throws Erreur en cas d'échec de l'ajout
     */
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

    /**
     * Récupère les decks d'un utilisateur
     * @param userId - Identifiant de l'utilisateur
     * @returns Liste des decks de l'utilisateur avec leurs cartes
     * @throws Erreur en cas d'échec de la récupération
     */
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

    /**
     * Crée un nouveau deck pour un utilisateur
     * @param deck - Objet contenant les détails du deck à créer
     * @returns Le deck créé
     * @throws Erreur en cas d'échec de la création
     */
    async createDeck(deck: Omit<Deck, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('decks')
            .insert([deck])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Met à jour un deck existant
     * @param deckId - Identifiant du deck à mettre à jour
     * @param updates - Objet partiel contenant les champs à mettre à jour
     * @returns Le deck mis à jour
     * @throws Erreur en cas d'échec de la mise à jour
     */
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

    /**
     * Récupère les réalisations obtenues par un utilisateur
     * @param userId - Identifiant de l'utilisateur
     * @returns Liste des réalisations de l'utilisateur
     * @throws Erreur en cas d'échec de la récupération
     */
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