/**
 * @file characterCardService.test.ts  
 * @description Tests pour le service de gestion des cartes personnage
 */

import { CharacterCardService, CharacterCardInstance } from '../../services/characterCardService';
import { CharacterCard } from '../../types/index';

// Mock des données pour les tests
const mockCharacterCard: CharacterCard = {
  id: 1,
  name: 'Test Character',
  description: 'A test character',
  type: 'personnage',
  rarity: 'banger',
  properties: {
    health: 100,
    baseHealth: 100,
    attack: 10,
    defense: 5,
    level: 1,
    maxLevel: 10,
    xp: 0,
    xpToNextLevel: 225
  },
  summon_cost: 50,
  image: 'test.png',
  passive_effect: null,
  is_wip: false,
  is_crap: false
};

describe('CharacterCardService', () => {
  let characterCardService: CharacterCardService;

  beforeEach(() => {
    characterCardService = new CharacterCardService();
  });

  describe('isValidCharacterCard', () => {
    it('should return true for valid character cards', () => {
      expect(characterCardService.isValidCharacterCard(mockCharacterCard)).toBe(true);
    });

    it('should return false for non-character cards', () => {
      const nonCharacterCard = { ...mockCharacterCard, type: 'objet' };
      expect(characterCardService.isValidCharacterCard(nonCharacterCard)).toBe(false);
    });

    it('should return false for cards without health property', () => {
      const cardWithoutHealth = {
        ...mockCharacterCard,
        properties: { 
          ...mockCharacterCard.properties,
          health: undefined 
        }
      };
      expect(characterCardService.isValidCharacterCard(cardWithoutHealth)).toBe(false);
    });
  });

  describe('toCharacterCard', () => {
    it('should convert a valid card to a CharacterCard', () => {
      const genericCard = {
        id: 2,
        name: 'Generic Card',
        description: 'A generic card',
        type: 'personnage',
        rarity: 'interessant',
        properties: {
          health: 80,
          baseHealth: undefined,
          attack: undefined,
          defense: undefined,
          level: undefined,
          maxLevel: undefined,
          xp: undefined,
          xpToNextLevel: undefined
        },
        summon_cost: 30,
        image: 'generic.png',
        passive_effect: null,
        is_wip: false,
        is_crap: false
      };

      const result = characterCardService.toCharacterCard(genericCard);
      
      expect(result).not.toBeNull();
      expect(result!.properties.baseHealth).toBe(80);
      expect(result!.properties.level).toBe(1);
      expect(result!.properties.maxLevel).toBe(10);
      expect(result!.properties.xp).toBe(0);
      expect(result!.properties.attack).toBe(1);
      expect(result!.properties.defense).toBe(0);
    });

    it('should return null for invalid cards', () => {
      const invalidCard = { ...mockCharacterCard, type: 'objet' };
      expect(characterCardService.toCharacterCard(invalidCard)).toBeNull();
    });
  });

  describe('calculateMaxHealthForLevel', () => {
    it('should calculate correct max health for level 1', () => {
      const baseHealth = 100;
      const level = 1;
      const result = characterCardService.calculateMaxHealthForLevel(baseHealth, level);
      expect(result).toBe(100); // Niveau 1, pas de bonus
    });

    it('should increase health with level progression', () => {
      const baseHealth = 100;
      const growthFactor = Math.max(5, baseHealth * 0.15); // = 15
      
      // Niveau 2: base + (2-1) * facteur = 100 + 15 = 115
      expect(characterCardService.calculateMaxHealthForLevel(baseHealth, 2)).toBe(115);
      
      // Niveau 5: base + (5-1) * facteur = 100 + 60 = 160
      expect(characterCardService.calculateMaxHealthForLevel(baseHealth, 5)).toBe(160);
      
      // Niveau 10: base + (10-1) * facteur = 100 + 135 = 235
      expect(characterCardService.calculateMaxHealthForLevel(baseHealth, 10)).toBe(235);
    });

    it('should use minimum growth factor for low base health', () => {
      const lowBaseHealth = 20;
      // Le facteur de croissance minimum est 5, pas 20*0.15=3
      
      // Niveau 3: base + (3-1) * facteur = 20 + 10 = 30
      expect(characterCardService.calculateMaxHealthForLevel(lowBaseHealth, 3)).toBe(30);
    });
  });

  describe('calculateXPForNextLevel', () => {
    it('should calculate correct XP requirements for different levels', () => {
      // XP pour niveau 2: 100 * (1 * 1.5)² = 100 * 2.25 = 225
      expect(characterCardService.calculateXPForNextLevel(1)).toBe(225);
      
      // XP pour niveau 5: 100 * (4 * 1.5)² = 100 * 36 = 3600
      expect(characterCardService.calculateXPForNextLevel(4)).toBe(3600);
      
      // XP pour niveau 10: 100 * (9 * 1.5)² = 100 * 182.25 = 18225
      expect(characterCardService.calculateXPForNextLevel(9)).toBe(18225);
    });

    it('should return increasing XP requirements', () => {
      const level1XP = characterCardService.calculateXPForNextLevel(1);
      const level2XP = characterCardService.calculateXPForNextLevel(2);
      const level3XP = characterCardService.calculateXPForNextLevel(3);
      
      expect(level2XP).toBeGreaterThan(level1XP);
      expect(level3XP).toBeGreaterThan(level2XP);
    });
  });
});

describe('CharacterCardInstance', () => {
  let characterInstance: CharacterCardInstance;

  beforeEach(() => {
    characterInstance = new CharacterCardInstance(mockCharacterCard);
  });

  describe('constructor', () => {
    it('should initialize character with correct properties', () => {
      expect(characterInstance.level).toBe(1);
      expect(characterInstance.maxLevel).toBe(10);
      expect(characterInstance.xp).toBe(0);
      expect(characterInstance.xpToNextLevel).toBe(225); // 100 * (1 * 1.5)²
      expect(characterInstance.maxHealth).toBe(100);
      expect(characterInstance.currentHealth).toBe(100);
    });

    it('should use default values for missing properties', () => {
      const minimalCard: CharacterCard = {
        id: 3,
        name: 'Minimal Character',
        description: null,
        type: 'personnage',
        rarity: 'gros_bodycount',
        properties: {
          health: 50,
          baseHealth: 50,
          attack: 0,
          defense: 0,
          level: 1,
          maxLevel: 10,
          xp: 0,
          xpToNextLevel: 0
        },
        summon_cost: null,
        image: null,
        passive_effect: null,
        is_wip: false,
        is_crap: false
      };

      const instance = new CharacterCardInstance(minimalCard);
      expect(instance.level).toBe(1);
      expect(instance.maxLevel).toBe(10);
      expect(instance.xp).toBe(0);
      expect(instance.xpToNextLevel).toBe(225);
      expect(instance.temporaryStats.attack).toBe(1); // Valeur par défaut
      expect(instance.temporaryStats.defense).toBe(0); // Valeur par défaut
    });
  });

  describe('updateStatsForLevel', () => {
    it('should update stats based on level', () => {
      characterInstance.level = 1;
      characterInstance.updateStatsForLevel();
      expect(characterInstance.temporaryStats.attack).toBe(10); // Niveau 1: base=10, bonus=0
      expect(characterInstance.temporaryStats.defense).toBe(5); // Niveau 1: base=5, bonus=0
      
      characterInstance.level = 5;
      characterInstance.updateStatsForLevel();
      expect(characterInstance.temporaryStats.attack).toBe(14); // Niveau 5: base=10, bonus=4
      expect(characterInstance.temporaryStats.defense).toBe(6); // Niveau 5: base=5, bonus=1
      
      characterInstance.level = 10;
      characterInstance.updateStatsForLevel();
      expect(characterInstance.temporaryStats.attack).toBe(20); // Niveau 10: base=10, bonus=10
      expect(characterInstance.temporaryStats.defense).toBe(8); // Niveau 10: base=5, bonus=3
    });
  });

  describe('addExperience', () => {
    it('should add experience without level up if below threshold', () => {
      const initialXP = characterInstance.xp;
      const result = characterInstance.addExperience(100);
      
      expect(result).toBe(false); // Pas de level up
      expect(characterInstance.xp).toBe(initialXP + 100);
      expect(characterInstance.level).toBe(1); // Niveau inchangé
    });

    it('should level up when XP threshold is reached', () => {
      const result = characterInstance.addExperience(300); // Dépasse le seuil de 225
      
      expect(result).toBe(true); // Level up
      expect(characterInstance.level).toBe(2);
      expect(characterInstance.xp).toBe(300 - 225); // XP restante après level up
    });

    it('should not level up beyond max level', () => {
      characterInstance.level = 10; // Niveau max
      characterInstance.maxLevel = 10;
      
      const result = characterInstance.addExperience(1000);
      
      expect(result).toBe(false);
      expect(characterInstance.level).toBe(10); // Niveau inchangé
    });
  });

  describe('levelUp', () => {
    it('should increase level and adjust stats', () => {
      const oldMaxHealth = characterInstance.maxHealth;
      
      characterInstance.levelUp();
      
      expect(characterInstance.level).toBe(2);
      expect(characterInstance.maxHealth).toBeGreaterThan(oldMaxHealth);
      expect(characterInstance.xpToNextLevel).toBeGreaterThan(225); // Nouveau seuil plus élevé
    });

    it('should maintain health percentage when leveling up', () => {
      // Réduit la santé à 50%
      characterInstance.currentHealth = 50;
      
      characterInstance.levelUp();
      
      // Après level up, la santé devrait toujours être à ~50% (avec arrondi)
      expect(characterInstance.currentHealth).toBe(Math.floor(characterInstance.maxHealth * 0.5));
    });

    it('should not level up beyond max level', () => {
      characterInstance.level = 10;
      characterInstance.maxLevel = 10;
      
      const originalLevel = characterInstance.level;
      characterInstance.levelUp();
      
      expect(characterInstance.level).toBe(originalLevel);
    });
  });
}); 