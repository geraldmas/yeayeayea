import React from 'react';
import GameCard, { CardType, CardRarity } from './GameCard';
import './GameCardGrid.css';

interface Card {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  description?: string;
  image?: string;
  summon_cost?: number;
  properties?: any;
  is_wip?: boolean;
  is_crap?: boolean;
}

interface GameCardGridProps {
  cards: Card[];
  onCardClick?: (card: Card) => void;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  maxCards?: number;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

const GameCardGrid: React.FC<GameCardGridProps> = ({
  cards,
  onCardClick,
  title = 'Cartes',
  subtitle,
  emptyMessage = 'Aucune carte à afficher',
  maxCards,
  showLoadMore = false,
  onLoadMore,
  isLoading = false
}) => {
  // Gérer la limite de cartes si spécifiée
  const displayedCards = maxCards ? cards.slice(0, maxCards) : cards;
  
  // Gérer le clic sur une carte
  const handleCardClick = (card: Card) => {
    if (onCardClick) {
      onCardClick(card);
    }
  };
  
  return (
    <div className="game-card-grid-container">
      {/* En-tête de la grille */}
      {(title || subtitle) && (
        <div className="game-card-grid-header">
          {title && <h2 className="game-card-grid-title">{title}</h2>}
          {subtitle && <p className="game-card-grid-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Grille de cartes */}
      {displayedCards.length > 0 ? (
        <div className="game-card-grid">
          {displayedCards.map(card => (
            <div key={card.id} className="game-card-wrapper">
              <GameCard
                id={card.id}
                name={card.name}
                type={card.type}
                rarity={card.rarity}
                image={card.image}
                description={card.description}
                summonCost={card.summon_cost}
                health={card.properties?.health || card.properties?.pv}
                isWip={card.is_wip}
                isCrap={card.is_crap}
                onClick={() => handleCardClick(card)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="game-card-grid-empty">
          <p>{isLoading ? 'Chargement des cartes...' : emptyMessage}</p>
        </div>
      )}
      
      {/* Bouton "Charger plus" */}
      {showLoadMore && cards.length > 0 && (
        <div className="game-card-grid-load-more">
          <button 
            className="btn btn-outline" 
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Chargement...' : 'Charger plus'}
          </button>
        </div>
      )}
    </div>
  );
};

export default GameCardGrid; 