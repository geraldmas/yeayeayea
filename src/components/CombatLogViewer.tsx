import React, { useEffect, useState } from 'react';
import { combatLogService, CombatLogEvent } from '../services/combatLogService';
import './CombatLogViewer.css';

const CombatLogViewer: React.FC = () => {
  const [events, setEvents] = useState<CombatLogEvent[]>([]);

  useEffect(() => {
    const handler = (event: CombatLogEvent) => {
      setEvents(prev => [...prev, event].slice(-20));
    };
    combatLogService.on(handler);
    return () => combatLogService.off(handler);
  }, []);

  if (!combatLogService.enabled) return null;

  return (
    <div className="combat-log-viewer">
      <h4>Actions récentes</h4>
      <ul>
        {events.map((e, idx) => (
          <li key={idx}>{e.message}</li>
        ))}
      </ul>
    </div>
  );
};

export default CombatLogViewer;
