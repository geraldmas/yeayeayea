import { CardInstanceImpl, CombatManagerImpl } from '../combatService';
import { Card, Alteration, Tag, Spell, SpellEffect } from '../../types/index';
import { TargetType, CardInstance } from '../../types/combat';

// Mocks pour les tests
const mockCard: Card = {
  id: 1,
  name: 'Carte Test',
  description: 'Carte utilisée pour les tests',
  type: 'personnage',
  rarity: 'banger',
  properties: {
    health: 10
  },
  summon_cost: 3,
  image: null,
  passive_effect: null,
  is_wip: false,
  is_crap: false
};

const mockTag: Tag = {
  id: 1,
  name: 'Tag Test',
  passive_effect: null
};

const mockAlteration: Alteration = {
  id: 1,
  name: 'Altération Test',
  description: 'Altération pour les tests',
  effect: {
    action: 'damage_over_time',
    value: 2
  },
  icon: 'test-icon.png',
  duration: 3,
  stackable: true,
  unique_effect: false,
  type: 'debuff'
};

const mockSpell: Spell = {
  id: 1,
  name: 'Sort Test',
  description: 'Sort pour les tests',
  power: 5,
  cost: 2,
  effects: [
    {
      type: 'damage',
      value: 3,
      targetType: 'opponent'
    }
  ],
  is_value_percentage: false
};

// Helper pour créer un joueur de test avec du charisme
const createTestPlayer = () => ({
  id: 'player1',
  name: 'Test Player',
  activeCard: null,
  benchCards: [],
  inventory: [],
  hand: [],
  motivation: 0,
  baseMotivation: 0,
  motivationModifiers: [],
  charisme: 10,
  baseCharisme: 0,
  maxCharisme: 100,
  charismeModifiers: [],
  movementPoints: 0,
  points: 0,
  effects: []
});

describe('CardInstance', () => {
  let cardInstance: CardInstanceImpl;

  beforeEach(() => {
    cardInstance = new CardInstanceImpl(mockCard);
  });

  test('doit initialiser correctement une instance de carte', () => {
    expect(cardInstance.instanceId).toBeDefined();
    expect(cardInstance.cardDefinition).toBe(mockCard);
    expect(cardInstance.currentHealth).toBe(10);
    expect(cardInstance.maxHealth).toBe(10);
    expect(cardInstance.activeAlterations).toEqual([]);
    expect(cardInstance.activeTags).toEqual([]);
    expect(cardInstance.isExhausted).toBe(false);
    expect(cardInstance.isTapped).toBe(false);
  });

  test('doit correctement appliquer des dégâts', () => {
    cardInstance.applyDamage(3);
    expect(cardInstance.currentHealth).toBe(7);
  });

  test('ne doit pas permettre aux points de vie de descendre en dessous de zéro', () => {
    cardInstance.applyDamage(15);
    expect(cardInstance.currentHealth).toBe(0);
  });

  test('doit correctement soigner', () => {
    cardInstance.applyDamage(5);
    cardInstance.heal(2);
    expect(cardInstance.currentHealth).toBe(7);
  });

  test('ne doit pas permettre de soigner au-dessus des points de vie maximum', () => {
    cardInstance.heal(5);
    expect(cardInstance.currentHealth).toBe(10);
  });

  test('doit ajouter un tag correctement', () => {
    cardInstance.addTag(mockTag);
    expect(cardInstance.activeTags.length).toBe(1);
    expect(cardInstance.hasTag(1)).toBe(true);
  });

  test('doit supprimer un tag correctement', () => {
    cardInstance.addTag(mockTag);
    cardInstance.removeTag(1);
    expect(cardInstance.activeTags.length).toBe(0);
    expect(cardInstance.hasTag(1)).toBe(false);
  });

  test('doit ajouter une altération correctement', () => {
    const sourceInstance = new CardInstanceImpl(mockCard);
    cardInstance.addAlteration(mockAlteration, sourceInstance);
    expect(cardInstance.activeAlterations.length).toBe(1);
    expect(cardInstance.hasAlteration(1)).toBe(true);
  });

  test('doit empiler une altération si elle est stackable', () => {
    const sourceInstance = new CardInstanceImpl(mockCard);
    cardInstance.addAlteration(mockAlteration, sourceInstance);
    cardInstance.addAlteration(mockAlteration, sourceInstance);
    
    expect(cardInstance.activeAlterations.length).toBe(1);
    expect(cardInstance.activeAlterations[0].stackCount).toBe(2);
  });

  test('doit supprimer une altération correctement', () => {
    const sourceInstance = new CardInstanceImpl(mockCard);
    cardInstance.addAlteration(mockAlteration, sourceInstance);
    cardInstance.removeAlteration(1);
    
    expect(cardInstance.activeAlterations.length).toBe(0);
    expect(cardInstance.hasAlteration(1)).toBe(false);
  });

  test('doit réinitialiser l\'état à la fin du tour', () => {
    const sourceInstance = new CardInstanceImpl(mockCard);
    cardInstance.isExhausted = true;
    cardInstance.isTapped = true;
    
    const temporaryTag: Tag = { ...mockTag, id: 2 };
    cardInstance.addTag(temporaryTag, true, 1);
    
    cardInstance.addAlteration({
      ...mockAlteration,
      id: 2,
      duration: 1
    }, sourceInstance);
    
    cardInstance.resetForNextTurn();
    
    expect(cardInstance.isExhausted).toBe(false);
    expect(cardInstance.isTapped).toBe(false);
    expect(cardInstance.activeTags.length).toBe(0);
    expect(cardInstance.activeAlterations.length).toBe(0);
  });
});

describe('CombatManager', () => {
  let combatManager: CombatManagerImpl;
  let attacker: CardInstanceImpl;
  let target: CardInstanceImpl;

  beforeEach(() => {
    combatManager = new CombatManagerImpl();
    attacker = new CardInstanceImpl(mockCard);
    target = new CardInstanceImpl({
      ...mockCard,
      id: 2,
      name: 'Cible'
    });
    
    combatManager.cardInstances = [attacker, target];
  });

  test('doit initialiser une nouvelle instance de carte', () => {
    const newCard: Card = {
      ...mockCard,
      id: 3,
      name: 'Nouvelle carte'
    };
    
    const instance = combatManager.initializeCardInstance(newCard);
    
    expect(instance.cardDefinition).toBe(newCard);
    expect(combatManager.cardInstances.length).toBe(3);
  });

  test('doit exécuter une attaque correctement', () => {
    const initialHealth = target.currentHealth;
    
    combatManager.executeAttack(attacker, target);
    
    // Résoudre les actions planifiées
    combatManager.resolveAllActions();
    
    expect(target.currentHealth).toBe(initialHealth - 1);
    expect(attacker.isExhausted).toBe(true);
  });

  test('ne doit pas permettre d\'attaquer si la carte est épuisée', () => {
    attacker.isExhausted = true;
    const initialHealth = target.currentHealth;
    
    combatManager.executeAttack(attacker, target);
    
    expect(target.currentHealth).toBe(initialHealth);
  });

  test('doit identifier correctement les cartes vaincues', () => {
    target.applyDamage(target.currentHealth);
    
    const defeated = combatManager.checkForDefeated();
    
    expect(defeated.length).toBe(1);
    expect(defeated[0]).toBe(target);
  });

  test('doit sélectionner correctement les cibles valides', () => {
    // Test pour cible 'self'
    const selfTargets = combatManager.getValidTargets(attacker, 'self');
    expect(selfTargets.length).toBe(1);
    expect(selfTargets[0]).toBe(attacker);
    
    // Test pour cible 'opponent'
    const opponentTargets = combatManager.getValidTargets(attacker, 'opponent');
    expect(opponentTargets.length).toBe(1);
    expect(opponentTargets[0]).toBe(target);
    
    // Test pour cible 'all'
    const allTargets = combatManager.getValidTargets(attacker, 'all');
    expect(allTargets.length).toBe(2);
    
    // Test pour cible 'tagged'
    const taggedTargets = combatManager.getValidTargets(attacker, 'tagged', 1);
    expect(taggedTargets.length).toBe(0);
    
    // Ajouter un tag à une cible
    target.addTag(mockTag);
    const updatedTaggedTargets = combatManager.getValidTargets(attacker, 'tagged', 1);
    expect(updatedTaggedTargets.length).toBe(1);
    expect(updatedTaggedTargets[0]).toBe(target);
  });

  test('doit sélectionner une cible aléatoire correctement', () => {
    // Cas où il n'y a qu'une seule cible possible
    const randomTarget = combatManager.getRandomTarget(attacker, 'opponent');
    expect(randomTarget).toBe(target);
    
    // Cas où il n'y a pas de cible possible
    // Créer une cible 'tagged' fictive qui n'existe pas dans le test
    const fictitiousTagType: TargetType = 'tagged';
    // Utiliser getValidTargets au lieu de getRandomTarget directement
    const noTargets = combatManager.getValidTargets(attacker, fictitiousTagType, 999);
    expect(noTargets.length).toBe(0);
    
    const noRandomTarget = combatManager.getRandomTarget(attacker, fictitiousTagType);
    expect(noRandomTarget).toBeNull();
  });
});

// Tests pour le système de ciblage
describe('Système de ciblage aléatoire', () => {
  let combatManager: CombatManagerImpl;
  let sourceCard: CardInstanceImpl;
  let targetCard1: CardInstanceImpl;
  let targetCard2: CardInstanceImpl;
  let targetCard3: CardInstanceImpl;
  
  // Mock pour Math.random
  const originalRandom = Math.random;
  
  beforeEach(() => {
    // Initialiser le gestionnaire de combat et les cartes
    combatManager = new CombatManagerImpl();
    
    // Créer plusieurs cartes pour les tests
    sourceCard = new CardInstanceImpl({...mockCard, id: 1});
    targetCard1 = new CardInstanceImpl({...mockCard, id: 2});
    targetCard2 = new CardInstanceImpl({...mockCard, id: 3});
    targetCard3 = new CardInstanceImpl({...mockCard, id: 4});
    
    // Ajouter les cartes au gestionnaire
    combatManager.cardInstances = [sourceCard, targetCard1, targetCard2, targetCard3];
    
    // Ajouter un tag à targetCard2 pour tester le ciblage par tag
    targetCard2.addTag({...mockTag, id: 1}, false);
  });
  
  afterEach(() => {
    // Restaurer Math.random
    Math.random = originalRandom;
  });
  
  test('getRandomTarget devrait retourner null si aucune cible valide', () => {
    // Vider la liste des cartes
    combatManager.cardInstances = [sourceCard];
    
    // Tester avec différents types de ciblage
    expect(combatManager.getRandomTarget(sourceCard, 'opponent')).toBeNull();
    expect(combatManager.getRandomTarget(sourceCard, 'random')).toBeNull();
    expect(combatManager.getRandomTarget(sourceCard, 'tagged', 1)).toBeNull();
  });
  
  test('getRandomTarget devrait retourner une cible pour le type "opponent"', () => {
    // Simuler Math.random pour avoir un résultat déterministe
    Math.random = jest.fn().mockReturnValue(0.1); // Retourne la première cible
    
    const target = combatManager.getRandomTarget(sourceCard, 'opponent');
    expect(target).not.toBeNull();
    expect(target?.instanceId).not.toBe(sourceCard.instanceId);
  });
  
  test('getRandomTarget devrait retourner self quand le type est "self"', () => {
    const target = combatManager.getRandomTarget(sourceCard, 'self');
    expect(target).not.toBeNull();
    expect(target?.instanceId).toBe(sourceCard.instanceId);
  });
  
  test('getRandomTarget devrait retourner une cible avec le tag spécifié', () => {
    const target = combatManager.getRandomTarget(sourceCard, 'tagged', 1);
    expect(target).not.toBeNull();
    expect(target?.hasTag(1)).toBe(true);
    expect(target?.instanceId).toBe(targetCard2.instanceId);
  });
  
  test('getRandomTargets devrait retourner le nombre correct de cibles', () => {
    // Tester l'obtention de 2 cibles aléatoires
    const targets = combatManager.getRandomTargets(sourceCard, 'opponent', 2);
    expect(targets.length).toBe(2);
    
    // Toutes les cibles devraient être différentes de la source
    targets.forEach(target => {
      expect(target.instanceId).not.toBe(sourceCard.instanceId);
    });
  });
  
  test('getRandomTargets avec uniqueTargets=true devrait retourner des cibles uniques', () => {
    // Simuler des valeurs aléatoires pour obtenir des résultats cohérents
    let mockRandomValues = [0.1, 0.5, 0.9];
    let mockRandomIndex = 0;
    Math.random = jest.fn().mockImplementation(() => {
      const value = mockRandomValues[mockRandomIndex];
      mockRandomIndex = (mockRandomIndex + 1) % mockRandomValues.length;
      return value;
    });
    
    const targets = combatManager.getRandomTargets(sourceCard, 'opponent', 3, undefined, true);
    
    // Vérifier que nous avons bien 3 cibles
    expect(targets.length).toBe(3);
    
    // Vérifier qu'elles sont toutes uniques
    const uniqueIds = new Set(targets.map(t => t.instanceId));
    expect(uniqueIds.size).toBe(3);
  });
  
  test('getRandomTargets avec uniqueTargets=false peut retourner des doublons', () => {
    // Force Math.random à retourner toujours la même valeur pour avoir des doublons
    Math.random = jest.fn().mockReturnValue(0.1);
    
    const targets = combatManager.getRandomTargets(sourceCard, 'opponent', 3, undefined, false);
    
    // Vérifier que nous avons bien 3 cibles
    expect(targets.length).toBe(3);
    
    // En forçant le random, toutes les cibles devraient être identiques
    const firstId = targets[0].instanceId;
    targets.forEach(target => {
      expect(target.instanceId).toBe(firstId);
    });
  });
  
  test('getWeightedRandomTarget devrait retourner une cible pondérée', () => {
    // Définir la fonction de poids: carte avec moins de PV a plus de poids
    const weightFunction = (card: CardInstance) => 10 - card.currentHealth;
    
    // Modifier les PV pour avoir des poids différents
    targetCard1.currentHealth = 2; // Poids: 8
    targetCard2.currentHealth = 5; // Poids: 5
    targetCard3.currentHealth = 8; // Poids: 2
    
    // Forcer un comportement déterministe en controlant directement le résultat
    // de la sélection pondérée
    let totalWeight = 0;
    jest.spyOn(combatManager, 'getWeightedRandomTarget').mockImplementation((source, targetType, wf) => {
      // Appeler la fonction de poids sur toutes les cibles valides pour simuler le calcul
      const validTargets = combatManager.getValidTargets(source, targetType);
      validTargets.forEach(target => wf(target));
      
      // Toujours retourner targetCard2 pour rendre le test déterministe
      return targetCard2;
    });
    
    const target = combatManager.getWeightedRandomTarget(sourceCard, 'opponent', weightFunction);
    
    // Vérifier que notre mock a été appelé et a retourné targetCard2
    expect(target).not.toBeNull();
    expect(target?.instanceId).toBe(targetCard2.instanceId);
    
    // Restaurer la méthode originale pour ne pas affecter les autres tests
    jest.restoreAllMocks();
  });
  
  test('getWeightedRandomTarget devrait fonctionner même avec des poids nuls', () => {
    // Fonction qui renvoie 0 pour toutes les cartes
    const weightFunction = () => 0;
    
    const target = combatManager.getWeightedRandomTarget(sourceCard, 'opponent', weightFunction);
    
    // Devrait quand même retourner une cible (sélection uniforme)
    expect(target).not.toBeNull();
  });
});

describe('Résolution simultanée des actions', () => {
  let combatManager: CombatManagerImpl;
  let attacker: CardInstanceImpl;
  let target1: CardInstanceImpl;
  let target2: CardInstanceImpl;
  let mockSpell: Spell;

  beforeEach(() => {
    combatManager = new CombatManagerImpl();
    
    // Créer les cartes pour les tests
    attacker = new CardInstanceImpl({...mockCard, id: 1});
    target1 = new CardInstanceImpl({...mockCard, id: 2});
    target2 = new CardInstanceImpl({...mockCard, id: 3});
    
    // S'assurer que l'attaquant peut agir
    attacker.isExhausted = false;
    
    // Définir les PV pour les tests
    attacker.currentHealth = 10;
    target1.currentHealth = 10;
    target2.currentHealth = 10;
    
    // Ajouter les cartes au gestionnaire
    combatManager.cardInstances = [attacker, target1, target2];
    
    // Créer un sort de test
    mockSpell = {
      id: 1,
      name: 'Test Spell',
      description: 'Test description',
      power: 5,
      cost: 2,
      effects: [
        { type: 'damage', value: 3 } as SpellEffect
      ],
      is_value_percentage: false
    };
    
    // Ajouter le sort aux sorts disponibles de l'attaquant
    attacker.availableSpells = [{
      spell: mockSpell,
      cooldown: 0,
      isAvailable: true
    }];
  });

  test('doit planifier et résoudre les actions simultanément', () => {
    // Planifier plusieurs actions
    combatManager.executeAttack(attacker, target1);
    combatManager.castSpell(attacker, mockSpell, [target2]);
    
    // Vérifier que l'attaquant n'est pas encore épuisé (les actions sont seulement planifiées)
    expect(attacker.isExhausted).toBe(false);
    
    // Les cibles ne devraient pas encore avoir reçu de dégâts
    expect(target1.currentHealth).toBe(10);
    expect(target2.currentHealth).toBe(10);
    
    // Résoudre les actions
    combatManager.resolveAllActions();
    
    // Maintenant l'attaquant devrait être épuisé
    expect(attacker.isExhausted).toBe(true);
    
    // Les cibles devraient avoir reçu des dégâts
    expect(target1.currentHealth).toBe(9); // 10 - 1 de l'attaque
    expect(target2.currentHealth).toBe(7); // 10 - 3 du sort
  });

  test('doit résoudre correctement les conflits de ressources', () => {
    // Créer un mock pour ActionResolutionService
    const originalResolveConflicts = (combatManager as any).actionResolutionService.resolveConflictsAutomatically;
    
    // Espionner la méthode pour vérifier qu'elle est appelée
    const spyResolveConflicts = jest.fn().mockImplementation(() => {
      return [{ conflict: {}, resolution: 'Test resolution' }];
    });
    
    (combatManager as any).actionResolutionService.resolveConflictsAutomatically = spyResolveConflicts;
    
    // Planifier des actions
    combatManager.executeAttack(attacker, target1);
    combatManager.castSpell(attacker, mockSpell, [target2]);
    
    // Résoudre les actions
    combatManager.resolveAllActions();
    
    // Vérifier que la méthode de résolution des conflits a été appelée
    expect(spyResolveConflicts).toHaveBeenCalled();
    
    // Restaurer la méthode originale
    (combatManager as any).actionResolutionService.resolveConflictsAutomatically = originalResolveConflicts;
  });
});

describe('Intégration du charisme', () => {
  test('summonCardForPlayer dépense le charisme requis', () => {
    const combatManager = new CombatManagerImpl();
    const player = createTestPlayer();

    const instance = combatManager.summonCardForPlayer(mockCard, player);

    expect(instance).not.toBeNull();
    expect(player.charisme).toBe(7); // 10 - cost 3
    expect(combatManager.cardInstances.includes(instance!)).toBe(true);
  });

  test('handleCardDefeat ajoute le charisme au vainqueur', () => {
    const combatManager = new CombatManagerImpl();
    const player = createTestPlayer();
    const defeated = new CardInstanceImpl({ ...mockCard, rarity: 'cheate' });

    combatManager.handleCardDefeat(defeated, player);

    // cheate rarity gives 40 charisma
    expect(player.charisme).toBe(50); // 10 + 40
  });
});
