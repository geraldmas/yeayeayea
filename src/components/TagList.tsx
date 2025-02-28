import React, { useState, useEffect } from 'react';
import { Tag } from '../types';
import { tagService } from '../utils/dataService';

interface TagListProps {
  tagIds: string[];
  onChange: (tagIds: string[]) => void;
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
      // Load selected tags
      const selectedTags = await Promise.all(
        tagIds.map(id => tagService.getById(id))
      );
      setTags(selectedTags.filter((tag): tag is Tag => tag !== null));

      // Load all available tags
      const allTags = await tagService.getAll();
      setAvailableTags(allTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async (tagId: string) => {
    if (!tagIds.includes(tagId)) {
      onChange([...tagIds, tagId]);
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTagIds = tagIds.filter((_, i) => i !== index);
    onChange(newTagIds);
  };

  if (loading) {
    return <div>Chargement des tags...</div>;
  }

  return (
    <div className="tag-list">
      <h3>Tags</h3>
      <div className="tag-selector">
        <select onChange={(e) => handleAddTag(e.target.value)}>
          <option value="">Ajouter un tag...</option>
          {availableTags
            .filter(tag => !tagIds.includes(tag.id))
            .map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
        </select>
      </div>
      <div className="selected-tags">
        {tags.map((tag, index) => (
          <div key={tag.id} className="tag-item">
            <span className="tag-name">{tag.name}</span>
            {tag.passive_effect && (
              <span className="tag-effect">{tag.passive_effect}</span>
            )}
            <button 
              onClick={() => handleRemoveTag(index)}
              className="remove-tag"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagList;