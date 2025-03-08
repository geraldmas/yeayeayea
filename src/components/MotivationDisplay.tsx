import React from 'react';
import { Player, MotivationModifier } from '../types';
import './MotivationDisplay.css';

interface MotivationDisplayProps {
  player: Player;
  isActive?: boolean;
}

/**
 * Composant MotivationDisplay - Affiche la motivation du joueur
 * 
 * Ce composant montre la quantité de motivation disponible pour un joueur,
 * ainsi que les modificateurs actifs si demandé.
 */
const MotivationDisplay: React.FC<MotivationDisplayProps> = ({ 
  player, 
  isActive = false 
}) => {
  // Calculer le pourcentage de remplissage de la barre
  const getBaseMotivation = (): number => {
    return player.baseMotivation || 10; // Valeur par défaut si non définie
  };
  
  // Calculer le pourcentage de remplissage
  const fillPercentage = Math.min(100, (player.motivation / getBaseMotivation()) * 100);
  
  // Déterminer la couleur de la barre en fonction du pourcentage
  const getBarColor = (): string => {
    if (fillPercentage < 30) return 'red';
    if (fillPercentage < 60) return 'orange';
    return 'green';
  };
  
  // Afficher les détails des modificateurs
  const renderModifiers = () => {
    if (!player.motivationModifiers || player.motivationModifiers.length === 0) {
      return null;
    }
    
    return (
      <div className="motivation-modifiers">
        {player.motivationModifiers.map((mod: MotivationModifier) => (
          <div key={mod.id} className="motivation-modifier">
            <span className="modifier-source">{mod.source}</span>
            <span className={`modifier-value ${mod.value >= 0 ? 'positive' : 'negative'}`}>
              {mod.value > 0 ? '+' : ''}{mod.value}{mod.isPercentage ? '%' : ''}
            </span>
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
    <div className={`motivation-display ${isActive ? 'active' : ''}`}>
      <div className="motivation-header">
        <h3>Motivation</h3>
        <div className="motivation-value">
          {player.motivation} / {getBaseMotivation()}
        </div>
      </div>
      
      <div className="motivation-bar-container">
        <div 
          className="motivation-bar" 
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

export default MotivationDisplay; 