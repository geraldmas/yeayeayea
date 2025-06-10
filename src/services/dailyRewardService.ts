import { supabase } from '../utils/supabaseClient';
import { userService } from '../utils/userService';

/**
 * @file dailyRewardService.ts
 * @description Gestion des récompenses quotidiennes pour encourager la connexion régulière des joueurs.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REWARD = 10; // Montant de charisme offert par défaut

export const dailyRewardService = {
  /**
   * Récupère la date de dernière récompense quotidienne d'un utilisateur.
   */
  async getLastRewardDate(userId: string): Promise<Date | null> {
    const { data, error } = await supabase
      .from('users')
      .select('properties')
      .eq('id', userId)
      .single();
    if (error) throw error;
    const last = data?.properties?.last_daily_reward;
    return last ? new Date(last) : null;
  },

  /**
   * Indique si l'utilisateur peut récupérer sa récompense quotidienne.
   */
  async canClaim(userId: string): Promise<boolean> {
    const last = await this.getLastRewardDate(userId);
    if (!last) return true;
    return Date.now() - last.getTime() >= ONE_DAY_MS;
  },

  /**
   * Attribue la récompense quotidienne si elle est disponible.
   * Retourne true en cas de succès.
   */
  async claim(userId: string, amount: number = DEFAULT_REWARD): Promise<boolean> {
    const eligible = await this.canClaim(userId);
    if (!eligible) return false;

    await userService.updateCurrency(userId, amount);

    const { data, error } = await supabase
      .from('users')
      .select('properties')
      .eq('id', userId)
      .single();
    if (error) throw error;

    const props = data?.properties || {};
    props.last_daily_reward = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('users')
      .update({ properties: props })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;
    return true;
  }
};
