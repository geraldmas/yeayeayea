/**
 * @file PlayerBase.tsx
 * @description Composant pour afficher la base du joueur
 */

import React, { useEffect, useRef, useState } from 'react';
import './PlayerBase.css';
import { PlayerBase as PlayerBaseType } from '../types/player';

interface PlayerBaseProps {
  /**
   * La base du joueur à afficher
   */
  playerBase: PlayerBaseType;
  
  /**
   * Indique si c'est la base du joueur courant (true) ou de l'adversaire (false)
   */
  isCurrentPlayer: boolean;
  
  /**
   * Fonction de rappel lorsque la base est cliquée
   */
  onClick?: () => void;
  
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
}

/**
 * Composant PlayerBase
 * 
 * Affiche la base du joueur avec sa barre de vie et ses altérations actives
 */
const PlayerBase: React.FC<PlayerBaseProps> = ({
  playerBase,
  isCurrentPlayer,
  onClick,
  className = '',
}) => {
  const [animationClass, setAnimationClass] = useState('');
  const prevHealthRef = useRef(playerBase.currentHealth);

  useEffect(() => {
    if (playerBase.currentHealth > prevHealthRef.current) {
      setAnimationClass('heal-animation');
    } else if (playerBase.currentHealth < prevHealthRef.current) {
      setAnimationClass('damage-animation');
    }
    prevHealthRef.current = playerBase.currentHealth;
    const timeout = setTimeout(() => setAnimationClass(''), 500);
    return () => clearTimeout(timeout);
  }, [playerBase.currentHealth]);
  // Calcule le pourcentage de vie restant
  const healthPercentage = Math.max(0, Math.min(100, (playerBase.currentHealth / playerBase.maxHealth) * 100));
  
  // Détermine la couleur de la barre de vie en fonction du pourcentage
  const getHealthBarColor = () => {
    if (healthPercentage > 60) return '#4CAF50'; // Vert
    if (healthPercentage > 30) return '#FFC107'; // Jaune
    return '#F44336'; // Rouge
  };
  
  // Affiche les altérations actives
  const renderAlterations = () => {
    if (playerBase.activeAlterations.length === 0) return null;
    
    return (
      <div className="player-base-alterations">
        {playerBase.activeAlterations.map((activeAlteration, index) => (
          <div
            key={`${activeAlteration.alteration.id}-${index}`}
            className="player-base-alteration"
            title={`${activeAlteration.alteration.name} (${activeAlteration.alteration.description})`}
            style={{ 
              backgroundColor: activeAlteration.alteration.color || '#607D8B',
              opacity: activeAlteration.remainingDuration === 1 ? 0.6 : 1 
            }}
          >
            {activeAlteration.stackCount > 1 && (
              <span className="stack-count">{activeAlteration.stackCount}</span>
            )}
            {activeAlteration.alteration.name.substring(0, 1)}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div
      className={`player-base ${isCurrentPlayer ? 'current-player' : 'opponent'} ${className} ${animationClass}`}
      onClick={onClick}
    >
      <div className="player-base-header">
        <h3>{isCurrentPlayer ? 'Votre Base' : 'Base Adverse'}</h3>
      </div>
      
      <div className="player-base-content">
        <div className="player-base-health-container">
          <div className="player-base-health-bar">
            <div 
              className="player-base-health-fill"
              style={{ 
                width: `${healthPercentage}%`,
                backgroundColor: getHealthBarColor()
              }}
            />
          </div>
          <div className="player-base-health-text">
            {playerBase.currentHealth} / {playerBase.maxHealth} PV
          </div>
        </div>
        
        {renderAlterations()}
      </div>
    </div>
  );
};

export default PlayerBase; 