import React, { useState, useEffect } from 'react';

interface AlterationSelectorProps {
  selectedAlteration?: number;
  onChange: (alterationId: number) => void;
}

interface Alteration {
  id: number;
  name: string;
  description?: string;
}

const AlterationSelector: React.FC<AlterationSelectorProps> = ({ selectedAlteration, onChange }) => {
  const [alterations, setAlterations] = useState<Alteration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // You would typically fetch alterations from your API here
    // For now, we'll use some dummy data
    const dummyAlterations = [
      { id: 1, name: 'Brûlure', description: 'Inflige des dégâts à chaque tour' },
      { id: 2, name: 'Poison', description: 'Inflige des dégâts croissants' },
      { id: 3, name: 'Paralysie', description: 'Réduit les capacités d\'action' },
      { id: 4, name: 'Gel', description: 'Empêche toute action' },
      { id: 5, name: 'Confusion', description: 'Chance de rater son action' },
    ];

    setAlterations(dummyAlterations);
    setLoading(false);
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
            {alteration.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AlterationSelector;