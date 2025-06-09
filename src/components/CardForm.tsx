import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Card } from '../types';
import SpellList from './SpellList';
import TagList from './TagList';
import CardPreview from './CardPreview';
import { updateCard, insertCard, uploadCardImage } from '../utils/supabaseClient';
import { updateCardSpells, updateCardTags } from '../utils/supabaseUtils';
import { getCardSpells, getCardTags } from '../utils/validation';
import './CardForm.css';

// Add this interface for toast notifications
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface CardFormProps {
  card: Card | null;
  onSave: (card: Card) => void;
  onDelete: (card: Card) => void;
  spellIds: number[];
  tagIds: number[];
  onSpellIdsChange: (ids: number[]) => void;
  onTagIdsChange: (ids: number[]) => void;
}

type CardInputEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

const EVENT_DURATIONS = ['instantanee', 'temporaire', 'permanente'] as const;

const defaultCard: Card = {
  id: 0,
  name: '',
  type: 'personnage',
  description: '',
  image: '',
  rarity: 'gros_bodycount',
  summon_cost: 0,
  passive_effect: '',
  is_wip: true,
  is_crap: false,
  properties: {}
};

const CardForm: React.FC<CardFormProps> = ({
  card,
  onSave,
  onDelete,
  spellIds,
  tagIds,
  onSpellIdsChange,
  onTagIdsChange
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'spells' | 'tags'>('info');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldRefreshPreview, setShouldRefreshPreview] = useState(0);
  const [localCard, setLocalCard] = useState<Card>(card || defaultCard);

  // Mettre à jour localCard lorsque card change (par exemple lors d'une réinitialisation)
  useEffect(() => {
    if (card) {
      setLocalCard(card);
    }
  }, [card]);

  // Fonction pour forcer le rafraîchissement de la prévisualisation
  const refreshPreview = useCallback(() => {
    setShouldRefreshPreview(prev => prev + 1);
  }, []);

  // Gestionnaires pour les mises à jour des sorts et tags
  const handleSpellsChange = useCallback((newSpellIds: number[]) => {
    onSpellIdsChange(newSpellIds);
    refreshPreview();
  }, [onSpellIdsChange, refreshPreview]);

  const handleTagsChange = useCallback((newTagIds: number[]) => {
    onTagIdsChange(newTagIds);
    refreshPreview();
  }, [onTagIdsChange, refreshPreview]);

  // Initialize form state with selected card values and load its spells and tags
  useEffect(() => {
    const loadCardData = async () => {
      // If we have a card from location state, use it
      if (location.state?.card) {
        onSave(location.state.card);
      }

      // Reset spells and tags if card is null or has no id
      if (!card?.id) {
        onSpellIdsChange([]);
        onTagIdsChange([]);
        return;
      }

      // Load spells and tags only if we have a card with an id
      try {
        const cardSpells = await getCardSpells(card.id);
        onSpellIdsChange(cardSpells.map(spell => spell.spell_id));

        const cardTags = await getCardTags(card.id);
        onTagIdsChange(cardTags.map(tag => tag.tag_id));
      } catch (error) {
        console.error('Error loading card data:', error);
      }
    };

    loadCardData();
  }, [location.state]);

  // Load spells and tags when card ID changes
  useEffect(() => {
    const loadRelations = async () => {
      if (!card?.id) return;

      try {
        const cardSpells = await getCardSpells(card.id);
        onSpellIdsChange(cardSpells.map(spell => spell.spell_id));

        const cardTags = await getCardTags(card.id);
        onTagIdsChange(cardTags.map(tag => tag.tag_id));
      } catch (error) {
        console.error('Error loading card relations:', error);
      }
    };

    loadRelations();
  }, [card?.id]);

  // Update summon_cost automatically based on rarity
  useEffect(() => {
    const rarityCostMap = {
      'gros_bodycount': 10,
      'interessant': 20,
      'banger': 40,
      'cheate': 80
    };

    // Only update if there's a valid rarity and no manual summon_cost has been set
    if (card?.rarity && 
        rarityCostMap[card.rarity as keyof typeof rarityCostMap] && 
        card.summon_cost === undefined) {
      const newCost = rarityCostMap[card.rarity as keyof typeof rarityCostMap];
      const updatedCard: Card = {
        ...card,
        summon_cost: newCost
      };
      onSave(updatedCard);
    }
  }, [card?.rarity, card, onSave]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  const saveToDatabase = useCallback(async (cardToSave: Card) => {
    try {
      const result = await updateCard(cardToSave);
      if (result) {
        showToast('Modifications sauvegardées', 'success');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la carte:', error);
      showToast('Erreur lors de la sauvegarde', 'error');
      // Revert to the last known good state
      if (location.state?.card) {
        onSave(location.state.card);
      }
    }
  }, [location.state?.card, onSave, showToast]);

  const debouncedSave = useCallback((cardToSave: Card) => {
    if (cardToSave.id) {
      setTimeout(() => saveToDatabase(cardToSave), 500);
    }
  }, [saveToDatabase]);

  const handleImageFile = async (file: File) => {
    try {
      const url = await uploadCardImage(file);
      setLocalCard(prev => ({ ...prev, image: url }));
      showToast('Image uploadée avec succès', 'success');
    } catch (err) {
      console.error('Erreur lors de l\'upload de l\'image', err);
      showToast('Erreur lors de l\'upload de l\'image', 'error');
    }
  };

  const handleChange = (e: CardInputEvent) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setLocalCard((prev: Card): Card => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
      return;
    }

    if (name === 'summon_cost') {
      setLocalCard((prev: Card): Card => ({
        ...prev,
        summon_cost: parseInt(value) || 0
      }));
      return;
    }

    if (name === 'type') {
      const newType = value as Card['type'];
      setLocalCard((prev: Card): Card => ({
        ...prev,
        type: newType,
        eventDuration: newType === 'evenement' ? (prev.eventDuration || 'instantanee') : undefined
      }));
      return;
    }

    if (name === 'eventDuration') {
      setLocalCard((prev: Card): Card => ({
        ...prev,
        eventDuration: value as Card['eventDuration']
      }));
      return;
    }

    if (name === 'rarity') {
      setLocalCard((prev: Card): Card => ({
        ...prev,
        rarity: value as Card['rarity']
      }));
      return;
    }

    // Gérer spécifiquement le changement des points de vie
    if (name === 'health') {
      setLocalCard((prev: Card): Card => ({
        ...prev,
        properties: {
          ...prev.properties,
          health: parseInt(value) || 0
        }
      }));
      return;
    }

    setLocalCard((prev: Card): Card => ({
      ...prev,
      [name]: value
    }));
  };

  // Add validation before sending to API
  const validateCard = async (card: Card): Promise<string[]> => {
    const requiredFields = ['name', 'type', 'rarity'];
    const missingFields = requiredFields.filter(field => !card[field as keyof Card]);
    
    if (missingFields.length > 0) {
      return missingFields;
    }
    
    if (card.type === 'personnage' && (!card.properties?.health || card.properties.health <= 0)) {
      return ['Personnages must have health greater than 0'];
    }
    
    return [];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!localCard) {
        throw new Error('Aucune carte à sauvegarder');
      }

      // Vérifions que les propriétés de base sont valides
      console.log('Carte avant validation:', JSON.stringify(localCard));

      // Valider la carte avant la sauvegarde
      const validationErrors = await validateCard(localCard);
      if (validationErrors.length > 0) {
        showToast('Erreurs de validation : ' + validationErrors.join(', '), 'error');
        setIsSubmitting(false);
        return;
      }

      // Préparation de la carte pour sauvegarde - assurons-nous que les propriétés sont correctes
      const cardToSave = {
        ...localCard,
        properties: {
          ...localCard.properties
        }
      };

      // Si c'est un personnage, vérifions que health est un nombre
      if (cardToSave.type === 'personnage') {
        cardToSave.properties.health = Number(cardToSave.properties.health || 0);
        
        // Vérifions que les points de vie sont valides
        if (isNaN(cardToSave.properties.health)) {
          showToast('Les points de vie doivent être un nombre valide', 'error');
          setIsSubmitting(false);
          return;
        }
      }

      // Supprimer la propriété tags si elle existe pour éviter l'erreur "Could not find the 'tags' column"
      const { tags, ...cardWithoutTags } = cardToSave;

      console.log(`Carte à sauvegarder (ID: ${cardWithoutTags.id || 'Nouvelle'})`, JSON.stringify(cardWithoutTags));

      // Sauvegarder la carte - updateCard se chargera de déterminer s'il faut insérer ou mettre à jour
      let savedCard;
      try {
        savedCard = await updateCard(cardWithoutTags);
        if (!savedCard) {
          throw new Error('Échec de la sauvegarde de la carte');
        }
        console.log('Carte sauvegardée avec succès:', JSON.stringify(savedCard));
      } catch (saveError) {
        console.error('Erreur lors de la sauvegarde principale:', saveError);
        throw saveError;
      }

      // Mettre à jour les relations avec les tags et les sorts en parallèle
      // Ne le faire que si la carte a un ID valide
      if (savedCard.id) {
        try {
          await Promise.all([
            updateCardTags(savedCard.id, tagIds),
            updateCardSpells(savedCard.id, spellIds)
          ]);
          console.log('Relations mises à jour avec succès');
        } catch (relationError) {
          console.error('Erreur lors de la mise à jour des relations:', relationError);
          showToast('Carte sauvegardée, mais erreur lors de la mise à jour des sorts/tags', 'error');
        }
      } else {
        console.error('Impossible de mettre à jour les relations: la carte n\'a pas d\'ID');
      }

      // Forcer le rafraîchissement de la prévisualisation
      refreshPreview();

      showToast('Carte sauvegardée avec succès', 'success');
      onSave(savedCard);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erreur inconnue lors de la sauvegarde';
      showToast(`Erreur lors de la sauvegarde : ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardTypes = ['personnage', 'objet', 'evenement', 'lieu', 'action'] as const;
  const rarityTypes = ['gros_bodycount', 'interessant', 'banger', 'cheate'] as const;

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'gros_bodycount': return 'Gros bodycount';
      case 'interessant': return 'Intéressant';
      case 'banger': return 'Banger';
      case 'cheate': return 'Cheaté';
      default: return rarity;
    }
  };

  if (!localCard) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="card-editor-layout">
      <div className="card-editor-container">
        <div className="card-editor-tabs">
          <button
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📝 Informations
          </button>
          <button
            className={`tab-button ${activeTab === 'spells' ? 'active' : ''}`}
            onClick={() => setActiveTab('spells')}
          >
            ✨ Sorts ({spellIds.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            🏷️ Tags ({tagIds.length})
          </button>
        </div>

        {/* Bouton de suppression - visible uniquement si la carte a un ID */}
        {localCard.id > 0 && (
          <div className="delete-card-container">
            <button 
              className="delete-card-button"
              onClick={() => onDelete(localCard)}
              title="Supprimer cette carte"
            >
              🗑️ Supprimer la carte
            </button>
          </div>
        )}

        <div className="card-editor-content">
          {activeTab === 'info' && (
            <div className="card-info-section">
              <div className="form-section">
                <h3>Informations générales</h3>

                <div className="form-group">
                  <label htmlFor="name" className="required-field">Nom de la carte</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={localCard.name}
                    onChange={handleChange}
                    placeholder="Nom de la carte"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="type" className="required-field">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={localCard.type}
                      onChange={handleChange}
                      required
                      className={`form-input card-type-select ${localCard.type}`}
                    >
                      <option value="">Sélectionner un type</option>
                      {cardTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="rarity" className="required-field">Rareté</label>
                    <select
                      id="rarity"
                      name="rarity"
                      value={localCard.rarity}
                      onChange={handleChange}
                      required
                      className={`form-input card-rarity-select ${localCard.rarity}`}
                    >
                      <option value="">Sélectionner une rareté</option>
                      {rarityTypes.map(rarity => (
                        <option key={rarity} value={rarity}>
                          {getRarityLabel(rarity)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {localCard.type === 'evenement' && (
                  <div className="form-group">
                    <label htmlFor="eventDuration" className="required-field">Durée de l'événement</label>
                    <select
                      id="eventDuration"
                      name="eventDuration"
                      value={localCard.eventDuration || 'instantanee'}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      {EVENT_DURATIONS.map(d => (
                        <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={localCard.description || ''}
                    onChange={handleChange}
                    placeholder="Description de la carte"
                    rows={3}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  {localCard.type === 'personnage' && (
                    <div className="form-group">
                      <label htmlFor="health" className="required-field">Points de vie</label>
                      <input
                        type="number"
                        id="health"
                        name="health"
                        value={localCard.properties?.health || 0}
                        onChange={handleChange}
                        min="0"
                        required
                        className="form-input"
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="image">Image URL</label>
                  <input
                    type="text"
                    id="image"
                    name="image"
                    value={localCard.image || ''}
                    onChange={handleChange}
                    placeholder="URL de l'image"
                    className="form-input"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="passive_effect">Effet passif</label>
                  <textarea
                    id="passive_effect"
                    name="passive_effect"
                    value={localCard.passive_effect || ''}
                    onChange={handleChange}
                    placeholder="Effet passif de la carte"
                    rows={2}
                    className="form-input"
                  />
                </div>

                <div className="form-row checkbox-section">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_wip"
                        checked={localCard.is_wip}
                        onChange={handleChange}
                      />
                      En cours (WIP)
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_crap"
                        checked={localCard.is_crap}
                        onChange={handleChange}
                      />
                      Carte poubelle
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'spells' && (
            <div className="card-spells-section">
              <div className="section-description">
                <h3>Sorts et capacités</h3>
                <p>Ajoutez et configurez les sorts disponibles pour cette carte. {localCard.type === 'personnage' ? 'Les personnages peuvent avoir plusieurs sorts avec des effets différents.' : ''}</p>
              </div>
              <SpellList
                spellIds={spellIds}
                onChange={handleSpellsChange}
                maxSpells={localCard.type === 'personnage' ? undefined : 1}
              />
              <div className="section-actions">
                <button 
                  className="validate-button"
                  onClick={async () => {
                    try {
                      await updateCardSpells(localCard.id, spellIds);
                      showToast('Sorts mis à jour avec succès', 'success');
                      refreshPreview();
                    } catch (error) {
                      console.error('Erreur lors de la mise à jour des sorts:', error);
                      showToast('Erreur lors de la mise à jour des sorts', 'error');
                    }
                  }}
                >
                  Valider les sorts
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="card-tags-section">
              <div className="section-description">
                <h3>Tags et attributs</h3>
                <p>Ajoutez des tags pour définir des attributs spécifiques à cette carte.</p>
              </div>
              <TagList
                tagIds={tagIds}
                onChange={handleTagsChange}
              />
              <div className="section-actions">
                <button 
                  className="validate-button"
                  onClick={async () => {
                    try {
                      await updateCardTags(localCard.id, tagIds);
                      showToast('Tags mis à jour avec succès', 'success');
                      refreshPreview();
                    } catch (error) {
                      console.error('Erreur lors de la mise à jour des tags:', error);
                      showToast('Erreur lors de la mise à jour des tags', 'error');
                    }
                  }}
                >
                  Valider les tags
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Unified buttons outside of tab system */}
        <div className="form-buttons unified-buttons">
          <button onClick={handleSubmit} className="save-button">Sauvegarder la carte et ses relations</button>
        </div>
      </div>

      <div className="card-preview-sidebar">
        <h3>Aperçu en temps réel</h3>
        <CardPreview 
          key={shouldRefreshPreview} 
          card={localCard} 
          spellIds={spellIds}
          tagIds={tagIds}
        />
      </div>

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardForm;