import React, { useState, useEffect } from 'react';
import { Card, Tag } from '../types';
import SpellList from './SpellList';
import TagList from './TagList';
import CardPreview from './CardPreview';

interface CardFormProps {
  card: Card;
  setCard: React.Dispatch<React.SetStateAction<Card>>;
}

const generateUniqueId = () => {
  const date = new Date();
  const timestamp = date.getTime();
  const random = Math.floor(Math.random() * 10000);
  return `card_${timestamp}_${random}`;
};

const CardForm: React.FC<CardFormProps> = ({ card, setCard }) => {
  const [uniqueIdPlaceholder] = useState(generateUniqueId());

  const [savedValues, setSavedValues] = useState<{
    names: string[];
    descriptions: string[];
    images: string[];
  }>({ names: [], descriptions: [], images: [] });

  useEffect(() => {
    // Charger les valeurs sauvegardées depuis le localStorage
    const loadSavedValues = () => {
      const saved = localStorage.getItem('savedCardValues');
      if (saved) {
        const values = JSON.parse(saved);
        setSavedValues(values);
      }
    };
    loadSavedValues();
  }, []);

  useEffect(() => {
    // Sauvegarder les nouvelles valeurs
    const updateSavedValues = (field: string, value: string) => {
      setSavedValues(prev => {
        const newValues = { ...prev };
        const key = field + 's' as keyof typeof prev;
        if (!newValues[key].includes(value) && value.trim() !== '') {
          newValues[key] = [...newValues[key], value];
          localStorage.setItem('savedCardValues', JSON.stringify(newValues));
        }
        return newValues;
      });
    };

    if (card.name) updateSavedValues('name', card.name);
    if (card.description) updateSavedValues('description', card.description);
    if (card.image) updateSavedValues('image', card.image);
  }, [card.name, card.description, card.image]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Gérer le champ image spécialement
    if (name === 'image') {
      // Si c'est une URL complète, la garder telle quelle
      // Sinon, considérer que c'est un nom de fichier dans /img/
      const finalValue = value.startsWith('http') || value.startsWith('data:') 
        ? value 
        : `/img/${value}`;
      setCard(prev => ({ ...prev, image: finalValue }));
      return;
    }

    // Handle different input types
    if (type === 'number') {
      setCard(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCard(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setCard(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-form">
        <h2>Informations de la Carte</h2>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="id">Identifiant</label>
            <input
              type="text"
              id="id"
              name="id"
              value={card.id}
              onChange={handleChange}
              placeholder={uniqueIdPlaceholder}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Nom</label>
            <input
              type="text"
              id="name"
              name="name"
              value={card.name}
              onChange={handleChange}
              placeholder="Nom de la carte"
              required
              list="savedNames"
            />
            <datalist id="savedNames">
              {savedValues.names.map((name, i) => (
                <option key={i} value={name} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={card.type}
              onChange={handleChange}
              required
            >
              <option value="character">Personnage</option>
              <option value="object">Objet</option>
              <option value="event">Événement</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              name="description"
              value={card.description}
              onChange={handleChange}
              placeholder="Description de la carte"
              list="savedDescriptions"
            />
            <datalist id="savedDescriptions">
              {savedValues.descriptions.map((desc, i) => (
                <option key={i} value={desc} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="image">Image</label>
            <input
              type="text"
              id="image"
              name="image"
              value={card.image.replace('/img/', '')}
              onChange={handleChange}
              placeholder="Nom du fichier dans /img/ ou URL complète"
              list="savedImages"
            />
            <datalist id="savedImages">
              {savedValues.images.map((img, i) => (
                <option key={i} value={img.replace('/img/', '')} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="health">Points de vie</label>
            <input
              type="number"
              id="health"
              name="health"
              value={card.health}
              onChange={handleChange}
              placeholder="Points de vie"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="passiveEffect">Effet passif</label>
            <textarea
              id="passiveEffect"
              name="passiveEffect"
              value={card.passiveEffect || ''}
              onChange={handleChange}
              placeholder="Description de l'effet passif (optionnel)"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isEX"
                checked={card.isEX || false}
                onChange={handleChange}
              />
              Carte EX (vaut 2 points)
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="position">Position</label>
            <select
              id="position"
              name="position"
              value={card.position || ''}
              onChange={handleChange}
            >
              <option value="">Non définie</option>
              <option value="active">Active</option>
              <option value="bench">Banc</option>
              <option value="hand">Main</option>
              <option value="inventory">Inventaire</option>
            </select>
          </div>
        </div>

        <SpellList 
          spells={card.spells} 
          onChange={(spells) => setCard(prev => ({...prev, spells}))} 
          isTalent={false}
        />

        {card.type === 'character' && (
          <div className="editor-section">
            <h3>Talent (capacité spéciale depuis le banc)</h3>
            <SpellList 
              spells={card.talent ? [card.talent] : []} 
              onChange={(talents) => setCard(prev => ({...prev, talent: talents[0]}))} 
              isTalent={true}
              maxSpells={1}
            />
          </div>
        )}

        <TagList 
          tags={card.tags} 
          onChange={(tags: Tag[]) => setCard(prev => ({...prev, tags}))} 
        />
      </div>
      
      <div className="preview-container">
        <CardPreview card={card} />
      </div>
    </div>
  );
};

export default CardForm;

// Ajout d'une exportation vide pour s'assurer que le fichier est traité comme un module
export {};