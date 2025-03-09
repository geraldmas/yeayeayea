import React from 'react';
import type { Player, CharismeModifier } from '../types/index';
import './CharismeDisplay.css';
import { getModifiedMaxCharisme } from '../utils/charismeService';

interface CharismeDisplayProps {
  player: Player;
  isActive?: boolean;
}

/**
 * Composant CharismeDisplay - Affiche le charisme du joueur
 * 
 * Ce composant montre la quantité de charisme disponible pour un joueur,
 * ainsi que les modificateurs actifs si demandé.
 */
const CharismeDisplay: React.FC<CharismeDisplayProps> = ({ 
  player, 
  isActive = false 
}) => {
  // Calculer le pourcentage de remplissage de la barre
  const getMaxCharisme = (): number => {
    return getModifiedMaxCharisme(player);
  };
  
  // Calculer le pourcentage de remplissage
  const fillPercentage = Math.min(100, (player.charisme / getMaxCharisme()) * 100);
  
  // Déterminer la couleur de la barre en fonction du pourcentage
  const getBarColor = (): string => {
    if (fillPercentage < 30) return '#8b4513'; // Marron
    if (fillPercentage < 60) return '#daa520'; // Doré
    return '#ffd700'; // Or brillant
  };
  
  // Afficher les détails des modificateurs
  const renderModifiers = () => {
    if (!player.charismeModifiers || player.charismeModifiers.length === 0) {
      return null;
    }
    
    return (
      <div className="charisme-modifiers">
        {player.charismeModifiers.map((mod: CharismeModifier) => (
          <div key={mod.id} className="charisme-modifier">
            <span className="modifier-source">{mod.source}</span>
            <span className={`modifier-value ${mod.value >= 0 ? 'positive' : 'negative'}`}>
              {mod.value > 0 ? '+' : ''}{mod.value}{mod.isPercentage ? '%' : ''}
            </span>
            <span className="modifier-type">({mod.type})</span>
            {mod.duration !== undefined && mod.duration > 0 && (
              <span className="modifier-duration">
                ({mod.duration} {mod.duration > 1 ? 'tours' : 'tour'})
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className={`charisme-display ${isActive ? 'active' : ''}`}>
      <div className="charisme-header">
        <h3>Charisme</h3>
        <div className="charisme-value">
          {player.charisme} / {getMaxCharisme()}
        </div>
      </div>
      
      <div className="charisme-bar-container">
        <div 
          className="charisme-bar" 
          style={{ 
            width: `${fillPercentage}%`,
            backgroundColor: getBarColor()
          }}
        ></div>
      </div>
      
      {isActive && renderModifiers()}
    </div>
  );
};

export default CharismeDisplay; 