import React, { useState, useEffect } from 'react';
import { Tag } from '../types';
import { loadTags, addTag as addGlobalTag, removeTag as removeGlobalTag } from '../utils/tagManager';

interface TagListProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
}

const TagList: React.FC<TagListProps> = ({ tags, onChange }) => {
  const [savedTags, setSavedTags] = useState<Tag[]>([]);
  const [showTagSelector, setShowTagSelector] = useState(false);

  useEffect(() => {
    setSavedTags(loadTags());
  }, []);

  const handleAddTag = () => {
    setShowTagSelector(true);
  };

  const handleRemoveTag = (index: number) => {
    const updatedTags = [...tags];
    updatedTags.splice(index, 1);
    onChange(updatedTags);
  };

  const handleTagChange = (index: number, field: keyof Tag, value: string) => {
    const updatedTags = [...tags];
    updatedTags[index] = { ...updatedTags[index], [field]: value };
    onChange(updatedTags);
  };

  const handleSelectTag = (savedTag: Tag) => {
    onChange([...tags, { ...savedTag }]);
    setShowTagSelector(false);
  };

  const handleCreateNewTag = () => {
    const newTag: Tag = { name: '', passiveEffect: '' };
    onChange([...tags, newTag]);
    setShowTagSelector(false);
  };

  const handleSaveAsGlobal = (tag: Tag) => {
    if (tag.name) {
      addGlobalTag(tag);
      setSavedTags(loadTags());
    }
  };

  const handleRemoveGlobal = (tagName: string) => {
    removeGlobalTag(tagName);
    setSavedTags(loadTags());
  };

  return (
    <div className="editor-section">
      <div className="section-title">
        <h3>Tags</h3>
        <button className="add-button" onClick={handleAddTag}>
          Ajouter un tag
        </button>
      </div>

      {showTagSelector && (
        <div className="tag-selector">
          <h4>Sélectionner un tag existant ou en créer un nouveau</h4>
          <div className="saved-tags-list">
            {savedTags.map((tag, index) => (
              <button
                key={index}
                className="tag-option"
                onClick={() => handleSelectTag(tag)}
              >
                {tag.name}
              </button>
            ))}
          </div>
          <button onClick={handleCreateNewTag}>Créer un nouveau tag</button>
        </div>
      )}

      {tags.length === 0 ? (
        <p>Aucun tag défini.</p>
      ) : (
        tags.map((tag, index) => (
          <div key={index} className="collapsible-section">
            <div className="collapsible-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Nom du tag</label>
                  <input
                    type="text"
                    value={tag.name}
                    onChange={(e) => handleTagChange(index, 'name', e.target.value)}
                    placeholder="Nom du tag"
                  />
                </div>

                <div className="form-group button-group">
                  <button
                    className="save-button"
                    onClick={() => handleSaveAsGlobal(tag)}
                    disabled={!tag.name}
                  >
                    Sauvegarder globalement
                  </button>
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveTag(index)}
                  >
                    Retirer
                  </button>
                  {savedTags.some(t => t.name === tag.name) && (
                    <button
                      className="remove-global-button"
                      onClick={() => handleRemoveGlobal(tag.name)}
                    >
                      Supprimer globalement
                    </button>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Effet passif</label>
                  <textarea
                    value={tag.passiveEffect}
                    onChange={(e) => handleTagChange(index, 'passiveEffect', e.target.value)}
                    placeholder="Description de l'effet passif (optionnel)"
                  />
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TagList;