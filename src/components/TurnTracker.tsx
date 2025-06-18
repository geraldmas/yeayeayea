import React from 'react';
import type { GameState, Player } from '../types';
import { getModifiedMaxCharisme } from '../utils/charismeService';
import './TurnTracker.css';

export interface TurnAction {
  id: string;
  label: string;
  onClick: () => void;
}

interface TurnTrackerProps {
  gameState: GameState;
  actions: TurnAction[];
  onNextPhase?: () => void;
  onNextTurn?: () => void;
}

const TurnTracker: React.FC<TurnTrackerProps> = ({
  gameState,
  actions,
  onNextPhase,
  onNextTurn
}) => {
  const activePlayer: Player = gameState.players[gameState.activePlayer];

  return (
    <div className="turn-tracker">
      <div className="turn-info">
        <div className="turn-number">Tour {gameState.turnCount}</div>
        <div className="phase">Phase : {gameState.phase}</div>
        <div className="active-player">Joueur actif : {activePlayer.name}</div>
        <div className="turn-buttons">
          {onNextPhase && (
            <button onClick={onNextPhase}>Phase suivante</button>
          )}
          {onNextTurn && (
            <button onClick={onNextTurn}>Fin de tour</button>
          )}
        </div>
      </div>

      <div className="resources">
        <div className="resource motivation">
          Motivation : {activePlayer.motivation} / {activePlayer.baseMotivation}
        </div>
        <div className="resource charisme">
          Charisme : {activePlayer.charisme ?? 0} / {getModifiedMaxCharisme(activePlayer)}
        </div>
      </div>

      <div className="actions">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="action-button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TurnTracker;
