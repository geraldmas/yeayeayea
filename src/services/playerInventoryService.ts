import type { Player, Card } from "../types/index";
import {
  Rarity,
  CHARISME_GAIN_BY_RARITY,
  addCharisme,
  spendCharisme,
} from "../utils/charismeService";

/**
 * Service de gestion de l'inventaire des joueurs.
 */
export class PlayerInventoryService {
  /**
   * Vend un objet de l'inventaire du joueur et lui ajoute du charisme.
   * Le montant de charisme obtenu dépend de la rareté de l'objet vendu
   * et est soumis aux modificateurs via {@link addCharisme}.
   *
   * @param player Joueur possédant l'objet
   * @param itemId Identifiant de l'objet à vendre
   * @returns Le joueur mis à jour
   */
  public static sellItem(player: Player, itemId: number): Player {
    const item = player.inventory.find((c) => c.id === itemId);
    if (!item) {
      return player;
    }

    const updatedInventory = player.inventory.filter((c) => c.id !== itemId);
    const rarity = item.rarity as Rarity;
    const baseGain = CHARISME_GAIN_BY_RARITY[rarity] ?? 0;

    const playerWithoutItem: Player = {
      ...player,
      inventory: updatedInventory,
    };
    return addCharisme(playerWithoutItem, baseGain);
  }

  /**
   * Achète un objet en dépensant du charisme.
   * Retourne null si le joueur n'a pas assez de ressources.
   */
  public static buyItem(
    player: Player,
    item: Card,
    cost: number,
  ): Player | null {
    const updated = spendCharisme(player, cost);
    if (!updated) {
      return null;
    }
    return {
      ...updated,
      inventory: [...updated.inventory, item],
    };
  }
}

export const playerInventoryService = new PlayerInventoryService();
