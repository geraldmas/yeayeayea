import React, { useState, useCallback, useEffect } from 'react';
import { Card, Spell } from '../types';
import ReactCrop, { Crop, PixelCrop, PercentCrop } from 'react-image-crop';
import { saveCropData, getCropData, ImageCrop } from '../utils/cardManager';
import 'react-image-crop/dist/ReactCrop.css';
import './CardPreview.css';

interface CardPreviewProps {
  card: Card;
}

// Fonction utilitaire pour normaliser le chemin de l'image
const normalizeImagePath = (imagePath: string) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  // Nettoyer le chemin de l'image pour ne garder que le nom du fichier
  const filename = imagePath.split('/').pop();
  return `/img/${filename}`;
};

const generateTagColor = (tagName: string) => {
  // Utilise le nom du tag comme graine pour générer une couleur cohérente
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Génère une teinte pastel
  const h = hash % 360;
  return `hsl(${h}, 70%, 85%)`;
};

const SpellPreview: React.FC<{ spell: Spell, isTalent?: boolean }> = ({ spell, isTalent }) => (
  <div className={`spell-preview ${isTalent ? 'talent' : ''}`}>
    <div className="spell-header">
      <span className="spell-name">{spell.name}</span>
      <span className="spell-power">⚡{spell.power}</span>
      {spell.cost && <span className="spell-cost">🎯{spell.cost}</span>}
    </div>
    <p className="spell-description">{spell.description}</p>
    <div className="spell-effects">
      {spell.effects.map((effect, i) => (
        <div key={i} className={`effect-tag ${effect.type}`}>
          {effect.type === 'damage' && '⚔️'}
          {effect.type === 'heal' && '💚'}
          {effect.type === 'status' && '⭐'}
          {effect.type === 'draw' && '🎴'}
          {effect.type === 'poison' && '☠️'}
          {effect.type === 'resource' && '🔮'}
          {effect.type === 'special' && '✨'}
          {effect.value}
          {effect.duration && ` (${effect.duration}t)`}
        </div>
      ))}
    </div>
  </div>
);

const CardPreview: React.FC<CardPreviewProps> = ({ card }) => {
  const [crop, setCrop] = useState<PercentCrop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0
  });
  const [completedCrop, setCompletedCrop] = useState<PercentCrop | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Charger le recadrage sauvegardé
  useEffect(() => {
    if (card.image) {
      const savedCrop = getCropData(card.image);
      if (savedCrop && savedCrop.unit === '%') {
        const percentCrop: PercentCrop = {
          unit: '%',
          width: savedCrop.width,
          height: savedCrop.height,
          x: savedCrop.x,
          y: savedCrop.y
        };
        setCrop(percentCrop);
        setCompletedCrop(percentCrop);
      } else {
        // Réinitialiser le crop si aucun recadrage n'est sauvegardé
        const defaultCrop: PercentCrop = {
          unit: '%',
          width: 100,
          height: 100,
          x: 0,
          y: 0
        };
        setCrop(defaultCrop);
        setCompletedCrop(defaultCrop);
      }
    }
  }, [card.image]);

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'gros_bodycount': return 'Gros bodycount';
      case 'interessant': return 'Intéressant';
      case 'banger': return 'Banger';
      case 'cheate': return 'Cheaté';
      default: return rarity;
    }
  };

  const handleImageClick = () => {
    setIsEditing(!isEditing);
  };

  const handleCropComplete = useCallback((pixel: PixelCrop, percent: PercentCrop) => {
    if (card.image) {
      setCompletedCrop(percent);
      saveCropData(card.image, {
        unit: '%',
        width: percent.width,
        height: percent.height,
        x: percent.x,
        y: percent.y
      });
    }
  }, [card.image]);

  const handleCropChange = useCallback((_: PixelCrop, percentCrop: PercentCrop) => {
    setCrop(percentCrop);
  }, []);

  const getImageStyle = () => {
    if (!isEditing && completedCrop) {
      const scale = 100 / completedCrop.width;
      return {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
        objectPosition: `${completedCrop.x}% ${completedCrop.y}%`,
        transform: scale > 1 ? `scale(${scale})` : undefined,
        transformOrigin: '0 0'
      };
    }
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const
    };
  };

  return (
    <div className={`card-preview ${card.type}`} data-rarity={card.rarity}>
      <div className="rarity-badge" data-rarity={card.rarity}>
        {getRarityLabel(card.rarity)}
      </div>
      <div className="card-header">
        <h3 className="card-name">
          {card.name}
          {card.isEX && <span className="ex-badge">EX</span>}
        </h3>
        <div className="card-type-health">
          <span className="card-type">
            {card.type === 'personnage' && '👤'}
            {card.type === 'objet' && '🎁'}
            {card.type === 'evenement' && '⚡'}
            {card.type === 'lieu' && '🏰'}
            {card.type}
          </span>
          {card.health > 0 && <span className="card-health">❤️ {card.health}</span>}
        </div>
      </div>

      <div className="card-image">
        {card.image && (
          isEditing ? (
            <div className="crop-container">
              <ReactCrop
                crop={crop}
                onChange={handleCropChange}
                onComplete={handleCropComplete}
                aspect={undefined}
                minWidth={20}
                minHeight={20}
              >
                <img 
                  src={normalizeImagePath(card.image)} 
                  alt={card.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </ReactCrop>
              <button 
                className="crop-done-button"
                onClick={handleImageClick}
              >
                ✅ Terminer
              </button>
            </div>
          ) : (
            <div 
              className="image-container"
              onClick={handleImageClick}
            >
              <img 
                src={normalizeImagePath(card.image)} 
                alt={card.name}
                style={getImageStyle()}
              />
            </div>
          )
        )}
      </div>

      <div className="card-content">
        {card.description && (
          <p className="card-description">{card.description}</p>
        )}

        {card.passiveEffect && (
          <div className="passive-effect">
            <h4>🔄 Effet Passif</h4>
            <p>{card.passiveEffect}</p>
          </div>
        )}

        {card.spells.length > 0 && (
          <div className="spells-section">
            <h4>⚔️ Capacités</h4>
            {card.spells.map((spell, index) => (
              <SpellPreview key={index} spell={spell} />
            ))}
          </div>
        )}

        {card.type === 'personnage' && card.talent && (
          <div className="talent-section">
            <h4>✨ Talent</h4>
            <SpellPreview spell={card.talent} isTalent={true} />
          </div>
        )}

        {card.tags.length > 0 && (
          <div className="tags-section">
            <h4>🏷️ Tags</h4>
            <div className="tags-list">
              {card.tags.map((tag, index) => (
                <div 
                  key={index} 
                  className="tag"
                  style={{ backgroundColor: generateTagColor(tag.name) }}
                >
                  <span className="tag-name">{tag.name}</span>
                  {tag.passiveEffect && (
                    <span className="tag-effect">{tag.passiveEffect}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardPreview;