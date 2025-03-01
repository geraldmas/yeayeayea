import React, { useState, useEffect } from 'react';
import { Spell, SpellEffect } from '../types';
import { spellService } from '../utils/dataService';
import AlterationList from './AlterationList';

interface SpellListProps {
  spellIds: number[];
  onChange: (spellIds: number[]) => void;
  maxSpells?: number;
}

const SpellList: React.FC<SpellListProps> = ({ spellIds, onChange, maxSpells }) => {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpells();
  }, [spellIds]);

  const loadSpells = async () => {
    try {
      const loadedSpells = await Promise.all(
        spellIds.map(id => spellService.getById(id))
      );
      setSpells(loadedSpells.filter((spell): spell is Spell => spell !== null));
    } catch (error) {
      console.error('Error loading spells:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpell = async () => {
    if (maxSpells && spellIds.length >= maxSpells) {
      alert(`Maximum ${maxSpells} sort${maxSpells > 1 ? 's' : ''} autorisé(s)`);
      return;
    }

    const newSpell = {
      name: 'Nouveau sort',
      description: '',
      power: 0,
      cost: 0,
      range_min: 0,
      range_max: 0,
      effects: [],
      is_value_percentage: false,
    };

    try {
      const createdSpell = await spellService.create(newSpell);
      if (createdSpell && createdSpell.id) {
        onChange([...spellIds, createdSpell.id]);
        setExpandedIndex(spells.length);
      }
    } catch (error) {
      console.error('Error creating spell:', error);
    }
  };

  const handleUpdateSpell = async (index: number, field: keyof Spell, value: any) => {
    const spell = spells[index];
    try {
      await spellService.update(spell.id, { [field]: value });
      const updatedSpells = [...spells];
      updatedSpells[index] = { ...updatedSpells[index], [field]: value };
      setSpells(updatedSpells);
    } catch (error) {
      console.error('Error updating spell:', error);
    }
  };

  const handleAddEffect = async (spellIndex: number) => {
    const spell = spells[spellIndex];
    const newEffect: SpellEffect = {
      type: 'damage',
      value: 0,
      targetType: 'opponent'
    };
    const updatedEffects = [...spell.effects, newEffect];

    try {
      await spellService.update(spell.id, { effects: updatedEffects });
      const updatedSpells = [...spells];
      updatedSpells[spellIndex].effects = updatedEffects;
      setSpells(updatedSpells);
    } catch (error) {
      console.error('Error adding effect:', error);
    }
  };

  const handleUpdateEffect = async (spellIndex: number, effectIndex: number, field: keyof SpellEffect, value: any) => {
    const spell = spells[spellIndex];
    const updatedEffects = [...spell.effects];
    updatedEffects[effectIndex] = {
      ...updatedEffects[effectIndex],
      [field]: value
    };

    try {
      await spellService.update(spell.id, { effects: updatedEffects });
      const updatedSpells = [...spells];
      updatedSpells[spellIndex].effects = updatedEffects;
      setSpells(updatedSpells);
    } catch (error) {
      console.error('Error updating effect:', error);
    }
  };

  const handleRemoveEffect = async (spellIndex: number, effectIndex: number) => {
    const spell = spells[spellIndex];
    const updatedEffects = spell.effects.filter((_, i) => i !== effectIndex);

    try {
      await spellService.update(spell.id, { effects: updatedEffects });
      const updatedSpells = [...spells];
      updatedSpells[spellIndex].effects = updatedEffects;
      setSpells(updatedSpells);
    } catch (error) {
      console.error('Error removing effect:', error);
    }
  };

  const handleRemoveSpell = async (index: number) => {
    const spellId = spellIds[index];
    try {
      await spellService.delete(spellId);
      onChange(spellIds.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing spell:', error);
    }
  };

  if (loading) {
    return <div>Chargement des sorts...</div>;
  }

  return (
    <div className="spells-section">
      <h3>Sorts</h3>
      <div className="spells-list">
        {spells.map((spell, index) => (
          <div key={spell.id} className="collapsible-section">
            <div 
              className="collapsible-header"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <span>{spell.name || 'Sort sans nom'}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSpell(index);
                }}
                className="remove-spell"
              >
                ×
              </button>
            </div>
            {expandedIndex === index && (
              <div className="collapsible-content">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      value={spell.name}
                      onChange={(e) => handleUpdateSpell(index, 'name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={spell.description || ''}
                      onChange={(e) => handleUpdateSpell(index, 'description', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Puissance</label>
                    <input
                      type="number"
                      value={spell.power}
                      onChange={(e) => handleUpdateSpell(index, 'power', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Coût</label>
                    <input
                      type="number"
                      value={spell.cost || 0}
                      onChange={(e) => handleUpdateSpell(index, 'cost', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Portée min</label>
                    <input
                      type="number"
                      value={spell.range_min || 0}
                      onChange={(e) => handleUpdateSpell(index, 'range_min', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Portée max</label>
                    <input
                      type="number"
                      value={spell.range_max || 0}
                      onChange={(e) => handleUpdateSpell(index, 'range_max', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="effects-section">
                  <h4>Effets</h4>
                  <button onClick={() => handleAddEffect(index)}>
                    Ajouter un effet
                  </button>

                  {Array.isArray(spell.effects) && spell.effects.map((effect, effectIndex) => (
                    <div key={effectIndex} className="effect-item">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Type</label>
                          <select
                            value={effect.type}
                            onChange={(e) => handleUpdateEffect(index, effectIndex, 'type', e.target.value)}
                          >
                            <option value="damage">Dégâts</option>
                            <option value="heal">Soin</option>
                            <option value="draw">Piocher</option>
                            <option value="resource">Ressource</option>
                            <option value="add_tag">Ajouter tag</option>
                            <option value="multiply_damage">Multiplier dégâts</option>
                            <option value="apply_alteration">Appliquer altération</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Valeur</label>
                          <input
                            type="number"
                            value={effect.value}
                            onChange={(e) => handleUpdateEffect(index, effectIndex, 'value', parseInt(e.target.value))}
                          />
                        </div>

                        {effect.type !== 'draw' && effect.type !== 'resource' && (
                          <div className="form-group">
                            <label>Cible</label>
                            <select
                              value={effect.targetType || 'opponent'}
                              onChange={(e) => handleUpdateEffect(index, effectIndex, 'targetType', e.target.value)}
                            >
                              <option value="self">Soi-même</option>
                              <option value="opponent">Adversaire</option>
                              <option value="all">Tous</option>
                              <option value="tagged">Par tag</option>
                            </select>
                          </div>
                        )}

                        {effect.targetType === 'tagged' && (
                          <div className="form-group">
                            <label>Tag cible</label>
                            <input
                              type="text"
                              value={effect.tagTarget || ''}
                              onChange={(e) => handleUpdateEffect(index, effectIndex, 'tagTarget', e.target.value)}
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label>Chance (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={effect.chance || 100}
                            onChange={(e) => handleUpdateEffect(index, effectIndex, 'chance', parseInt(e.target.value))}
                          />
                        </div>

                        {effect.type === 'apply_alteration' && (
                          <>
                            <AlterationList 
                              selectedAlteration={effect.alteration}
                              onChange={(alterationId) => handleUpdateEffect(index, effectIndex, 'alteration', alterationId)}
                            />
                            <div className="form-group">
                              <label>Durée (tours)</label>
                              <input
                                type="number"
                                min="1"
                                value={effect.duration || 1}
                                onChange={(e) => handleUpdateEffect(index, effectIndex, 'duration', parseInt(e.target.value))}
                              />
                            </div>
                          </>
                        )}

                        <button
                          onClick={() => handleRemoveEffect(index, effectIndex)}
                          className="remove-effect"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <button 
          onClick={handleCreateSpell}
          disabled={maxSpells !== undefined && spells.length >= maxSpells}
        >
          Ajouter un sort
        </button>
      </div>
    </div>
  );
};

export default SpellList;