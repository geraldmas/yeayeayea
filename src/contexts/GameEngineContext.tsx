import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Player, GameState } from '../types/player';
import { CombatManagerImpl } from '../services/combatService';
import { TurnService } from '../services/turnService';

interface GameEngineContextValue {
  combat: CombatManagerImpl;
  state: GameState;
  nextPhase: () => void;
  nextTurn: () => void;
}

const GameEngineContext = createContext<GameEngineContextValue | null>(null);

interface ProviderProps {
  players: Player[];
  children: React.ReactNode;
}

export const GameEngineProvider: React.FC<ProviderProps> = ({ players, children }) => {
  const [combat] = useState(() => new CombatManagerImpl());
  const [state, setState] = useState<GameState>(() => TurnService.initializeGameState(players));

  useEffect(() => {
    setState(TurnService.initializeGameState(players));
  }, [players]);

  const nextPhase = () => {
    const phases: GameState['phase'][] = ['draw', 'main', 'combat', 'end'];
    const currentIndex = phases.indexOf(state.phase);
    const next = phases[(currentIndex + 1) % phases.length];
    setState(s => TurnService.changePhase(s, next));
  };

  const nextTurn = () => {
    setState(s => TurnService.nextTurn(s));
  };

  return (
    <GameEngineContext.Provider value={{ combat, state, nextPhase, nextTurn }}>
      {children}
    </GameEngineContext.Provider>
  );
};

export function useGameEngine() {
  const ctx = useContext(GameEngineContext);
  if (!ctx) throw new Error('useGameEngine must be used within GameEngineProvider');
  return ctx;
}
