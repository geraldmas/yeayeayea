import React, { useState, useEffect } from 'react';
import { Spell, SpellEffect } from '../types';
import { alterationService } from '../utils/dataService';
import { supabase } from '../utils/supabaseClient';
import './CardDisplay.css';

interface CardDisplayProps {
  title: string;
  description?: string;
  image?: string;
  health?: number;
  type?: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
  rarity?: string;
  tags?: any[];
  passiveEffect?: any;
  spells?: Spell[];
}

// Fonction pour générer une couleur pastel aléatoire
const generatePastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 80%)`;
};

// Map pour stocker les couleurs des tags
const tagColors = new Map<string, string>();

// Map pour stocker les altérations
const alterationsCache = new Map<number, { name: string, color: string }>();

const CardDisplay: React.FC<CardDisplayProps> = ({
  title,
  description,
  image,
  health,
  type = 'personnage',
  rarity = 'interessant',
  tags = [],
  passiveEffect,
  spells = []
}) => {
  const [alterations, setAlterations] = useState<Map<number, { name: string, color: string }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlterations();
  }, [spells]);

  const loadAlterations = async () => {
    try {
      const alterationIds = spells
        ?.flatMap(spell => spell.effects?.map(effect => effect.alteration))
        .filter(id => id !== null && id !== undefined);

      if (!alterationIds || alterationIds.length === 0) {
        setAlterations(new Map());
        setLoading(false);
        return;
      }

      const { data: alterationsData, error } = await supabase
        .from('alterations')
        .select('*')
        .in('id', alterationIds);

      if (error) {
        console.error('Error loading alterations:', error);
        return;
      }

      if (!alterationsData) {
        console.error('No alterations data received');
        return;
      }

      const newAlterations = new Map(
        alterationsData.map((alt: { id: number, name: string, type: string }) => [
          alt.id,
          {
            name: alt.name,
            color: alt.type === 'buff' ? '#e8f5e9' : 
                   alt.type === 'debuff' ? '#ffebee' : 
                   alt.type === 'status' ? '#e3f2fd' : '#f5f5f5'
          }
        ])
      );

      setAlterations(newAlterations);
      setLoading(false);
    } catch (error) {
      console.error('Error in loadAlterations:', error);
      setLoading(false);
    }
  };

  // Assigner une couleur à chaque tag s'il n'en a pas déjà une
  tags.forEach(tag => {
    if (!tagColors.has(tag)) {
      tagColors.set(tag, generatePastelColor());
    }
  });

  return (
    <div className={`card-preview ${type || ''}`} data-rarity={rarity}>
      <div className="card-header">
        <span className="card-in-icon">IN</span>
        <h2 className="card-title">{title}</h2>
        {health && (
          <div className="card-stats">
            <span>❤️</span>
            <span>{health}</span>
          </div>
        )}
      </div>

      {image && (
        <img src={image} alt={title} className="card-image" />
      )}

      <div className="card-description">
        {description}
      </div>

      {passiveEffect && (
        <div className="passive-effect">
          <span>🔄</span> {passiveEffect}
        </div>
      )}

      {spells.map((spell, index) => (
        <div key={index} className="spell">
          <div className="spell-header">
            <span className="spell-name">{spell.name}</span>
            <div className="spell-stats">
              {(() => {
                const dmg = spell.effects.find(e => e.type === 'damage')?.value;
                const heal = spell.effects.find(e => e.type === 'heal')?.value;
                return (
                  <>
                    {dmg !== undefined && <span className="spell-power">⚔️ {dmg}</span>}
                    {heal !== undefined && <span className="spell-power">💚 {heal}</span>}
                  </>
                );
              })()}
              {spell.cost && spell.cost > 0 && <span className="spell-cost">💎 {spell.cost}</span>}
            </div>
          </div>
          {spell.description && <div className="spell-description">{spell.description}</div>}
          {spell.effects.length > 0 && (
            <div className="spell-effects">
              {spell.effects.map((effect, effectIndex) => (
                <span 
                  key={effectIndex} 
                  className={`effect-tag ${effect.type}`}
                  style={effect.type === 'apply_alteration' && effect.alteration && alterations.has(effect.alteration) ? {
                    backgroundColor: alterations.get(effect.alteration)?.color
                  } : undefined}
                >
                  {effect.type === 'apply_alteration' && effect.alteration ? (
                    alterations.get(effect.alteration)?.name || `Altération ${effect.alteration}`
                  ) : (
                    <>
                      {effect.type === 'damage' && '⚔️'}
                      {effect.type === 'heal' && '💚'}
                      {effect.type === 'draw' && '🎴'}
                      {effect.type === 'resource' && '🔮'}
                      {effect.type === 'add_tag' && '🏷️'}
                      {effect.type === 'multiply_damage' && '⚡'}
                      {['damage', 'heal', 'draw', 'resource', 'shield'].includes(effect.type) && effect.value && ` ${effect.value}`}
                      {effect.duration && ` (${effect.duration}t)`}
                      {effect.chance && effect.chance < 100 && ` [${effect.chance}%]`}
                    </>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {tags.length > 0 && (
        <div className="card-tags">
          {tags.map((tag, index) => (
            <span 
              key={index} 
              className="tag"
              style={{
                '--tag-color': tagColors.get(tag)
              } as React.CSSProperties}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardDisplay;