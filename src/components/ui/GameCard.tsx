import React, { useState } from 'react';
import { FaStar, FaHeart, FaMoneyBillWave, FaUser, FaTag, FaMapMarkerAlt, FaBolt, FaCalendarAlt } from 'react-icons/fa';
import './GameCard.css';
import { defaultCard } from '../../assets/images';

// Types d'objets pour les cartes
export type CardType = 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
export type CardRarity = 'gros_bodycount' | 'interessant' | 'banger' | 'cheate';

export interface GameCardProps {
  id: number | string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  image?: string;
  description?: string;
  summonCost?: number;
  health?: number;
  isWip?: boolean;
  isCrap?: boolean;
  onClick?: () => void;
}

// Mapping des icônes pour les types de cartes
const typeToIcon = {
  personnage: <FaUser />,
  objet: <FaTag />,
  evenement: <FaCalendarAlt />,
  lieu: <FaMapMarkerAlt />,
  action: <FaBolt />
};

// Mapping des couleurs pour les types de cartes
const typeToColor = {
  personnage: '#7540ee',
  objet: '#2feea3',
  evenement: '#ee4040',
  lieu: '#40aaee',
  action: '#eeaa40'
};

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
  // État pour gérer l'effet de survol
  const [isHovered, setIsHovered] = useState(false);
  
  // Formatage de la rareté pour affichage
  const formatRarity = (rarity: CardRarity): string => {
    switch (rarity) {
      case 'gros_bodycount': return 'Standard';
      case 'interessant': return 'Rare';
      case 'banger': return 'Épique';
      case 'cheate': return 'Légendaire';
      default: return 'Standard';
    }
  };

  // Génération des étoiles selon la rareté
  const getRarityStars = () => {
    switch (rarity) {
      case 'gros_bodycount': return '★';
      case 'interessant': return '★★';
      case 'banger': return '★★★';
      case 'cheate': return '★★★★★';
      default: return '★';
    }
  };

  // Génération des classes CSS
  const cardClasses = [
    'game-card',
    `card-type-${type}`,
    `card-rarity-${rarity}`,
    isWip ? 'card-wip' : '',
    isCrap ? 'card-crap' : '',
    isHovered ? 'hovered' : ''
  ].filter(Boolean).join(' ');

  // Fonction pour tronquer la description
  const truncateDescription = (text?: string, maxLength = 120) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bordure supérieure colorée */}
      <div 
        className="card-top-border" 
        style={{ color: typeToColor[type] }}
      />
      
      {/* En-tête de la carte */}
      <div className="card-header">
        <div className="card-name-container">
          <div className="card-name">{name}</div>
          <div className="card-id">{id}</div>
        </div>
        {summonCost !== undefined && (
          <div className="card-cost">
            {summonCost}
            <span className="cost-icon"><FaMoneyBillWave /></span>
          </div>
        )}
      </div>
      
      {/* Wrapper d'image avec effets */}
      <div className="card-image-wrapper">
        <div className="card-image-container">
          {image ? (
            <>
              <img 
                src={image} 
                alt={name} 
                className="card-image" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = defaultCard;
                }}
              />
              <div className="card-image-overlay" />
            </>
          ) : (
            <div className="card-image-placeholder">
              <span className="card-type-icon">{typeToIcon[type]}</span>
            </div>
          )}
          
          {/* Badge de type */}
          <div 
            className="card-type-badge" 
            style={{ background: `${typeToColor[type]}dd` }}
          >
            <span className="card-type-icon">{typeToIcon[type]}</span>
            <span className="card-type-text">{type}</span>
          </div>
          
          {/* Badge de statut (si applicable) */}
          {(isWip || isCrap) && (
            <div className={`card-status-badge ${isWip ? 'wip' : ''} ${isCrap ? 'crap' : ''}`}>
              {isWip && isCrap ? 'WIP - CRAP' : isWip ? 'WIP' : 'CRAP'}
            </div>
          )}
        </div>
      </div>
      
      {/* Corps de la carte */}
      <div className="card-body">
        {/* Stats pour personnages */}
        {type === 'personnage' && health !== undefined && (
          <div className="card-stats">
            <div className="card-health">
              <span className="stat-icon"><FaHeart /></span>
              <span className="stat-value">{health}</span>
            </div>
          </div>
        )}
        
        {/* Description */}
        <div className="card-description-container">
          {description ? (
            <div className={`card-description ${isHovered ? 'scrolling' : ''}`}>
              {description}
            </div>
          ) : (
            <div className="card-description card-no-description">
              Aucune description disponible
            </div>
          )}
        </div>
      </div>
      
      {/* Pied de carte */}
      <div className="card-footer">
        <div className="card-rarity">
          <div className={`rarity-stars rarity-${rarity}`}>{getRarityStars()}</div>
          <div className="rarity-text">{formatRarity(rarity)}</div>
        </div>
      </div>
      
      {/* Effets visuels */}
      <div className="card-glow" />
      <div className="card-shine" />
      {rarity === 'cheate' && <div className="card-legendary-border" />}
    </div>
  );
};

export default GameCard; 