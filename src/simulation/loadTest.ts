import { simulateGame } from './gameSimulator';

import type { Difficulty } from './aiAgent';

export interface LoadTestOptions {
  iterations: number;
  deckId: string;
  opponentDeckId: string;
  difficulty?: Difficulty;
}

export interface LoadTestResult {
  durationMs: number;
}

/**
 * Exécute plusieurs simulations pour tester les performances du moteur.
 * @param options Paramètres du test de charge
 * @returns Durée totale en millisecondes
 */
export async function runLoadTest(options: LoadTestOptions): Promise<LoadTestResult> {
  const { iterations, deckId, opponentDeckId, difficulty } = options;
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await simulateGame({ deckId, opponentDeckId, simulationType: 'performance', difficulty });
  }
  const durationMs = Date.now() - start;
  return { durationMs };
}
