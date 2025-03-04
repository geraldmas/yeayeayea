import React, { useState, useEffect } from 'react';
import { Alteration, AlterationEffect } from '../types';
import { alterationService } from '../utils/dataService';
import './AlterationManager.css';

interface AlterationManagerProps {
  alteration?: Alteration;
  onChange: (alteration: Alteration) => void;
}

const AlterationManager: React.FC<AlterationManagerProps> = ({ alteration, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [alterations, setAlterations] = useState<Alteration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedAlteration, setEditedAlteration] = useState<Partial<Alteration>>(alteration || {
    name: '',
    description: '',
    effect: {
      action: '',
      value: 0,
      description: '',
      targetType: 'self',
      conditions: {
        type: 'chance',
        value: 100
      }
    },
    icon: '🔮',
    duration: 1,
    stackable: false,
    unique_effect: false,
    type: 'status'
  });

  useEffect(() => {
    loadAlterations();
  }, []);

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

  const handleChange = (field: keyof Alteration, value: any) => {
    setEditedAlteration(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEffectChange = (field: keyof AlterationEffect, value: any) => {
    setEditedAlteration(prev => ({
      ...prev,
      effect: {
        ...(prev.effect as AlterationEffect || {}),
        [field]: value
      }
    }));
  };

  const handleConditionChange = (field: string, value: any) => {
    setEditedAlteration(prev => {
      const currentEffect = prev.effect || {};
      const currentConditions = currentEffect.conditions || {
        type: 'chance' as const,
        value: 100
      };

      return {
        ...prev,
        effect: {
          ...currentEffect,
          conditions: {
            ...currentConditions,
            [field]: value
          }
        }
      };
    });
  };

  const handleSave = async () => {
    try {
      if (!editedAlteration.name || !editedAlteration.description) {
        alert('Le nom et la description sont requis');
        return;
      }

      let savedAlteration;
      if (alteration?.id) {
        const { id, ...updatePayload } = editedAlteration;
        savedAlteration = await alterationService.update(alteration.id, updatePayload);
      } else {
        const { id, ...createPayload } = editedAlteration;
        savedAlteration = await alterationService.create(createPayload as Omit<Alteration, 'id'>);
      }
      onChange(savedAlteration);
      setIsEditing(false);
      loadAlterations(); // Recharger la liste après la sauvegarde
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'altération:', error);
      alert('Une erreur est survenue lors de la sauvegarde');
    }
  };

  const handleDelete = async (alt: Alteration) => {
    if (alt.id === undefined) {
      console.error('Impossible de supprimer une altération sans id');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette altération ?')) {
      try {
        await alterationService.delete(alt.id);
        loadAlterations();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const renderDisplay = () => (
    <div className="alteration-display">
      <div className="alteration-header">
        <span className="alteration-icon">{alteration?.icon}</span>
        <span className="alteration-name">{alteration?.name || 'Nouvelle altération'}</span>
        <span className={`alteration-type ${alteration?.type}`}>
          {alteration?.type === 'buff' ? 'Amélioration' :
           alteration?.type === 'debuff' ? 'Handicap' :
           alteration?.type === 'status' ? 'Status' : 'Autre'}
        </span>
      </div>
      <p className="alteration-description">{alteration?.description || 'Aucune description'}</p>
      <div className="alteration-details">
        <span title="Durée en tours">⏱️ {alteration?.duration || 'Permanent'}</span>
        {alteration?.stackable && <span title="Cette altération peut être cumulée">🔄 Cumulable</span>}
        {alteration?.unique_effect && <span title="Cette altération a un effet unique">✨ Effet unique</span>}
        {(alteration?.effect as AlterationEffect)?.action && (
          <span title="Action spéciale">🎯 {(alteration?.effect as AlterationEffect).action}</span>
        )}
        {(alteration?.effect as AlterationEffect)?.conditions?.type === 'chance' && (
          <span title="Chance d'activation">🎲 {(alteration?.effect as AlterationEffect).conditions?.value}%</span>
        )}
      </div>
      <button 
        onClick={() => setIsEditing(true)}
        className="edit-button"
      >
        ✏️ Modifier
      </button>
    </div>
  );

  const renderForm = () => (
    <div className="alteration-form">
      <div className="form-group">
        <label htmlFor="name">Nom de l'altération</label>
        <input
          id="name"
          type="text"
          value={editedAlteration.name || ''}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="Ex: Confusion, Poison, Bouclier..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={editedAlteration.description || ''}
          onChange={e => handleChange('description', e.target.value)}
          placeholder="Décrivez les effets de cette altération..."
        />
      </div>

      <div className="form-section">
        <h3>Effet</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="action">Action</label>
            <select
              id="action"
              value={(editedAlteration.effect as AlterationEffect)?.action || ''}
              onChange={e => handleEffectChange('action', e.target.value)}
            >
              <option value="">Sélectionner une action</option>
              <option value="miss_chance">Chance de rater</option>
              <option value="damage_over_time">Dégâts continus</option>
              <option value="heal_over_time">Soin continu</option>
              <option value="damage_multiplier">Multiplicateur de dégâts</option>
              <option value="shield">Bouclier</option>
              <option value="stun">Étourdissement</option>
              <option value="custom">Action personnalisée</option>
            </select>
          </div>

          {(editedAlteration.effect as AlterationEffect)?.action === 'custom' && (
            <div className="form-group">
              <label htmlFor="custom-action">Action personnalisée</label>
              <input
                id="custom-action"
                type="text"
                value={(editedAlteration.effect as AlterationEffect)?.description || ''}
                onChange={e => handleEffectChange('description', e.target.value)}
                placeholder="Ex: Inverse les effets de soin"
              />
            </div>
          )}

          {(editedAlteration.effect as AlterationEffect)?.action && (
            <div className="form-group">
              <label htmlFor="value">Valeur</label>
              <input
                id="value"
                type="number"
                value={(editedAlteration.effect as AlterationEffect)?.value || 0}
                onChange={e => handleEffectChange('value', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="targetType">Cible</label>
            <select
              id="targetType"
              value={(editedAlteration.effect as AlterationEffect)?.targetType || 'self'}
              onChange={e => handleEffectChange('targetType', e.target.value)}
            >
              <option value="self">Soi-même</option>
              <option value="opponent">Adversaire</option>
              <option value="all">Tous</option>
              <option value="tagged">Par tag</option>
            </select>
          </div>

          {(editedAlteration.effect as AlterationEffect)?.targetType === 'tagged' && (
            <div className="form-group">
              <label htmlFor="tag">Tag requis</label>
              <input
                id="tag"
                type="text"
                value={(editedAlteration.effect as AlterationEffect)?.conditions?.tag || ''}
                onChange={e => handleConditionChange('tag', e.target.value)}
                placeholder="Ex: NUIT, FEU..."
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="condition-type">Condition d'activation</label>
            <select
              id="condition-type"
              value={(editedAlteration.effect as AlterationEffect)?.conditions?.type || 'chance'}
              onChange={e => handleConditionChange('type', e.target.value)}
            >
              <option value="chance">Chance</option>
              <option value="health_below">PV inférieurs à</option>
              <option value="health_above">PV supérieurs à</option>
              <option value="has_tag">Possède le tag</option>
              <option value="missing_tag">Ne possède pas le tag</option>
            </select>
          </div>

          {(editedAlteration.effect as AlterationEffect)?.conditions?.type === 'chance' && (
            <>
              <div className="form-group">
                <label htmlFor="activation-chance">Chance d'activation (%)</label>
                <input
                  id="activation-chance"
                  type="number"
                  value={(editedAlteration.effect as AlterationEffect)?.conditions?.value || 100}
                  onChange={e => handleConditionChange('value', parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
              </div>
            </>
          )}

          {(['health_below', 'health_above'].includes((editedAlteration.effect as AlterationEffect)?.conditions?.type || '')) && (
            <div className="form-group">
              <label htmlFor="health-value">Valeur de PV (%)</label>
              <input
                id="health-value"
                type="number"
                value={(editedAlteration.effect as AlterationEffect)?.conditions?.value || 50}
                onChange={e => handleConditionChange('value', parseInt(e.target.value) || 0)}
                min="0"
                max="100"
              />
            </div>
          )}

          {(['has_tag', 'missing_tag'].includes((editedAlteration.effect as AlterationEffect)?.conditions?.type || '')) && (
            <div className="form-group">
              <label htmlFor="condition-tag">Tag</label>
              <input
                id="condition-tag"
                type="text"
                value={(editedAlteration.effect as AlterationEffect)?.conditions?.tag || ''}
                onChange={e => handleConditionChange('tag', e.target.value)}
                placeholder="Ex: NUIT, FEU..."
              />
            </div>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="icon">Icône</label>
          <input
            id="icon"
            type="text"
            value={editedAlteration.icon || ''}
            onChange={e => handleChange('icon', e.target.value)}
            placeholder="🔮"
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={editedAlteration.type || 'status'}
            onChange={e => handleChange('type', e.target.value)}
          >
            <option value="buff">Amélioration</option>
            <option value="debuff">Handicap</option>
            <option value="status">Status</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="duration">Durée (tours)</label>
          <input
            id="duration"
            type="number"
            value={editedAlteration.duration || 0}
            onChange={e => handleChange('duration', parseInt(e.target.value) || 0)}
            min="0"
            title="0 = permanent"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={editedAlteration.stackable || false}
              onChange={e => handleChange('stackable', e.target.checked)}
            />
            Cumulable
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={editedAlteration.unique_effect || false}
              onChange={e => handleChange('unique_effect', e.target.checked)}
            />
            Effet unique
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button onClick={handleSave}>
          {alteration?.id ? 'Sauvegarder les modifications' : 'Créer l\'altération'}
        </button>
        <button onClick={() => setIsEditing(false)}>Annuler</button>
      </div>
    </div>
  );

  return (
    <div className="alteration-manager">
      <div className="alterations-list">
        {loading ? (
          <div className="loading">Chargement des altérations...</div>
        ) : (
          alterations.map(alt => (
            <div key={alt.id} className="alteration-item">
              <div className="alteration-header">
                <span className="alteration-icon">{alt.icon}</span>
                <span className="alteration-name">{alt.name}</span>
                <span className={`alteration-type ${alt.type}`}>
                  {alt.type === 'buff' ? 'Amélioration' :
                   alt.type === 'debuff' ? 'Handicap' :
                   alt.type === 'status' ? 'Status' : 'Autre'}
                </span>
              </div>
              <p className="alteration-description">{alt.description}</p>
              <div className="alteration-details">
                <span title="Durée en tours">⏱️ {alt.duration || 'Permanent'}</span>
                {alt.stackable && <span title="Cette altération peut être cumulée">🔄 Cumulable</span>}
                {alt.unique_effect && <span title="Cette altération a un effet unique">✨ Effet unique</span>}
                {(alt.effect as AlterationEffect)?.action && (
                  <span title="Action spéciale">🎯 {(alt.effect as AlterationEffect).action}</span>
                )}
              </div>
              <div className="alteration-actions">
                <button 
                  className="edit-button"
                  onClick={() => {
                    setEditedAlteration(alt);
                    setIsEditing(true);
                  }}
                >
                  ✏️ Modifier
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(alt)}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            {renderForm()}
          </div>
        </div>
      )}

      {!isEditing && (
        <button 
          className="add-alteration-button"
          onClick={() => {
            setEditedAlteration({
              name: '',
              description: '',
              effect: {
                action: '',
                value: 0,
                description: '',
                targetType: 'self',
                conditions: {
                  type: 'chance',
                  value: 100
                }
              },
              icon: '🔮',
              duration: 1,
              stackable: false,
              unique_effect: false,
              type: 'status'
            });
            setIsEditing(true);
          }}
        >
          + Créer une nouvelle altération
        </button>
      )}
    </div>
  );
};

export default AlterationManager;