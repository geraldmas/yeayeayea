import React, { useState } from 'react';
import { Alteration } from '../types';
import { alterationService } from '../utils/dataService';
import './AlterationManager.css';

interface AlterationManagerProps {
  alteration?: Alteration;
  onChange: (alteration: Alteration) => void;
}

const AlterationManager: React.FC<AlterationManagerProps> = ({ alteration, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAlteration, setEditedAlteration] = useState<Partial<Alteration>>(alteration || {
    name: '',
    description: '',
    effect: '',
    icon: '🔮',
    duration: 1,
    stackable: false,
    unique_effect: false,
    type: 'status'
  });

  const handleChange = (field: keyof Alteration, value: any) => {
    setEditedAlteration(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      let savedAlteration;
      if (alteration?.id) {
        savedAlteration = await alterationService.update(alteration.id, editedAlteration);
      } else {
        savedAlteration = await alterationService.create(editedAlteration as Omit<Alteration, 'id'>);
      }
      onChange(savedAlteration);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving alteration:', error);
    }
  };

  const renderDisplay = () => (
    <div className="alteration-display">
      <div className="alteration-header">
        <span className="alteration-icon">{alteration?.icon}</span>
        <span className="alteration-name">{alteration?.name}</span>
        <span className={`alteration-type ${alteration?.type}`}>{alteration?.type}</span>
      </div>
      <p className="alteration-description">{alteration?.description}</p>
      <div className="alteration-details">
        <span>Durée: {alteration?.duration || 'Permanent'}</span>
        {alteration?.stackable && <span>Cumulable</span>}
        {alteration?.unique_effect && <span>Effet unique</span>}
      </div>
      <button onClick={() => setIsEditing(true)}>Modifier</button>
    </div>
  );

  const renderForm = () => (
    <div className="alteration-form">
      <div className="form-group">
        <label>Nom</label>
        <input
          type="text"
          value={editedAlteration.name || ''}
          onChange={e => handleChange('name', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={editedAlteration.description || ''}
          onChange={e => handleChange('description', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Effet</label>
        <input
          type="text"
          value={editedAlteration.effect || ''}
          onChange={e => handleChange('effect', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Icône</label>
        <input
          type="text"
          value={editedAlteration.icon || ''}
          onChange={e => handleChange('icon', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Type</label>
        <select
          value={editedAlteration.type || 'status'}
          onChange={e => handleChange('type', e.target.value)}
        >
          <option value="buff">Buff</option>
          <option value="debuff">Debuff</option>
          <option value="status">Status</option>
          <option value="other">Autre</option>
        </select>
      </div>
      <div className="form-group">
        <label>Durée (tours)</label>
        <input
          type="number"
          value={editedAlteration.duration || 0}
          onChange={e => handleChange('duration', parseInt(e.target.value))}
          min="0"
        />
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={editedAlteration.stackable || false}
            onChange={e => handleChange('stackable', e.target.checked)}
          />
          Cumulable
        </label>
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={editedAlteration.unique_effect || false}
            onChange={e => handleChange('unique_effect', e.target.checked)}
          />
          Effet unique
        </label>
      </div>
      <div className="form-actions">
        <button onClick={handleSave}>Sauvegarder</button>
        <button onClick={() => setIsEditing(false)}>Annuler</button>
      </div>
    </div>
  );

  return (
    <div className="alteration-manager">
      {isEditing ? renderForm() : renderDisplay()}
    </div>
  );
};

export default AlterationManager;