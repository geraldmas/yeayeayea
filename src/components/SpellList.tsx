import React, { useState } from 'react';
import { Spell, SpellEffect } from '../types';

interface SpellListProps {
  spells: Spell[];
  onChange: (spells: Spell[]) => void;
  isTalent: boolean;
  maxSpells?: number;
}

const SpellList: React.FC<SpellListProps> = ({ spells, onChange, isTalent, maxSpells }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAddSpell = () => {
    if (maxSpells && spells.length >= maxSpells) return;
    
    const newSpell: Spell = {
      name: '',
      description: '',
      power: 0,
      effects: []
    };
    onChange([...spells, newSpell]);
    setExpandedIndex(spells.length);
  };

  const handleRemoveSpell = (index: number) => {
    const updatedSpells = [...spells];
    updatedSpells.splice(index, 1);
    onChange(updatedSpells);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && index < expandedIndex) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleSpellChange = (index: number, field: keyof Spell, value: any) => {
    const updatedSpells = [...spells];
    updatedSpells[index] = { ...updatedSpells[index], [field]: value };
    onChange(updatedSpells);
  };

  const handleEffectChange = (spellIndex: number, effectIndex: number, field: keyof SpellEffect, value: any) => {
    const updatedSpells = [...spells];
    const effect = { ...updatedSpells[spellIndex].effects[effectIndex], [field]: value };
    updatedSpells[spellIndex].effects[effectIndex] = effect;
    onChange(updatedSpells);
  };

  const handleAddEffect = (spellIndex: number) => {
    const updatedSpells = [...spells];
    const newEffect: SpellEffect = {
      type: 'damage',
      value: 0
    };
    updatedSpells[spellIndex].effects.push(newEffect);
    onChange(updatedSpells);
  };

  const handleRemoveEffect = (spellIndex: number, effectIndex: number) => {
    const updatedSpells = [...spells];
    updatedSpells[spellIndex].effects.splice(effectIndex, 1);
    onChange(updatedSpells);
  };

  return (
    <div className="editor-section">
      <div className="section-title">
        <h3>{isTalent ? "Talent" : "Sorts"}</h3>
        {(!maxSpells || spells.length < maxSpells) && (
          <button className="add-button" onClick={handleAddSpell}>
            Ajouter un {isTalent ? "talent" : "sort"}
          </button>
        )}
      </div>

      {spells.length === 0 ? (
        <p>Aucun {isTalent ? "talent" : "sort"} défini.</p>
      ) : (
        spells.map((spell, index) => (
          <div key={index} className="collapsible-section">
            <div 
              className="collapsible-header"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <h4>{spell.name || `${isTalent ? "Talent" : "Sort"} sans nom`}</h4>
              <div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSpell(index);
                  }}
                  className="remove-button"
                >
                  Supprimer
                </button>
              </div>
            </div>

            {expandedIndex === index && (
              <div className="collapsible-content">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      value={spell.name}
                      onChange={(e) => handleSpellChange(index, 'name', e.target.value)}
                      placeholder="Nom du sort"
                    />
                  </div>

                  <div className="form-group">
                    <label>Puissance</label>
                    <input
                      type="number"
                      value={spell.power}
                      onChange={(e) => handleSpellChange(index, 'power', Number(e.target.value))}
                      placeholder="Puissance"
                    />
                  </div>

                  <div className="form-group">
                    <label>Coût en PA</label>
                    <input
                      type="number"
                      value={spell.cost || ''}
                      onChange={(e) => handleSpellChange(index, 'cost', e.target.value === '' ? undefined : Number(e.target.value))}
                      placeholder="Coût en points d'action"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={spell.description}
                      onChange={(e) => handleSpellChange(index, 'description', e.target.value)}
                      placeholder="Description du sort"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Portée minimale</label>
                    <input
                      type="number"
                      value={spell.range?.min || ''}
                      onChange={(e) => {
                        const min = e.target.value === '' ? undefined : Number(e.target.value);
                        const range = min !== undefined ? { min, max: spell.range?.max || min } : undefined;
                        handleSpellChange(index, 'range', range);
                      }}
                      placeholder="Portée minimale"
                    />
                  </div>

                  <div className="form-group">
                    <label>Portée maximale</label>
                    <input
                      type="number"
                      value={spell.range?.max || ''}
                      onChange={(e) => {
                        const max = e.target.value === '' ? undefined : Number(e.target.value);
                        const min = spell.range?.min || 0;
                        const range = max !== undefined ? { min, max } : undefined;
                        handleSpellChange(index, 'range', range);
                      }}
                      placeholder="Portée maximale"
                    />
                  </div>
                </div>

                <h4>Effets du Sort</h4>
                {spell.effects.map((effect, effectIndex) => (
                  <div key={effectIndex} className="collapsible-section">
                    <div className="collapsible-content">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Type d'effet</label>
                          <select
                            value={effect.type}
                            onChange={(e) => handleEffectChange(index, effectIndex, 'type', e.target.value as any)}
                          >
                            <option value="damage">Dégâts</option>
                            <option value="heal">Soin</option>
                            <option value="status">Statut</option>
                            <option value="draw">Pioche</option>
                            <option value="poison">Poison</option>
                            <option value="resource">Ressource</option>
                            <option value="special">Spécial</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Valeur</label>
                          <input
                            type="number"
                            value={effect.value}
                            onChange={(e) => handleEffectChange(index, effectIndex, 'value', Number(e.target.value))}
                            placeholder="Valeur de l'effet"
                          />
                        </div>

                        <div className="form-group">
                          <button 
                            className="remove-button" 
                            onClick={() => handleRemoveEffect(index, effectIndex)}
                          >
                            Supprimer l'effet
                          </button>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Type de cible</label>
                          <select
                            value={effect.targetType || ''}
                            onChange={(e) => handleEffectChange(index, effectIndex, 'targetType', e.target.value || undefined)}
                          >
                            <option value="">Non définie</option>
                            <option value="self">Soi-même</option>
                            <option value="opponent">Adversaire</option>
                            <option value="all">Tous</option>
                            <option value="tagged">Tag spécifique</option>
                          </select>
                        </div>

                        {effect.targetType === 'tagged' && (
                          <div className="form-group">
                            <label>Tag ciblé</label>
                            <input
                              type="text"
                              value={effect.tagTarget || ''}
                              onChange={(e) => handleEffectChange(index, effectIndex, 'tagTarget', e.target.value)}
                              placeholder="Nom du tag ciblé"
                            />
                          </div>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Probabilité (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={effect.chance || ''}
                            onChange={(e) => handleEffectChange(index, effectIndex, 'chance', e.target.value === '' ? undefined : Number(e.target.value))}
                            placeholder="Probabilité d'activation (0-100)"
                          />
                        </div>

                        <div className="form-group">
                          <label>Durée</label>
                          <input
                            type="number"
                            min="0"
                            value={effect.duration || ''}
                            onChange={(e) => handleEffectChange(index, effectIndex, 'duration', e.target.value === '' ? undefined : Number(e.target.value))}
                            placeholder="Nombre de tours"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button 
                  className="add-button" 
                  onClick={() => handleAddEffect(index)}
                  style={{ marginTop: '10px' }}
                >
                  Ajouter un effet
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default SpellList;

// Ajout d'une exportation vide pour s'assurer que le fichier est traité comme un module
export {};