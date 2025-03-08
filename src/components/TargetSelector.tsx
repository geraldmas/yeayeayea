import React, { useState, useEffect } from 'react';
import './TargetSelector.css';
import { CardInstance, ManualTargetingOptions } from '../types/combat';

interface TargetSelectorProps extends ManualTargetingOptions {
  isOpen: boolean;
}

/**
 * Composant pour la sélection manuelle de cibles
 * Permet à l'utilisateur de choisir une ou plusieurs cibles parmi les cibles possibles
 * selon les critères spécifiés dans les options
 */
const TargetSelector: React.FC<TargetSelectorProps> = ({
  isOpen,
  card,
  possibleTargets,
  spell,
  criteria,
  maxTargets = 1,
  minTargets = 1,
  onTargetSelected,
  onCancel
}) => {
  const [selectedTargets, setSelectedTargets] = useState<CardInstance[]>([]);
  const [filteredTargets, setFilteredTargets] = useState<CardInstance[]>(possibleTargets);

  // Reset selection when component opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTargets([]);
      setFilteredTargets(possibleTargets);
    }
  }, [isOpen, possibleTargets]);

  // Appliquer les filtres quand les critères changent
  useEffect(() => {
    if (!criteria) {
      setFilteredTargets(possibleTargets);
      return;
    }

    let filtered = [...possibleTargets];

    // Filtrer par tags
    if (criteria.byTag && criteria.byTag.length > 0) {
      filtered = filtered.filter(target => 
        criteria.byTag!.some(tagId => target.activeTags.some(tag => tag.tag.id === tagId))
      );
    }

    // Filtrer par rareté
    if (criteria.byRarity && criteria.byRarity.length > 0) {
      filtered = filtered.filter(target => 
        criteria.byRarity!.includes(target.cardDefinition.rarity)
      );
    }

    // Filtrer par pourcentage de santé
    if (criteria.byHealthPercent) {
      filtered = filtered.filter(target => {
        const healthPercent = (target.currentHealth / target.maxHealth) * 100;
        const { min, max } = criteria.byHealthPercent!;
        
        if (min !== undefined && healthPercent < min) return false;
        if (max !== undefined && healthPercent > max) return false;
        
        return true;
      });
    }

    // Exclure les tags
    if (criteria.excludeTags && criteria.excludeTags.length > 0) {
      filtered = filtered.filter(target => 
        !criteria.excludeTags!.some(tagId => target.activeTags.some(tag => tag.tag.id === tagId))
      );
    }

    setFilteredTargets(filtered);
  }, [criteria, possibleTargets]);

  const handleTargetClick = (target: CardInstance) => {
    const isAlreadySelected = selectedTargets.some(t => t.instanceId === target.instanceId);
    
    if (isAlreadySelected) {
      // Désélectionner la cible
      setSelectedTargets(prev => prev.filter(t => t.instanceId !== target.instanceId));
    } else {
      // Sélectionner la cible, mais vérifier si on n'a pas dépassé le maximum
      if (selectedTargets.length < maxTargets) {
        setSelectedTargets(prev => [...prev, target]);
      }
    }
  };

  const handleConfirm = () => {
    // Vérifier qu'on a au moins le nombre minimum de cibles
    if (selectedTargets.length >= minTargets) {
      onTargetSelected(selectedTargets);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="target-selector-overlay">
      <div className="target-selector-container">
        <div className="target-selector-header">
          <h3>Sélectionner {maxTargets > 1 ? 'des cibles' : 'une cible'}</h3>
          {spell && <p>Pour le sort : {spell.spell.name}</p>}
        </div>
        
        <div className="target-selection-info">
          <p>Sélectionnez entre {minTargets} et {maxTargets} cible(s)</p>
          <p>Cibles sélectionnées : {selectedTargets.length} / {maxTargets}</p>
        </div>
        
        <div className="targets-list">
          {filteredTargets.length === 0 ? (
            <p className="no-targets">Aucune cible disponible correspondant aux critères</p>
          ) : (
            filteredTargets.map(target => (
              <div 
                key={target.instanceId}
                className={`target-card ${selectedTargets.some(t => t.instanceId === target.instanceId) ? 'selected' : ''}`}
                onClick={() => handleTargetClick(target)}
              >
                <div className="target-header">
                  <h4>{target.cardDefinition.name}</h4>
                  <span className="target-rarity">{target.cardDefinition.rarity}</span>
                </div>
                <div className="target-stats">
                  <span className="target-health">❤️ {target.currentHealth}/{target.maxHealth}</span>
                  {target.temporaryStats.attack > 0 && 
                    <span className="target-attack">⚔️ {target.temporaryStats.attack}</span>
                  }
                </div>
                {target.activeTags.length > 0 && (
                  <div className="target-tags">
                    {target.activeTags.map((tagInstance, index) => (
                      <span key={index} className="tag">{tagInstance.tag.name}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="target-selector-actions">
          <button 
            className="cancel-button" 
            onClick={onCancel}
          >
            Annuler
          </button>
          <button 
            className="confirm-button" 
            onClick={handleConfirm}
            disabled={selectedTargets.length < minTargets}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TargetSelector; 