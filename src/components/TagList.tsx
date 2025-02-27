import React from 'react';
import { Tag } from '../types';

interface TagListProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
}

const TagList: React.FC<TagListProps> = ({ tags, onChange }) => {
  const handleAddTag = () => {
    const newTag: Tag = {
      name: '',
      passiveEffect: ''
    };
    onChange([...tags, newTag]);
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

  return (
    <div className="editor-section">
      <div className="section-title">
        <h3>Tags</h3>
        <button className="add-button" onClick={handleAddTag}>
          Ajouter un tag
        </button>
      </div>

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

                <div className="form-group">
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveTag(index)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Effet passif</label>
                  <textarea
                    value={tag.passiveEffect}
                    onChange={(e) => handleTagChange(index, 'passiveEffect', e.target.value)}
                    placeholder="Description de l'effet passif du tag"
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