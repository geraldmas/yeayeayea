import React, { useState, useEffect } from 'react';
import { Spell, SpellEffect } from '../types';
import { spellService } from '../utils/dataService';
import AlterationSelector from './AlterationSelector';
import './SpellList.css';

interface SpellListProps {
  spellIds: number[];
  onChange: (spellIds: number[]) => void;
  maxSpells?: number;
}

const SpellList: React.FC<SpellListProps> = ({ spellIds, onChange, maxSpells }) => {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [expandedSpellId, setExpandedSpellId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingEffect, setEditingEffect] = useState<{spellIndex: number, effectIndex: number} | null>(null);

  // Effect types with their visual properties
  const effectTypes = [
    { value: 'damage', label: '⚔️ Dégâts', color: '#ffebee' },
    { value: 'heal', label: '💚 Soin', color: '#e8f5e9' },
    { value: 'draw', label: '🃏 Piocher', color: '#e3f2fd' },
    { value: 'resource', label: '⚡ Ressource', color: '#e0f2f1' },
    { value: 'apply_alteration', label: '🔄 Appliquer altération', color: '#d1c4e9' },
    { value: 'add_tag', label: '🏷️ Ajouter tag', color: '#e8eaf6' },
    { value: 'multiply_damage', label: '✖️ Multiplier dégâts', color: '#ffecb3' },
    { value: 'special', label: '✨ Effet spécial', color: '#fce4ec' }
  ];

  useEffect(() => {
    loadSpells();
  }, [spellIds]);

  const loadSpells = async () => {
    if (spellIds.length === 0) {
      setSpells([]);
      setLoading(false);
      return;
    }

    try {
      const loadedSpells = await Promise.all(
        spellIds.map(id => spellService.getById(id))
      );
      
      // Make sure each spell has an effects array
      const validSpells = loadedSpells
        .filter((spell): spell is Spell => spell !== null)
        .map(spell => ({
          ...spell,
          effects: Array.isArray(spell.effects) ? spell.effects : []
        }));
        
      setSpells(validSpells);
    } catch (error) {
      console.error('Error loading spells:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpell = async () => {
    if (maxSpells && spellIds.length >= maxSpells) {
      alert(`Maximum ${maxSpells} sort${maxSpells > 1 ? 's' : ''} autorisé`);
      return;
    }

    const newSpell = {
      name: 'Nouveau sort',
      description: '',
      power: 10,
      cost: 1,
      range_min: 0,
      range_max: 0,
      effects: [{ 
        type: 'damage' as const, 
        value: 10,
        targetType: 'opponent' as const,
        chance: 100
      }],
      is_value_percentage: false
    };

    try {
      const createdSpell = await spellService.create(newSpell);
      if (createdSpell?.id) {
        onChange([...spellIds, createdSpell.id]);
        setExpandedSpellId(createdSpell.id);
      }
    } catch (error) {
      console.error('Error creating spell:', error);
    }
  };

  const handleRemoveSpell = async (spellId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce sort ?')) {
      try {
        await spellService.delete(spellId);
        onChange(spellIds.filter(id => id !== spellId));
      } catch (error) {
        console.error('Error removing spell:', error);
      }
    }
  };

  const handleUpdateSpell = async (spellId: number, field: keyof Spell, value: any) => {
    const spellIndex = spells.findIndex(s => s.id === spellId);
    if (spellIndex === -1) return;

    try {
      await spellService.update(spellId, { [field]: value });
      
      const updatedSpells = [...spells];
      updatedSpells[spellIndex] = { 
        ...updatedSpells[spellIndex], 
        [field]: value 
      };
      setSpells(updatedSpells);
    } catch (error) {
      console.error('Error updating spell:', error);
    }
  };

  const handleAddEffect = async (spellId: number) => {
    const spellIndex = spells.findIndex(s => s.id === spellId);
    if (spellIndex === -1) return;

    const spell = spells[spellIndex];
    const newEffect: SpellEffect = {
      type: 'damage',
      value: 10,
      targetType: 'opponent',
      chance: 100
    };

    try {
      const updatedEffects = [...spell.effects, newEffect];
      await spellService.update(spellId, { effects: updatedEffects });
      
      const updatedSpells = [...spells];
      updatedSpells[spellIndex].effects = updatedEffects;
      setSpells(updatedSpells);
      
      // Set this new effect as the one being edited
      setEditingEffect({
        spellIndex,
        effectIndex: updatedEffects.length - 1
      });
    } catch (error) {
      console.error('Error adding effect:', error);
    }
  };

  const handleUpdateEffect = async (spellId: number, effectIndex: number, field: keyof SpellEffect, value: any) => {
    const spellIndex = spells.findIndex(s => s.id === spellId);
    if (spellIndex === -1 || !spells[spellIndex].effects[effectIndex]) return;

    const spell = spells[spellIndex];
    const updatedEffects = [...spell.effects];
    updatedEffects[effectIndex] = {
      ...updatedEffects[effectIndex],
      [field]: value
    };

    try {
      await spellService.update(spellId, { effects: updatedEffects });
      
      const updatedSpells = [...spells];
      updatedSpells[spellIndex].effects = updatedEffects;
      setSpells(updatedSpells);
    } catch (error) {
      console.error('Error updating effect:', error);
    }
  };

  const handleRemoveEffect = async (spellId: number, effectIndex: number) => {
    const spellIndex = spells.findIndex(s => s.id === spellId);
    if (spellIndex === -1) return;

    const spell = spells[spellIndex];
    const updatedEffects = spell.effects.filter((_, i) => i !== effectIndex);

    try {
      await spellService.update(spellId, { effects: updatedEffects });
      
      const updatedSpells = [...spells];
      updatedSpells[spellIndex].effects = updatedEffects;
      setSpells(updatedSpells);
      
      if (editingEffect?.spellIndex === spellIndex && editingEffect?.effectIndex === effectIndex) {
        setEditingEffect(null);
      }
    } catch (error) {
      console.error('Error removing effect:', error);
    }
  };

  const getEffectTypeLabel = (type: string) => {
    return effectTypes.find(t => t.value === type)?.label || type;
  };

  const getEffectColor = (type: string) => {
    return effectTypes.find(t => t.value === type)?.color || '#f5f5f5';
  };

  if (loading) {
    return <div className="loading-container">Chargement des sorts...</div>;
  }

  return (
    <div className="spell-list">
      {spells.length === 0 ? (
        <div className="empty-state">
          <p>Aucun sort n'a été ajouté à cette carte.</p>
        </div>
      ) : (
        <div className="spells-container">
          {spells.map((spell) => (
            <div 
              key={spell.id} 
              className={`spell-card ${expandedSpellId === spell.id ? 'expanded' : ''}`}
            >
              <div className="spell-header" onClick={() => setExpandedSpellId(expandedSpellId === spell.id ? null : spell.id)}>
                <div className="spell-title">
                  <span className="spell-name">{spell.name || 'Sort sans nom'}</span>
                  <div className="spell-stats">
                    <span className="spell-cost" title="Coût en motivation">🎯 {spell.cost || 0}</span>
                    <span className="spell-power" title="Puissance">⚡ {spell.power}</span>
                  </div>
                </div>
                <div className="spell-controls">
                  <button 
                    className="remove-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSpell(spell.id);
                    }}
                    title="Supprimer ce sort"
                  >
                    <span className="icon">×</span>
                  </button>
                </div>
              </div>

              {expandedSpellId === spell.id && (
                <div className="spell-details">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`spell-name-${spell.id}`}>Nom</label>
                      <input
                        id={`spell-name-${spell.id}`}
                        type="text"
                        value={spell.name}
                        onChange={(e) => handleUpdateSpell(spell.id, 'name', e.target.value)}
                        placeholder="Nom du sort"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`spell-desc-${spell.id}`}>Description</label>
                      <textarea
                        id={`spell-desc-${spell.id}`}
                        value={spell.description || ''}
                        onChange={(e) => handleUpdateSpell(spell.id, 'description', e.target.value)}
                        placeholder="Description de l'effet du sort"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`spell-power-${spell.id}`}>Puissance</label>
                      <input
                        id={`spell-power-${spell.id}`}
                        type="number"
                        value={spell.power}
                        onChange={(e) => handleUpdateSpell(spell.id, 'power', parseInt(e.target.value) || 0)}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor={`spell-cost-${spell.id}`}>Coût en motivation</label>
                      <input
                        id={`spell-cost-${spell.id}`}
                        type="number"
                        value={spell.cost || 0}
                        onChange={(e) => handleUpdateSpell(spell.id, 'cost', parseInt(e.target.value) || 0)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`spell-range-min-${spell.id}`}>Portée min</label>
                      <input
                        id={`spell-range-min-${spell.id}`}
                        type="number"
                        value={spell.range_min || 0}
                        onChange={(e) => handleUpdateSpell(spell.id, 'range_min', parseInt(e.target.value) || 0)}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor={`spell-range-max-${spell.id}`}>Portée max</label>
                      <input
                        id={`spell-range-max-${spell.id}`}
                        type="number"
                        value={spell.range_max || 0}
                        onChange={(e) => handleUpdateSpell(spell.id, 'range_max', parseInt(e.target.value) || 0)}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={spell.is_value_percentage || false}
                          onChange={(e) => handleUpdateSpell(spell.id, 'is_value_percentage', e.target.checked)}
                        />
                        Utiliser des pourcentages
                      </label>
                    </div>
                  </div>

                  <div className="effects-section">
                    <h4>Effets du sort</h4>
                    
                    {spell.effects.length === 0 ? (
                      <p className="no-effects">Ce sort n'a pas d'effets définis.</p>
                    ) : (
                      <div className="effects-list">
                        {spell.effects.map((effect, effectIndex) => (
                          <div 
                            key={effectIndex} 
                            className="effect-card"
                            style={{ backgroundColor: getEffectColor(effect.type) }}
                          >
                            <div className="effect-header">
                              <span className="effect-type">{getEffectTypeLabel(effect.type)}</span>
                              <button 
                                className="remove-effect-button" 
                                onClick={() => handleRemoveEffect(spell.id, effectIndex)}
                                title="Supprimer cet effet"
                              >×</button>
                            </div>
                            
                            <div className="effect-content">
                              <div className="form-row">
                                <div className="form-group">
                                  <label>Type d'effet</label>
                                  <select
                                    value={effect.type}
                                    onChange={(e) => handleUpdateEffect(spell.id, effectIndex, 'type', e.target.value)}
                                    className="form-input"
                                  >
                                    {effectTypes.map(type => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div className="form-group">
                                  <label>Valeur</label>
                                  <input
                                    type="number"
                                    value={effect.value || 0}
                                    onChange={(e) => handleUpdateEffect(spell.id, effectIndex, 'value', parseInt(e.target.value) || 0)}
                                    className="form-input"
                                  />
                                </div>
                              </div>

                              {effect.type !== 'draw' && effect.type !== 'resource' && (
                                <div className="form-row">
                                  <div className="form-group">
                                    <label>Cible</label>
                                    <select
                                      value={effect.targetType || 'opponent'}
                                      onChange={(e) => handleUpdateEffect(spell.id, effectIndex, 'targetType', e.target.value)}
                                      className="form-input"
                                    >
                                      <option value="self">Soi-même</option>
                                      <option value="opponent">Adversaire</option>
                                      <option value="all">Tous</option>
                                      <option value="tagged">Par tag</option>
                                    </select>
                                  </div>
                                  
                                  {effect.targetType === 'tagged' && (
                                    <div className="form-group">
                                      <label>Tag cible</label>
                                      <input
                                        type="text"
                                        value={effect.tagTarget || ''}
                                        onChange={(e) => handleUpdateEffect(spell.id, effectIndex, 'tagTarget', e.target.value)}
                                        placeholder="Nom du tag (ex: NUIT)"
                                        className="form-input"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="form-row">
                                <div className="form-group">
                                  <label>Chance (%)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={effect.chance || 100}
                                    onChange={(e) => handleUpdateEffect(spell.id, effectIndex, 'chance', parseInt(e.target.value) || 100)}
                                    className="form-input"
                                  />
                                </div>

                                {effect.type === 'apply_alteration' && (
                                  <div className="form-group">
                                    <label>Durée (tours)</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={effect.duration || 1}
                                      onChange={(e) => handleUpdateEffect(spell.id, effectIndex, 'duration', parseInt(e.target.value) || 1)}
                                      className="form-input"
                                    />
                                  </div>
                                )}
                              </div>

                              {effect.type === 'apply_alteration' && (
                                <div className="alteration-section">
                                  <AlterationSelector 
                                  selectedAlteration={effect.alteration}
                                  onChange={(alterationId: number) => handleUpdateEffect(spell.id, effectIndex, 'alteration', alterationId)}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button 
                      onClick={() => handleAddEffect(spell.id)}
                      className="add-effect-button"
                    >
                      + Ajouter un effet
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="spell-actions">
        <button 
          onClick={handleCreateSpell}
          disabled={maxSpells !== undefined && spellIds.length >= maxSpells}
          className="add-spell-button"
        >
          + {maxSpells && spellIds.length >= maxSpells 
              ? 'Maximum de sorts atteint' 
              : 'Ajouter un nouveau sort'}
        </button>
      </div>
    </div>
  );
};

export default SpellList;