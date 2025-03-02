import React, { useState, useEffect } from 'react';
import { Tag } from '../types';
import { tagService } from '../utils/dataService';
import './TagList.css';

interface TagListProps {
  tagIds: number[];
  onChange: (tagIds: number[]) => void;
  disableAutocomplete?: boolean; // New prop
}

const TagList: React.FC<TagListProps> = ({ tagIds, onChange, disableAutocomplete }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTagId, setExpandedTagId] = useState<number | null>(null);

  useEffect(() => {
    loadTags();
  }, [tagIds]);

  const loadTags = async () => {
    try {
      // Charger les tags sélectionnés - with improved error handling
      if (tagIds.length > 0) {
        const selectedTagPromises = tagIds.map(async id => {
          try {
            return await tagService.getById(id);
          } catch (err) {
            console.error(`Error fetching tag with ID ${id}:`, err);
            return null;
          }
        });
        
        const selectedTags = await Promise.all(selectedTagPromises);
        setTags(selectedTags.filter((tag): tag is Tag => tag !== null));
      } else {
        setTags([]);
      }

      // Charger tous les tags disponibles
      try {
        const allTags = await tagService.getAll();
        setAvailableTags(allTags || []);
      } catch (err) {
        console.error('Error fetching all available tags:', err);
        setAvailableTags([]);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
      // Log more detailed error information
      if (error instanceof Error) {
        console.error(error.message);
        console.error(error.stack);
      }
      setTags([]);
      setAvailableTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    const newTag = {
      name: 'Nouveau tag',
      passive_effect: ''
    };

    try {
      const createdTag = await tagService.create(newTag);
      if (createdTag && createdTag.id) {
        onChange([...tagIds, createdTag.id]);
        setExpandedTagId(createdTag.id);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleAddExistingTag = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tagId = parseInt(e.target.value);
    if (!isNaN(tagId) && !tagIds.includes(tagId)) {
      onChange([...tagIds, tagId]);
      setExpandedTagId(tagId);
      e.target.value = ''; // Reset select
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir retirer ce tag de la carte ?')) {
      onChange(tagIds.filter(id => id !== tagId));
      if (expandedTagId === tagId) {
        setExpandedTagId(null);
      }
    }
  };

  const handleUpdateTag = async (tagId: number, field: keyof Tag, value: any) => {
    const tagIndex = tags.findIndex(t => t.id === tagId);
    if (tagIndex === -1) return;

    try {
      await tagService.update(tagId, { [field]: value });
      
      const updatedTags = [...tags];
      updatedTags[tagIndex] = { 
        ...updatedTags[tagIndex], 
        [field]: value 
      };
      setTags(updatedTags);
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const getTagColorClass = (tagName: string) => {
    // Generate consistent color class based on tag name
    const hashCode = tagName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return `tag-color-${Math.abs(hashCode) % 5}`;
  };

  if (loading) {
    return <div className="loading-container">Chargement des tags...</div>;
  }

  return (
    <div className="tag-list">
      {tags.length === 0 ? (
        <div className="empty-state">
          <p>Aucun tag n'a été ajouté à cette carte.</p>
        </div>
      ) : (
        <div className="tags-container">
          {tags.map((tag) => (
            <div 
              key={tag.id} 
              className={`tag-card ${expandedTagId === tag.id ? 'expanded' : ''} ${getTagColorClass(tag.name)}`}
            >
              <div className="tag-header" onClick={() => setExpandedTagId(expandedTagId === tag.id ? null : tag.id)}>
                <div className="tag-title">
                  <span className="tag-name">{tag.name || 'Tag sans nom'}</span>
                  {tag.passive_effect && (
                    <span className="tag-badge" title="Ce tag a un effet passif">✨</span>
                  )}
                </div>
                <div className="tag-controls">
                  <button 
                    className="remove-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(tag.id);
                    }}
                    title="Retirer ce tag"
                  >
                    <span className="icon">×</span>
                  </button>
                </div>
              </div>

              {expandedTagId === tag.id && (
                <div className="tag-details">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`tag-name-${tag.id}`}>Nom</label>
                      <input
                        id={`tag-name-${tag.id}`}
                        type="text"
                        value={tag.name}
                        onChange={(e) => handleUpdateTag(tag.id, 'name', e.target.value)}
                        placeholder="Nom du tag"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`tag-effect-${tag.id}`}>Effet passif</label>
                      <textarea
                        id={`tag-effect-${tag.id}`}
                        value={tag.passive_effect || ''}
                        onChange={(e) => handleUpdateTag(tag.id, 'passive_effect', e.target.value)}
                        placeholder="Effet passif du tag (optionnel)"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="tag-actions">
        <select 
          onChange={handleAddExistingTag} 
          className="tag-select"
          value=""
        >
          <option value="">Sélectionner un tag existant...</option>
          {availableTags
            .filter(tag => !tagIds.includes(tag.id))
            .map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))
          }
        </select>
        
        <button 
          onClick={handleCreateTag}
          className="add-tag-button"
        >
          + Créer un nouveau tag
        </button>
      </div>

      {!disableAutocomplete && <datalist id="tag-suggestions">...</datalist>}
    </div>
  );
};

export default TagList;