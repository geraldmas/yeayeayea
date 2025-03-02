import React, { useState, useCallback, useEffect } from 'react';
import { Card, Spell, Alteration, Tag } from '../types';
import ReactCrop, { Crop, PixelCrop, PercentCrop } from 'react-image-crop';
import { saveCropData, getCropData } from '../utils/imageCropManager';
import { alterationService, spellService, tagService } from '../utils/dataService';
import 'react-image-crop/dist/ReactCrop.css';
import './CardPreview.css';
import { getCardTags, getCardSpells } from '../utils/validation';

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
  // Protection contre les valeurs undefined
  if (!tagName) return 'hsl(0, 0%, 85%)'; // Couleur par défaut

  // Utilise le nom du tag comme graine pour générer une couleur cohérente
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Génère une teinte pastel
  const h = hash % 360;
  return `hsl(${h}, 70%, 85%)`;
};

const SpellPreview: React.FC<{ spell: Spell, alterations?: Record<string, Alteration> }> = ({ spell, alterations = {} }) => (
  <div className={`spell-preview'}`}>
    <p>
      <strong className="spell-name">{spell.name}</strong> - {spell.description}
      <span className="spell-power">⚡{spell.power}</span>
      {spell.cost && <span className="spell-cost">🎯{spell.cost}</span>}
    </p>
    <div className="spell-effects">
      {spell.effects.map((effect, i) => (
        <div key={i} className={`effect-tag ${effect.type}`}>
          {effect.type === 'apply_alteration' && effect.alteration && (
            <>
              {alterations[effect.alteration]?.icon || '🔮'}
              {alterations[effect.alteration]?.name || 'Altération inconnue'}
              {effect.duration && ` (${effect.duration}t)`}
            </>
          )}
          {effect.type !== 'apply_alteration' && (
            <>
              {effect.type === 'damage' && '⚔️'}
              {effect.type === 'heal' && '💚'}
              {effect.type === 'draw' && '🎴'}
              {effect.type === 'resource' && '🔮'}
              {effect.type === 'add_tag' && '🏷️'}
              {effect.type === 'multiply_damage' && '⚡'}
              {effect.multiplier ? `${effect.multiplier.value}x` : effect.value}
            </>
          )}
          {effect.duration && ` (${effect.duration}t)`}
          {effect.chance && ` [${effect.chance}%]`}
          {effect.condition && (
            <span className="effect-condition">
              {effect.condition.type === 'has_tag' && `si ${effect.condition.tag}`}
              {effect.condition.type === 'missing_tag' && `si pas ${effect.condition.tag}`}
              {effect.condition.type === 'health_below' && `si PV < ${effect.condition.value}`}
              {effect.condition.type === 'health_above' && `si PV > ${effect.condition.value}`}
            </span>
          )}
          {effect.multiplier?.condition && (
            <span className="effect-condition">
              {effect.multiplier.condition.type === 'target_has_tag' && `si cible ${effect.multiplier.condition.tag}`}
              {effect.multiplier.condition.type === 'target_missing_tag' && `si cible pas ${effect.multiplier.condition.tag}`}
            </span>
          )}
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
  const [alterations, setAlterations] = useState<Record<string, Alteration>>({});
  const [loadedSpells, setLoadedSpells] = useState<Spell[]>([]);
  const [loadedTags, setLoadedTags] = useState<Tag[]>([]);

  useEffect(() => {
    loadAlterations();
    loadSpellsAndTags();
  }, [card]);

  const loadAlterations = async () => {
    try {
      const data = await alterationService.getAll();
      const alterationsMap = data.reduce((acc, alt) => {
        acc[alt.id] = alt;
        return acc;
      }, {} as Record<string, Alteration>);
      setAlterations(alterationsMap);
    } catch (error) {
      console.error('Error loading alterations:', error);
    }
  };

  const loadSpells = async () => {
    try {
      const spellIds = await getCardSpells(card.id);
      const spellIdNumbers = spellIds.map(spellObj => spellObj.spell_id);
      const spellsData = await spellService.getByIds(spellIdNumbers);
      setLoadedSpells(spellsData.filter(spell => spell !== null));
    } catch (error) {
      console.error('Error loading spells:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tagIds = await getCardTags(card.id);
      const tagIdNumbers = tagIds.map(tagObj => tagObj.tag_id);
      const tagsData = await tagService.getByIds(tagIdNumbers);
      setLoadedTags(tagsData.filter(tag => tag !== null));
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadSpellsAndTags = async () => {
    await loadSpells();
    await loadTags();
  };

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
      case 'gros_bodycount': return 'GB';
      case 'interessant': return 'IN';
      case 'banger': return 'BA';
      case 'cheate': return 'CH';
      default: return rarity.substring(0, 2).toUpperCase();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personnage': return '👤';
      case 'objet': return '🎁';
      case 'evenement': return '⚡';
      case 'lieu': return '🏰';
      case 'action': return '🎯';
      default: return '';
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
      {card.is_wip && <div className="wip-badge">WIP</div>}
      <div className="rarity-badge" data-rarity={card.rarity}>
        {getRarityLabel(card.rarity)}
      </div>
      <div className="card-header">
        <div className="card-name">
          <span className="type-icon">{getTypeIcon(card.type)}</span>
          {card.name}
        </div>
        {card.type === 'personnage' && card.properties?.health && card.properties.health > 0 && (
          <span className="card-health">❤️ {card.properties.health}</span>
        )}
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

        {card.passive_effect && (
          <div className="passive-effect">
            <p>🔄 {card.passive_effect}</p>
          </div>
        )}

        {loadedSpells && loadedSpells.length > 0 && (
          <div className="spells-section">
            {loadedSpells.map((spell, index) => (
              <SpellPreview key={index} spell={spell} alterations={alterations} />
            ))}
          </div>
        )}

        {loadedTags && loadedTags.length > 0 && (
          <div className="tags-list">
            {loadedTags.map((tag, index) => (
              <div 
                key={index} 
                className="tag"
                style={{ backgroundColor: generateTagColor(tag.name || '') }}
              >
                <span className="tag-name">{tag.name || 'Tag sans nom'}</span>
                {tag.passive_effect && (
                  <span className="tag-effect">{tag.passive_effect}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardPreview;