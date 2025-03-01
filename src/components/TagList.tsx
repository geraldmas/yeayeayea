import React, { useState, useEffect } from 'react';
import { Tag } from '../types';
import { tagService } from '../utils/dataService';

interface TagListProps {
  tagIds: number[];
  onChange: (tagIds: number[]) => void;
}

const TagList: React.FC<TagListProps> = ({ tagIds, onChange }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, [tagIds]);

  const loadTags = async () => {
    try {
      // Charger les tags sélectionnés
      const selectedTags = await Promise.all(
        tagIds.map(id => tagService.getById(id))
      );
      setTags(selectedTags.filter((tag): tag is Tag => tag !== null));

      // Charger tous les tags disponibles
      const allTags = await tagService.getAll();
      setAvailableTags(allTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExistingTag = async (tagId: string) => {
    const numericId = parseInt(tagId);
    if (!tagIds.includes(numericId)) {
      onChange([...tagIds, numericId]);
    }
  };

  const handleCreateNewTag = async () => {
    const newTag = {
      name: 'Nouveau tag',
      passive_effect: ''
    };

    try {
      const createdTag = await tagService.create(newTag);
      if (createdTag && createdTag.id) {
        onChange([...tagIds, createdTag.id]);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleUpdateTag = async (index: number, field: keyof Tag, value: string) => {
    const tag = tags[index];
    try {
      await tagService.update(tag.id, { [field]: value });
      const updatedTags = [...tags];
      updatedTags[index] = { ...updatedTags[index], [field]: value };
      setTags(updatedTags);
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const handleRemoveTag = async (index: number) => {
    onChange(tagIds.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div>Chargement des tags...</div>;
  }

  return (
    <div className="tag-list">
      <h3>Tags</h3>
      <div className="tag-selector">
        <select onChange={(e) => handleAddExistingTag(e.target.value)}>
          <option value="">Sélectionner un tag existant...</option>
          {availableTags
            .filter(tag => !tagIds.includes(tag.id))
            .map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
        </select>
        <button onClick={handleCreateNewTag}>Créer un nouveau tag</button>
      </div>
      <div className="selected-tags">
        {tags.map((tag, index) => (
          <div key={tag.id} className="tag-item">
            <div className="form-row">
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={tag.name}
                  onChange={(e) => handleUpdateTag(index, 'name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Effet passif</label>
                <input
                  type="text"
                  value={tag.passive_effect || ''}
                  onChange={(e) => handleUpdateTag(index, 'passive_effect', e.target.value)}
                />
              </div>
              <button
                onClick={() => handleRemoveTag(index)}
                className="remove-tag"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagList;