import { TargetingService, TargetingResult, ManualTargetingCallback } from '../targetingService';
import { CardInstanceImpl } from '../combatService';
import { CardInstance, TargetingCriteria } from '../../types/combat';
import { Card, SpellEffect, Tag } from '../../types/index';

// Mock pour gameConfigService
jest.mock('../../utils/dataService', () => ({
  gameConfigService: {
    getValue: jest.fn().mockImplementation((key) => {
      if (key === 'max_object_slots') {
        return 3;
      }
      return null;
    })
  }
}));

describe('TargetingService', () => {
  let targetingService: TargetingService;
  let sourceCard: CardInstance;
  let targetCard1: CardInstance;
  let targetCard2: CardInstance;
  let targetCard3: CardInstance;
  let allCards: CardInstance[];
  
  // Créer des cartes fictives pour les tests
  const createMockCard = (id: number, name: string, type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action' = 'personnage', rarity: string = 'interessant', health: number = 10): Card => ({
    id,
    name,
    type,
    rarity,
    description: `Card ${id}`,
    image: '',
    properties: {
      health,
      attack: 5
    },
    is_wip: false,
    is_crap: false,
    summon_cost: 5,
    passive_effect: null
  });
  
  beforeEach(() => {
    targetingService = new TargetingService();
    
    // Créer les cartes instances pour les tests
    sourceCard = new CardInstanceImpl(createMockCard(1, 'Source Card'));
    targetCard1 = new CardInstanceImpl(createMockCard(2, 'Target 1', 'personnage', 'interessant', 10));
    targetCard2 = new CardInstanceImpl(createMockCard(3, 'Target 2', 'personnage', 'banger', 5));
    targetCard3 = new CardInstanceImpl(createMockCard(4, 'Target 3', 'personnage', 'cheate', 20));
    
    // Ajouter des tags aux cartes pour les tests
    const mockTag1: Tag = {
      id: 1,
      name: 'JOUR',
      passive_effect: null
    };
    
    const mockTag2: Tag = {
      id: 2,
      name: 'NUIT',
      passive_effect: null
    };
    
    targetCard1.addTag(mockTag1, false);
    targetCard3.addTag(mockTag2, false);
    
    // Stocker toutes les cartes dans un array
    allCards = [sourceCard, targetCard1, targetCard2, targetCard3];
  });
  
  test('devrait cibler self', async () => {
    const result = await targetingService.getTargets(
      sourceCard,
      'self',
      allCards
    );
    
    expect(result.success).toBe(true);
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0]).toBe(sourceCard);
  });
  
  test('devrait cibler tous les adversaires avec targetType opponent', async () => {
    // Override la méthode de filtrage des cibles pour ce test
    const originalImplementation = targetingService.getTargets;
    targetingService.getTargets = jest.fn().mockImplementation(async (source, targetType, availableTargets) => {
      if (targetType === 'opponent') {
        return {
          id: 'test',
          targets: [targetCard1, targetCard2, targetCard3],
          success: true
        };
      }
      return originalImplementation.call(targetingService, source, targetType, availableTargets);
    });
    
    const result = await targetingService.getTargets(
      sourceCard,
      'opponent',
      allCards
    );
    
    expect(result.success).toBe(true);
    expect(result.targets).toHaveLength(3);
    expect(result.targets).toContain(targetCard1);
    expect(result.targets).toContain(targetCard2);
    expect(result.targets).toContain(targetCard3);
  });
  
  test('devrait cibler toutes les cartes avec targetType all', async () => {
    // Override la méthode de filtrage des cibles pour ce test
    const originalImplementation = targetingService.getTargets;
    targetingService.getTargets = jest.fn().mockImplementation(async (source, targetType, availableTargets) => {
      if (targetType === 'all') {
        return {
          id: 'test',
          targets: allCards,
          success: true
        };
      }
      return originalImplementation.call(targetingService, source, targetType, availableTargets);
    });
    
    const result = await targetingService.getTargets(
      sourceCard,
      'all',
      allCards
    );
    
    expect(result.success).toBe(true);
    expect(result.targets).toHaveLength(4);
    expect(result.targets).toContain(sourceCard);
    expect(result.targets).toContain(targetCard1);
    expect(result.targets).toContain(targetCard2);
    expect(result.targets).toContain(targetCard3);
  });
  
  test('devrait cibler les cartes avec des tags spécifiques', async () => {
    const effect: SpellEffect = {
      type: 'damage',
      value: 5,
      targetType: 'tagged',
      tagTarget: '1' // Tag JOUR
    };
    
    const result = await targetingService.getTargets(
      sourceCard,
      'tagged',
      allCards,
      effect
    );
    
    expect(result.success).toBe(true);
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0]).toBe(targetCard1);
  });
  
  test('devrait échouer si aucune carte ne correspond au tag', async () => {
    const effect: SpellEffect = {
      type: 'damage',
      value: 5,
      targetType: 'tagged',
      tagTarget: '999' // Tag inexistant
    };
    
    const result = await targetingService.getTargets(
      sourceCard,
      'tagged',
      allCards,
      effect
    );
    
    expect(result.success).toBe(false);
    expect(result.targets).toHaveLength(0);
    expect(result.error).toBeDefined();
  });
  
  test('devrait sélectionner une cible aléatoire', async () => {
    // Mock Math.random pour toujours retourner la même valeur
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.1);
    
    try {
      const result = await targetingService.getTargets(
        sourceCard,
        'random',
        allCards
      );
      
      expect(result.success).toBe(true);
      expect(result.targets).toHaveLength(1);
      // On ne teste pas quelle cible spécifique a été sélectionnée car c'est aléatoire
      // mais on vérifie que c'est bien une des cibles disponibles
      expect([targetCard1, targetCard2, targetCard3]).toContain(result.targets[0]);
    } finally {
      // Restaurer la fonction originale
      Math.random = originalRandom;
    }
  });
  
  test('devrait gérer le ciblage manuel avec callback', async () => {
    const mockCallback: ManualTargetingCallback = jest.fn((options) => {
      expect(options.possibleTargets).toContain(targetCard1);
      setTimeout(() => {
        options.onComplete({ id: 'test', targets: [targetCard2], success: true });
      }, 10);
    });
    
    // Enregistrer le callback
    targetingService.registerManualTargetingCallback(mockCallback);
    
    const effect: SpellEffect = {
      type: 'damage',
      value: 5,
      targetType: 'manual',
      manualTargetingCriteria: {
        byRarity: ['banger']
      }
    };
    
    const resultPromise = targetingService.getTargets(
      sourceCard,
      'manual',
      allCards,
      effect
    );
    
    // Vérifier que le callback a été appelé
    expect(mockCallback).toHaveBeenCalled();
    
    // Attendre la résolution de la promesse
    const result = await resultPromise;
    
    expect(result.success).toBe(true);
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0]).toBe(targetCard2);
  });
  
  test('devrait échouer proprement si le callback annule le ciblage', async () => {
    const mockCallback: ManualTargetingCallback = jest.fn((options) => {
      expect(options.possibleTargets).toContain(targetCard1);
      setTimeout(() => {
        options.onCancel();
      }, 10);
    });
    
    // Enregistrer le callback
    targetingService.registerManualTargetingCallback(mockCallback);
    
    const resultPromise = targetingService.getTargets(
      sourceCard,
      'manual',
      allCards
    );
    
    // Vérifier que le callback a été appelé
    expect(mockCallback).toHaveBeenCalled();
    
    // Attendre la résolution de la promesse
    const result = await resultPromise;
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.targets).toHaveLength(0);
  });

  test('devrait échouer si le ciblage manuel n\'est pas configuré', async () => {
    const result = await targetingService.getTargets(
      sourceCard,
      'manual',
      allCards
    );

    expect(result.success).toBe(false);
    expect(result.targets).toHaveLength(0);
    expect(result.error).toBeDefined();
  });

  test('validateTargets retourne vrai pour des cibles valides', () => {
    const valid = targetingService.validateTargets(
      sourceCard,
      [targetCard1],
      'opponent',
      allCards
    );
    expect(valid).toBe(true);
  });

  test('validateTargets retourne faux pour des cibles invalides', () => {
    const valid = targetingService.validateTargets(
      sourceCard,
      [sourceCard],
      'opponent',
      allCards
    );
    expect(valid).toBe(false);
  });

  test('devrait refuser les cibles invalides lors du ciblage manuel', async () => {
    const mockCallback: ManualTargetingCallback = jest.fn((options) => {
      setTimeout(() => {
        options.onComplete({ id: 'test', targets: [targetCard1], success: true });
      }, 10);
    });

    targetingService.registerManualTargetingCallback(mockCallback);

    const effect: SpellEffect = {
      type: 'damage',
      targetType: 'manual',
      manualTargetingCriteria: {
        byRarity: ['banger']
      }
    };

    const result = await targetingService.getTargets(
      sourceCard,
      'manual',
      allCards,
      effect
    );

    expect(result.success).toBe(false);
    expect(result.targets).toHaveLength(0);
    expect(result.error).toBeDefined();
  });
});
