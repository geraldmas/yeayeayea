/**
 * @file PlayerBaseDemo.tsx
 * @description Composant de démonstration pour tester le système de base des joueurs
 */

import React, { useState, useEffect } from 'react';
import PlayerBaseComponent from './PlayerBase';
import { createPlayerBase } from '../services/PlayerBaseService';
import { PlayerBase } from '../types/player';
import { Alteration } from '../types';

const PlayerBaseDemo: React.FC = () => {
  const [playerBase, setPlayerBase] = useState<PlayerBase>(createPlayerBase({ maxHealth: 100 }));
  const [opponentBase, setOpponentBase] = useState<PlayerBase>(createPlayerBase({ maxHealth: 150 }));
  const [isPlayerDamaging, setIsPlayerDamaging] = useState(false);
  const [isPlayerHealing, setIsPlayerHealing] = useState(false);
  
  // Exemple d'altérations pour la démo
  const alterations: Alteration[] = [
    {
      id: 1,
      name: 'Poison',
      description: 'Inflige 5 dégâts par tour',
      type: 'debuff',
      duration: 3,
      stackable: true,
      unique_effect: false,
      color: '#8BC34A',
      effect: { action: 'damage', value: 5 }
    },
    {
      id: 2,
      name: 'Bouclier',
      description: 'Réduit les dégâts reçus de 10%',
      type: 'buff',
      duration: 2,
      stackable: false,
      unique_effect: true,
      color: '#2196F3',
      effect: { action: 'reduce_damage', value: 10, is_percentage: true }
    },
    {
      id: 3,
      name: 'Régénération',
      description: 'Restaure 5 PV par tour',
      type: 'buff',
      stackable: true,
      unique_effect: false,
      color: '#4CAF50',
      effect: { action: 'heal', value: 5 }
    }
  ];
  
  // Appliquer des dégâts à la base du joueur
  const damagePlayerBase = () => {
    const amount = Math.floor(Math.random() * 20) + 5; // Dégâts aléatoires entre 5 et 25
    const newBase = { ...playerBase };
    newBase.applyDamage(amount, 'Attaque de démo');
    setPlayerBase(newBase);
    setIsPlayerDamaging(true);
    
    setTimeout(() => {
      setIsPlayerDamaging(false);
    }, 500);
  };
  
  // Soigner la base du joueur
  const healPlayerBase = () => {
    const amount = Math.floor(Math.random() * 15) + 5; // Soins aléatoires entre 5 et 20
    const newBase = { ...playerBase };
    newBase.heal(amount, 'Soin de démo');
    setPlayerBase(newBase);
    setIsPlayerHealing(true);
    
    setTimeout(() => {
      setIsPlayerHealing(false);
    }, 500);
  };
  
  // Appliquer des dégâts à la base adverse
  const damageOpponentBase = () => {
    const amount = Math.floor(Math.random() * 20) + 5; // Dégâts aléatoires entre 5 et 25
    const newBase = { ...opponentBase };
    newBase.applyDamage(amount, 'Attaque de démo');
    setOpponentBase(newBase);
  };
  
  // Ajouter une altération aléatoire à la base du joueur
  const addRandomAlterationToPlayer = () => {
    const randomIndex = Math.floor(Math.random() * alterations.length);
    const alteration = alterations[randomIndex];
    
    const newBase = { ...playerBase };
    newBase.addAlteration(alteration, null);
    setPlayerBase(newBase);
  };
  
  // Ajouter une altération aléatoire à la base adverse
  const addRandomAlterationToOpponent = () => {
    const randomIndex = Math.floor(Math.random() * alterations.length);
    const alteration = alterations[randomIndex];
    
    const newBase = { ...opponentBase };
    newBase.addAlteration(alteration, null);
    setOpponentBase(newBase);
  };
  
  // Simuler un tour de jeu
  const simulateTurn = () => {
    // Appliquer les effets des altérations
    const newPlayerBase = { ...playerBase };
    const newOpponentBase = { ...opponentBase };
    
    newPlayerBase.applyAlterationEffects();
    newOpponentBase.applyAlterationEffects();
    
    // Réduire la durée des altérations
    newPlayerBase.resetForNextTurn();
    newOpponentBase.resetForNextTurn();
    
    setPlayerBase(newPlayerBase);
    setOpponentBase(newOpponentBase);
  };
  
  // Réinitialiser la démo
  const resetDemo = () => {
    setPlayerBase(createPlayerBase({ maxHealth: 100 }));
    setOpponentBase(createPlayerBase({ maxHealth: 150 }));
  };
  
  return (
    <div className="player-base-demo">
      <h2>Démonstration du Système de Base des Joueurs</h2>
      
      <div className="demo-bases">
        <div className="base-container">
          <PlayerBaseComponent 
            playerBase={playerBase}
            isCurrentPlayer={true}
            className={`
              ${isPlayerDamaging ? 'damage-animation' : ''} 
              ${isPlayerHealing ? 'heal-animation' : ''}
            `}
          />
          <div className="base-status">
            {playerBase.isDestroyed() && (
              <div className="destroyed-message">Votre base est détruite !</div>
            )}
          </div>
        </div>
        
        <div className="base-container">
          <PlayerBaseComponent 
            playerBase={opponentBase}
            isCurrentPlayer={false}
          />
          <div className="base-status">
            {opponentBase.isDestroyed() && (
              <div className="destroyed-message">Base adverse détruite !</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="demo-controls">
        <h3>Actions sur votre base</h3>
        <div className="control-buttons">
          <button onClick={damagePlayerBase} disabled={playerBase.isDestroyed()}>
            Infliger des dégâts
          </button>
          <button onClick={healPlayerBase} disabled={playerBase.isDestroyed()}>
            Soigner
          </button>
          <button onClick={addRandomAlterationToPlayer} disabled={playerBase.isDestroyed()}>
            Ajouter une altération
          </button>
        </div>
        
        <h3>Actions sur la base adverse</h3>
        <div className="control-buttons">
          <button onClick={damageOpponentBase} disabled={opponentBase.isDestroyed()}>
            Infliger des dégâts
          </button>
          <button onClick={addRandomAlterationToOpponent} disabled={opponentBase.isDestroyed()}>
            Ajouter une altération
          </button>
        </div>
        
        <h3>Contrôles de la partie</h3>
        <div className="control-buttons">
          <button onClick={simulateTurn}>
            Simuler un tour
          </button>
          <button onClick={resetDemo}>
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerBaseDemo; 