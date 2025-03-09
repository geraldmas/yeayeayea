import { supabase } from './supabaseClient';
import type { User } from '../types/userTypes';

/**
 * @file adminService.ts
 * @description Service pour les fonctionnalités d'administration du jeu Yeayeayea
 * Ce module fournit des fonctions pour gérer les utilisateurs, leurs droits et leurs données
 * depuis une interface d'administration
 */

export const adminService = {
  /**
   * Récupère tous les utilisateurs du système
   * @returns Liste des utilisateurs triés par nom d'utilisateur
   * @throws Erreur en cas d'échec de la récupération
   */
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('username');

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère un utilisateur par son identifiant
   * @param userId - Identifiant de l'utilisateur à récupérer
   * @returns Données de l'utilisateur
   * @throws Erreur si l'utilisateur n'existe pas ou en cas d'échec de la récupération
   */
  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Crée un nouvel utilisateur avec les droits spécifiés
   * @param userData - Objet contenant les données du nouvel utilisateur
   * @param userData.username - Nom d'utilisateur
   * @param userData.password - Mot de passe (devrait être hashé en production)
   * @param userData.isAdmin - Indique si l'utilisateur est un administrateur
   * @param userData.experience_points - Points d'expérience initiaux
   * @param userData.level - Niveau initial
   * @param userData.currency - Monnaie initiale
   * @returns L'utilisateur créé
   * @throws Erreur en cas d'échec de la création
   */
  async createUser(userData: {
    username: string;
    password: string;
    isAdmin?: boolean;
    experience_points?: number;
    level?: number;
    currency?: number;
  }) {
    const { isAdmin, password, ...otherData } = userData;
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...otherData,
        password_hash: password, // En production, cette valeur devrait être hashée
        experience_points: userData.experience_points || 0,
        level: userData.level || 1,
        currency: userData.currency || 0,
        settings: {},
        is_admin: isAdmin || false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Met à jour un utilisateur existant
   * @param userId - Identifiant de l'utilisateur à mettre à jour
   * @param updates - Objet contenant les champs à mettre à jour
   * @param updates.username - Nouveau nom d'utilisateur
   * @param updates.password - Nouveau mot de passe (devrait être hashé en production)
   * @param updates.isAdmin - Nouveau statut administrateur
   * @param updates.experience_points - Nouveaux points d'expérience
   * @param updates.level - Nouveau niveau
   * @param updates.currency - Nouvelle quantité de monnaie
   * @returns L'utilisateur mis à jour
   * @throws Erreur en cas d'échec de la mise à jour
   */
  async updateUser(userId: string, updates: {
    username?: string;
    password?: string;
    isAdmin?: boolean;
    experience_points?: number;
    level?: number;
    currency?: number;
  }) {
    const { isAdmin, password, ...otherUpdates } = updates;
    
    // Préparer les données à mettre à jour
    const updateData: any = { ...otherUpdates };
    
    // Si un nouveau mot de passe est fourni
    if (password) {
      updateData.password_hash = password; // En production, cette valeur devrait être hashée
    }
    
    // Mettre à jour le statut admin si fourni
    if (isAdmin !== undefined) {
      updateData.is_admin = isAdmin;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprime un utilisateur
   */
  async deleteUser(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return true;
  },

  /**
   * Met à jour le statut d'administrateur d'un utilisateur
   */
  async setAdminStatus(userId: string, isAdmin: boolean) {
    const { data, error } = await supabase
      .from('users')
      .update({
        is_admin: isAdmin
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 