import React, { useState, useEffect, useCallback } from 'react';
import { Card, Rarity, Tag, Spell, LoadedSpellsMap } from '../types';
import CardPreview from './CardPreview';
import { getAllCards, searchCards } from '../utils/supabaseClient';
import './CardBrowser.css';
import { useNavigate } from 'react-router-dom';
import { tagService, spellService } from '../utils/dataService';
import { getCardTags, getCardSpells } from '../utils/validation';

interface Filters {
  searchTerm: string;
  isWIP?: boolean;
  isCrap?: boolean;
  rarity?: Rarity;
  type?: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
  hasTags: boolean | null;
  hasImage: boolean | null;
  hasDescription: boolean | null;
  selectedTags: string[];
  hasSpells: boolean | null;
  hasPassiveEffect: boolean | null;
}

interface CardBrowserProps {
  cards: Card[];
  onCardSelect: (card: Card) => void;
  loadedSpellsMap: LoadedSpellsMap;
}

const CardBrowser: React.FC<CardBrowserProps> = ({
  cards: initialCards,
  onCardSelect,
  loadedSpellsMap: initialSpellsMap
}) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [loadedSpellsMap, setLoadedSpellsMap] = useState<LoadedSpellsMap>(initialSpellsMap);
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    isWIP: undefined,
    isCrap: false,
    rarity: undefined,
    type: undefined,
    hasTags: null,
    hasImage: null,
    hasDescription: null,
    selectedTags: [],
    hasSpells: null,
    hasPassiveEffect: null
  });

  const [allCards, setAllCards] = useState<Card[]>(initialCards);

  const navigate = useNavigate();

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    if (!allCards) return;
    
    const loadTagsForCards = async () => {
      const allTagsSet = new Set<string>();

      allCards.forEach(card => {
        card.tags?.forEach(tag => {
          if (tag.name) allTagsSet.add(tag.name);
        });
      });

      setAllTags(Array.from(allTagsSet).sort());
    };

    loadTagsForCards();
  }, [allCards]);

  const filterCards = useCallback((cards: Card[]) => {
    return cards.filter(card => {
      if (filters.isWIP !== undefined && card.is_wip !== filters.isWIP) return false;
      if (filters.isCrap !== undefined && card.is_crap !== filters.isCrap) return false;
      if (filters.rarity && card.rarity !== filters.rarity) return false;
      if (filters.type && card.type !== filters.type) return false;
      if (filters.hasTags !== null) {
        const cardTags = card.tags || [];
        if (filters.hasTags && cardTags.length === 0) return false;
        if (!filters.hasTags && cardTags.length > 0) return false;
      }
      if (filters.hasImage !== null) {
        if (filters.hasImage && !card.image) return false;
        if (!filters.hasImage && card.image) return false;
      }
      if (filters.hasDescription !== null) {
        if (filters.hasDescription && !card.description) return false;
        if (!filters.hasDescription && card.description) return false;
      }
      if (filters.hasSpells !== null) {
        const cardSpells = loadedSpellsMap[card.id] || [];
        if (filters.hasSpells && cardSpells.length === 0) return false;
        if (!filters.hasSpells && cardSpells.length > 0) return false;
      }
      if (filters.hasPassiveEffect !== null) {
        if (filters.hasPassiveEffect && !card.passive_effect) return false;
        if (!filters.hasPassiveEffect && card.passive_effect) return false;
      }
      if (filters.selectedTags.length > 0) {
        const cardTagNames = card.tags?.map(tag => tag.name) || [];
        if (!filters.selectedTags.every(tag => cardTagNames.includes(tag))) {
          return false;
        }
      }
      return true;
    });
  }, [filters, loadedSpellsMap]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await getAllCards();
      setAllCards(data);
      setCards(filterCards(data));
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allCards.length > 0) {
      setCards(filterCards(allCards));
    }
  }, [filters, filterCards, allCards]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await searchCards(filters.searchTerm);
      setAllCards(data);
      setCards(filterCards(data));
    } catch (error) {
      console.error('Error searching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.searchTerm) {
        handleSearch();
      } else {
        loadCards();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  const handleFilterChange = (filterName: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      isWIP: undefined,
      isCrap: false,
      rarity: undefined,
      type: undefined,
      hasTags: null,
      hasImage: null,
      hasDescription: null,
      selectedTags: [],
      hasSpells: null,
      hasPassiveEffect: null
    });
  };

  return (
    <div className="card-browser">
      <div className="card-list">
        <div className="browser-header">
          <div className="filters-section">
            <div className="filters-header">
              <div className="filters-stats">
                Affichage de {cards.length} carte{cards.length > 1 ? 's' : ''} sur {allCards.length}
              </div>
              <button className="reset-filters-button" onClick={handleResetFilters}>
                Réinitialiser les filtres
              </button>
            </div>
            
            <div className="search-bar">
              <input
                type="text"
                placeholder="🔍 Rechercher une carte..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>

            <div className="filter-groups">
              <div className="filter-group">
                <div className="filter-group-label">Statut</div>
                <div className="filter-buttons">
                  <button
                    className={`filter-button ${filters.isWIP === true ? 'active' : ''}`}
                    onClick={() => handleFilterChange('isWIP', filters.isWIP === true ? undefined : true)}
                  >
                    🚧 En cours
                  </button>
                  <button
                    className={`filter-button ${filters.isWIP === false ? 'active' : ''}`}
                    onClick={() => handleFilterChange('isWIP', filters.isWIP === false ? undefined : false)}
                  >
                    ✅ Terminé
                  </button>
                  <button
                    className={`filter-button ${filters.isCrap === false ? 'active' : ''}`}
                    onClick={() => handleFilterChange('isCrap', filters.isCrap === false ? undefined : false)}
                  >
                    🗑️ Exclure poubelle
                  </button>
                  <button
                    className={`filter-button ${filters.isCrap === true ? 'active' : ''}`}
                    onClick={() => handleFilterChange('isCrap', filters.isCrap === true ? undefined : true)}
                  >
                    🗑️ Afficher uniquement poubelle
                  </button>
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-group-label">Type</div>
                <div className="filter-buttons">
                  <button
                    className={`filter-button type-personnage ${filters.type === 'personnage' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('type', filters.type === 'personnage' ? undefined : 'personnage')}
                  >
                    👤 Personnage
                  </button>
                  <button
                    className={`filter-button type-objet ${filters.type === 'objet' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('type', filters.type === 'objet' ? undefined : 'objet')}
                  >
                    🎁 Objet
                  </button>
                  <button
                    className={`filter-button type-evenement ${filters.type === 'evenement' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('type', filters.type === 'evenement' ? undefined : 'evenement')}
                  >
                    ⚡ Événement
                  </button>
                  <button
                    className={`filter-button type-lieu ${filters.type === 'lieu' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('type', filters.type === 'lieu' ? undefined : 'lieu')}
                  >
                    🏰 Lieu
                  </button>
                  <button
                    className={`filter-button type-action ${filters.type === 'action' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('type', filters.type === 'action' ? undefined : 'action')}
                  >
                    🎯 Action
                  </button>
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-group-label">Rareté</div>
                <div className="filter-buttons">
                  <button
                    className={`filter-button rarity-gros_bodycount ${filters.rarity === 'gros_bodycount' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('rarity', filters.rarity === 'gros_bodycount' ? undefined : 'gros_bodycount')}
                  >
                    Gros bodycount
                  </button>
                  <button
                    className={`filter-button rarity-interessant ${filters.rarity === 'interessant' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('rarity', filters.rarity === 'interessant' ? undefined : 'interessant')}
                  >
                    Intéressant
                  </button>
                  <button
                    className={`filter-button rarity-banger ${filters.rarity === 'banger' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('rarity', filters.rarity === 'banger' ? undefined : 'banger')}
                  >
                    Banger
                  </button>
                  <button
                    className={`filter-button rarity-cheate ${filters.rarity === 'cheate' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('rarity', filters.rarity === 'cheate' ? undefined : 'cheate')}
                  >
                    Cheaté
                  </button>
                </div>
              </div>

              <div className="filter-group warning-section">
                <div className="filter-group-label">🚨 Éléments manquants</div>
                <div className="filter-buttons">
                  <button
                    className={`filter-button warning ${filters.hasImage === false ? 'active' : ''}`}
                    onClick={() => handleFilterChange('hasImage', filters.hasImage === false ? null : false)}
                  >
                    Sans image
                  </button>
                  <button
                    className={`filter-button warning ${filters.hasDescription === false ? 'active' : ''}`}
                    onClick={() => handleFilterChange('hasDescription', filters.hasDescription === false ? null : false)}
                  >
                    Sans description
                  </button>
                  <button
                    className={`filter-button warning ${filters.hasTags === false ? 'active' : ''}`}
                    onClick={() => handleFilterChange('hasTags', filters.hasTags === false ? null : false)}
                  >
                    Sans tags
                  </button>
                  <button
                    className={`filter-button warning ${filters.hasSpells === false ? 'active' : ''}`}
                    onClick={() => handleFilterChange('hasSpells', filters.hasSpells === false ? null : false)}
                  >
                    Sans sorts
                  </button>
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-group-label">Tags spécifiques</div>
                <div className="tag-cloud">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      className={`tag-button ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
                      onClick={() => {
                        const newTags = filters.selectedTags.includes(tag)
                          ? filters.selectedTags.filter(t => t !== tag)
                          : [...filters.selectedTags, tag];
                        handleFilterChange('selectedTags', newTags);
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="cards-grid">
          {loading ? (
            <div className="loading">Chargement...</div>
          ) : cards.length === 0 ? (
            <div className="no-results">Aucune carte trouvée</div>
          ) : (
            cards.map(card => (
              <div 
                key={card.id}
                className={`card-item ${selectedCard?.id === card.id ? 'selected' : ''}`}
                onClick={() => setSelectedCard(card)}
                title="Cliquez pour visualiser"
              >
                <div className="card-item-header">
                  <span className="card-name" title={card.name}>
                    {card.name}
                    {card.is_wip && <span className="wip-badge-small">WIP</span>}
                  </span>
                </div>
                <div className="card-item-info">
                  <span className={`card-type-badge ${card.type}`}>{card.type}</span>
                  <span className={`card-rarity-badge ${card.rarity}`}>
                    {card.rarity.replace('_', ' ')}
                  </span>
                </div>
                {card.tags && card.tags.length > 0 && (
                  <div className="card-tags">
                    {card.tags.map((tag, index) => (
                      <span
                        key={index} 
                        className="card-tag"
                        title={tag.passive_effect || ''}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                {!card.image && <div className="no-image">🖼️</div>}
              </div>
            ))
          )}
        </div>
      </div>
      {selectedCard && (
        <div className="card-preview-container">
          <CardPreview card={selectedCard} />
          <div className="preview-actions">
            <button 
              className="edit-card-button"
              onClick={() => navigate('/card', { state: { card: selectedCard } })}
            >
              Éditer la carte
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardBrowser;