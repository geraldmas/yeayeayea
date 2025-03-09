import { v4 as uuidv4 } from 'uuid';
import {
  initializePlayerCharisme,
  calculateCharismeFromDefeat,
  addCharismeModifier,
  calculateModifiedCharismeGeneration,
  addCharisme,
  spendCharisme,
  updateCharismeModifiers,
  getModifiedMaxCharisme,
  setMaxCharisme,
  handleCharismeFromDefeat,
  CHARISME_GAIN_BY_RARITY,
  DEFAULT_BASE_CHARISME,
  DEFAULT_MAX_CHARISME,
  Player,
  Card,
  Rarity,
  CharismeModifier
} from '../utils/charismeService';

// Fonction helper pour créer un joueur de test
const createTestPlayer = (): Player => ({
  id: uuidv4(),
  name: 'Joueur Test',
  activeCard: null,
  benchCards: [],
  inventory: [],
  hand: [],
  motivation: 10,
  baseMotivation: 10,
  motivationModifiers: [],
  charisme: 0,
  baseCharisme: 0,
  maxCharisme: 100,
  charismeModifiers: [],
  movementPoints: 0,
  points: 0,
  effects: []
});

// Fonction helper pour créer une carte personnage de test
const createTestCharacterCard = (rarity: Rarity): Card => ({
  id: 1,
  name: 'Personnage Test',
  description: 'Carte de test pour les tests du service de charisme',
  type: 'personnage',
  rarity: rarity,
  properties: { health: 10 },
  summon_cost: 5,
  image: null,
  passive_effect: null,
  is_wip: false,
  is_crap: false
});

describe('charismeService', () => {
  describe('initializePlayerCharisme', () => {
    it('initialise correctement les propriétés de charisme d\'un joueur', () => {
      const player = createTestPlayer();
      player.charisme = undefined as any;
      player.baseCharisme = undefined as any;
      player.maxCharisme = undefined as any;
      player.charismeModifiers = undefined as any;
      
      const initializedPlayer = initializePlayerCharisme(player);
      
      expect(initializedPlayer.charisme).toBe(DEFAULT_BASE_CHARISME);
      expect(initializedPlayer.baseCharisme).toBe(DEFAULT_BASE_CHARISME);
      expect(initializedPlayer.maxCharisme).toBe(DEFAULT_MAX_CHARISME);
      expect(initializedPlayer.charismeModifiers).toEqual([]);
    });
  });
  
  describe('calculateCharismeFromDefeat', () => {
    it('calcule correctement le charisme en fonction de la rareté du personnage', () => {
      const grosBodycountCard = createTestCharacterCard('gros_bodycount');
      const interessantCard = createTestCharacterCard('interessant');
      const bangerCard = createTestCharacterCard('banger');
      const cheateCard = createTestCharacterCard('cheate');
      
      expect(calculateCharismeFromDefeat(grosBodycountCard)).toBe(CHARISME_GAIN_BY_RARITY.gros_bodycount);
      expect(calculateCharismeFromDefeat(interessantCard)).toBe(CHARISME_GAIN_BY_RARITY.interessant);
      expect(calculateCharismeFromDefeat(bangerCard)).toBe(CHARISME_GAIN_BY_RARITY.banger);
      expect(calculateCharismeFromDefeat(cheateCard)).toBe(CHARISME_GAIN_BY_RARITY.cheate);
    });
    
    it('retourne 0 pour des cartes qui ne sont pas des personnages', () => {
      const nonCharacterCard: Card = {
        ...createTestCharacterCard('interessant'),
        type: 'objet'
      };
      
      expect(calculateCharismeFromDefeat(nonCharacterCard)).toBe(0);
    });
  });
  
  describe('addCharismeModifier', () => {
    it('ajoute correctement un modificateur de charisme', () => {
      const player = createTestPlayer();
      const modifiedPlayer = addCharismeModifier(
        player,
        10,
        false,
        'Test Source',
        'generation'
      );
      
      expect(modifiedPlayer.charismeModifiers).toBeDefined();
      expect(modifiedPlayer.charismeModifiers?.length).toBe(1);
      expect(modifiedPlayer.charismeModifiers?.[0].value).toBe(10);
      expect(modifiedPlayer.charismeModifiers?.[0].isPercentage).toBe(false);
      expect(modifiedPlayer.charismeModifiers?.[0].source).toBe('Test Source');
      expect(modifiedPlayer.charismeModifiers?.[0].type).toBe('generation');
      expect(modifiedPlayer.charismeModifiers?.[0].id).toBeDefined();
    });
    
    it('ajoute correctement un modificateur temporaire avec durée', () => {
      const player = createTestPlayer();
      const modifiedPlayer = addCharismeModifier(
        player,
        15,
        true,
        'Test Source',
        'stockage',
        3
      );
      
      expect(modifiedPlayer.charismeModifiers).toBeDefined();
      expect(modifiedPlayer.charismeModifiers?.length).toBe(1);
      expect(modifiedPlayer.charismeModifiers?.[0].value).toBe(15);
      expect(modifiedPlayer.charismeModifiers?.[0].isPercentage).toBe(true);
      expect(modifiedPlayer.charismeModifiers?.[0].duration).toBe(3);
      expect(modifiedPlayer.charismeModifiers?.[0].type).toBe('stockage');
    });
  });
  
  describe('calculateModifiedCharismeGeneration', () => {
    it('applique correctement les modificateurs de valeur absolue', () => {
      const player = createTestPlayer();
      const playerWithMods = addCharismeModifier(
        player,
        5,
        false,
        'Test Source',
        'generation'
      );
      
      expect(calculateModifiedCharismeGeneration(10, playerWithMods)).toBe(15);
    });
    
    it('applique correctement les modificateurs en pourcentage', () => {
      const player = createTestPlayer();
      const playerWithMods = addCharismeModifier(
        player,
        50,
        true,
        'Test Source',
        'generation'
      );
      
      expect(calculateModifiedCharismeGeneration(10, playerWithMods)).toBe(15); // 10 + 50% = 15
    });
    
    it('ignore les modificateurs qui ne sont pas de type génération', () => {
      const player = createTestPlayer();
      const playerWithMods = addCharismeModifier(
        player,
        5,
        false,
        'Test Source',
        'stockage'
      );
      
      expect(calculateModifiedCharismeGeneration(10, playerWithMods)).toBe(10);
    });
    
    it('applique d\'abord les modificateurs absolus puis les pourcentages', () => {
      let player = createTestPlayer();
      player = addCharismeModifier(player, 5, false, 'Source 1', 'generation');
      player = addCharismeModifier(player, 50, true, 'Source 2', 'generation');
      
      // (10 + 5) * 1.5 = 22.5, arrondi à 23
      expect(calculateModifiedCharismeGeneration(10, player)).toBe(23);
    });
  });
  
  describe('addCharisme', () => {
    it('ajoute correctement du charisme à un joueur', () => {
      const player = createTestPlayer();
      player.charisme = 10;
      
      const updatedPlayer = addCharisme(player, 5);
      
      expect(updatedPlayer.charisme).toBe(15);
    });
    
    it('respecte la limite maximale de charisme', () => {
      const player = createTestPlayer();
      player.charisme = 95;
      player.maxCharisme = 100;
      
      const updatedPlayer = addCharisme(player, 10);
      
      expect(updatedPlayer.charisme).toBe(100);
    });
    
    it('applique les modificateurs de génération au montant ajouté', () => {
      let player = createTestPlayer();
      player.charisme = 10;
      player = addCharismeModifier(player, 50, true, 'Source', 'generation');
      
      const updatedPlayer = addCharisme(player, 10); // 10 + 50% = 15
      
      expect(updatedPlayer.charisme).toBe(25); // 10 + 15 = 25
    });
  });
  
  describe('spendCharisme', () => {
    it('dépense correctement du charisme si le joueur en a assez', () => {
      const player = createTestPlayer();
      player.charisme = 20;
      
      const updatedPlayer = spendCharisme(player, 10);
      
      expect(updatedPlayer).not.toBeNull();
      expect(updatedPlayer!.charisme).toBe(10);
    });
    
    it('retourne null si le joueur n\'a pas assez de charisme', () => {
      const player = createTestPlayer();
      player.charisme = 5;
      
      const updatedPlayer = spendCharisme(player, 10);
      
      expect(updatedPlayer).toBeNull();
    });
    
    it('applique les modificateurs de coût', () => {
      let player = createTestPlayer();
      player.charisme = 10;
      player = addCharismeModifier(player, -2, false, 'Réduction', 'cout');
      
      const updatedPlayer = spendCharisme(player, 10); // 10 - 2 = 8
      
      expect(updatedPlayer).not.toBeNull();
      expect(updatedPlayer!.charisme).toBe(2); // 10 - 8 = 2
    });
    
    it('applique les modificateurs de coût en pourcentage', () => {
      let player = createTestPlayer();
      player.charisme = 10;
      player = addCharismeModifier(player, -20, true, 'Réduction', 'cout');
      
      const updatedPlayer = spendCharisme(player, 10); // 10 - 20% = 8
      
      expect(updatedPlayer).not.toBeNull();
      expect(updatedPlayer!.charisme).toBe(2); // 10 - 8 = 2
    });
  });
  
  describe('updateCharismeModifiers', () => {
    it('réduit correctement la durée des modificateurs temporaires', () => {
      let player = createTestPlayer();
      player = addCharismeModifier(player, 10, false, 'Source', 'generation', 2);
      
      const updatedPlayer = updateCharismeModifiers(player);
      
      expect(updatedPlayer.charismeModifiers).toBeDefined();
      expect(updatedPlayer.charismeModifiers?.length).toBe(1);
      expect(updatedPlayer.charismeModifiers?.[0].duration).toBe(1);
    });
    
    it('supprime les modificateurs dont la durée est expirée', () => {
      let player = createTestPlayer();
      player = addCharismeModifier(player, 10, false, 'Source', 'generation', 1);
      
      const updatedPlayer = updateCharismeModifiers(player);
      
      expect(updatedPlayer.charismeModifiers).toBeDefined();
      expect(updatedPlayer.charismeModifiers?.length).toBe(0);
    });
    
    it('ne modifie pas les modificateurs permanents', () => {
      let player = createTestPlayer();
      player = addCharismeModifier(player, 10, false, 'Source', 'generation');
      
      const updatedPlayer = updateCharismeModifiers(player);
      
      expect(updatedPlayer.charismeModifiers).toBeDefined();
      expect(updatedPlayer.charismeModifiers?.length).toBe(1);
      expect(updatedPlayer.charismeModifiers?.[0].duration).toBeUndefined();
    });
  });
  
  describe('getModifiedMaxCharisme', () => {
    it('calcule correctement la capacité maximale avec modificateurs absolus', () => {
      let player = createTestPlayer();
      player.maxCharisme = 100;
      player = addCharismeModifier(player, 20, false, 'Source', 'stockage');
      
      expect(getModifiedMaxCharisme(player)).toBe(120);
    });
    
    it('calcule correctement la capacité maximale avec modificateurs en pourcentage', () => {
      let player = createTestPlayer();
      player.maxCharisme = 100;
      player = addCharismeModifier(player, 30, true, 'Source', 'stockage');
      
      expect(getModifiedMaxCharisme(player)).toBe(130); // 100 + 30% = 130
    });
    
    it('ignore les modificateurs qui ne sont pas de type stockage', () => {
      let player = createTestPlayer();
      player.maxCharisme = 100;
      player = addCharismeModifier(player, 20, false, 'Source', 'generation');
      
      expect(getModifiedMaxCharisme(player)).toBe(100);
    });
    
    it('applique d\'abord les modificateurs absolus puis les pourcentages', () => {
      let player = createTestPlayer();
      player.maxCharisme = 100;
      player = addCharismeModifier(player, 20, false, 'Source 1', 'stockage');
      player = addCharismeModifier(player, 30, true, 'Source 2', 'stockage');
      
      // (100 + 20) * 1.3 = 156
      expect(getModifiedMaxCharisme(player)).toBe(156);
    });
  });
  
  describe('setMaxCharisme', () => {
    it('met à jour correctement la capacité maximale de charisme', () => {
      const player = createTestPlayer();
      player.maxCharisme = 100;
      
      const updatedPlayer = setMaxCharisme(player, 150);
      
      expect(updatedPlayer.maxCharisme).toBe(150);
    });
    
    it('réduit le charisme si nécessaire pour respecter la nouvelle limite', () => {
      const player = createTestPlayer();
      player.maxCharisme = 100;
      player.charisme = 80;
      
      const updatedPlayer = setMaxCharisme(player, 50);
      
      expect(updatedPlayer.maxCharisme).toBe(50);
      expect(updatedPlayer.charisme).toBe(50);
    });
    
    it('ne modifie pas le charisme si la nouvelle limite est supérieure', () => {
      const player = createTestPlayer();
      player.maxCharisme = 100;
      player.charisme = 80;
      
      const updatedPlayer = setMaxCharisme(player, 150);
      
      expect(updatedPlayer.maxCharisme).toBe(150);
      expect(updatedPlayer.charisme).toBe(80);
    });
  });
  
  describe('handleCharismeFromDefeat', () => {
    it('ajoute correctement le charisme pour la défaite d\'un personnage', () => {
      const player = createTestPlayer();
      player.charisme = 10;
      const character = createTestCharacterCard('banger'); // Valeur: 20
      
      const updatedPlayer = handleCharismeFromDefeat(player, character);
      
      expect(updatedPlayer.charisme).toBe(30); // 10 + 20 = 30
    });
    
    it('n\'ajoute pas de charisme pour des cartes non-personnage', () => {
      const player = createTestPlayer();
      player.charisme = 10;
      const nonCharacter: Card = {
        ...createTestCharacterCard('banger'),
        type: 'objet'
      };
      
      const updatedPlayer = handleCharismeFromDefeat(player, nonCharacter);
      
      expect(updatedPlayer.charisme).toBe(10); // Pas de changement
    });
    
    it('applique les modificateurs de génération au charisme gagné', () => {
      let player = createTestPlayer();
      player.charisme = 10;
      player = addCharismeModifier(player, 50, true, 'Source', 'generation');
      const character = createTestCharacterCard('banger'); // Valeur: 20
      
      const updatedPlayer = handleCharismeFromDefeat(player, character);
      
      // 10 + (20 * 1.5) = 10 + 30 = 40
      expect(updatedPlayer.charisme).toBe(40);
    });
  });
}); 