import { TurnService } from '../turnService';
import { MotivationService } from '../motivationService';
import type { GameState, Player } from '../../types/index';

// Mock du service de motivation
jest.mock('../motivationService', () => ({
  MotivationService: {
    renewMotivation: jest.fn((player) => ({
      ...player,
      motivation: 10 // Valeur de test
    })),
    consumeMotivation: jest.fn().mockImplementation((player, amount) => {
      if (player.motivation < amount) {
        return null;
      }
      return {
        ...player,
        motivation: player.motivation - amount
      };
    })
  }
}));

describe('TurnService', () => {
  // Joueurs de test
  const createTestPlayers = (): Player[] => [
    {
      id: 'player1',
      name: 'Joueur 1',
      activeCard: null,
      benchCards: [],
      inventory: [],
      hand: [],
      motivation: 5,
      baseMotivation: 10,
      motivationModifiers: [],
      movementPoints: 0,
      points: 0,
      effects: []
    },
    {
      id: 'player2',
      name: 'Joueur 2',
      activeCard: null,
      benchCards: [],
      inventory: [],
      hand: [],
      motivation: 3,
      baseMotivation: 10,
      motivationModifiers: [],
      movementPoints: 0,
      points: 0,
      effects: []
    }
  ];

  // État de jeu de test
  const createTestGameState = (): GameState => ({
    players: createTestPlayers(),
    currentTurn: 0,
    phase: 'main',
    activePlayer: 0,
    turnCount: 1
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeGameState', () => {
    it('devrait initialiser un nouvel état de jeu avec les valeurs par défaut', () => {
      const players = createTestPlayers();
      
      const result = TurnService.initializeGameState(players);
      
      expect(result.players).toBe(players);
      expect(result.currentTurn).toBe(0);
      expect(result.phase).toBe('main');
      expect(result.activePlayer).toBe(0);
      expect(result.turnCount).toBe(1);
    });
  });

  describe('nextTurn', () => {
    it('devrait passer au joueur suivant et renouveler sa motivation', () => {
      const gameState = createTestGameState();
      
      const result = TurnService.nextTurn(gameState);
      
      expect(result.activePlayer).toBe(1);
      expect(result.currentTurn).toBe(1);
      expect(result.turnCount).toBe(1);
      expect(result.phase).toBe('main');
      
      // Vérifier que la motivation a été renouvelée
      expect(MotivationService.renewMotivation).toHaveBeenCalledWith(gameState.players[1]);
    });

    it('devrait revenir au premier joueur et incrémenter le compteur de tours', () => {
      const gameState = createTestGameState();
      gameState.activePlayer = 1;
      
      const result = TurnService.nextTurn(gameState);
      
      expect(result.activePlayer).toBe(0);
      expect(result.currentTurn).toBe(1);
      expect(result.turnCount).toBe(2);
      
      // Vérifier que la motivation a été renouvelée
      expect(MotivationService.renewMotivation).toHaveBeenCalledWith(gameState.players[0]);
    });
  });

  describe('changePhase', () => {
    it('devrait changer la phase du tour', () => {
      const gameState = createTestGameState();
      
      const result = TurnService.changePhase(gameState, 'combat');
      
      expect(result.phase).toBe('combat');
      expect(result.activePlayer).toBe(gameState.activePlayer);
      expect(result.currentTurn).toBe(gameState.currentTurn);
      expect(result.turnCount).toBe(gameState.turnCount);
    });
  });

  describe('hasEnoughMotivation', () => {
    it('devrait retourner true si le joueur a suffisamment de motivation', () => {
      const gameState = createTestGameState();
      
      const result = TurnService.hasEnoughMotivation(gameState, 'player1', 3);
      
      expect(result).toBe(true);
    });

    it('devrait retourner false si le joueur n\'a pas suffisamment de motivation', () => {
      const gameState = createTestGameState();
      
      const result = TurnService.hasEnoughMotivation(gameState, 'player1', 10);
      
      expect(result).toBe(false);
    });

    it('devrait retourner false si le joueur n\'existe pas', () => {
      const gameState = createTestGameState();
      
      const result = TurnService.hasEnoughMotivation(gameState, 'player3', 3);
      
      expect(result).toBe(false);
    });
  });

  describe('consumeMotivation', () => {
    it('devrait consommer la motivation du joueur', () => {
      const gameState = createTestGameState();
      
      const result = TurnService.consumeMotivation(gameState, 'player1', 3);
      
      expect(result).not.toBeNull();
      expect(result?.players[0].motivation).toBe(2); // 5 - 3 = 2
      expect(MotivationService.consumeMotivation).toHaveBeenCalledWith(gameState.players[0], 3);
    });

    it('devrait retourner null si le joueur n\'a pas assez de motivation', () => {
      const gameState = createTestGameState();
      
      // Configure le mock pour retourner null (déjà configuré dans le setup)
      
      const result = TurnService.consumeMotivation(gameState, 'player1', 10);
      
      expect(result).toBeNull();
      expect(MotivationService.consumeMotivation).toHaveBeenCalledWith(gameState.players[0], 10);
    });

    it('devrait retourner null si le joueur n\'existe pas', () => {
      const gameState = createTestGameState();
      
      const result = TurnService.consumeMotivation(gameState, 'player3', 3);
      
      expect(result).toBeNull();
      expect(MotivationService.consumeMotivation).not.toHaveBeenCalled();
    });
  });
}); 