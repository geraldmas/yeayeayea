import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import CardPreview from './CardPreview';
import { getAllCards, searchCards } from '../utils/supabaseClient';
import { downloadCSV } from '../utils/csvConverter';
import './CardBrowser.css';

const CardBrowser: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        handleSearch();
      } else {
        loadCards();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await getAllCards();
      setCards(data);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await searchCards(searchTerm);
      setCards(data);
    } catch (error) {
      console.error('Error searching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    downloadCSV(cards);
  };

  return (
    <div className="card-browser">
      <div className="card-list">
        <div className="browser-header">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher une carte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="export-button" onClick={handleExportCSV}>
            Exporter en CSV
          </button>
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
              >
                <span className="card-name">{card.name}</span>
                <span className="card-type">{card.type}</span>
                {card.image && (
                  <img 
                    src={card.image} 
                    alt={card.name} 
                    className="card-thumbnail"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {selectedCard && (
        <div className="card-preview-container">
          <CardPreview card={selectedCard} />
        </div>
      )}
    </div>
  );
};

export default CardBrowser;