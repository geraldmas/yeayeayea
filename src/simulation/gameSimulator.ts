import { simulationResultsService } from '../utils/dataService';
import type { Database } from '../types/database.types';

export type SimulationType = 'training' | 'performance' | 'metrics';

export interface SimulationOptions {
  deckId: string;
  opponentDeckId: string;
  simulationType?: SimulationType;
}

export interface SimulationResult {
  winner: string;
  turns: number;
}

/**
 * Lance une partie automatique simplifiée entre deux decks.
 * Le vainqueur et le nombre de tours sont déterminés aléatoirement.
 * Le résultat est sauvegardé via simulationResultsService.create.
 */
export async function simulateGame({ deckId, opponentDeckId, simulationType = 'training' }: SimulationOptions): Promise<SimulationResult> {
  // Déterminer aléatoirement un nombre de tours et le gagnant
  const turns = Math.floor(Math.random() * 10) + 1;
  const winner = Math.random() > 0.5 ? deckId : opponentDeckId;

  // Sauvegarder le résultat de la simulation
  await simulationResultsService.create({
    simulation_type: simulationType,
    deck_id: deckId,
    opponent_deck_id: opponentDeckId,
    result: { won: winner === deckId, turns } as Database['public']['Tables']['simulation_results']['Row']['result'],
    metadata: {}
  });

  return { winner, turns };
}
