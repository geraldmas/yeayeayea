import React, { useEffect, useState } from 'react';
import { userService } from '../utils/userService';
import { simulationResultsService } from '../utils/dataService';
import { simulateGame } from '../simulation/gameSimulator';
import type { Deck } from '../types/userTypes';
import { InfoTooltip } from './ui';

interface SimulationPanelProps {
  user: { id: string } | null;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({ user }) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckA, setDeckA] = useState('');
  const [deckB, setDeckB] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [runs, setRuns] = useState(1);
  const [performance, setPerformance] = useState<{
    winRate: number;
    averageTurns: number;
    totalGames: number;
  } | null>(null);

  const tooltips = {
    deckA: 'Deck utilisé comme joueur principal',
    deckB: 'Deck opposé pour la simulation',
    runs: 'Nombre de parties à simuler'
  } as const;

  useEffect(() => {
    const load = async () => {
      if (user) {
        const userDecks = await userService.getDecks(user.id);
        setDecks(userDecks || []);
      }
      fetchHistory();
    };
    load();
  }, [user]);

  const fetchHistory = async (deckId?: string) => {
    const results = deckId
      ? await simulationResultsService.getByDeck(deckId)
      : await simulationResultsService.getAll();
    setHistory(results);
  };

  const runSimulation = async () => {
    if (!deckA || !deckB) return;
    for (let i = 0; i < runs; i++) {
      await simulateGame({ deckId: deckA, opponentDeckId: deckB, simulationType: 'performance' });
    }
    await fetchHistory(deckA);
    const perf = await simulationResultsService.getDeckPerformance(deckA);
    setPerformance(perf);
  };

  return (
    <div className="simulation-panel">
      <h2>Simulations</h2>
      <div className="sim-form">
        <label>
          Deck A <InfoTooltip title={tooltips.deckA} />
          <select value={deckA} onChange={e => setDeckA(e.target.value)}>
            <option value="">Choisir un deck</option>
            {decks.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>
        <label>
          Deck B <InfoTooltip title={tooltips.deckB} />
          <select value={deckB} onChange={e => setDeckB(e.target.value)}>
            <option value="">Choisir un deck</option>
            {decks.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>
        <label>
          Nombre de simulations <InfoTooltip title={tooltips.runs} />
          <input type="number" min="1" value={runs} onChange={e => setRuns(parseInt(e.target.value, 10))} />
        </label>
        <button className="btn btn-primary" onClick={runSimulation}>Lancer</button>
      </div>

      {performance && (
        <div className="performance-stats">
          <h3>Statistiques du deck {deckA}</h3>
          <p>Taux de victoire: {(performance.winRate * 100).toFixed(1)}%</p>
          <p>Nombre moyen de tours: {performance.averageTurns.toFixed(2)}</p>
          <p>Parties totales: {performance.totalGames}</p>
        </div>
      )}

      <h3>Historique</h3>
      <ul>
        {history.map(res => (
          <li key={res.id}>
            {res.deck_id} vs {res.opponent_deck_id} : {res.result.won ? 'victoire' : 'défaite'} en {res.result.turns} tours
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SimulationPanel;
