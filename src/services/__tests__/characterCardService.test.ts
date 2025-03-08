import { CharacterCardService, CharacterCardInstance } from '../characterCardService';
import { CharacterCard } from '../../types/index';

// Mock card pour les tests
const mockCharacterCard: CharacterCard = {
  id: 1,
  name: 'Héros Test',
  description: 'Un héros pour tester le système de niveau',
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
    xpToNextLevel: 225,
  },
  summon_cost: 5,
  image: '',
  passive_effect: '',
  is_wip: false,
  is_crap: false
};

describe('CharacterCardService', () => {
  let service: CharacterCardService;

  beforeEach(() => {
    service = new CharacterCardService();
  });

  test('doit identifier correctement les cartes personnage valides', () => {
    expect(service.isValidCharacterCard(mockCharacterCard)).toBe(true);
    
    // Carte non valide (type incorrect)
    const invalidCard1 = { 
      ...mockCharacterCard,
      type: 'objet' 
    };
    expect(service.isValidCharacterCard(invalidCard1)).toBe(false);
    
    // Carte non valide (propriétés manquantes)
    const invalidCard2 = { 
      ...mockCharacterCard,
      properties: {} 
    };
    expect(service.isValidCharacterCard(invalidCard2)).toBe(false);
  });

  test('doit convertir une carte en carte personnage avec des valeurs par défaut', () => {
    // Carte avec propriétés minimales
    const minimalCard = {
      id: 2,
      name: 'Carte minimaliste',
      description: 'Une carte avec un minimum de propriétés',
      type: 'personnage',
      rarity: 'banger',
      properties: {
        health: 50
      },
      summon_cost: 3,
      image: '',
      passive_effect: '',
      is_wip: false,
      is_crap: false
    };

    const convertedCard = service.toCharacterCard(minimalCard);
    
    expect(convertedCard).not.toBeNull();
    expect(convertedCard?.properties.baseHealth).toBe(50);
    expect(convertedCard?.properties.level).toBe(1);
    expect(convertedCard?.properties.attack).toBe(1);
    expect(convertedCard?.properties.defense).toBe(0);
  });

  test('doit créer une instance de carte personnage correctement initialisée', () => {
    const instance = service.createCharacterInstance(mockCharacterCard);
    
    expect(instance).toBeInstanceOf(CharacterCardInstance);
    expect(instance.level).toBe(1);
    expect(instance.maxHealth).toBe(100);
    expect(instance.currentHealth).toBe(100);
    expect(instance.temporaryStats.attack).toBe(10);
    expect(instance.temporaryStats.defense).toBe(5);
  });
});

describe('CharacterCardInstance', () => {
  let characterInstance: CharacterCardInstance;

  beforeEach(() => {
    const service = new CharacterCardService();
    characterInstance = service.createCharacterInstance(mockCharacterCard);
  });

  test('doit ajouter de l\'expérience correctement', () => {
    expect(characterInstance.xp).toBe(0);
    
    characterInstance.addExperience(100);
    expect(characterInstance.xp).toBe(100);
    expect(characterInstance.level).toBe(1); // Pas encore assez d'XP pour level up
  });

  test('doit gérer le passage de niveau correctement', () => {
    // Ajouter suffisamment d'XP pour passer au niveau 2
    const leveledUp = characterInstance.addExperience(300);
    
    expect(leveledUp).toBe(true);
    expect(characterInstance.level).toBe(2);
    expect(characterInstance.xp).toBe(300 - 225); // XP excédentaire conservée
    expect(characterInstance.maxHealth).toBeGreaterThan(100); // Santé augmentée
  });

  test('doit maintenir le même pourcentage de vie lors du passage de niveau', () => {
    // Réduire la vie à 50%
    characterInstance.applyDamage(50);
    expect(characterInstance.currentHealth).toBe(50);
    
    // Passage au niveau 2
    characterInstance.addExperience(300);
    
    // La vie doit toujours être à environ 50% de la nouvelle valeur max
    const expectedHealth = Math.floor(characterInstance.maxHealth * 0.5);
    expect(characterInstance.currentHealth).toBe(expectedHealth);
  });

  test('doit augmenter les statistiques d\'attaque et de défense avec le niveau', () => {
    // Créer une carte avec des valeurs de base connues
    const testCard: CharacterCard = {
      ...mockCharacterCard,
      properties: {
        ...mockCharacterCard.properties,
        attack: 5,
        defense: 3,
        level: 1
      }
    };
    
    // Créer une instance fraîche
    const service = new CharacterCardService();
    const testInstance = service.createCharacterInstance(testCard);
    
    // Vérifier les valeurs initiales
    expect(testInstance.temporaryStats.attack).toBe(5);
    expect(testInstance.temporaryStats.defense).toBe(3);
    
    // Monter au niveau 5
    testInstance.level = 5;
    testInstance.updateStatsForLevel();
    
    // Les statistiques doivent avoir augmenté
    expect(testInstance.temporaryStats.attack).toBeGreaterThan(5);
    expect(testInstance.temporaryStats.defense).toBeGreaterThanOrEqual(3);
  });

  test('doit respecter la limite de niveau maximum', () => {
    // Définir un niveau maximum plus bas pour le test
    characterInstance.maxLevel = 3;
    
    // Monter au niveau maximum
    characterInstance.levelUp();
    characterInstance.levelUp();
    
    expect(characterInstance.level).toBe(3);
    
    // Essayer de monter au-delà du niveau maximum
    const result = characterInstance.addExperience(10000);
    
    expect(result).toBe(false);
    expect(characterInstance.level).toBe(3); // Niveau inchangé
  });

  test('doit calculer correctement l\'XP requise pour chaque niveau', () => {
    const xpLevel1 = characterInstance.xpToNextLevel;
    
    characterInstance.levelUp();
    const xpLevel2 = characterInstance.xpToNextLevel;
    
    characterInstance.levelUp();
    const xpLevel3 = characterInstance.xpToNextLevel;
    
    // L'XP requise doit augmenter à chaque niveau
    expect(xpLevel2).toBeGreaterThan(xpLevel1);
    expect(xpLevel3).toBeGreaterThan(xpLevel2);
  });
}); 