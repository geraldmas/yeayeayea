import React, { useState, useEffect } from 'react';
import { Booster, Card, Spell, Tag } from '../types';
import { spellService, tagService } from '../utils/dataService';
import { getCardTags, getCardSpells } from '../utils/validation';

interface BoosterFormProps {
  booster: Booster;
  onSave: (booster: Booster) => void;
}

const BoosterForm: React.FC<BoosterFormProps> = ({ booster, onSave }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loadedSpells, setLoadedSpells] = useState<Record<string, Spell>>({});
  const [loadedTags, setLoadedTags] = useState<Record<string, Tag>>({});
  const [cardSpellsMap, setCardSpellsMap] = useState<Record<number, number[]>>({});
  const [cardTagsMap, setCardTagsMap] = useState<Record<number, number[]>>({});

  useEffect(() => {
    loadSpellsAndTags();
  }, [booster.cards]);

  const loadSpellsAndTags = async () => {
    const spellIds = new Set<number>();
    const tagIds = new Set<number>();
    const spellsMap: Record<number, number[]> = {};
    const tagsMap: Record<number, number[]> = {};

    // Collect all spell and tag IDs from cards using the join table approach
    await Promise.all(booster.cards.map(async (card) => {
      // Get spells for this card
      const cardSpells = await getCardSpells(card.id);
      const cardSpellIds = cardSpells.map(spell => spell.spell_id);
      spellsMap[card.id] = cardSpellIds;
      cardSpellIds.forEach(id => spellIds.add(id));
      
      // Get tags for this card
      const cardTags = await getCardTags(card.id);
      const cardTagIds = cardTags.map(tag => tag.tag_id);
      tagsMap[card.id] = cardTagIds;
      cardTagIds.forEach(id => tagIds.add(id));
    }));

    setCardSpellsMap(spellsMap);
    setCardTagsMap(tagsMap);

    try {
      const spells = await spellService.getByIds(Array.from(spellIds));
      const spellsRecord = spells.reduce((acc, spell) => {
        acc[spell.id] = spell;
        return acc;
      }, {} as Record<string, Spell>);
      setLoadedSpells(spellsRecord);

      const tags = await tagService.getByIds(Array.from(tagIds));
      const tagsRecord = tags.reduce((acc, tag) => {
        acc[tag.id] = tag;
        return acc;
      }, {} as Record<string, Tag>);
      setLoadedTags(tagsRecord);
    } catch (error) {
      console.error('Error loading spells and tags:', error);
    }
  };

  const loadBoosterData = async () => {
    const spellIds = new Set<number>();
    const tagIds = new Set<number>();

    await Promise.all(booster.cards.map(async (card) => {
      const cardSpells = await getCardSpells(card.id);
      cardSpells.forEach(spell => spellIds.add(spell.spell_id));
      
      const cardTags = await getCardTags(card.id);
      cardTags.forEach(tag => tagIds.add(tag.tag_id));
    }));

    // ...existing code...
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedBooster: Booster = {
      ...booster,
      [name]: value
    };
    onSave(updatedBooster);
  };

  const handleAddCard = (card: Card) => {
    const updatedBooster: Booster = {
      ...booster,
      cards: [...booster.cards, card]
    };
    onSave(updatedBooster);
  };

  const handleRemoveCard = (index: number) => {
    const newCards = [...booster.cards];
    newCards.splice(index, 1);
    const updatedBooster: Booster = {
      ...booster,
      cards: newCards
    };
    onSave(updatedBooster);
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
                  <p><strong>Points de vie:</strong> {card.properties?.health || 0}</p>
                  <p><strong>Sorts:</strong> {cardSpellsMap[card.id]?.length || 0}</p>
                  <p><strong>Tags:</strong> {
                    cardTagsMap[card.id]?.map(tagId => loadedTags[tagId]?.name)
                      .filter(Boolean)
                      .join(', ') || 'Aucun'
                  }</p>
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