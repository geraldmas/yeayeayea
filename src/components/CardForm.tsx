import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Card, Rarity } from '../types';
import SpellList from './SpellList';
import TagList from './TagList';
import './CardForm.css';
import { getAutocompleteValues } from '../utils/supabaseClient';

interface CardFormProps {
  card: Card;
  setCard: Dispatch<SetStateAction<Card>>;
}

const CardForm: React.FC<CardFormProps> = ({ card, setCard }) => {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'health') {
      const numValue = parseInt(value);
      setCard((prev: Card) => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else if (name === 'isWIP') {
      const isChecked = (e.target as HTMLInputElement).checked;
      setCard((prev: Card) => ({
        ...prev,
        [name]: isChecked
      }));
    } else if (name === 'passive_effect') {
      setCard((prev: Card) => ({
        ...prev,
        passiveEffect: value
      }));
    } else {
      setCard((prev: Card) => ({
        ...prev,
        [name]: value
      }));
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

  return (
    <div className="editor-container">
      <div className="editor-form">
        <div className="editor-section">
          <div className="section-title">
            <h3>Informations générales</h3>
          </div>
          
          <div className="form-row">
            <div className="form-group required">
              <label htmlFor="name">Nom de la carte</label>
              <div className="input-with-suggestions">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={card.name}
                  onChange={handleChange}
                  placeholder="Nom de la carte"
                  list="saved-names"
                  required
                />
                <datalist id="saved-names">
                  {savedValues.names.map((name, index) => (
                    <option key={index} value={name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="form-group required">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={card.type}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionner un type</option>
                {cardTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={card.description || ''}
                onChange={handleChange}
                placeholder="Description de la carte"
                rows={3}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group required">
              <label htmlFor="health">Points de vie</label>
              <input
                type="number"
                id="health"
                name="health"
                value={card.health}
                onChange={handleChange}
                min="0"
                required
              />
            </div>

            <div className="form-group required">
              <label htmlFor="rarity">Rareté</label>
              <select
                id="rarity"
                name="rarity"
                value={card.rarity}
                onChange={handleChange}
                required
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="passive_effect">Effet passif</label>
              <textarea
                id="passive_effect"
                name="passive_effect"
                value={card.passiveEffect || ''}
                onChange={handleChange}
                placeholder="Effet passif de la carte"
                rows={2}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="image">Image URL</label>
              <div className="input-with-suggestions">
                <input
                  type="text"
                  id="image"
                  name="image"
                  value={card.image || ''}
                  onChange={handleChange}
                  placeholder="URL de l'image"
                  list="saved-images"
                />
                <datalist id="saved-images">
                  {savedValues.images.map((url, index) => (
                    <option key={index} value={url} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isWIP"
                  checked={card.isWIP}
                  onChange={handleChange}
                />
                En cours (WIP)
              </label>
            </div>
          </div>
        </div>

        <div className="editor-section">
          <div className="section-title">
            <h3>Sorts</h3>
          </div>
          <SpellList 
            spellIds={card.spells} 
            onChange={spells => setCard((prev: Card) => ({ ...prev, spells }))}
          />
        </div>

        <div className="editor-section">
          <div className="section-title">
            <h3>Tags</h3>
          </div>
          <TagList 
            tagIds={card.tags}
            onChange={tags => setCard((prev: Card) => ({ ...prev, tags }))}
          />
        </div>
      </div>
    </div>
  );
};

export default CardForm;