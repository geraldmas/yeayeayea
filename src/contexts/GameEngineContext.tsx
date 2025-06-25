import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Player, GameState, Json } from '../types';
import { CombatManagerImpl } from '../services/combatService';
import { TurnService } from '../services/turnService';
import { combatLogService, CombatLogEvent } from '../services/combatLogService';
import { gameSaveService } from '../utils/dataService';

interface GameEngineContextValue {
  combat: CombatManagerImpl;
  state: GameState;
  nextPhase: () => void;
  nextTurn: () => void;
  history: CombatLogEvent[];
  saveGame: (userId: string) => Promise<void>;
  loadGame: (saveId: number) => Promise<void>;
}

const GameEngineContext = createContext<GameEngineContextValue | null>(null);

interface ProviderProps {
  players: Player[];
  children: React.ReactNode;
}

export const GameEngineProvider: React.FC<ProviderProps> = ({ players, children }) => {
  const [combat] = useState(() => new CombatManagerImpl());
  const [state, setState] = useState<GameState>(() => TurnService.initializeGameState(players));
  const [history, setHistory] = useState<CombatLogEvent[]>([]);

  useEffect(() => {
    setState(TurnService.initializeGameState(players));
  }, [players]);

  useEffect(() => {
    const handler = (e: CombatLogEvent) => setHistory(prev => [...prev, e]);
    combatLogService.on(handler);
    return () => combatLogService.off(handler);
  }, []);

  const nextPhase = () => {
    const phases: GameState['phase'][] = ['draw', 'main', 'combat', 'end'];
    const currentIndex = phases.indexOf(state.phase);
    const next = phases[(currentIndex + 1) % phases.length];
    setState(s => TurnService.changePhase(s, next));
  };

  const nextTurn = () => {
    setState(s => TurnService.nextTurn(s));
  };

  const saveGame = async (userId: string) => {
    await gameSaveService.create({ user_id: userId, state: state as unknown as Json, history: history as unknown as Json });
  };

  const loadGame = async (saveId: number) => {
    const save = await gameSaveService.getById(saveId);
    if (save) {
      setState(save.state as unknown as GameState);
      setHistory(save.history as unknown as CombatLogEvent[]);
    }
  };

  return (
    <GameEngineContext.Provider value={{ combat, state, nextPhase, nextTurn, history, saveGame, loadGame }}>
      {children}
    </GameEngineContext.Provider>
  );
};

export function useGameEngine() {
  const ctx = useContext(GameEngineContext);
  if (!ctx) throw new Error('useGameEngine must be used within GameEngineProvider');
  return ctx;
}
