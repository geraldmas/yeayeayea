import { CardInstanceImpl } from '../combatService';
import { Card, Alteration, Tag } from '../../types/index';

// Mocks pour les tests
const mockCard: Card = {
  id: 1,
  name: 'Carte Test',
  description: 'Carte utilisée pour les tests',
  type: 'personnage',
  rarity: 'banger',
  properties: {
    health: 10,
    attack: 2,
    defense: 1
  },
  summon_cost: 3,
  image: null,
  passive_effect: null,
  is_wip: false,
  is_crap: false
};

const mockAlteration: Alteration = {
  id: 1,
  name: 'Poison',
  description: 'Inflige des dégâts sur la durée',
  effect: {
    action: 'damage_over_time',
    value: 2
  },
  icon: 'poison-icon.png',
  duration: 3,
  stackable: true,
  unique_effect: false,
  type: 'debuff',
  color: 'green'
};

const mockAlterationBuff: Alteration = {
  id: 2,
  name: 'Force',
  description: 'Augmente l\'attaque',
  effect: {
    action: 'modify_attack',
    value: 2
  },
  icon: 'strength-icon.png',
  duration: 2,
  stackable: true,
  unique_effect: false,
  type: 'buff',
  color: 'red'
};

const mockTag: Tag = {
  id: 1,
  name: 'Résistant',
  passive_effect: 'Réduit les dégâts subis'
};

describe('CardInstance - Propriétés d\'état temporaire', () => {
  let cardInstance: CardInstanceImpl;

  beforeEach(() => {
    cardInstance = new CardInstanceImpl(mockCard);
  });

  test('doit initialiser correctement les propriétés temporaires', () => {
    expect(cardInstance.currentHealth).toBe(10);
    expect(cardInstance.maxHealth).toBe(10);
    expect(cardInstance.temporaryStats).toBeDefined();
    expect(cardInstance.temporaryStats.attack).toBe(2);
    expect(cardInstance.temporaryStats.defense).toBe(1);
    expect(cardInstance.activeEffects).toEqual({});
  });

  test('doit appliquer une altération et mettre à jour les statistiques temporaires', () => {
    const sourceInstance = new CardInstanceImpl(mockCard);
    cardInstance.addAlteration(mockAlterationBuff, sourceInstance);
    
    expect(cardInstance.activeAlterations.length).toBe(1);
    expect(cardInstance.temporaryStats.attack).toBe(4); // 2 (base) + 2 (buff)
  });

  test('doit empiler les altérations et cumuler les effets', () => {
    const sourceInstance = new CardInstanceImpl(mockCard);
    cardInstance.addAlteration(mockAlterationBuff, sourceInstance);
    cardInstance.addAlteration(mockAlterationBuff, sourceInstance);
    
    expect(cardInstance.activeAlterations.length).toBe(1);
    expect(cardInstance.activeAlterations[0].stackCount).toBe(2);
    expect(cardInstance.temporaryStats.attack).toBe(6); // 2 (base) + 2*2 (buff)
  });

  test('doit retirer les effets d\'une altération quand elle expire', () => {
    const sourceInstance = new CardInstanceImpl(mockCard);
    const alterationWithShortDuration = { ...mockAlterationBuff, duration: 1 };
    
    cardInstance.addAlteration(alterationWithShortDuration, sourceInstance);
    expect(cardInstance.temporaryStats.attack).toBe(4);
    
    cardInstance.resetForNextTurn();
    expect(cardInstance.activeAlterations.length).toBe(0);
    expect(cardInstance.temporaryStats.attack).toBe(2); // Retour à la valeur de base
  });

  test('doit pouvoir suivre l\'historique des modifications de PV', () => {
    expect(cardInstance.damageHistory).toEqual([]);
    
    cardInstance.applyDamage(3);
    expect(cardInstance.currentHealth).toBe(7);
    expect(cardInstance.damageHistory.length).toBe(1);
    expect(cardInstance.damageHistory[0].amount).toBe(3);
    expect(cardInstance.damageHistory[0].type).toBe('damage');
    
    cardInstance.heal(2);
    expect(cardInstance.currentHealth).toBe(9);
    expect(cardInstance.damageHistory.length).toBe(2);
    expect(cardInstance.damageHistory[1].amount).toBe(2);
    expect(cardInstance.damageHistory[1].type).toBe('heal');
  });

  test('doit gérer correctement les bonus et malus de dégâts', () => {
    const sourceInstance = new CardInstanceImpl(mockCard);
    const damageReductionAlteration: Alteration = {
      id: 3,
      name: 'Protection',
      description: 'Réduit les dégâts reçus',
      effect: {
        action: 'modify_damage_taken_multiply',
        value: 0.5 // 50% de réduction
      },
      icon: 'shield-icon.png',
      duration: 2,
      stackable: false,
      unique_effect: true,
      type: 'buff',
      color: 'blue'
    };
    
    cardInstance.addAlteration(damageReductionAlteration, sourceInstance);
    cardInstance.applyDamage(10);
    
    expect(cardInstance.currentHealth).toBe(5); // 10 - (10 * 0.5)
  });

  test('doit gérer les effets persistants entre les tours', () => {
    const sourceInstance = new CardInstanceImpl(mockCard);
    cardInstance.addAlteration(mockAlteration, sourceInstance); // Poison
    
    expect(cardInstance.activeAlterations.length).toBe(1);
    expect(cardInstance.currentHealth).toBe(10);
    
    // Simuler la fin du tour et l'application des altérations
    cardInstance.applyAlterationEffects();
    expect(cardInstance.currentHealth).toBe(8); // 10 - 2 (poison)
    
    cardInstance.resetForNextTurn();
    expect(cardInstance.activeAlterations.length).toBe(1); // Altération encore active
    
    cardInstance.applyAlterationEffects();
    expect(cardInstance.currentHealth).toBe(6); // 8 - 2 (poison)
    
    cardInstance.resetForNextTurn();
    expect(cardInstance.activeAlterations.length).toBe(1); // Altération encore active
    
    cardInstance.applyAlterationEffects();
    expect(cardInstance.currentHealth).toBe(4); // 6 - 2 (poison)
    
    cardInstance.resetForNextTurn();
    expect(cardInstance.activeAlterations.length).toBe(0); // Altération expirée
  });
}); 