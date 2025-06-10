import { simulateGame } from '../simulation/gameSimulator';

export interface DeckPair {
  deckId: string;
  opponentDeckId: string;
}

export interface TrainingOptions {
  deckPairs: DeckPair[];
  intervalMs?: number;
}

/**
 * Service d'entraînement de l'IA.
 * Lance régulièrement des simulations pour accumuler des métriques
 * et améliorer les stratégies de jeu.
 */
export const aiTrainingService = {
  _interval: null as NodeJS.Timeout | null,

  start({ deckPairs, intervalMs = 60000 }: TrainingOptions) {
    if (this._interval) return;
    this._interval = setInterval(async () => {
      for (const pair of deckPairs) {
        await simulateGame({
          deckId: pair.deckId,
          opponentDeckId: pair.opponentDeckId,
          simulationType: 'training'
        });
      }
    }, intervalMs);
  },

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  },

  isRunning(): boolean {
    return this._interval !== null;
  }
};
