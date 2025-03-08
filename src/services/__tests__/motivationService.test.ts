import { MotivationService } from '../motivationService';
import { Player, MotivationModifier } from '../../types';

// Mock pour gameConfigService
jest.mock('../../utils/dataService', () => ({
  gameConfigService: {
    getValue: jest.fn().mockResolvedValue(10),
    update: jest.fn().mockResolvedValue(true)
  }
}));

describe('MotivationService', () => {
  // Joueur de test
  const createTestPlayer = (): Player => ({
    id: 'player1',
    name: 'Joueur Test',
    activeCard: null,
    benchCards: [],
    inventory: [],
    hand: [],
    motivation: 10,
    baseMotivation: 10,
    motivationModifiers: [],
    movementPoints: 0,
    points: 0,
    effects: []
  });

  describe('initializePlayerMotivation', () => {
    it('devrait initialiser la motivation du joueur avec les valeurs par défaut', () => {
      const player = createTestPlayer();
      player.motivation = 0;
      player.baseMotivation = 0;
      
      const result = MotivationService.initializePlayerMotivation(player);
      
      expect(result.motivation).toBe(10);
      expect(result.baseMotivation).toBe(10);
      expect(result.motivationModifiers).toEqual([]);
    });
  });

  describe('renewMotivation', () => {
    it('devrait renouveler la motivation à la valeur de base sans modificateurs', () => {
      const player = createTestPlayer();
      player.motivation = 3; // Motivation actuelle réduite
      
      const result = MotivationService.renewMotivation(player);
      
      expect(result.motivation).toBe(10);
    });

    it('devrait appliquer les modificateurs absolus', () => {
      const player = createTestPlayer();
      player.motivation = 3;
      player.motivationModifiers = [
        { id: 'mod1', value: 2, isPercentage: false, source: 'Objet A' },
        { id: 'mod2', value: -1, isPercentage: false, source: 'Effet B' }
      ];
      
      const result = MotivationService.renewMotivation(player);
      
      // 10 (base) + 2 - 1 = 11
      expect(result.motivation).toBe(11);
    });

    it('devrait appliquer les modificateurs en pourcentage après les absolus', () => {
      const player = createTestPlayer();
      player.motivation = 3;
      player.motivationModifiers = [
        { id: 'mod1', value: 2, isPercentage: false, source: 'Objet A' },
        { id: 'mod2', value: 20, isPercentage: true, source: 'Effet B' }
      ];
      
      const result = MotivationService.renewMotivation(player);
      
      // (10 (base) + 2) * 1.2 = 14.4, arrondi à 14
      expect(result.motivation).toBe(14);
    });

    it('devrait réduire la durée des modificateurs temporaires', () => {
      const player = createTestPlayer();
      player.motivationModifiers = [
        { id: 'mod1', value: 2, isPercentage: false, source: 'Objet A', duration: 2 },
        { id: 'mod2', value: 20, isPercentage: true, source: 'Effet B', duration: 1 }
      ];
      
      const result = MotivationService.renewMotivation(player);
      
      expect(result.motivationModifiers).toHaveLength(2);
      expect(result.motivationModifiers[0].duration).toBe(1);
      expect(result.motivationModifiers[1].duration).toBe(0);
    });

    it('devrait supprimer les modificateurs expirés', () => {
      const player = createTestPlayer();
      player.motivationModifiers = [
        { id: 'mod1', value: 2, isPercentage: false, source: 'Objet A', duration: 0 },
        { id: 'mod2', value: 20, isPercentage: true, source: 'Effet B', duration: 1 }
      ];
      
      const result = MotivationService.renewMotivation(player);
      
      expect(result.motivationModifiers).toHaveLength(1);
      expect(result.motivationModifiers[0].id).toBe('mod2');
    });
  });

  describe('addMotivationModifier', () => {
    it('devrait ajouter un nouveau modificateur à la liste', () => {
      const player = createTestPlayer();
      
      const result = MotivationService.addMotivationModifier(
        player, 
        5, 
        false, 
        'Test Modifier'
      );
      
      expect(result.motivationModifiers).toHaveLength(1);
      expect(result.motivationModifiers[0].value).toBe(5);
      expect(result.motivationModifiers[0].isPercentage).toBe(false);
      expect(result.motivationModifiers[0].source).toBe('Test Modifier');
      expect(result.motivationModifiers[0].duration).toBeUndefined();
    });

    it('devrait ajouter un modificateur avec durée', () => {
      const player = createTestPlayer();
      
      const result = MotivationService.addMotivationModifier(
        player, 
        10, 
        true, 
        'Test Modifier', 
        3
      );
      
      expect(result.motivationModifiers).toHaveLength(1);
      expect(result.motivationModifiers[0].value).toBe(10);
      expect(result.motivationModifiers[0].isPercentage).toBe(true);
      expect(result.motivationModifiers[0].source).toBe('Test Modifier');
      expect(result.motivationModifiers[0].duration).toBe(3);
    });
  });

  describe('removeMotivationModifier', () => {
    it('devrait supprimer un modificateur par son ID', () => {
      const player = createTestPlayer();
      player.motivationModifiers = [
        { id: 'mod1', value: 2, isPercentage: false, source: 'Objet A' },
        { id: 'mod2', value: 20, isPercentage: true, source: 'Effet B' }
      ];
      
      const result = MotivationService.removeMotivationModifier(player, 'mod1');
      
      expect(result.motivationModifiers).toHaveLength(1);
      expect(result.motivationModifiers[0].id).toBe('mod2');
    });

    it('ne devrait rien faire si l\'ID n\'existe pas', () => {
      const player = createTestPlayer();
      player.motivationModifiers = [
        { id: 'mod1', value: 2, isPercentage: false, source: 'Objet A' }
      ];
      
      const result = MotivationService.removeMotivationModifier(player, 'mod2');
      
      expect(result.motivationModifiers).toHaveLength(1);
      expect(result.motivationModifiers[0].id).toBe('mod1');
    });
  });

  describe('consumeMotivation', () => {
    it('devrait réduire la motivation du montant spécifié', () => {
      const player = createTestPlayer();
      player.motivation = 10;
      
      const result = MotivationService.consumeMotivation(player, 3);
      
      expect(result?.motivation).toBe(7);
    });

    it('devrait retourner null si la motivation est insuffisante', () => {
      const player = createTestPlayer();
      player.motivation = 5;
      
      const result = MotivationService.consumeMotivation(player, 10);
      
      expect(result).toBeNull();
    });
  });
}); 