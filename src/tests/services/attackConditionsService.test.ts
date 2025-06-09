import { describe, expect, test } from '@jest/globals';
import { AttackConditionsService, AttackTargetType } from '../../services/attackConditionsService';
import { v4 as uuidv4 } from 'uuid';
import { CardInstance } from '../../types/combat';
import { Player } from '../../types/player';

// Mocks
const mockCardInstance = (canAttackResult = true): CardInstance => ({
  instanceId: uuidv4(),
  cardDefinition: {
    id: 1,
    name: 'Test Card',
    type: 'personnage' as const,
    description: 'Test description',
    passive_effect: '',
    properties: { health: 10 },
    is_wip: false,
    is_crap: false,
    summon_cost: 5,
    rarity: 'banger' as const,
    image: ''
  },
  currentHealth: 10,
  maxHealth: 10,
  temporaryStats: { attack: 5, defense: 3 },
  activeAlterations: [],
  activeTags: [],
  availableSpells: [],
  isExhausted: false,
  isTapped: false,
  unableToAttack: false,
  counters: {},
  damageHistory: [],
  activeEffects: {},
  canAttack: jest.fn().mockReturnValue(canAttackResult),
  hasTag: jest.fn(),
  hasAlteration: jest.fn(),
  canUseSpell: jest.fn(),
  applyDamage: jest.fn(),
  heal: jest.fn(),
  addAlteration: jest.fn(),
  removeAlteration: jest.fn(),
  addTag: jest.fn(),
  removeTag: jest.fn(),
  resetForNextTurn: jest.fn(),
  recalculateTemporaryStats: jest.fn(),
  applyAlterationEffects: jest.fn()
} as unknown as CardInstance);

const mockPlayerBase = {
  id: uuidv4(),
  currentHealth: 100,
  maxHealth: 100,
  activeAlterations: [],
  applyDamage: jest.fn().mockImplementation((amount) => amount),
  heal: jest.fn(),
  addAlteration: jest.fn(),
  removeAlteration: jest.fn(),
  hasAlteration: jest.fn(),
  applyAlterationEffects: jest.fn(),
  resetForNextTurn: jest.fn(),
  isDestroyed: jest.fn().mockReturnValue(false)
};

const createMockPlayer = (characterCount: number): Player => {
  return {
    id: uuidv4(),
    name: 'Test Player',
    base: { ...mockPlayerBase },
    characters: Array(characterCount).fill(null).map(() => mockCardInstance()),
    objects: [],
    hand: [],
    deck: [],
    discard: [],
    motivation: 10,
    charisme: 20,
    getAllEntities: jest.fn(),
    hasLost: jest.fn().mockReturnValue(false)
  } as unknown as Player;
};

describe('AttackConditionsService', () => {
  describe('canAttack', () => {
    test('should return false if attacker cannot attack', () => {
      const attacker = mockCardInstance(false);
      const sourcePlayer = createMockPlayer(1);
      const targetPlayer = createMockPlayer(1);
      
      const result = AttackConditionsService.canAttack({
        attacker,
        sourcePlayer,
        targetPlayer,
        targetType: AttackTargetType.ENTITY
      });
      
      expect(result.canAttack).toBe(false);
      expect(result.reason).toBeDefined();
    });
    
    test('should check base attack conditions when targeting base', () => {
      const attacker = mockCardInstance(true);
      const sourcePlayer = createMockPlayer(1);
      const targetPlayer = createMockPlayer(1); // Avec un personnage
      
      const result = AttackConditionsService.canAttack({
        attacker,
        sourcePlayer,
        targetPlayer,
        targetType: AttackTargetType.BASE
      });
      
      expect(result.canAttack).toBe(false);
      expect(result.reason).toBeDefined();
    });
    
    test('should allow entity attack if attacker can attack', () => {
      const attacker = mockCardInstance(true);
      const sourcePlayer = createMockPlayer(1);
      const targetPlayer = createMockPlayer(1);
      
      const result = AttackConditionsService.canAttack({
        attacker,
        sourcePlayer,
        targetPlayer,
        targetType: AttackTargetType.ENTITY
      });
      
      expect(result.canAttack).toBe(true);
    });
  });
  
  describe('canAttackBase', () => {
    test('should return false if target player has characters', () => {
      const sourcePlayer = createMockPlayer(1);
      const targetPlayer = createMockPlayer(2); // Avec 2 personnages
      
      const result = AttackConditionsService.canAttackBase(
        sourcePlayer,
        targetPlayer
      );
      
      expect(result.canAttack).toBe(false);
      expect(result.reason).toContain("Impossible d'attaquer directement la base");
    });
    
    test('should return true if target player has no characters', () => {
      const sourcePlayer = createMockPlayer(1);
      const targetPlayer = createMockPlayer(0); // Sans personnage
      
      const result = AttackConditionsService.canAttackBase(
        sourcePlayer,
        targetPlayer
      );
      
      expect(result.canAttack).toBe(true);
    });
    
    test('should allow base attack if ignoreConditions is true, regardless of characters', () => {
      const sourcePlayer = createMockPlayer(1);
      const targetPlayer = createMockPlayer(3); // Avec 3 personnages
      
      const result = AttackConditionsService.canAttackBase(
        sourcePlayer,
        targetPlayer,
        true // ignoreConditions = true
      );
      
      expect(result.canAttack).toBe(true);
    });
  });
  
  describe('applyBaseAttackModifiers', () => {
    test('should divide damage by 2 and round down', () => {
      const attacker = mockCardInstance();
      const targetPlayer = createMockPlayer(0);
      
      const result = AttackConditionsService.applyBaseAttackModifiers(
        7, // Dégâts initiaux
        attacker,
        targetPlayer
      );
      
      expect(result).toBe(3); // 7 / 2 = 3.5, arrondi à 3
    });
    
    test('should return 0 for negative damage after modification', () => {
      const attacker = mockCardInstance();
      const targetPlayer = createMockPlayer(0);
      
      const result = AttackConditionsService.applyBaseAttackModifiers(
        -5, // Dégâts négatifs (situation anormale)
        attacker,
        targetPlayer
      );
      
      expect(result).toBe(0); // Doit être au minimum 0
    });
    
    test('should return 0 for 0 damage', () => {
      const attacker = mockCardInstance();
      const targetPlayer = createMockPlayer(0);
      
      const result = AttackConditionsService.applyBaseAttackModifiers(
        0,
        attacker,
        targetPlayer
      );
      
      expect(result).toBe(0);
    });
  });
}); 