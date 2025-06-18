import { CardInstanceImpl } from '../../services/combatService';
import { Card } from '../../types';
import { gameConfigService } from '../../utils/dataService';

// Mock de gameConfigService
jest.mock('../../utils/dataService', () => ({
  gameConfigService: {
    getValue: jest.fn().mockResolvedValue(3) // Retourne 3 emplacements d'objets par défaut pour les tests
  }
}));

describe('CardInstance - Système d\'emplacements d\'objets', () => {
  // Objets de test
  let personnageCard: Card;
  let objetCard1: Card;
  let objetCard2: Card;
  let objetCard3: Card;
  let personnageInstance: CardInstanceImpl;
  let objetInstance1: CardInstanceImpl;
  let objetInstance2: CardInstanceImpl;
  let objetInstance3: CardInstanceImpl;
  
  beforeEach(() => {
    // Créer une carte personnage de test
    personnageCard = {
      id: 1,
      name: 'Test Personnage',
      type: 'personnage',
      rarity: 'banger',
      description: 'Personnage de test',
      image: 'test.jpg',
      passive_effect: '',
      properties: {
        health: 100,
        attack: 10,
        defense: 5
      },
      is_wip: false,
      is_crap: false,
      summon_cost: 10
    };
    
    // Créer des cartes objet de test
    objetCard1 = {
      id: 2,
      name: 'Test Objet 1',
      type: 'objet',
      rarity: 'interessant',
      description: 'Objet de test 1',
      image: 'objet1.jpg',
      passive_effect: JSON.stringify({
        type: 'health_boost',
        value: 20
      }),
      properties: {},
      is_wip: false,
      is_crap: false,
      summon_cost: 5
    };
    
    objetCard2 = {
      id: 3,
      name: 'Test Objet 2',
      type: 'objet',
      rarity: 'interessant',
      description: 'Objet de test 2',
      image: 'objet2.jpg',
      passive_effect: JSON.stringify({
        type: 'attack_boost',
        value: 30
      }),
      properties: {},
      is_wip: false,
      is_crap: false,
      summon_cost: 5
    };
    
    objetCard3 = {
      id: 4,
      name: 'Test Objet 3',
      type: 'objet',
      rarity: 'banger',
      description: 'Objet de test 3',
      image: 'objet3.jpg',
      passive_effect: JSON.stringify({
        type: 'defense_boost',
        value: 40
      }),
      properties: {},
      is_wip: false,
      is_crap: false,
      summon_cost: 8
    };
    
    // Créer les instances
    personnageInstance = new CardInstanceImpl(personnageCard);
    objetInstance1 = new CardInstanceImpl(objetCard1);
    objetInstance2 = new CardInstanceImpl(objetCard2);
    objetInstance3 = new CardInstanceImpl(objetCard3);
    
    // S'assurer que l'initialisation des emplacements d'objets est terminée
    return personnageInstance.initializeObjectSlots();
  });
  
  test('Initialisation des emplacements d\'objets pour un personnage', async () => {
    // Vérifier que les emplacements d'objets sont initialisés
    expect(personnageInstance.objectSlots).toBeDefined();
    expect(personnageInstance.objectSlots?.length).toBe(3);
    
    // Vérifier que tous les emplacements sont vides
    personnageInstance.objectSlots?.forEach(slot => {
      expect(slot.equippedObject).toBeNull();
      expect(slot.isLocked).toBe(false);
    });
  });
  
  test('Les cartes non-personnage n\'ont pas d\'emplacements d\'objets', () => {
    // Les instances d'objets ne devraient pas avoir d'emplacements d'objets
    expect(objetInstance1.objectSlots).toBeUndefined();
  });
  
  test('Équiper un objet dans un emplacement spécifique', () => {
    // Équiper l'objet 1 dans l'emplacement 2
    const result = personnageInstance.equipObject(objetInstance1, 2);
    
    // Vérifier que l'équipement a réussi
    expect(result).toBe(true);
    
    // Vérifier que l'objet est bien équipé dans l'emplacement 2
    const slot = personnageInstance.objectSlots?.find(s => s.slotId === 2);
    expect(slot?.equippedObject).toBe(objetInstance1);
  });
  
  test('Équiper un objet sans spécifier d\'emplacement', () => {
    // Équiper l'objet sans spécifier d'emplacement (devrait prendre le premier disponible)
    const result = personnageInstance.equipObject(objetInstance1);
    
    // Vérifier que l'équipement a réussi
    expect(result).toBe(true);
    
    // Vérifier que l'objet est bien équipé dans le premier emplacement
    const slot = personnageInstance.objectSlots?.[0];
    expect(slot?.equippedObject).toBe(objetInstance1);
  });
  
  test('Équiper plusieurs objets', () => {
    // Équiper les trois objets
    personnageInstance.equipObject(objetInstance1, 1);
    personnageInstance.equipObject(objetInstance2, 2);
    personnageInstance.equipObject(objetInstance3, 3);
    
    // Vérifier que tous les emplacements sont occupés
    expect(personnageInstance.objectSlots?.[0].equippedObject).toBe(objetInstance1);
    expect(personnageInstance.objectSlots?.[1].equippedObject).toBe(objetInstance2);
    expect(personnageInstance.objectSlots?.[2].equippedObject).toBe(objetInstance3);
    
    // Vérifier qu'il n'y a plus d'emplacement disponible
    expect(personnageInstance.hasAvailableObjectSlot()).toBe(false);
  });
  
  test('Tenter d\'équiper un objet dans un emplacement déjà occupé', () => {
    // Équiper l'objet 1 dans l'emplacement 1
    personnageInstance.equipObject(objetInstance1, 1);
    
    // Tenter d'équiper l'objet 2 dans le même emplacement
    const result = personnageInstance.equipObject(objetInstance2, 1);
    
    // Vérifier que l'équipement a échoué
    expect(result).toBe(false);
    
    // Vérifier que l'objet 1 est toujours équipé
    expect(personnageInstance.objectSlots?.[0].equippedObject).toBe(objetInstance1);
  });
  
  test('Déséquiper un objet', () => {
    // Équiper l'objet 1
    personnageInstance.equipObject(objetInstance1, 1);
    
    // Déséquiper l'objet
    const unequippedObject = personnageInstance.unequipObject(1);
    
    // Vérifier que l'objet déséquipé est bien l'objet 1
    expect(unequippedObject).toBe(objetInstance1);
    
    // Vérifier que l'emplacement est vide
    expect(personnageInstance.objectSlots?.[0].equippedObject).toBeNull();
  });
  
  test('Récupérer tous les objets équipés', () => {
    // Équiper deux objets
    personnageInstance.equipObject(objetInstance1, 1);
    personnageInstance.equipObject(objetInstance2, 3);
    
    // Récupérer tous les objets équipés
    const equippedObjects = personnageInstance.getEquippedObjects();
    
    // Vérifier qu'il y a bien deux objets équipés
    expect(equippedObjects.length).toBe(2);
    expect(equippedObjects).toContain(objetInstance1);
    expect(equippedObjects).toContain(objetInstance2);
  });
  
  test('Verrouiller un emplacement', () => {
    // Verrouiller l'emplacement 2
    personnageInstance.objectSlots = personnageInstance.objectSlots?.map(slot => {
      if (slot.slotId === 2) {
        return { ...slot, isLocked: true };
      }
      return slot;
    });
    
    // Tenter d'équiper un objet dans l'emplacement verrouillé
    const result = personnageInstance.equipObject(objetInstance1, 2);
    
    // Vérifier que l'équipement a échoué
    expect(result).toBe(false);
    
    // Tenter de déséquiper l'emplacement verrouillé (même s'il est vide)
    const unequippedObject = personnageInstance.unequipObject(2);
    
    // Vérifier que le déséquipement a échoué
    expect(unequippedObject).toBeNull();
  });

  test('Les effets passifs des objets modifient les statistiques', () => {
    personnageInstance.equipObject(objetInstance2, 1); // attack_boost 30%
    expect(personnageInstance.temporaryStats.attack).toBeGreaterThan(personnageCard.properties.attack);
  });
});
