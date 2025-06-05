import { normalizeCardForFrontend, normalizeCardForDatabase, normalizeCardsForFrontend } from '../../utils/helpers';
import { Card, CardFrontend } from '../../types';

describe('helpers', () => {
  const baseCard: Card = {
    id: 1,
    name: 'Test Card',
    type: 'personnage',
    rarity: 'interessant',
    description: 'desc',
    image: 'img.png',
    passive_effect: 'effect',
    properties: { health: 5 },
    is_wip: true,
    is_crap: false,
    summon_cost: 2
  };

  test('normalizeCardForFrontend converts snake_case fields to camelCase', () => {
    const result = normalizeCardForFrontend(baseCard);
    expect(result).toMatchObject({
      id: baseCard.id,
      isWIP: baseCard.is_wip,
      isCrap: baseCard.is_crap,
      passiveEffect: baseCard.passive_effect,
      summonCost: baseCard.summon_cost
    });
    expect(result.spells).toEqual([]);
    expect(result.tags).toEqual([]);
  });

  test('normalizeCardForDatabase converts camelCase fields to snake_case', () => {
    const frontend: CardFrontend = {
      ...baseCard,
      isWIP: true,
      isCrap: false,
      passiveEffect: 'effect',
      summonCost: 2,
      spells: [],
      tags: []
    };
    const result = normalizeCardForDatabase(frontend);
    expect(result).toMatchObject({
      id: 1,
      name: 'Test Card',
      type: 'personnage',
      rarity: 'interessant',
      description: 'desc',
      image: 'img.png',
      passive_effect: 'effect',
      properties: { health: 5 },
      is_wip: true,
      is_crap: false,
      summon_cost: 2
    });
  });

  test('normalizeCardsForFrontend maps an array of cards', () => {
    const cards = [baseCard, { ...baseCard, id: 2 }];
    const result = normalizeCardsForFrontend(cards);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });
});
