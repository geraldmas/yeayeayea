import { PlayerInventoryService } from "../playerInventoryService";
import { Player, Card, Rarity } from "../../types/index";
import { addCharismeModifier } from "../../utils/charismeService";

const createTestPlayer = (): Player => ({
  id: "player1",
  name: "Test Player",
  activeCard: null,
  benchCards: [],
  inventory: [],
  hand: [],
  motivation: 0,
  baseMotivation: 0,
  motivationModifiers: [],
  charisme: 0,
  baseCharisme: 0,
  maxCharisme: 100,
  charismeModifiers: [],
  movementPoints: 0,
  points: 0,
  effects: [],
});

const createTestItem = (id: number, rarity: Rarity): Card => ({
  id,
  name: "Item",
  description: "Test item",
  type: "objet",
  rarity,
  properties: {},
  summon_cost: 0,
  image: null,
  passive_effect: null,
  is_wip: false,
  is_crap: false,
});

describe("PlayerInventoryService.sellItem", () => {
  it("removes item from inventory and adds charisme", () => {
    const player = createTestPlayer();
    const item = createTestItem(1, "banger");
    player.inventory = [item];

    const result = PlayerInventoryService.sellItem(player, 1);

    expect(result.inventory).toHaveLength(0);
    expect(result.charisme).toBe(20);
  });

  it("applies charisme modifiers when selling", () => {
    let player = createTestPlayer();
    const item = createTestItem(1, "banger");
    player.inventory = [item];
    player = addCharismeModifier(player, 50, true, "bonus", "generation");

    const result = PlayerInventoryService.sellItem(player, 1);

    expect(result.inventory).toHaveLength(0);
    expect(result.charisme).toBe(30); // 20 base +50%
  });
});

describe("PlayerInventoryService.buyItem", () => {
  it("adds item to inventory and spends charisme", () => {
    const player = createTestPlayer();
    player.charisme = 30;
    const item = createTestItem(2, "interessant");

    const result = PlayerInventoryService.buyItem(player, item, 20)!;

    expect(result.inventory).toHaveLength(1);
    expect(result.inventory[0]).toBe(item);
    expect(result.charisme).toBe(10);
  });

  it("returns null when not enough charisme", () => {
    const player = createTestPlayer();
    player.charisme = 5;
    const item = createTestItem(2, "interessant");

    const result = PlayerInventoryService.buyItem(player, item, 10);

    expect(result).toBeNull();
  });
});
