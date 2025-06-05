import React, { useState, useEffect } from 'react';
import { Alteration } from '../types';
import { alterationService } from '../utils/dataService';

interface AlterationListProps {
  selectedAlteration?: number;
  onChange: (alterationId: number | undefined) => void;
}

const AlterationList: React.FC<AlterationListProps> = ({ selectedAlteration, onChange }) => {
  const [alterations, setAlterations] = useState<Alteration[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlterations();
  }, []);

  const loadAlterations = async () => {
    try {
      const data = await alterationService.getAll();
      setAlterations(data);
    } catch (error) {
      console.error('Error loading alterations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Chargement des altérations...</div>;
  }

  return (
    <div className="alteration-selector">
      <select 
        value={selectedAlteration || ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
      >
        <option value="">Sélectionner une altération</option>
        {alterations.map((alteration) => (
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

export default AlterationList;
