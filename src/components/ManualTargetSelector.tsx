import React, { useState } from 'react';
import { CardInstance } from '../types/combat';

interface ManualTargetSelectorProps {
  targets: CardInstance[];
  minTargets?: number;
  maxTargets?: number;
  onConfirm: (selected: CardInstance[]) => void;
  onCancel: () => void;
}

const ManualTargetSelector: React.FC<ManualTargetSelectorProps> = ({
  targets,
  minTargets = 1,
  maxTargets = 1,
  onConfirm,
  onCancel
}) => {
  const [selected, setSelected] = useState<CardInstance[]>([]);

  const toggleTarget = (target: CardInstance) => {
    const exists = selected.some(t => t.instanceId === target.instanceId);
    if (exists) {
      setSelected(prev => prev.filter(t => t.instanceId !== target.instanceId));
    } else if (selected.length < maxTargets) {
      setSelected(prev => [...prev, target]);
    }
  };

  const confirm = () => {
    if (selected.length >= minTargets) {
      onConfirm(selected);
    }
  };

  return (
    <div className="manual-target-selector">
      <ul>
        {targets.map(t => (
          <li key={t.instanceId}>
            <label>
              <input
                type="checkbox"
                checked={selected.some(sel => sel.instanceId === t.instanceId)}
                onChange={() => toggleTarget(t)}
              />
              {t.cardDefinition.name}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={onCancel}>Annuler</button>
      <button onClick={confirm} disabled={selected.length < minTargets}>
        Valider
      </button>
    </div>
  );
};

export default ManualTargetSelector;
