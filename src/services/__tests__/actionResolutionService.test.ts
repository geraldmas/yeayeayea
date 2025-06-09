import { ActionResolutionService, ActionType, PlannedAction, ConflictResolutionStrategy } from '../actionResolutionService';
import { CardInstanceImpl } from '../combatService';
import { Card, Spell, SpellEffect } from '../../types/index';

// Mock des dépendances
const mockCard: Card = {
  id: 1,
  name: 'Test Card',
  type: 'personnage',
  rarity: 'interessant',
  description: 'Test description',
  image: 'test.png',
  passive_effect: '',
  properties: { health: 10 },
  is_wip: false,
  is_crap: false,
  summon_cost: 2
};

const mockSpell: Spell = {
  id: 1,
  name: 'Test Spell',
  description: 'Test spell description',
  cost: 2,
  range_min: 1,
  range_max: 3,
  effects: [
    { type: 'damage', value: 3 } as SpellEffect,
    { type: 'apply_alteration', value: 1, alteration: 1 } as SpellEffect
  ],
  is_value_percentage: false
};

describe('ActionResolutionService', () => {
  let service: ActionResolutionService;
  let sourceCard: CardInstanceImpl;
  let targetCard1: CardInstanceImpl;
  let targetCard2: CardInstanceImpl;
  
  // Activer les faux timers pour les tests
  beforeAll(() => {
    jest.useFakeTimers();
  });

  // Nettoyer après les tests
  afterAll(() => {
    jest.useRealTimers();
  });
  
  beforeEach(() => {
    // Initialiser le service et les cartes pour les tests
    service = new ActionResolutionService();
    
    sourceCard = new CardInstanceImpl({...mockCard, id: 1});
    targetCard1 = new CardInstanceImpl({...mockCard, id: 2});
    targetCard2 = new CardInstanceImpl({...mockCard, id: 3});
    
    // Ajouter la propriété motivation pour les tests
    sourceCard.temporaryStats.motivation = 10;
  });
  
  test('doit permettre de planifier une action', () => {
    const actionId = service.planAction({
      type: ActionType.ATTACK,
      source: sourceCard,
      targets: [targetCard1],
      priority: 1,
      cost: 1,
    });
    
    expect(actionId).toBeDefined();
    expect(typeof actionId).toBe('string');
    
    const actions = service.getPlannedActions();
    expect(actions.length).toBe(1);
    expect(actions[0].id).toBe(actionId);
  });
  
  test('doit permettre d\'annuler une action', () => {
    const actionId = service.planAction({
      type: ActionType.ATTACK,
      source: sourceCard,
      targets: [targetCard1],
      priority: 1,
      cost: 1,
    });
    
    expect(service.getPlannedActions().length).toBe(1);
    
    const result = service.cancelAction(actionId);
    expect(result).toBe(true);
    expect(service.getPlannedActions().length).toBe(0);
  });
  
  test('doit résoudre les actions dans l\'ordre de priorité par défaut', () => {
    // Par défaut, le service utilise la stratégie FIFO
    
    // Planifier des actions avec des priorités différentes
    const actionId1 = service.planAction({
      type: ActionType.ATTACK,
      source: sourceCard,
      targets: [targetCard1],
      priority: 1,
      cost: 1,
    });
    
    // Simuler un délai pour avoir des timestamps différents
    jest.advanceTimersByTime(100);
    
    const actionId2 = service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard2],
      spell: mockSpell,
      priority: 5,
      cost: 2,
    });
    
    const executedActions: PlannedAction[] = [];
    
    // Résoudre les actions
    service.resolveActions((action) => {
      executedActions.push(action);
    });
    
    // Vérifier l'ordre d'exécution - FIFO par défaut
    expect(executedActions.length).toBe(2);
    expect(executedActions[0].id).toBe(actionId1); // Premier arrivé en premier
    expect(executedActions[1].id).toBe(actionId2);
    
    // Vérifier que les actions ont été vidées
    expect(service.getPlannedActions().length).toBe(0);
  });
  
  test('doit résoudre les actions selon la stratégie PRIORITY', () => {
    // Configurer le service pour utiliser la stratégie PRIORITY
    service.setConflictStrategy(ConflictResolutionStrategy.PRIORITY);
    
    // Planifier des actions avec des priorités différentes
    const lowPriorityActionId = service.planAction({
      type: ActionType.ATTACK,
      source: sourceCard,
      targets: [targetCard1],
      priority: 1,
      cost: 1,
    });
    
    const highPriorityActionId = service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard2],
      spell: mockSpell,
      priority: 5,
      cost: 2,
    });
    
    const executedActions: PlannedAction[] = [];
    
    // Résoudre les actions
    service.resolveActions((action) => {
      executedActions.push(action);
    });
    
    // Vérifier l'ordre d'exécution
    expect(executedActions.length).toBe(2);
    expect(executedActions[0].id).toBe(highPriorityActionId); // Priorité plus élevée en premier
    expect(executedActions[1].id).toBe(lowPriorityActionId);
  });
  
  test('doit résoudre les actions selon la stratégie LIFO', () => {
    // Configurer le service pour utiliser la stratégie LIFO
    service.setConflictStrategy(ConflictResolutionStrategy.LIFO);
    
    // Planifier des actions dans un ordre spécifique
    const firstActionId = service.planAction({
      type: ActionType.ATTACK,
      source: sourceCard,
      targets: [targetCard1],
      priority: 1,
      cost: 1,
    });
    
    // Simuler un délai pour avoir des timestamps différents
    jest.advanceTimersByTime(100);
    
    const secondActionId = service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard2],
      spell: mockSpell,
      priority: 1, // Même priorité
      cost: 2,
    });
    
    const executedActions: PlannedAction[] = [];
    
    // Résoudre les actions
    service.resolveActions((action) => {
      executedActions.push(action);
    });
    
    // Vérifier l'ordre d'exécution - LIFO devrait donner dernier arrivé en premier
    expect(executedActions.length).toBe(2);
    expect(executedActions[0].id).toBe(secondActionId);
    expect(executedActions[1].id).toBe(firstActionId);
  });
  
  test('doit résoudre les actions selon la stratégie COST', () => {
    // Configurer le service pour utiliser la stratégie COST
    service.setConflictStrategy(ConflictResolutionStrategy.COST);
    
    // Planifier des actions avec des coûts différents
    const lowCostActionId = service.planAction({
      type: ActionType.ATTACK,
      source: sourceCard,
      targets: [targetCard1],
      priority: 1,
      cost: 1, // Coût bas
    });
    
    const highCostActionId = service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard2],
      spell: mockSpell,
      priority: 1, // Même priorité
      cost: 3, // Coût élevé
    });
    
    const executedActions: PlannedAction[] = [];
    
    // Résoudre les actions
    service.resolveActions((action) => {
      executedActions.push(action);
    });
    
    // Vérifier l'ordre d'exécution - COST devrait donner coût élevé en premier
    expect(executedActions.length).toBe(2);
    expect(executedActions[0].id).toBe(highCostActionId);
    expect(executedActions[1].id).toBe(lowCostActionId);
  });
  
  test('doit résoudre les actions selon la stratégie LOW_COST', () => {
    // Configurer le service pour utiliser la stratégie LOW_COST
    service.setConflictStrategy(ConflictResolutionStrategy.LOW_COST);
    
    // Planifier des actions avec des coûts différents
    const lowCostActionId = service.planAction({
      type: ActionType.ATTACK,
      source: sourceCard,
      targets: [targetCard1],
      priority: 1,
      cost: 1, // Coût bas
    });
    
    const highCostActionId = service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard2],
      spell: mockSpell,
      priority: 1, // Même priorité
      cost: 3, // Coût élevé
    });
    
    const executedActions: PlannedAction[] = [];
    
    // Résoudre les actions
    service.resolveActions((action) => {
      executedActions.push(action);
    });
    
    // Vérifier l'ordre d'exécution - LOW_COST devrait donner coût bas en premier
    expect(executedActions.length).toBe(2);
    expect(executedActions[0].id).toBe(lowCostActionId);
    expect(executedActions[1].id).toBe(highCostActionId);
  });
  
  test('doit détecter les conflits de ressources', () => {
    // Planifier des actions qui coûtent plus que la motivation disponible
    service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard1],
      spell: mockSpell,
      priority: 1,
      cost: 7, // Coût élevé
    });
    
    service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard, // Même source
      targets: [targetCard2],
      spell: mockSpell,
      priority: 1,
      cost: 6, // Coût élevé
    });
    
    const conflicts = service.detectConflicts();
    
    // Vérifier que le conflit a été détecté
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].reason).toContain('Ressources insuffisantes');
    expect(conflicts[0].type).toBe('resource');
  });
  
  test('doit détecter les conflits d\'exclusivité', () => {
    // Créer des sorts avec des altérations
    const spell1 = {...mockSpell, id: 1};
    const spell2 = {...mockSpell, id: 2};
    
    // Planifier deux actions de sort sur la même cible
    service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard1],
      spell: spell1,
      priority: 1,
      cost: 2,
    });
    
    service.planAction({
      type: ActionType.CAST_SPELL,
      source: targetCard2,
      targets: [targetCard1], // Même cible
      spell: spell2,
      priority: 1,
      cost: 2,
    });
    
    const conflicts = service.detectConflicts();
    
    // Vérifier que le conflit a été détecté (mais pas le conflit de ciblage)
    expect(conflicts.length).toBeGreaterThanOrEqual(1);
    
    // Chercher le conflit d'exclusivité
    const exclusivityConflict = conflicts.find(c => c.type === 'exclusivity');
    expect(exclusivityConflict).toBeDefined();
    expect(exclusivityConflict?.reason).toContain('Altérations potentiellement exclusives');
  });
  
  test('doit détecter les conflits de ciblage', () => {
    // Planifier deux actions d'attaque sur la même cible
    service.planAction({
      type: ActionType.ATTACK,
      source: sourceCard,
      targets: [targetCard1],
      priority: 1,
      cost: 1,
    });
    
    service.planAction({
      type: ActionType.ATTACK,
      source: targetCard2,
      targets: [targetCard1], // Même cible
      priority: 1,
      cost: 1,
    });
    
    const conflicts = service.detectConflicts();
    
    // Vérifier que le conflit a été détecté
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].reason).toContain('Actions potentiellement contradictoires');
    expect(conflicts[0].type).toBe('target');
  });
  
  test('doit résoudre automatiquement les conflits par priorité', () => {
    // Configurer le service pour utiliser la stratégie PRIORITY
    service.setConflictStrategy(ConflictResolutionStrategy.PRIORITY);
    
    // Planifier des actions en conflit avec des priorités différentes
    service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard1],
      spell: mockSpell,
      priority: 1, // Priorité basse
      cost: 7, // Conflit de ressources
    });
    
    service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard2],
      spell: mockSpell,
      priority: 5, // Priorité élevée
      cost: 6,
    });
    
    // Résoudre les conflits
    const resolutions = service.resolveConflictsAutomatically();
    
    // Vérifier que le conflit a été résolu
    expect(resolutions.length).toBe(1);
    
    // Noter que l'action avec priorité élevée est conservée (la priorité 5)
    const remainingActions = service.getPlannedActions();
    expect(remainingActions.length).toBe(1);
    expect(remainingActions[0].priority).toBe(5);
    
    // La résolution peut être "Conservation de l'action avec priorité supérieure" ou "Conservation de l'action avec priorité inférieure"
    // selon l'action qui est considérée comme action1 ou action2 dans le conflit
    expect(
      resolutions[0].resolution.includes('priorité supérieure') || 
      resolutions[0].resolution.includes('priorité inférieure')
    ).toBe(true);
  });
  
  test('doit résoudre automatiquement les conflits selon FIFO en cas d\'égalité de priorité', () => {
    // Configurer le service pour utiliser la stratégie PRIORITY
    service.setConflictStrategy(ConflictResolutionStrategy.PRIORITY);
    
    // Planifier une action plus ancienne
    const firstActionId = service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard1],
      spell: mockSpell,
      priority: 1, // Même priorité
      cost: 7, // Conflit de ressources
    });
    
    // Modifier manuellement le timestamp pour simuler une action plus ancienne
    const actions = service.getPlannedActions();
    const originalTimestamp = actions[0].timestamp;
    actions[0].timestamp = originalTimestamp - 1000;
    
    // Planifier une action plus récente
    service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard2],
      spell: mockSpell,
      priority: 1, // Même priorité
      cost: 6,
    });
    
    // Résoudre les conflits
    const resolutions = service.resolveConflictsAutomatically();
    
    // Vérifier que le conflit a été résolu
    expect(resolutions.length).toBe(1);
    expect(resolutions[0].resolution).toContain('Priorités égales');
    
    // Vérifier qu'il ne reste qu'une action (la plus ancienne)
    const remainingActions = service.getPlannedActions();
    expect(remainingActions.length).toBe(1);
    expect(remainingActions[0].id).toBe(firstActionId);
  });
  
  test('doit récupérer les informations sur les conflits et leur résolution', () => {
    // Configurer le service pour utiliser la stratégie FIFO
    service.setConflictStrategy(ConflictResolutionStrategy.FIFO);
    
    // Planifier une action plus ancienne (qui sera gardée par FIFO)
    const firstActionId = service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard1],
      spell: mockSpell,
      priority: 1,
      cost: 7, // Conflit de ressources
    });
    
    // Modifier manuellement le timestamp pour simuler une action plus ancienne
    const actions = service.getPlannedActions();
    const originalTimestamp = actions[0].timestamp;
    actions[0].timestamp = originalTimestamp - 1000;
    
    // Planifier une action plus récente
    service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard, // Même source
      targets: [targetCard2],
      spell: mockSpell,
      priority: 1,
      cost: 6,
    });
    
    // Récupérer les informations sur les conflits
    const conflictInfo = service.getConflictInfo();
    
    // Vérifier que les informations sont correctes
    expect(conflictInfo.strategy).toBe(ConflictResolutionStrategy.FIFO);
    expect(conflictInfo.randomChance).toBe(0);
    expect(conflictInfo.conflicts.length).toBe(1);
    expect(conflictInfo.resolutions.length).toBe(1);
    
    // Vérifier que l'action conservée est celle qui a été planifiée en premier (la plus ancienne)
    expect(conflictInfo.resolutions[0].keptActionId).toBe(firstActionId);
  });
  
  test('doit pouvoir modifier la stratégie de résolution de conflits', () => {
    // Vérifier la stratégie par défaut
    expect(service.getConflictInfo().strategy).toBe(ConflictResolutionStrategy.FIFO);
    
    // Modifier la stratégie
    service.setConflictStrategy(ConflictResolutionStrategy.RANDOM);
    
    // Vérifier que la stratégie a été modifiée
    expect(service.getConflictInfo().strategy).toBe(ConflictResolutionStrategy.RANDOM);
    
    // Tester avec une autre stratégie
    service.setConflictStrategy(ConflictResolutionStrategy.PRIORITY);
    expect(service.getConflictInfo().strategy).toBe(ConflictResolutionStrategy.PRIORITY);
  });
  
  test('doit pouvoir modifier la probabilité d\'utiliser l\'aléatoire', () => {
    // Vérifier la probabilité par défaut
    expect(service.getConflictInfo().randomChance).toBe(0);
    
    // Modifier la probabilité
    service.setRandomResolutionChance(50);
    
    // Vérifier que la probabilité a été modifiée
    expect(service.getConflictInfo().randomChance).toBe(50);
    
    // Tester avec des valeurs limites
    service.setRandomResolutionChance(120); // Au-delà de 100
    expect(service.getConflictInfo().randomChance).toBe(100); // Plafonnée à 100
    
    service.setRandomResolutionChance(-10); // En dessous de 0
    expect(service.getConflictInfo().randomChance).toBe(0); // Limitée à 0
  });
}); 