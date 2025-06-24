import { simulationResultsService } from '../utils/dataService';
import type { Database } from '../types/database.types';
import { runAi, Difficulty } from './aiAgent';

export type SimulationType = 'training' | 'performance' | 'metrics';

export interface SimulationOptions {
  deckId: string;
  opponentDeckId: string;
  simulationType?: SimulationType;
  difficulty?: Difficulty;
}

export interface SimulationResult {
  winner: string;
  turns: number;
  log: string[];
}

/**
 * Lance une partie automatique simplifiée entre deux decks.
 * Le vainqueur et le nombre de tours sont déterminés aléatoirement.
 * Le résultat est sauvegardé via simulationResultsService.create.
 */
export async function simulateGame({ deckId, opponentDeckId, simulationType = 'training', difficulty = 'medium' }: SimulationOptions): Promise<SimulationResult> {
  // Déterminer aléatoirement un nombre de tours
  const turns = Math.floor(Math.random() * 10) + 1;

  // Probabilité de victoire du deck principal selon la difficulté
  let winChance = 0.5;
  if (difficulty === 'easy') winChance = 0.7;
  if (difficulty === 'hard') winChance = 0.3;

  const winner = Math.random() < winChance ? deckId : opponentDeckId;

  // Générer le feedback de l'IA
  const aiFeedback = runAi(turns, difficulty);

  // Sauvegarder le résultat de la simulation
  await simulationResultsService.create({
    simulation_type: simulationType,
    deck_id: deckId,
    opponent_deck_id: opponentDeckId,
    result: { won: winner === deckId, turns } as Database['public']['Tables']['simulation_results']['Row']['result'],
    metadata: { difficulty, actions: aiFeedback.actions }
  });

  return { winner, turns, log: aiFeedback.actions };
}
