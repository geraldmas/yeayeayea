import React from 'react';
import { Card } from '../types';

interface HandProps {
  cards: Card[];
  onDragStart: (e: React.DragEvent, card: Card) => void;
  onCardClick?: (card: Card) => void;
}

const Hand: React.FC<HandProps> = ({ cards, onDragStart, onCardClick }) => {
  return (
    <div className="player-hand-container">
      <div className="section-title">Votre Main</div>
      <div className="player-hand">
        {cards.length > 0 ? (
          cards.map(card => (
            <div
              key={`hand-card-${card.id}`}
              className={`hand-card hand-card-${card.type} ${card.type === 'evenement' ? 'face-down' : ''}`}
              draggable
              onDragStart={e => onDragStart(e, card)}
              onClick={() => onCardClick && onCardClick(card)}
            >
              {card.type !== 'evenement' ? (
                <>
                  <div className="card-name">{card.name}</div>
                  <div className="card-type">{card.type}</div>
                  {card.type === 'personnage' && card.properties && card.properties.health && (
                    <div className="card-health">❤️ {card.properties.health}</div>
                  )}
                  {card.rarity && (
                    <div className="card-rarity">{card.rarity}</div>
                  )}
                  {card.type === 'action' && (
                    <div className="action-indicator">Activable partout</div>
                  )}
                </>
              ) : (
                <div className="event-card-back">Événement</div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-hand-message">
            <span>Aucune carte en main</span>
            <div className="hand-hint">Utilisez le bouton \"Piocher une carte\" ci-dessous</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hand;
