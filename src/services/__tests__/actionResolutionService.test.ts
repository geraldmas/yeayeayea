import { ActionResolutionService, ActionType, PlannedAction } from '../actionResolutionService';
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
  power: 5,
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
  
  test('doit résoudre les actions dans l\'ordre de priorité', () => {
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
    
    // Vérifier que les actions ont été vidées
    expect(service.getPlannedActions().length).toBe(0);
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
    
    // Vérifier que le conflit a été détecté
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].reason).toContain('Altérations potentiellement exclusives');
  });
  
  test('doit résoudre automatiquement les conflits par priorité', () => {
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
    expect(resolutions[0].resolution).toContain('priorité inférieure');
    
    // Vérifier qu'il ne reste qu'une action (celle avec la priorité la plus élevée)
    const remainingActions = service.getPlannedActions();
    expect(remainingActions.length).toBe(1);
    expect(remainingActions[0].priority).toBe(5);
  });
  
  test('doit résoudre automatiquement les conflits par timestamp en cas d\'égalité de priorité', () => {
    // Simuler un délai pour avoir des timestamps différents
    const action1 = service.planAction({
      type: ActionType.CAST_SPELL,
      source: sourceCard,
      targets: [targetCard1],
      spell: mockSpell,
      priority: 1,
      cost: 7, // Conflit de ressources
    });
    
    // Modifier manuellement le timestamp pour simuler une action plus ancienne
    const actions = service.getPlannedActions();
    actions[0].timestamp = Date.now() - 1000;
    
    // Planifier une action plus récente avec la même priorité
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
    expect(resolutions[0].resolution).toContain('planifiée plus tard');
    
    // Vérifier qu'il ne reste qu'une action (la plus ancienne)
    const remainingActions = service.getPlannedActions();
    expect(remainingActions.length).toBe(1);
    expect(remainingActions[0].id).toBe(action1);
  });
}); 