import React from 'react';
import './GameCard.css';

interface GameCardProps {
  id: number;
  name: string;
  type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
  rarity: 'gros_bodycount' | 'interessant' | 'banger' | 'cheate';
  image?: string;
  description?: string;
  summonCost?: number;
  health?: number;
  isWip?: boolean;
  isCrap?: boolean;
  onClick?: () => void;
}

const GameCard: React.FC<GameCardProps> = ({
  id,
  name,
  type,
  rarity,
  image,
  description,
  summonCost,
  health,
  isWip = false,
  isCrap = false,
  onClick
}) => {
  // Mappings des types vers des icônes et des couleurs
  const typeIcons = {
    personnage: '👤',
    objet: '🔮',
    evenement: '⚡',
    lieu: '🏙️',
    action: '⚔️'
  };
  
  // Fonction pour formater la rareté en texte lisible
  const formatRarity = (rarity: string) => {
    switch(rarity) {
      case 'gros_bodycount':
        return 'Commune';
      case 'interessant':
        return 'Peu Commune';
      case 'banger':
        return 'Rare';
      case 'cheate':
        return 'Légendaire';
      default:
        return rarity;
    }
  };
  
  // Calculer les classes CSS en fonction des propriétés
  const cardClasses = [
    'game-card',
    `card-type-${type}`,
    `card-rarity-${rarity}`,
    isWip ? 'card-wip' : '',
    isCrap ? 'card-crap' : '',
  ].filter(Boolean).join(' ');
  
  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="card-header">
        <div className="card-name">{name}</div>
        <div className="card-cost">{summonCost}</div>
      </div>
      
      <div className="card-image-container">
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="card-image" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/default-card.jpg';
            }}
          />
        ) : (
          <div className="card-image-placeholder">
            <span className="card-type-icon">{typeIcons[type]}</span>
          </div>
        )}
        
        <div className="card-type-badge">
          <span className="card-type-icon">{typeIcons[type]}</span>
          <span className="card-type-text">{type}</span>
        </div>
        
        {(isWip || isCrap) && (
          <div className={`card-status-badge ${isWip ? 'wip' : ''} ${isCrap ? 'crap' : ''}`}>
            {isWip ? 'En cours' : ''}
            {isWip && isCrap ? ' / ' : ''}
            {isCrap ? 'À retravailler' : ''}
          </div>
        )}
      </div>
      
      <div className="card-body">
        <div className="card-description" title={description}>
          {description ? (
            description.length > 100 ? `${description.slice(0, 100)}...` : description
          ) : (
            <span className="card-no-description">Pas de description</span>
          )}
        </div>
      </div>
      
      <div className="card-footer">
        <div className="card-rarity">
          <span className="rarity-dot"></span>
          <span className="rarity-text">{formatRarity(rarity)}</span>
        </div>
        
        {type === 'personnage' && health !== undefined && (
          <div className="card-health">
            {health} PV
          </div>
        )}
        
        <div className="card-id">#{id}</div>
      </div>
      
      <div className="card-glow"></div>
    </div>
  );
};

export default GameCard; 