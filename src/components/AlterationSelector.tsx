import React, { useState, useEffect } from 'react';
import { Alteration } from '../types';
import { alterationService } from '../utils/dataService';

interface AlterationSelectorProps {
  selectedAlteration?: number;
  onChange: (alterationId: number) => void;
}

const AlterationSelector: React.FC<AlterationSelectorProps> = ({ selectedAlteration, onChange }) => {
  const [alterations, setAlterations] = useState<Alteration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlterations = async () => {
      try {
        const data = await alterationService.getAll();
        setAlterations(data);
      } catch (error) {
        console.error('Erreur lors du chargement des altérations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAlterations();
  }, []);

  if (loading) {
    return <div>Chargement des altérations...</div>;
  }

  return (
    <div className="alteration-selector">
      <label htmlFor="alteration-select">Altération</label>
      <select
        id="alteration-select"
        value={selectedAlteration || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="form-input"
      >
        <option value="">Sélectionnez une altération</option>
        {alterations.map(alteration => (
          <option key={alteration.id} value={alteration.id}>
            {alteration.icon} {alteration.name} ({alteration.type})
          </option>
        ))}
      </select>

      {selectedAlteration && (
        <div className="alteration-preview">
          {alterations.find(a => a.id === selectedAlteration)?.description}
        </div>
      )}
    </div>
  );
};

export default AlterationSelector;