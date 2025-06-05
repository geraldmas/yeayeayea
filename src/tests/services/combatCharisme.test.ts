import { v4 as uuidv4 } from 'uuid';
import { CombatManagerImpl, CardInstanceImpl } from '../../services/combatService';
import {
  Player as CharismePlayer,
  initializePlayerCharisme,
  CHARISME_GAIN_BY_RARITY,
} from '../../utils/charismeService';
import { Card } from '../../types/index';

const createTestPlayer = (): CharismePlayer => {
  const base: any = {
    id: uuidv4(),
    name: 'Test Player',
    activeCard: null,
    benchCards: [],
    inventory: [],
    hand: [],
    motivation: 10,
    baseMotivation: 10,
    motivationModifiers: [],
    movementPoints: 0,
    points: 0,
    effects: [],
  };
  return initializePlayerCharisme(base);
};

const testCard: Card = {
  id: 1,
  name: 'Test Card',
  description: null,
  type: 'personnage',
  rarity: 'gros_bodycount',
  properties: { health: 5 },
  summon_cost: 5,
  image: null,
  passive_effect: null,
  is_wip: false,
  is_crap: false,
};

describe('CombatService - Charisme', () => {
  let combat: CombatManagerImpl;

  beforeEach(() => {
    combat = new CombatManagerImpl();
  });

  test('summonCardForPlayer dépense le charisme du joueur', () => {
    const player = createTestPlayer();
    player.charisme = 10;

    const instance = combat.summonCardForPlayer(testCard, player);

    expect(instance).not.toBeNull();
    expect(player.charisme).toBe(5);
    expect(combat.cardInstances.length).toBe(1);
  });

  test('summonCardForPlayer échoue si charisme insuffisant', () => {
    const player = createTestPlayer();
    player.charisme = 3;

    const instance = combat.summonCardForPlayer(testCard, player);

    expect(instance).toBeNull();
    expect(player.charisme).toBe(3);
    expect(combat.cardInstances.length).toBe(0);
  });

  test('handleCardDefeat ajoute le charisme au vainqueur', () => {
    const player = createTestPlayer();
    player.charisme = 0;
    const defeated = new CardInstanceImpl(testCard);

    combat.handleCardDefeat(defeated, player);

    expect(player.charisme).toBe(CHARISME_GAIN_BY_RARITY.gros_bodycount);
  });
});
