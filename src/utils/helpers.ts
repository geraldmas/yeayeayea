import { Card, CardFrontend } from '../types';

// Helper to normalize card property naming between database (snake_case) and frontend (camelCase)
export const normalizeCardForFrontend = (card: Card): CardFrontend => {
  return {
    ...card,
    // Create virtual properties that map to the database fields
    isWIP: card.is_wip,
    isCrap: card.is_crap,
    passiveEffect: card.passive_effect,
    summonCost: card.summon_cost,
    // Initialize empty arrays for spells and tags
    spells: [],
    tags: []
  };
};

export const normalizeCardForDatabase = (card: CardFrontend): Omit<Card, 'id'> => {
  // Extract only the properties that should be saved to the database
  const { isWIP, isCrap, passiveEffect, spells, tags, ...rest } = card;
  
  return {
    ...rest,
    is_wip: isWIP,
    is_crap: isCrap,
    passive_effect: passiveEffect,
    summon_cost: card.summonCost
  };
};

// Add batch normalization helpers
export const normalizeCardsForFrontend = (cards: Card[]): CardFrontend[] => {
  return cards.map(normalizeCardForFrontend);
};