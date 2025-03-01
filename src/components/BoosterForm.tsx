import React, { useState, useEffect } from 'react';
import { Booster, Card, Spell, Tag } from '../types';
import { spellService, tagService } from '../utils/dataService';
import { Json } from '../types/database.types';

interface BoosterFormProps {
  booster: Booster;
  setBooster: React.Dispatch<React.SetStateAction<Booster>>;
}

const BoosterForm: React.FC<BoosterFormProps> = ({ booster, setBooster }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loadedSpells, setLoadedSpells] = useState<Record<string, Spell>>({});
  const [loadedTags, setLoadedTags] = useState<Record<string, Tag>>({});

  useEffect(() => {
    loadSpellsAndTags();
  }, [booster.cards]);

  const loadSpellsAndTags = async () => {
    const spellIds = new Set<number>();
    const tagIds = new Set<number>();

    // Collect all spell and tag IDs from cards
    booster.cards.forEach(card => {
      card.spells.forEach(id => spellIds.add(id));
      card.tags.forEach(id => tagIds.add(id));
    });

    try {
      const spells = await spellService.getByIds(Array.from(spellIds));
      const spellsMap = spells.reduce((acc, spell) => {
        acc[spell.id] = spell;
        return acc;
      }, {} as Record<string, Spell>);
      setLoadedSpells(spellsMap);

      const tags = await tagService.getByIds(Array.from(tagIds));
      const tagsMap = tags.reduce((acc, tag) => {
        acc[tag.id] = tag;
        return acc;
      }, {} as Record<string, Tag>);
      setLoadedTags(tagsMap);
    } catch (error) {
      console.error('Error loading spells and tags:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBooster(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCard = (card: Card) => {
    setBooster(prev => ({
      ...prev,
      cards: [...prev.cards, card]
    }));
  };

  const handleRemoveCard = (index: number) => {
    setBooster(prev => {
      const newCards = [...prev.cards];
      newCards.splice(index, 1);
      return {
        ...prev,
        cards: newCards
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        const parsedData = JSON.parse(jsonData);
        
        // Vérifier si c'est une carte ou un tableau de cartes
        if (Array.isArray(parsedData)) {
          setAvailableCards(parsedData);
        } else if (parsedData.id && parsedData.name) {
          setAvailableCards([parsedData]);
        }
      } catch (error) {
        console.error("Erreur lors de l'importation des cartes :", error);
        alert("Format de fichier JSON invalide");
      }
    };
    reader.readAsText(files[0]);
    e.target.value = '';
  };

  return (
    <div className="editor-section">
      <h2>Informations du Booster</h2>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="id">ID</label>
          <input
            type="text"
            id="id"
            name="id"
            value={booster.id}
            onChange={handleChange}
            placeholder="Identifiant unique du booster"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Nom</label>
          <input
            type="text"
            id="name"
            name="name"
            value={booster.name}
            onChange={handleChange}
            placeholder="Nom du booster"
            required
          />
        </div>
      </div>

      <div className="editor-section">
        <div className="section-title">
          <h3>Cartes incluses ({booster.cards.length})</h3>
          <div>
            <input
              type="file"
              id="card-json-upload"
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button 
              onClick={() => document.getElementById('card-json-upload')?.click()}
            >
              Importer des cartes JSON
            </button>
          </div>
        </div>

        {booster.cards.length === 0 ? (
          <p>Aucune carte dans ce booster.</p>
        ) : (
          booster.cards.map((card, index) => (
            <div key={index} className="collapsible-section">
              <div className="collapsible-header" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                <h4>{card.name || "Carte sans nom"}</h4>
                <button 
                  className="remove-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCard(index);
                  }}
                >
                  Retirer
                </button>
              </div>
              
              {expandedIndex === index && (
                <div className="collapsible-content">
                  <p><strong>ID:</strong> {card.id}</p>
                  <p><strong>Type:</strong> {card.type}</p>
                  <p><strong>Description:</strong> {card.description}</p>
                  <p><strong>Points de vie:</strong> {card.health}</p>
                  <p><strong>Sorts:</strong> {card.spells?.length || 0}</p>
                  <p><strong>Tags:</strong> {card.tags.map(id => loadedTags[id]?.name).filter(Boolean).join(', ') || 'Aucun'}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {availableCards.length > 0 && (
        <div className="editor-section">
          <h3>Cartes disponibles à ajouter</h3>
          
          <div className="form-row">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {availableCards
              .filter(card => 
                card.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((card, index) => (
                <div key={index} className="collapsible-section">
                  <div className="collapsible-header">
                    <h4>{card.name || "Carte sans nom"}</h4>
                    <button 
                      className="add-button" 
                      onClick={() => handleAddCard(card)}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default BoosterForm;

// Ajout d'une exportation vide pour s'assurer que le fichier est traité comme un module
export {};