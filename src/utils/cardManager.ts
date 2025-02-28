import { Card } from '../types';

const SAVED_CARDS_KEY = 'savedCards';

export const saveCard = (card: Card) => {
  if (!card.name) return;
  try {
    const savedCards = localStorage.getItem(SAVED_CARDS_KEY);
    let cards: { [key: string]: Card } = {};
    
    if (savedCards) {
      cards = JSON.parse(savedCards);
    }
    
    // S'assurer que les tableaux sont toujours initialisés
    cards[card.name] = {
      ...card,
      spells: card.spells || [],
      tags: card.tags || []
    };
    
    localStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la carte:', error);
  }
};

export const loadCard = (name: string): Card | null => {
  try {
    const savedCards = localStorage.getItem(SAVED_CARDS_KEY);
    if (savedCards) {
      const cards: { [key: string]: Card } = JSON.parse(savedCards);
      const card = cards[name];
      if (card) {
        // S'assurer que les tableaux sont toujours initialisés
        return {
          ...card,
          spells: card.spells || [],
          tags: card.tags || []
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Erreur lors du chargement de la carte:', error);
    return null;
  }
};

export const listSavedCards = (): string[] => {
  try {
    const savedCards = localStorage.getItem(SAVED_CARDS_KEY);
    if (savedCards) {
      const cards: { [key: string]: Card } = JSON.parse(savedCards);
      return Object.keys(cards);
    }
    return [];
  } catch (error) {
    console.error('Erreur lors de la lecture des cartes sauvegardées:', error);
    return [];
  }
};

export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: '%';
}

export const saveCropData = (imageId: string, cropData: ImageCrop) => {
  const key = `crop_${imageId}`;
  localStorage.setItem(key, JSON.stringify(cropData));
};

export const getCropData = (imageId: string): ImageCrop | null => {
  const key = `crop_${imageId}`;
  const data = localStorage.getItem(key);
  if (data) {
    return JSON.parse(data);
  }
  return null;
};