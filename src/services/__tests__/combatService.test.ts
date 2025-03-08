import { CardInstanceImpl, CombatManagerImpl } from '../combatService';
import { Card, Alteration, Tag, Spell } from '../../types/index';
import { TargetType } from '../../types/combat';

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
  range_min: 1,
  range_max: 3,
  effects: [
    {
      type: 'damage',
      value: 3,
      targetType: 'opponent'
    }
  ],
  is_value_percentage: false
};

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