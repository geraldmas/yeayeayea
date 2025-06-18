import { CombatManagerImpl } from '../../services/combatService';
import { Card } from '../../types';

const createLieuCard = (): Card => ({
  id: 99,
  name: 'Lieu Test',
  description: '',
  type: 'lieu',
  rarity: 'interessant',
  properties: {},
  summon_cost: 0,
  image: '',
  passive_effect: JSON.stringify({ type: 'heal', value: 2 }),
  is_wip: false,
  is_crap: false
});

const createCharacterCard = (): Card => ({
  id: 1,
  name: 'Perso',
  description: '',
  type: 'personnage',
  rarity: 'gros_bodycount',
  properties: { health: 5, attack: 1, defense: 1 },
  summon_cost: 1,
  image: '',
  passive_effect: '',
  is_wip: false,
  is_crap: false
});

describe('CombatManager - effets des cartes lieu', () => {
  test('applyActiveLieuEffects soigne toutes les cartes', () => {
    const manager = new CombatManagerImpl();
    const lieu = manager.convertCardToInstance(createLieuCard());
    const perso = manager.convertCardToInstance(createCharacterCard());
    perso.currentHealth = 3;
    manager.cardInstances = [perso];
    // Ajouter le lieu dans les cartes disponibles pour éviter les erreurs
    // @ts-ignore accès direct pour le test
    manager['lieuCardService']['commonLieuCards'].push(lieu);
    manager.changeLieuCard(lieu);
    manager.applyActiveLieuEffects();
    expect(perso.currentHealth).toBe(5);
  });
});
