import React from 'react';
import { ActiveAlteration } from '../types/combat';
import './ActiveAlterations.css';

interface ActiveAlterationsProps {
  alterations: ActiveAlteration[];
}

const ActiveAlterations: React.FC<ActiveAlterationsProps> = ({ alterations }) => {
  if (!alterations || alterations.length === 0) return null;

  return (
    <div className="active-alterations">
      {alterations.map((alt, idx) => (
        <div
          key={idx}
          className={`alteration-badge ${alt.alteration.type}`}
          title={`${alt.alteration.name} (${alt.remainingDuration !== null ? alt.remainingDuration : '∞'}t)`}
        >
          <span className="badge-icon">{alt.alteration.icon}</span>
          {alt.stackCount > 1 && (
            <span className="badge-stack">x{alt.stackCount}</span>
          )}
          {alt.remainingDuration !== null && (
            <span className="badge-duration">{alt.remainingDuration}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ActiveAlterations;
