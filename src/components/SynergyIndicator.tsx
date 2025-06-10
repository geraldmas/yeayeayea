import React from 'react';
import LinkIcon from '@mui/icons-material/Link';
import { Tooltip } from '@mui/material';
import './SynergyIndicator.css';

export interface SynergyEffect {
  value: number;
  source: string;
  isPercentage: boolean;
}

interface SynergyIndicatorProps {
  effects: SynergyEffect[];
}

const SynergyIndicator: React.FC<SynergyIndicatorProps> = ({ effects }) => {
  if (!effects || effects.length === 0) return null;

  return (
    <div className="synergy-indicator">
      {effects.map((e, idx) => (
        <Tooltip
          key={idx}
          title={`${e.source} (+${e.value}${e.isPercentage ? '%' : ''})`}
          arrow
        >
          <LinkIcon fontSize="small" className="synergy-icon glow-pulse" />
        </Tooltip>
      ))}
    </div>
  );
};

export default SynergyIndicator;
