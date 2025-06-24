import { supabase } from '../utils/supabaseClient';
import { userService } from '../utils/userService';

export interface UserStats {
  user_id: string;
  wins: number;
  losses: number;
  card_usage: Record<string, number>;
}

const ACHIEVEMENT_THRESHOLDS = [
  { wins: 1, id: 1 },
  { wins: 10, id: 2 }
];

export const progressService = {
  async getStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return data as UserStats;
  },

  async recordMatch(userId: string, usedCards: number[], won: boolean): Promise<UserStats> {
    const current =
      (await this.getStats(userId)) || { user_id: userId, wins: 0, losses: 0, card_usage: {} };

    if (won) current.wins += 1;
    else current.losses += 1;

    for (const id of usedCards) {
      const key = id.toString();
      current.card_usage[key] = (current.card_usage[key] || 0) + 1;
    }

    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        wins: current.wins,
        losses: current.losses,
        card_usage: current.card_usage
      })
      .select()
      .single();

    if (error) throw error;

    await this.checkUnlocks(userId, data.wins);
    return data as UserStats;
  },

  async checkUnlocks(userId: string, wins: number): Promise<void> {
    for (const a of ACHIEVEMENT_THRESHOLDS) {
      if (wins >= a.wins) {
        await userService.unlockAchievement(userId, a.id);
      }
    }
  }
};
