import { supabase } from '../utils/supabaseClient';
import { userService } from '../utils/userService';
import { v4 as uuidv4 } from 'uuid';

/**
 * @file dailyChallengeService.ts
 * @description Gestion des défis quotidiens pour récompenser les joueurs actifs.
 */

interface DailyTask {
  id: string;
  description: string;
  done: boolean;
}

interface DailyChallenge {
  id: string;
  date: string;
  tasks: DailyTask[];
  reward: number;
  claimed: boolean;
}

const TASK_POOL = [
  'Jouer 3 cartes',
  'Gagner un combat',
  'Ouvrir un booster'
];

const DEFAULT_REWARD = 20;

const createChallenge = (): DailyChallenge => {
  return {
    id: uuidv4(),
    date: new Date().toISOString().slice(0, 10),
    tasks: TASK_POOL.map(desc => ({ id: uuidv4(), description: desc, done: false })),
    reward: DEFAULT_REWARD,
    claimed: false
  };
};

export const dailyChallengeService = {
  /**
   * Retourne le défi quotidien de l'utilisateur, en créant un nouveau défi si nécessaire.
   */
  async getChallenge(userId: string): Promise<DailyChallenge> {
    const { data, error } = await supabase
      .from('users')
      .select('properties')
      .eq('id', userId)
      .single();
    if (error) throw error;
    const props = data?.properties || {};
    let challenge: DailyChallenge | undefined = props.daily_challenge;
    const today = new Date().toISOString().slice(0, 10);
    if (!challenge || challenge.date !== today) {
      challenge = createChallenge();
      props.daily_challenge = challenge;
      await supabase.from('users').update({ properties: props }).eq('id', userId);
    }
    return challenge;
  },

  /**
   * Marque une tâche du défi comme complétée.
   */
  async completeTask(userId: string, taskId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('properties')
      .eq('id', userId)
      .single();
    if (error) throw error;
    const props = data?.properties || {};
    const challenge: DailyChallenge | undefined = props.daily_challenge;
    if (!challenge || challenge.claimed) return false;
    const task = challenge.tasks.find(t => t.id === taskId);
    if (!task || task.done) return false;
    task.done = true;
    props.daily_challenge = challenge;
    const { error: updateError } = await supabase
      .from('users')
      .update({ properties: props })
      .eq('id', userId)
      .select()
      .single();
    if (updateError) throw updateError;
    return true;
  },

  /**
   * Accorde la récompense du défi si toutes les tâches sont terminées.
   */
  async claimReward(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('properties')
      .eq('id', userId)
      .single();
    if (error) throw error;
    const props = data?.properties || {};
    const challenge: DailyChallenge | undefined = props.daily_challenge;
    if (!challenge || challenge.claimed) return false;
    if (!challenge.tasks.every(t => t.done)) return false;

    await userService.updateCurrency(userId, challenge.reward);
    challenge.claimed = true;
    props.daily_challenge = challenge;

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
