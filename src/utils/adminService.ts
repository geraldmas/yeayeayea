import { supabase } from './supabaseClient';
import type { User } from '../types/userTypes';

export const adminService = {
  /**
   * Récupère tous les utilisateurs
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
   * Récupère un utilisateur par son ID
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
   * Crée un nouvel utilisateur
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