import { Card } from '../types';

const STORAGE_PREFIX = 'card_';

export const saveCard = (card: Card) => {
  if (!card.name) return;
  const storageKey = STORAGE_PREFIX + card.name.toLowerCase().replace(/\s+/g, '_');
  localStorage.setItem(storageKey, JSON.stringify(card));
};

export const loadCard = (cardName: string): Card | null => {
  const storageKey = STORAGE_PREFIX + cardName.toLowerCase().replace(/\s+/g, '_');
  const savedCard = localStorage.getItem(storageKey);
  return savedCard ? JSON.parse(savedCard) : null;
};

export const listSavedCards = (): string[] => {
  const savedCards: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const cardName = key.substring(STORAGE_PREFIX.length).replace(/_/g, ' ');
      savedCards.push(cardName);
    }
  }
  return savedCards;
};