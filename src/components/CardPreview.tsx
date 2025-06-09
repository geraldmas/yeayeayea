import React, { useState, useEffect } from 'react';
import { Card, Spell, Alteration, Tag } from '../types';
import { alterationService, spellService, tagService } from '../utils/dataService';
import { getCardTags, getCardSpells } from '../utils/validation';
import CardDisplay from './CardDisplay';
import './CardPreview.css';

interface CardPreviewProps {
  card: Card;
  spellIds?: number[];
  tagIds?: number[];
}

const CardPreview: React.FC<CardPreviewProps> = ({ card, spellIds = [], tagIds = [] }) => {
  const [loadedTags, setLoadedTags] = useState<Tag[]>([]);
  const [loadedSpells, setLoadedSpells] = useState<Spell[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCardData = async () => {
      setIsLoading(true);
      try {
        let finalTagIds = tagIds;
        let finalSpellIds = spellIds;

        if (card?.id && (!tagIds.length || !spellIds.length)) {
          const [cardTags, cardSpells] = await Promise.all([
            getCardTags(card.id),
            getCardSpells(card.id)
          ]);
          
          if (!tagIds.length) {
            finalTagIds = cardTags.map(tag => tag.tag_id);
          }
          if (!spellIds.length) {
            finalSpellIds = cardSpells.map(spell => spell.spell_id);
          }
        }

        const [tags, spells] = await Promise.all([
          tagService.getByIds(finalTagIds),
          spellService.getByIds(finalSpellIds)
        ]);

        setLoadedTags(tags.filter(Boolean));
        setLoadedSpells(spells.filter(Boolean));
      } catch (error) {
        console.error('Erreur lors du chargement des données de la carte:', error);
        setLoadedTags([]);
        setLoadedSpells([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCardData();
  }, [card?.id, spellIds, tagIds]);

  if (!card) return null;

  return (
    <CardDisplay
      title={card.name}
      description={card.description || ''}
      image={card.image || undefined}
      health={card.properties?.health}
      type={card.type as 'personnage' | 'lieu' | 'objet' | 'evenement' | 'action'}
      rarity={card.rarity as 'gros_bodycount' | 'interessant' | 'banger' | 'cheate'}
      tags={loadedTags.map(tag => tag.name || '')}
      passiveEffect={card.passive_effect || undefined}
      spells={loadedSpells.map(spell => ({
        id: spell.id,
        name: spell.name || '',
        description: spell.description || '',
        cost: spell.cost || null,
        power: spell.power,
        is_value_percentage: spell.is_value_percentage || false,
        effects: spell.effects?.map(effect => ({
          type: effect.type,
          value: effect.value,
          duration: effect.duration || undefined,
          chance: effect.chance || undefined,
          alteration: effect.alteration,
          targetType: effect.targetType
        })) || []
      }))}
    />
  );
};

export default CardPreview;