/**
 * @file PlayerBaseService.test.ts
 * @description Tests unitaires pour le service PlayerBase
 */

import { createPlayerBase, PlayerBaseImpl } from '../services/PlayerBaseService';
import { createPlayerBaseFromConfig } from '../services/PlayerBaseService';
import { PlayerBase, PlayerBaseConfig } from '../types/player';
import { Alteration } from '../types';

// Mock de gameConfigService pour les tests liés à la configuration
jest.mock('../utils/dataService', () => ({
  gameConfigService: {
    getValue: jest.fn()
  }
}));

// Mock pour une altération de test
const createMockAlteration = (id: number, stackable: boolean = false, duration: number | undefined = undefined): Alteration => {
  return {
    id,
    name: `Altération test ${id}`,
    description: `Description de l'altération test ${id}`,
    type: 'buff',
    stackable,
    unique_effect: false,
    duration,
    effect: {}
  };
};

describe('PlayerBaseService', () => {
  let playerBase: PlayerBase;
  
  beforeEach(() => {
    // Réinitialiser la base du joueur avant chaque test avec la configuration par défaut
    playerBase = createPlayerBase({ maxHealth: 100 });
  });
  
  test('devrait créer une base avec la configuration par défaut', () => {
    expect(playerBase).toBeDefined();
    expect(playerBase.maxHealth).toBe(100);
    expect(playerBase.currentHealth).toBe(100);
    expect(playerBase.activeAlterations).toEqual([]);
  });
  
  test('devrait créer une base avec une configuration personnalisée', () => {
    const config: PlayerBaseConfig = { maxHealth: 200 };
    const customBase = createPlayerBase(config);

    expect(customBase.maxHealth).toBe(200);
    expect(customBase.currentHealth).toBe(200);
  });

  test('devrait appliquer la réduction de dégâts configurée', () => {
    const baseWithReduction = createPlayerBase({ maxHealth: 100, damageReductionFactor: 0.5 });
    const result = baseWithReduction.applyDamage(20);

    // 20 * 0.5 = 10 de dégâts subis
    expect(result).toBe(10);
    expect(baseWithReduction.currentHealth).toBe(90);
  });
  
  test('devrait appliquer des dégâts correctement', () => {
    const damage = 30;
    const result = playerBase.applyDamage(damage, 'Test source');

    expect(result).toBe(15);
    expect(playerBase.currentHealth).toBe(85);
  });

  test('devrait limiter les dégâts à la santé actuelle', () => {
    // Infliger une très grosse quantité de dégâts
    const damage = 400;
    const result = playerBase.applyDamage(damage, 'Test source');

    expect(result).toBe(100); // Seulement 100 dégâts appliqués
    expect(playerBase.currentHealth).toBe(0);
  });
  
  test('devrait soigner correctement', () => {
    // D'abord infliger des dégâts
    playerBase.applyDamage(50);
    expect(playerBase.currentHealth).toBe(75);
    
    // Puis soigner
    const healAmount = 20;
    const result = playerBase.heal(healAmount, 'Test heal');
    
    expect(result).toBe(20);
    expect(playerBase.currentHealth).toBe(95);
  });
  
  test('devrait limiter les soins aux PV manquants', () => {
    // D'abord infliger des dégâts
    playerBase.applyDamage(30);
    expect(playerBase.currentHealth).toBe(85);
    
    // Puis tenter de soigner plus que nécessaire
    const healAmount = 50;
    const result = playerBase.heal(healAmount, 'Test heal');
    
    expect(result).toBe(15); // Seulement 15 soins appliqués
    expect(playerBase.currentHealth).toBe(100);
  });
  
  test('devrait détecter correctement la destruction de la base', () => {
    expect(playerBase.isDestroyed()).toBe(false);

    playerBase.applyDamage(200);
    
    expect(playerBase.currentHealth).toBe(0);
    expect(playerBase.isDestroyed()).toBe(true);
  });
  
  test('devrait ajouter une altération non-empilable correctement', () => {
    const alteration = createMockAlteration(1, false, 3);
    
    playerBase.addAlteration(alteration, null);
    
    expect(playerBase.activeAlterations.length).toBe(1);
    expect(playerBase.hasAlteration(1)).toBe(true);
    expect(playerBase.activeAlterations[0].remainingDuration).toBe(3);
  });
  
  test('devrait mettre à jour la durée d\'une altération non-empilable existante', () => {
    const alteration = createMockAlteration(1, false, 3);
    
    playerBase.addAlteration(alteration, null);
    expect(playerBase.activeAlterations[0].remainingDuration).toBe(3);
    
    // Ajouter à nouveau la même altération avec une durée différente
    const updatedAlteration = { ...alteration, duration: 5 };
    playerBase.addAlteration(updatedAlteration, null);
    
    // La durée devrait être mise à jour, mais pas créer de nouvelle entrée
    expect(playerBase.activeAlterations.length).toBe(1);
    expect(playerBase.activeAlterations[0].remainingDuration).toBe(5);
  });
  
  test('devrait empiler les altérations empilables', () => {
    const alteration = createMockAlteration(1, true, 3);
    
    playerBase.addAlteration(alteration, null);
    playerBase.addAlteration(alteration, null);
    
    expect(playerBase.activeAlterations.length).toBe(1);
    expect(playerBase.activeAlterations[0].stackCount).toBe(2);
  });
  
  test('devrait supprimer une altération correctement', () => {
    const alteration1 = createMockAlteration(1);
    const alteration2 = createMockAlteration(2);
    
    playerBase.addAlteration(alteration1, null);
    playerBase.addAlteration(alteration2, null);
    
    expect(playerBase.activeAlterations.length).toBe(2);
    
    playerBase.removeAlteration(1);
    
    expect(playerBase.activeAlterations.length).toBe(1);
    expect(playerBase.hasAlteration(1)).toBe(false);
    expect(playerBase.hasAlteration(2)).toBe(true);
  });
  
  test('devrait réduire la durée des altérations lors du resetForNextTurn', () => {
    const alteration1 = createMockAlteration(1, false, 2);
    const alteration2 = createMockAlteration(2, false, 1);
    const alteration3 = createMockAlteration(3, false); // Sans durée (permanente)
    
    playerBase.addAlteration(alteration1, null);
    playerBase.addAlteration(alteration2, null);
    playerBase.addAlteration(alteration3, null);
    
    expect(playerBase.activeAlterations.length).toBe(3);
    
    // Simuler la fin du tour
    playerBase.resetForNextTurn();
    
    // alteration2 devrait être supprimée (durée = 0)
    // alteration1 devrait avoir durée = 1
    // alteration3 devrait rester inchangée (durée = null)
    expect(playerBase.activeAlterations.length).toBe(2);
    expect(playerBase.hasAlteration(2)).toBe(false);
    expect(playerBase.activeAlterations.find(a => a.alteration.id === 1)?.remainingDuration).toBe(1);
    expect(playerBase.activeAlterations.find(a => a.alteration.id === 3)?.remainingDuration).toBeNull();
    
    // Simuler un autre tour
    playerBase.resetForNextTurn();
    
    // Maintenant alteration1 devrait aussi être supprimée
    expect(playerBase.activeAlterations.length).toBe(1);
    expect(playerBase.hasAlteration(1)).toBe(false);
    expect(playerBase.hasAlteration(3)).toBe(true);
  });

  describe('createPlayerBaseFromConfig', () => {
    it('utilise la valeur de configuration lorsqu\'elle est disponible', async () => {
      const { gameConfigService } = require('../utils/dataService');
      gameConfigService.getValue.mockResolvedValue(150);

      const base = await createPlayerBaseFromConfig();

      expect(gameConfigService.getValue).toHaveBeenCalledWith('pv_base_initial');
      expect(base.maxHealth).toBe(150);
    });

    it('retourne la valeur par defaut en cas d\'absence de configuration', async () => {
      const { gameConfigService } = require('../utils/dataService');
      gameConfigService.getValue.mockResolvedValue(null);

      const base = await createPlayerBaseFromConfig();

      expect(base.maxHealth).toBe(100);
    });
  });
});
