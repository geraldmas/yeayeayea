import React from "react";
import type { Player, Card } from "../types/index";
import { PlayerInventoryService } from "../services/playerInventoryService";
import { getModifiedMaxCharisme } from "../utils/charismeService";
import "./InventoryManager.css";

interface InventoryManagerProps {
  player: Player;
  onUpdate: (player: Player) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({
  player,
  onUpdate,
}) => {
  const handleSell = (item: Card) => {
    if (!window.confirm(`Vendre "${item.name}" ?`)) {
      return;
    }
    const updated = PlayerInventoryService.sellItem(player, item.id);
    onUpdate(updated);
  };

  const handleBuy = () => {
    const item: Card = {
      id: Date.now(),
      name: "Objet mystère",
      description: "Achat automatique",
      type: "objet",
      rarity: "interessant",
      properties: {},
      summon_cost: 0,
      image: null,
      passive_effect: null,
      is_wip: false,
      is_crap: false,
    };
    const updated = PlayerInventoryService.buyItem(player, item, 10);
    if (!updated) {
      window.alert("Pas assez de charisme !");
      return;
    }
    onUpdate(updated);
  };

  return (
    <div className="inventory-manager">
      <h3>Inventaire</h3>
      <div className="charisme-info">
        Charisme: {player.charisme ?? 0} / {getModifiedMaxCharisme(player)}
      </div>
      <button className="buy-button" onClick={handleBuy}>
        Acheter un objet (10)
      </button>
      <ul className="inventory-list">
        {player.inventory.map((item) => (
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
