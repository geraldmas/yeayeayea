import React, { useState, useEffect } from 'react';
import { Alteration } from '../types';
import { alterationService } from '../utils/dataService';
import { migrationService } from '../utils/migration';

const AlterationManager: React.FC = () => {
  const [alterations, setAlterations] = useState<Alteration[]>([]);
  const [editingAlteration, setEditingAlteration] = useState<Alteration | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadAlterations();
  }, []);

  const loadAlterations = async () => {
    try {
      const data = await alterationService.getAll();
      setAlterations(data);
    } catch (error) {
      console.error('Error loading alterations:', error);
    }
  };

  const handleCreateAlteration = async (alteration: Omit<Alteration, 'id'>) => {
    try {
      await alterationService.create(alteration);
      loadAlterations();
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating alteration:', error);
    }
  };

  const handleUpdateAlteration = async (id: string, alteration: Partial<Alteration>) => {
    try {
      await alterationService.update(id, alteration);
      loadAlterations();
      setEditingAlteration(null);
    } catch (error) {
      console.error('Error updating alteration:', error);
    }
  };

  const handleDeleteAlteration = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette altération ?')) return;
    
    try {
      await alterationService.delete(id);
      loadAlterations();
    } catch (error) {
      console.error('Error deleting alteration:', error);
    }
  };

  const handleMigration = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir lancer la migration ? Cette opération est irréversible.')) {
      return;
    }
    
    try {
      const result = await migrationService.migrateToNewSchema();
      if (result.success) {
        alert('Migration terminée avec succès !');
        loadAlterations();
      } else {
        alert('Erreur lors de la migration : ' + result.error);
      }
    } catch (error) {
      console.error('Error during migration:', error);
      alert('Erreur lors de la migration');
    }
  };

  const AlterationForm: React.FC<{
    initialData?: Alteration;
    onSubmit: (data: any) => void;
    onCancel: () => void;
  }> = ({ initialData, onSubmit, onCancel }) => {
    interface AlterationFormData extends Omit<Alteration, 'id' | 'created_at' | 'updated_at'> {}

    const [formData, setFormData] = useState<AlterationFormData>(initialData || {
      name: '',
      description: '',
      effect: '',
      icon: '',
      stackable: false,
      unique_effect: false,
      type: 'status',
      duration: 1
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : type === 'number' 
            ? parseInt(value) || 1
            : value
      }));
    };

    return (
      <div className="alteration-form">
        <div className="form-row">
          <div className="form-group">
            <label>Nom</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Icône</label>
            <input
              type="text"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Effet</label>
          <input
            type="text"
            name="effect"
            value={formData.effect}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="buff">Bonus</option>
              <option value="debuff">Malus</option>
              <option value="status">Statut</option>
              <option value="other">Autre</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Durée (tours)</label>
          <input
            type="number"
            name="duration"
            value={formData.duration || 1}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="stackable"
                checked={formData.stackable}
                onChange={handleChange}
              />
              Cumulable
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="unique_effect"
                checked={formData.unique_effect}
                onChange={handleChange}
              />
              Unique (une seule fois par cible)
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => onSubmit(formData)}>
            {initialData ? 'Mettre à jour' : 'Créer'}
          </button>
          <button type="button" onClick={onCancel} className="secondary">
            Annuler
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="editor-section">
      <div className="section-title">
        <h2>Gestionnaire d'Altérations</h2>
        <div className="section-actions">
          <button 
            className="add-button"
            onClick={() => setIsCreating(true)}
          >
            Nouvelle Altération
          </button>
          <button 
            className="migration-button"
            onClick={handleMigration}
          >
            Lancer la Migration
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="editor-section">
          <h3>Nouvelle Altération</h3>
          <AlterationForm
            onSubmit={handleCreateAlteration}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      <div className="alterations-list">
        {alterations.map(alteration => (
          <div key={alteration.id} className="alteration-item">
            {editingAlteration?.id === alteration.id ? (
              <AlterationForm
                initialData={alteration}
                onSubmit={(data) => handleUpdateAlteration(alteration.id, data)}
                onCancel={() => setEditingAlteration(null)}
              />
            ) : (
              <div className="alteration-content">
                <div className="alteration-header">
                  <span className="alteration-icon">{alteration.icon}</span>
                  <h3>{alteration.name}</h3>
                  <span className={`alteration-type ${alteration.type}`}>
                    {alteration.type}
                  </span>
                </div>
                <p className="alteration-description">{alteration.description}</p>
                <div className="alteration-details">
                  <span>{alteration.stackable ? 'Cumulable' : 'Non cumulable'}</span>
                  {alteration.unique_effect && <span>Unique</span>}
                </div>
                <div className="alteration-actions">
                  <button
                    onClick={() => setEditingAlteration(alteration)}
                    className="edit-button"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteAlteration(alteration.id)}
                    className="delete-button"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlterationManager;