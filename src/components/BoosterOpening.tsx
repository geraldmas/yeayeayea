import React, { useState } from 'react';
import CardPreview from './CardPreview';
import { boosterService } from '../utils/boosterService';
import { supabase } from '../utils/supabaseClient';
import type { Card } from '../types';
import './BoosterOpening.css';

interface BoosterOpeningProps {
  boosterType?: string;
}

const BoosterOpening: React.FC<BoosterOpeningProps> = ({ boosterType = 'standard_booster' }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openBooster = async () => {
    try {
      setIsOpening(true);
      setError(null);
      const result = await boosterService.openBooster(boosterType);
      if (result.cards && result.cards.length > 0) {
        const ids = result.cards.map((c: any) => c.id);
        const { data, error: fetchError } = await supabase
          .from('cards')
          .select('*')
          .in('id', ids);
        if (fetchError) throw fetchError;
        setCards(data as Card[]);
      }
    } catch (err: any) {
      console.error('Erreur ouverture booster:', err);
      setError(err.message || 'Erreur inconnue');
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="booster-opening">
      <button onClick={openBooster} disabled={isOpening} className="open-btn">
        {isOpening ? 'Ouverture...' : 'Ouvrir un booster'}
      </button>
      {error && <div className="error-msg">{error}</div>}
      <div className="opened-cards">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="opened-card slide-in-up"
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <CardPreview card={card} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoosterOpening;
