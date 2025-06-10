import { simulateGame } from './gameSimulator';

export interface LoadTestOptions {
  iterations: number;
  deckId: string;
  opponentDeckId: string;
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
  const { iterations, deckId, opponentDeckId } = options;
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await simulateGame({ deckId, opponentDeckId, simulationType: 'performance' });
  }
  const durationMs = Date.now() - start;
  return { durationMs };
}
