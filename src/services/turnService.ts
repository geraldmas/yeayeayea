import { GameState, Player } from '../types';
import { MotivationService } from './motivationService';

/**
 * Service pour la gestion des tours de jeu
 */
export class TurnService {
  /**
   * Initialise un nouvel état de jeu
   * @param players Les joueurs de la partie
   * @returns Un nouvel état de jeu
   */
  public static initializeGameState(players: Player[]): GameState {
    // Initialiser l'état de jeu
    return {
      players,
      currentTurn: 0,
      phase: 'main', // Phase initiale
      activePlayer: 0, // Le joueur 0 commence
      turnCount: 1
    };
  }
  
  /**
   * Passe au tour suivant et renouvelle les ressources
   * @param gameState L'état de jeu actuel
   * @returns L'état de jeu mis à jour
   */
  public static nextTurn(gameState: GameState): GameState {
    // Déterminer le prochain joueur actif
    const nextActivePlayer = (gameState.activePlayer + 1) % gameState.players.length;
    
    // Mettre à jour le compteur de tours si on revient au premier joueur
    const newTurnCount = nextActivePlayer === 0 
      ? gameState.turnCount + 1
      : gameState.turnCount;
    
    // Calculer le compte de tour global (combinaison du tour et du joueur actif)
    const newCurrentTurn = gameState.currentTurn + 1;
    
    // Renouveler la motivation du joueur qui va devenir actif
    const updatedPlayers = [...gameState.players];
    
    // Appliquer le renouvellement de motivation au joueur qui devient actif
    updatedPlayers[nextActivePlayer] = MotivationService.renewMotivation(
      updatedPlayers[nextActivePlayer]
    );
    
    // Retourner le nouvel état de jeu
    return {
      ...gameState,
      players: updatedPlayers,
      currentTurn: newCurrentTurn,
      phase: 'main', // Réinitialiser la phase au début du tour
      activePlayer: nextActivePlayer,
      turnCount: newTurnCount
    };
  }
  
  /**
   * Change la phase du tour actuel
   * @param gameState L'état de jeu actuel
   * @param newPhase La nouvelle phase
   * @returns L'état de jeu mis à jour
   */
  public static changePhase(
    gameState: GameState, 
    newPhase: 'draw' | 'main' | 'combat' | 'end'
  ): GameState {
    return {
      ...gameState,
      phase: newPhase
    };
  }
  
  /**
   * Vérifie si un joueur a suffisamment de motivation pour une action
   * @param gameState L'état de jeu actuel
   * @param playerId L'identifiant du joueur
   * @param cost Le coût en motivation
   * @returns true si le joueur a suffisamment de motivation, false sinon
   */
  public static hasEnoughMotivation(
    gameState: GameState,
    playerId: string,
    cost: number
  ): boolean {
    const player = gameState.players.find((p: Player) => p.id === playerId);
    if (!player) return false;
    
    return player.motivation >= cost;
  }
  
  /**
   * Consomme de la motivation pour une action
   * @param gameState L'état de jeu actuel
   * @param playerId L'identifiant du joueur
   * @param cost Le coût en motivation
   * @returns L'état de jeu mis à jour, ou null si la motivation est insuffisante
   */
  public static consumeMotivation(
    gameState: GameState,
    playerId: string,
    cost: number
  ): GameState | null {
    // Trouver l'index du joueur
    const playerIndex = gameState.players.findIndex((p: Player) => p.id === playerId);
    if (playerIndex === -1) return null;
    
    // Consommer la motivation
    const updatedPlayer = MotivationService.consumeMotivation(
      gameState.players[playerIndex],
      cost
    );
    
    if (!updatedPlayer) return null; // Motivation insuffisante
    
    // Mettre à jour l'état de jeu
    const updatedPlayers = [...gameState.players];
    updatedPlayers[playerIndex] = updatedPlayer;
    
    return {
      ...gameState,
      players: updatedPlayers
    };
  }
} 