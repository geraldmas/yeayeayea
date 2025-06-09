import React, { useState, useEffect, useCallback } from 'react';
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
    { value: 'damage', label: '⚔️ Dégâts', color: '#ffebee', needsValue: true, needsTarget: true },
    { value: 'heal', label: '💚 Soin', color: '#e8f5e9', needsValue: true, needsTarget: true },
    { value: 'draw', label: '🃏 Piocher', color: '#e3f2fd', needsValue: true, needsTarget: false },
    { value: 'resource', label: '⚡ Ressource', color: '#e0f2f1', needsValue: true, needsTarget: true },
    { value: 'apply_alteration', label: '🔄 Appliquer altération', color: '#d1c4e9', needsValue: false, needsTarget: true },
    { value: 'add_tag', label: '🏷️ Ajouter tag', color: '#e8eaf6', needsValue: false, needsTarget: true },
    { value: 'multiply_damage', label: '✖️ Multiplier dégâts', color: '#ffecb3', needsValue: true, needsTarget: false },
    { value: 'special', label: '✨ Effet spécial', color: '#fce4ec', needsValue: false, needsTarget: false }
  ];

  const loadSpells = useCallback(async () => {
    if (spellIds.length === 0) {
      setSpells([]);
      setLoading(false);
      return;
    }

    try {
      const loadedSpells = await Promise.all(
        spellIds.map(id => spellService.getById(id))
      );
      
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
  }, [spellIds]);

  useEffect(() => {
    loadSpells();
  }, [loadSpells]);

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
      effects: [{
        type: 'damage' as const,
        value: 10,
        targetType: 'opponent' as const,
        chance: 100
      }],
      is_value_percentage: false
    };

    try {
      // Créer le sort
      const createdSpell = await spellService.create(newSpell);
      if (!createdSpell?.id) {
        throw new Error('Échec de la création du sort');
      }

      // Mettre à jour la liste des sorts
      const updatedSpellIds = [...spellIds, createdSpell.id];
      onChange(updatedSpellIds);

      // Mettre à jour l'état local
      setSpells(prevSpells => [...prevSpells, createdSpell]);
      setExpandedSpellId(createdSpell.id);

      // Recharger les sorts pour s'assurer que tout est synchronisé
      loadSpells();
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
      const updatedSpells = [...spells];
      updatedSpells[spellIndex] = { 
        ...updatedSpells[spellIndex], 
        [field]: value 
      };
      setSpells(updatedSpells);

      await spellService.update(spellId, { [field]: value });
    } catch (error) {
      console.error('Error updating spell:', error);
      // En cas d'erreur, on recharge les sorts pour revenir à l'état précédent
      loadSpells();
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
      const updatedSpells = [...spells];
      updatedSpells[spellIndex] = {
        ...updatedSpells[spellIndex],
        effects: updatedEffects
      };
      setSpells(updatedSpells);

      await spellService.update(spellId, { effects: updatedEffects });
    } catch (error) {
      console.error('Error updating effect:', error);
      // En cas d'erreur, on recharge les sorts pour revenir à l'état précédent
      loadSpells();
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
                  

                  <div className="spell-effects">
                    <h4>Effets du sort</h4>
                    {spell.effects.map((effect, effectIndex) => (
                      <div 
                        key={effectIndex}
                        className="effect-card"
                        style={{ backgroundColor: getEffectColor(effect.type) }}
                      >
                        <div className="effect-header">
                          <select
                            value={effect.type}
                            onChange={(e) => handleUpdateEffect(spell.id, effectIndex, 'type', e.target.value)}
                            className="effect-type-select"
                          >
                            {effectTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRemoveEffect(spell.id, effectIndex)}
                            className="remove-effect-button"
                            title="Supprimer cet effet"
                          >
                            ×
                          </button>
                        </div>

                        {effectTypes.find(t => t.value === effect.type)?.needsValue && (
                          <div className="effect-value">
                            <input
                              type="number"
                              value={effect.value || 0}
                              onChange={(e) => handleUpdateEffect(spell.id, effectIndex, 'value', parseInt(e.target.value) || 0)}
                              placeholder="Valeur"
                              className="effect-input"
                            />
                          </div>
                        )}

                        {effectTypes.find(t => t.value === effect.type)?.needsTarget && (
                          <div className="effect-target">
                            <select
                              value={effect.targetType || 'opponent'}
                              onChange={(e) => handleUpdateEffect(spell.id, effectIndex, 'targetType', e.target.value)}
                              className="effect-input"
                            >
                              <option value="opponent">Adversaire</option>
                              <option value="self">Soi-même</option>
                              <option value="ally">Allié</option>
                              <option value="all">Tous</option>
                            </select>
                          </div>
                        )}

                        {effect.type === 'apply_alteration' && (
                          <div className="effect-alteration">
                            <AlterationSelector
                              selectedAlteration={effect.alteration}
                              onChange={(alterationId: number) => {
                                if (typeof alterationId === 'number') {
                                  handleUpdateEffect(spell.id, effectIndex, 'alteration', alterationId);
                                }
                              }}
                            />
                          </div>
                        )}

                        <div className="effect-chance">
                          <label>
                            Chance de succès:
                            <input
                              type="number"
                              value={effect.chance || 100}
                              onChange={(e) => handleUpdateEffect(spell.id, effectIndex, 'chance', parseInt(e.target.value) || 100)}
                              min="0"
                              max="100"
                              className="effect-input"
                            />
                            %
                          </label>
                        </div>
                      </div>
                    ))}

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
          className="add-spell-button"
        >
          + Créer un nouveau sort
        </button>
      </div>
    </div>
  );
};

export default SpellList;