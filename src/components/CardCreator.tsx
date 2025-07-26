import React, { useState } from 'react';
import cardCreationService, { PartialCardInput } from '../services/cardCreationService';

const defaultCard: PartialCardInput = {
  name: '',
  type: 'personnage',
  rarity: 'gros_bodycount',
  properties: {}
};

const CardCreator: React.FC = () => {
  const [card, setCard] = useState<PartialCardInput>(defaultCard);
  const [status, setStatus] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'health') {
      setCard((prev) => ({
        ...prev,
        properties: { ...prev.properties, health: Number(value) }
      }));
    } else if (
      'checked' in e.target &&
      (e.target as HTMLInputElement).type === 'checkbox'
    ) {
      setCard((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setCard((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await cardCreationService.create(card);
      setStatus(`Carte créée: ID ${created.id}${created.is_wip ? ' (WIP)' : ''}`);
      setCard(defaultCard);
    } catch (err) {
      console.error('Erreur création carte', err);
      setStatus('Erreur lors de la création');
    }
  };

  return (
    <form className="card-creator" onSubmit={handleSubmit}>
      <h2>Création rapide de carte</h2>
      <div>
        <label>Nom</label>
        <input name="name" value={card.name || ''} onChange={handleChange} required />
      </div>
      <div>
        <label>Type</label>
        <select name="type" value={card.type} onChange={handleChange}>
          <option value="personnage">Personnage</option>
          <option value="objet">Objet</option>
          <option value="evenement">Évènement</option>
          <option value="lieu">Lieu</option>
          <option value="action">Action</option>
        </select>
      </div>
      {card.type === 'personnage' && (
        <div>
          <label>PV</label>
          <input
            type="number"
            name="health"
            value={card.properties?.health ?? ''}
            onChange={handleChange}
          />
        </div>
      )}
      {card.type === 'evenement' && (
        <div>
          <label>Durée</label>
          <select
            name="eventDuration"
            value={card.eventDuration || ''}
            onChange={handleChange}
          >
            <option value="">--</option>
            <option value="instantanee">Instantanée</option>
            <option value="temporaire">Temporaire</option>
            <option value="permanente">Permanente</option>
          </select>
        </div>
      )}
      <div>
        <label>Rareté</label>
        <select name="rarity" value={card.rarity} onChange={handleChange}>
          <option value="gros_bodycount">Gros Bodycount</option>
          <option value="interessant">Intéressant</option>
          <option value="banger">Banger</option>
          <option value="cheate">Cheaté</option>
        </select>
      </div>
      <div>
        <label>Description</label>
        <textarea name="description" value={card.description || ''} onChange={handleChange} />
      </div>
      <div>
        <label>Image</label>
        <input name="image" value={card.image || ''} onChange={handleChange} />
      </div>
      <div>
        <label>Effet passif</label>
        <textarea
          name="passive_effect"
          value={card.passive_effect || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            name="is_crap"
            checked={card.is_crap ?? false}
            onChange={handleChange}
          />
          Carte poubelle
        </label>
      </div>
      <button type="submit">Créer</button>
      {status && <p className="status-message">{status}</p>}
    </form>
  );
};

export default CardCreator;
