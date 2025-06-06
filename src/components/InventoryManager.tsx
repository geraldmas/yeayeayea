import React from 'react';
import type { Player, Card } from '../types';
import { PlayerInventoryService } from '../services/playerInventoryService';
import { getModifiedMaxCharisme } from '../utils/charismeService';
import './InventoryManager.css';

interface InventoryManagerProps {
  player: Player;
  onUpdate: (player: Player) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ player, onUpdate }) => {
  const handleSell = (item: Card) => {
    if (!window.confirm(`Vendre "${item.name}" ?`)) {
      return;
    }
    const updated = PlayerInventoryService.sellItem(player, item.id);
    onUpdate(updated);
  };

  return (
    <div className="inventory-manager">
      <h3>Inventaire</h3>
      <div className="charisme-info">
        Charisme: {player.charisme ?? 0} / {getModifiedMaxCharisme(player)}
      </div>
      <ul className="inventory-list">
        {player.inventory.map(item => (
          <li key={item.id} className="inventory-item">
            <span className="item-name">{item.name}</span>
            <button className="sell-button" onClick={() => handleSell(item)}>
              Vendre
            </button>
          </li>
        ))}
        {player.inventory.length === 0 && (
          <li className="no-items">Aucun objet</li>
        )}
      </ul>
    </div>
  );
};

export default InventoryManager;
