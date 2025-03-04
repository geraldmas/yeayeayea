import React, { useState, useEffect } from 'react';
import './Objectives.css';
import { Card } from '../types';
import { supabase } from '../utils/supabaseClient';
import { tagService } from '../utils/dataService';

interface CardTag {
  id: number;
  name: string;
  passive_effect: string | null;
}

interface ExtendedCard extends Card {
  tags?: CardTag[];
}

interface ObjectiveProgress {
  current: number;
  target: number;
  label: string;
}

interface TagObjective {
  tag: string;
  count: number;
  target: number;
  id: number;
}

interface RarityObjective {
  rarity: string;
  count: number;
  target: number;
}

interface TypeObjective {
  type: string;
  count: number;
  target: number;
}

type Objective = TagObjective | RarityObjective | TypeObjective;

interface ObjectivesProps {
  cards: ExtendedCard[];
  onObjectiveComplete: (message: string) => void;
}

const Objectives: React.FC<ObjectivesProps> = ({ cards, onObjectiveComplete }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [tagObjectives, setTagObjectives] = useState<TagObjective[]>([
    { tag: 'Fasciste', count: 0, target: 10, id: 1 },
    { tag: 'Woke', count: 0, target: 10, id: 2 },
    { tag: 'En Marche!', count: 0, target: 10, id: 3 },
    { tag: 'Toxique', count: 0, target: 10, id: 4 },
    { tag: 'LGBT', count: 0, target: 10, id: 5 },
    { tag: 'Racisé', count: 0, target: 10, id: 6 },
    { tag: 'Drogué', count: 0, target: 10, id: 7 },
    { tag: 'Fou du bus', count: 0, target: 10, id: 9 },
  ]);

  const [rarityObjectives, setRarityObjectives] = useState<RarityObjective[]>([
    { rarity: 'gros_bodycount', count: 0, target: 40 },
    { rarity: 'interessant', count: 0, target: 20 },
    { rarity: 'banger', count: 0, target: 10 },
    { rarity: 'cheate', count: 0, target: 5 },
  ]);

  const [typeObjectives, setTypeObjectives] = useState<TypeObjective[]>([
    { type: 'personnage', count: 0, target: 50 },
    { type: 'lieu', count: 0, target: 5 },
    { type: 'evenement', count: 0, target: 10 },
    { type: 'action', count: 0, target: 15 },
    { type: 'objet', count: 0, target: 10 },
  ]);

  const [completedObjectives, setCompletedObjectives] = useState<Set<string>>(new Set());

  const renderProgressBar = (current: number, target: number, label: string) => {
    const progress = Math.min((current / target) * 100, 100);
    return (
      <div className="objective-item">
        <div className="objective-label">
          <span className="objective-name">
            {label}
          </span>
          <span className="objective-count">{current}/{target}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
            data-complete={progress >= 100}
          />
        </div>
      </div>
    );
  };

  // Charger les noms des tags
  useEffect(() => {
    const loadTagNames = async () => {
      setIsLoading(true);
      try {
        const tags = await tagService.getAll();
        
        setTagObjectives(prev => prev.map(obj => {
          const matchingTag = tags.find(tag => tag.id === obj.id);
          return {
            ...obj,
            tag: matchingTag ? matchingTag.name : `Tag #${obj.id}`
          };
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des noms des tags:', error);
        // En cas d'erreur, utiliser les IDs comme noms
        setTagObjectives(prev => prev.map(obj => ({
          ...obj,
          tag: `Tag #${obj.id}`
        })));
      } finally {
        setIsLoading(false);
      }
    };

    loadTagNames();
  }, []); // Ne charger qu'une fois au montage

  useEffect(() => {
    const newRarityObjectives = [...rarityObjectives];
    const newTypeObjectives = [...typeObjectives];
    const newTagObjectives = [...tagObjectives];

    // Réinitialiser les compteurs
    newRarityObjectives.forEach(obj => obj.count = 0);
    newTypeObjectives.forEach(obj => obj.count = 0);
    newTagObjectives.forEach(obj => obj.count = 0);

    // Créer un Map pour compter efficacement les tags par ID
    const tagCounts = new Map<number, number>();
    tagObjectives.forEach(obj => tagCounts.set(obj.id, 0));

    // Compter les cartes
    const countPromises = cards.map(async card => {
      // Compter par rareté
      const rarityObj = newRarityObjectives.find(obj => obj.rarity === card.rarity);
      if (rarityObj) rarityObj.count++;

      // Compter par type
      const typeObj = newTypeObjectives.find(obj => obj.type === card.type);
      if (typeObj) typeObj.count++;

      // Compter par tag en utilisant la table de jointure
      try {
        const { data: cardTags } = await supabase
          .from('card_tags')
          .select('tag_id')
          .eq('card_id', card.id);

        if (cardTags) {
          cardTags.forEach(({ tag_id }) => {
            const currentCount = tagCounts.get(tag_id) || 0;
            tagCounts.set(tag_id, currentCount + 1);
          });
        }
      } catch (error) {
        console.error(`Erreur lors du comptage des tags pour la carte ${card.id}:`, error);
      }
    });

    // Attendre que tous les comptages soient terminés
    Promise.all(countPromises).then(() => {
      // Mettre à jour les compteurs de tags
      newTagObjectives.forEach(obj => {
        obj.count = tagCounts.get(obj.id) || 0;
      });

      // Vérifier les objectifs complétés
      const checkObjective = (objective: Objective) => {
        const objectiveId = 'tag' in objective ? objective.tag :
                          'rarity' in objective ? objective.rarity :
                          objective.type;
        
        if (objective.count >= objective.target && !completedObjectives.has(objectiveId)) {
          completedObjectives.add(objectiveId);
          onObjectiveComplete(`Objectif atteint : ${objective.count}/${objective.target} ${objectiveId}`);
        }
      };

      [...newRarityObjectives, ...newTypeObjectives, ...newTagObjectives].forEach(checkObjective);

      setRarityObjectives(newRarityObjectives);
      setTypeObjectives(newTypeObjectives);
      setTagObjectives(newTagObjectives);
    });
  }, [cards, completedObjectives, onObjectiveComplete]);

  return (
    <div className={`objectives-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button 
        className="toggle-button"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Réduire' : 'Développer'}
      >
        {isExpanded ? '−' : '+'}
      </button>
      
      {isExpanded && (
        <div className="objectives-grid">
          <div className="objectives-column">
            <h3>Tags</h3>
            {tagObjectives.map(obj => (
              <div key={obj.id}>
                {renderProgressBar(obj.count, obj.target, obj.tag)}
              </div>
            ))}
          </div>

          <div className="objectives-column">
            <h3>Raretés</h3>
            {rarityObjectives.map(obj => (
              <div key={obj.rarity}>
                {renderProgressBar(obj.count, obj.target, obj.rarity)}
              </div>
            ))}
          </div>

          <div className="objectives-column">
            <h3>Types</h3>
            {typeObjectives.map(obj => (
              <div key={obj.type}>
                {renderProgressBar(obj.count, obj.target, obj.type)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Objectives; 