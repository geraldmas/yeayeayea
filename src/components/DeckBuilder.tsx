import React, { useEffect, useState } from 'react';
import { userService } from '../utils/userService';
import type { Card } from '../types';
import type { Deck } from '../types/userTypes';

const MAX_DECK_SIZE = 30;
const ALLOWED_RARITIES = ['gros_bodycount', 'interessant', 'banger', 'cheate'] as const;

interface DeckBuilderProps {
  user: { id: string };
}

type DeckCard = { card: Card; quantity: number };

const DeckBuilder: React.FC<DeckBuilderProps> = ({ user }) => {
  const [inventory, setInventory] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deckName, setDeckName] = useState('');
  const [deckCards, setDeckCards] = useState<Record<number, DeckCard>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const items = await userService.getInventory(user.id);
      const cards = (items || []).map((i: any) => ({ ...i.cards }));
      setInventory(cards);
      const userDecks = await userService.getDecks(user.id);
      setDecks(userDecks || []);
    };
    load();
  }, [user]);

  const loadDeck = (id: string | null) => {
    setSelectedDeckId(id);
    setMessage(null);
    if (!id) {
      setDeckName('');
      setDeckCards({});
      return;
    }
    const deck = decks.find(d => d.id === id);
    if (!deck) return;
    setDeckName(deck.name);
    const cards: Record<number, DeckCard> = {};
    (deck as any).deck_cards.forEach((dc: any) => {
      cards[dc.card_id] = { card: dc.cards, quantity: dc.quantity };
    });
    setDeckCards(cards);
  };

  const currentSize = Object.values(deckCards).reduce((s, dc) => s + dc.quantity, 0);

  const validate = () => {
    if (currentSize > MAX_DECK_SIZE) return `Deck trop grand (max ${MAX_DECK_SIZE})`;
    for (const dc of Object.values(deckCards)) {
      if (!ALLOWED_RARITIES.includes(dc.card.rarity as any)) {
        return `Rareté interdite: ${dc.card.rarity}`;
      }
    }
    return null;
  };

  const addCard = (card: Card) => {
    const size = currentSize;
    if (size >= MAX_DECK_SIZE) return;
    if (!ALLOWED_RARITIES.includes(card.rarity as any)) return;
    setDeckCards(prev => {
      const existing = prev[card.id];
      return {
        ...prev,
        [card.id]: { card, quantity: existing ? existing.quantity + 1 : 1 }
      };
    });
  };

  const removeCard = (cardId: number) => {
    setDeckCards(prev => {
      const existing = prev[cardId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const { [cardId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [cardId]: { card: existing.card, quantity: existing.quantity - 1 } };
    });
  };

  const saveDeck = async () => {
    const error = validate();
    if (error) { setMessage(error); return; }
    try {
      let deckId = selectedDeckId;
      if (!deckId) {
        const deck = await userService.createDeck({ user_id: user.id, name: deckName, description: null });
        deckId = deck.id;
        setSelectedDeckId(deckId);
      } else {
        await userService.updateDeck(deckId, { name: deckName });
      }
      const cards = Object.values(deckCards).map(dc => ({ card_id: dc.card.id, quantity: dc.quantity }));
      await userService.saveDeckCards(deckId!, cards);
      const userDecks = await userService.getDecks(user.id);
      setDecks(userDecks || []);
      setMessage('Deck sauvegardé');
    } catch (err) {
      console.error('Erreur sauvegarde deck:', err);
      setMessage('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="deck-builder">
      <h2>Deck Builder</h2>
      <div>
        <select value={selectedDeckId || ''} onChange={e => loadDeck(e.target.value || null)}>
          <option value="">Nouveau deck</option>
          {decks.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input placeholder="Nom du deck" value={deckName} onChange={e => setDeckName(e.target.value)} />
        <button onClick={saveDeck}>Sauvegarder</button>
        {message && <span className="deck-message">{message}</span>}
      </div>
      <div className="deck-builder-content">
        <div className="inventory">
          <h3>Cartes disponibles</h3>
          <ul>
            {inventory.map(card => (
              <li key={card.id}>
                {card.name} ({card.rarity})
                <button onClick={() => addCard(card)}>+</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="current-deck">
          <h3>Deck ({currentSize}/{MAX_DECK_SIZE})</h3>
          <ul>
            {Object.values(deckCards).map(dc => (
              <li key={dc.card.id}>
                {dc.card.name} x{dc.quantity}
                <button onClick={() => removeCard(dc.card.id)}>-</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DeckBuilder;
