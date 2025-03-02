import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../types';
import SpellList from './SpellList';
import TagList from './TagList';
import CardPreview from './CardPreview';
import { getAutocompleteValues, updateCard, insertCard } from '../utils/supabaseClient';
import { updateCardSpells, updateCardTags, Card as CardType } from '../utils/supabaseUtils';
import './CardForm.css';

interface CardFormProps {
  card: Card | null;
  setCard: React.Dispatch<React.SetStateAction<Card | null>>;
  spellIds: number[];
  setSpellIds: React.Dispatch<React.SetStateAction<number[]>>;
  tagIds: number[];
  setTagIds: React.Dispatch<React.SetStateAction<number[]>>;
}

const CardForm: React.FC<CardFormProps> = ({ card, setCard, spellIds, setSpellIds, tagIds, setTagIds }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'info' | 'spells' | 'tags'>('info');
  const [savedValues, setSavedValues] = useState<{
    names: string[];
    descriptions: string[];
    images: string[];
    passive_effects: string[];
  }>({
    names: [],
    descriptions: [],
    images: [],
    passive_effects: []
  });

  // Load autocomplete values
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestions = await getAutocompleteValues();
        setSavedValues(suggestions);
      } catch (error) {
        console.error('Erreur lors du chargement des suggestions:', error);
      }
    };
    loadSuggestions();
  }, []);

  // Initialize form state with selected card values
  useEffect(() => {
    if (location.state && location.state.card) {
      setCard(location.state.card);
    }
  }, [location.state, setCard]);

  // Update summon_cost automatically based on rarity
  useEffect(() => {
    const rarityCostMap = {
      'gros_bodycount': 10,
      'interessant': 20,
      'banger': 40,
      'cheate': 80
    };

    // Only update if there's a valid rarity
    if (card?.rarity && rarityCostMap[card.rarity as keyof typeof rarityCostMap]) {
      const newCost = rarityCostMap[card.rarity as keyof typeof rarityCostMap];

      // Only update if cost is different to avoid infinite render loops
      if (card.summon_cost !== newCost) {
        setCard(prev => (prev ? {
          ...prev,
          summon_cost: newCost
        } : prev));
      }
    }
  }, [card?.rarity, card?.summon_cost, setCard]);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'health') {
      const numValue = parseInt(value);
      setCard((prev) => (prev ? {
        ...prev,
        properties: {
          ...prev.properties,
          health: isNaN(numValue) ? undefined : numValue
        }
      } : null));
    } else if (name === 'isWIP') {
      const isChecked = (e.target as HTMLInputElement).checked;
      setCard((prev) => (prev ? {
        ...prev,
        is_wip: isChecked
      } : null));
    } else if (name === 'is_crap') {
      const isChecked = (e.target as HTMLInputElement).checked;
      setCard((prev) => (prev ? {
        ...prev,
        is_crap: isChecked
      } : null));
    } else if (name === 'passive_effect') {
      setCard((prev) => (prev ? {
        ...prev,
        passive_effect: value
      } : null));
    } else {
      setCard((prev) => (prev ? {
        ...prev,
        [name]: value
      } : null));
    }
  };

  const saveCard = async () => {
    if (card) {
      try {
        // First save the card data
        let savedCard: Card | null = null;
        
        if (card.id) {
          const updateResult = await updateCard(card);
          // Check if we got a valid result
          if (updateResult) {
            savedCard = updateResult as unknown as Card;
          } else {
            throw new Error("Failed to update card - no data returned");
          }
        } else {
          const insertResult = await insertCard(card);
          // Check if we got a valid result
          if (insertResult) {
            savedCard = insertResult as unknown as Card;
          } else {
            throw new Error("Failed to insert card - no data returned");
          }
        }
        
        // Then update relationships with spells and tags
        if (savedCard?.id) {
          // Save spell associations
          await updateCardSpells(String(savedCard.id), spellIds.map(id => String(id)));
          
          // Save tag associations
          await updateCardTags(String(savedCard.id), tagIds.map(id => String(id)));
        } else {
          throw new Error("Card saved but no ID was returned");
        }
        
        alert('Carte et relations sauvegardées avec succès');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la carte:', error);
        alert('Erreur lors de la sauvegarde de la carte');
      }
    }
  };

  const resetCard = () => {
    setCard({
      id: card?.id ?? 0,
      name: '',
      type: '' as typeof cardTypes[number],
      rarity: '',
      description: '',
      image: '',
      passive_effect: '',
      properties: {
        health: 0
      },
      is_wip: false,
      is_crap: false,
      summon_cost: 0
    });
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

  if (!card) {
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
                    value={card.name}
                    onChange={handleChange}
                    placeholder="Nom de la carte"
                    list="saved-names"
                    required
                    className="form-input"
                  />
                  <datalist id="saved-names">
                    {savedValues.names.map((name, index) => (
                      <option key={index} value={name} />
                    ))}
                  </datalist>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="type" className="required-field">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={card.type}
                      onChange={handleChange}
                      required
                      className={`form-input card-type-select ${card.type}`}
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
                      value={card.rarity}
                      onChange={handleChange}
                      required
                      className={`form-input card-rarity-select ${card.rarity}`}
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

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={card.description || ''}
                    onChange={handleChange}
                    placeholder="Description de la carte"
                    rows={3}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  {card.type === 'personnage' && (
                    <div className="form-group">
                      <label htmlFor="health" className="required-field">Points de vie</label>
                      <input
                        type="number"
                        id="health"
                        name="health"
                        value={card.properties?.health || 0}
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
                    value={card.image || ''}
                    onChange={handleChange}
                    placeholder="URL de l'image"
                    list="saved-images"
                    className="form-input"
                  />
                  <datalist id="saved-images">
                    {savedValues.images.map((url, index) => (
                      <option key={index} value={url} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label htmlFor="passive_effect">Effet passif</label>
                  <textarea
                    id="passive_effect"
                    name="passive_effect"
                    value={card.passive_effect || ''}
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
                        name="isWIP"
                        checked={card.is_wip}
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
                        checked={card.is_crap}
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
                <p>Ajoutez et configurez les sorts disponibles pour cette carte. {card.type === 'personnage' ? 'Les personnages peuvent avoir plusieurs sorts avec des effets différents.' : ''}</p>
              </div>
              <SpellList
                spellIds={spellIds}
                onChange={setSpellIds}
                maxSpells={card.type === 'personnage' ? undefined : 1}
              />
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
                onChange={setTagIds}
              />
            </div>
          )}
        </div>
        
        {/* Unified buttons outside of tab system */}
        <div className="form-buttons unified-buttons">
          <button onClick={saveCard} className="save-button">Sauvegarder la carte et ses relations</button>
          <button onClick={resetCard} className="reset-button">Réinitialiser</button>
        </div>
      </div>

      <div className="card-preview-sidebar">
        <h3>Aperçu en temps réel</h3>
        <CardPreview card={card} />
      </div>
    </div>
  );
};

export default CardForm;