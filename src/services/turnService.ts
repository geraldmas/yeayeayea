import type { GameState, Player } from '../types/index';
import { MotivationService } from './motivationService';

/**
 * @file turnService.ts
 * @description Service de gestion du cycle des tours pour le jeu Yeayeayea
 * 
 * Ce service gère le déroulement d'une partie en contrôlant :
 * - L'initialisation de l'état du jeu
 * - La progression des tours entre les joueurs
 * - Les changements de phase au sein d'un tour
 * - La gestion des ressources (motivation) entre les tours
 * 
 * Le cycle de jeu typique se déroule avec une alternance de tours entre les joueurs,
 * chaque tour étant divisé en plusieurs phases (pioche, principale, combat, fin).
 * Ce service coordonne ces transitions et assure le maintien d'un état de jeu cohérent.
 */

/**
 * Service pour la gestion des tours de jeu
 * Fournit des méthodes statiques pour manipuler l'état du jeu à chaque étape
 */
export class TurnService {
  /**
   * Initialise un nouvel état de jeu
   * Crée l'état initial d'une partie avec tous les joueurs et paramètres de départ
   * 
   * @param players - Les joueurs participant à la partie
   * @returns Un nouvel état de jeu prêt pour commencer la partie
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
   * Cette méthode termine le tour du joueur actif et prépare le suivant 
   * en réinitialisant la motivation et les ressources
   * 
   * @param gameState - L'état de jeu actuel
   * @returns L'état de jeu mis à jour avec le nouveau joueur actif
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
   * Les phases peuvent inclure : pioche (draw), principale (main), combat, fin (end)
   * Chaque phase peut avoir des règles et restrictions spécifiques
   * 
   * @param gameState - L'état de jeu actuel
   * @param newPhase - La nouvelle phase vers laquelle transitionner
   * @returns L'état de jeu mis à jour avec la nouvelle phase
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
   * Vérifie si un joueur a suffisamment de motivation pour exécuter une action
   * Cette vérification est utilisée avant d'autoriser des actions coûteuses
   * 
   * @param gameState - L'état de jeu actuel
   * @param playerId - L'identifiant unique du joueur à vérifier
   * @param cost - Le coût en motivation de l'action envisagée
   * @returns `true` si le joueur a suffisamment de motivation, `false` sinon
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
   * Utilise le MotivationService pour déduire le coût et mettre à jour l'état du joueur
   * Cette méthode est appelée lors de l'exécution d'actions comme jouer des cartes ou activer des effets
   * 
   * @param gameState - L'état de jeu actuel
   * @param playerId - L'identifiant unique du joueur qui effectue l'action
   * @param cost - Le coût en motivation de l'action à exécuter
   * @returns L'état de jeu mis à jour avec la motivation réduite, ou `null` si la motivation est insuffisante
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