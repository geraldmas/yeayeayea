import React, { useEffect, useMemo, useState } from 'react';
import { Card, Rarity } from '../types';
import { supabase } from '../utils/supabaseClient';
import { getCardTags } from '../utils/validation';
import GameCardGrid from './ui/GameCardGrid';
import './CollectionGallery.css';

interface CollectionGalleryProps {
  cards: Card[];
}

interface Filters {
  type?: Card['type'];
  rarity?: Rarity;
  tag?: string;
}

const rarityLabels: Record<Rarity, string> = {
  gros_bodycount: 'Standard',
  interessant: 'Rare',
  banger: 'Épique',
  cheate: 'Légendaire'
};

const CollectionGallery: React.FC<CollectionGalleryProps> = ({ cards }) => {
  const [filteredCards, setFilteredCards] = useState<Card[]>(cards);
  const [filters, setFilters] = useState<Filters>({});
  const [allTags, setAllTags] = useState<string[]>([]);

  // Charger les tags pour toutes les cartes si nécessaire
  useEffect(() => {
    const loadTags = async () => {
      const tagSet = new Set<string>();
      await Promise.all(
        cards.map(async card => {
          if (!card.tags) {
            const cardTags = await getCardTags(card.id);
            if (cardTags.length > 0) {
              const { data: tags } = await supabase
                .from('tags')
                .select('*')
                .in('id', cardTags.map(t => t.tag_id));
              card.tags = tags || [];
            } else {
              card.tags = [];
            }
          }
          card.tags.forEach(tag => {
            if (tag.name) tagSet.add(tag.name);
          });
        })
      );
      setAllTags(Array.from(tagSet).sort());
    };
    loadTags();
  }, [cards]);

  // Appliquer les filtres lorsque les cartes ou les filtres changent
  useEffect(() => {
    let result = cards;
    if (filters.type) {
      result = result.filter(c => c.type === filters.type);
    }
    if (filters.rarity) {
      result = result.filter(c => c.rarity === filters.rarity);
    }
    if (filters.tag) {
      result = result.filter(c => c.tags?.some(t => t.name === filters.tag));
    }
    setFilteredCards(result);
  }, [cards, filters]);

  const stats = useMemo(() => {
    const totals: Record<string, number> = { total: cards.length };
    cards.forEach(card => {
      totals[card.rarity] = (totals[card.rarity] || 0) + 1;
    });
    return totals;
  }, [cards]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <div className="collection-gallery">
      <div className="gallery-controls">
        <div className="filters">
          <select
            value={filters.type || ''}
            onChange={e => handleFilterChange('type', e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="personnage">Personnage</option>
            <option value="objet">Objet</option>
            <option value="evenement">Événement</option>
            <option value="lieu">Lieu</option>
            <option value="action">Action</option>
          </select>
          <select
            value={filters.rarity || ''}
            onChange={e => handleFilterChange('rarity', e.target.value)}
          >
            <option value="">Toutes les raretés</option>
            <option value="gros_bodycount">Standard</option>
            <option value="interessant">Rare</option>
            <option value="banger">Épique</option>
            <option value="cheate">Légendaire</option>
          </select>
          <select
            value={filters.tag || ''}
            onChange={e => handleFilterChange('tag', e.target.value)}
          >
            <option value="">Tous les tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div className="stats">
          <span>Total : {stats.total}</span>
          {(['gros_bodycount','interessant','banger','cheate'] as Rarity[]).map(r => (
            <span key={r}>{rarityLabels[r]} : {stats[r] || 0}</span>
          ))}
        </div>
      </div>

      <GameCardGrid cards={filteredCards} emptyMessage="Aucune carte" />
    </div>
  );
};

export default CollectionGallery;
