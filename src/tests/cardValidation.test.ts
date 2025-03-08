import { Card, Spell, SpellEffect } from '../types';
import { 
  validateCard, 
  validateSpell, 
  validateTag 
} from '../utils/validation';

// Mock des fonctions de récupération des relations
jest.mock('../utils/validation', () => {
  const originalModule = jest.requireActual('../utils/validation');
  return {
    ...originalModule,
    getCardTags: jest.fn().mockResolvedValue([]),
    getCardSpells: jest.fn().mockResolvedValue([]),
  };
});

// Mock du service de données
jest.mock('../utils/dataService', () => ({
  spellService: {
    getByIds: jest.fn().mockResolvedValue([]),
  },
  tagService: {
    getByIds: jest.fn().mockResolvedValue([]),
  },
}));

describe('Card Validation', () => {
  describe('validateCard - Generic validations', () => {
    it('should validate a complete and valid card', async () => {
      const validCard: Card = {
        id: 1,
        name: 'Carte test',
        type: 'personnage',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          health: 20,
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
      };

      const errors = await validateCard(validCard);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', async () => {
      const invalidCard: Card = {
        id: 1,
        name: '',  // Nom vide
        type: 'personnage',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          health: 20,
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
      };

      const errors = await validateCard(invalidCard);
      expect(errors).toContain('Le nom est requis');
    });

    it('should validate negative summon cost', async () => {
      const invalidCard: Card = {
        id: 1,
        name: 'Carte test',
        type: 'personnage',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          health: 20,
        },
        is_wip: false,
        is_crap: false,
        summon_cost: -1,  // Coût négatif
      };

      const errors = await validateCard(invalidCard);
      expect(errors).toContain('Le coût d\'invocation ne peut pas être négatif');
    });
  });

  describe('validateCard - Personnage validations', () => {
    it('should validate a valid personnage card', async () => {
      const validPersonnage: Card = {
        id: 1,
        name: 'Personnage test',
        type: 'personnage',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          health: 20,
          level: 1
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
      };

      const errors = await validateCard(validPersonnage);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for personnage card with missing health', async () => {
      const invalidPersonnage: Card = {
        id: 1,
        name: 'Personnage test',
        type: 'personnage',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          // health manquant
          level: 1
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
      };

      const errors = await validateCard(invalidPersonnage);
      expect(errors).toContain('Les points de vie sont requis pour un personnage');
    });

    it('should return errors for personnage card with health too high for its rarity', async () => {
      const invalidPersonnage: Card = {
        id: 1,
        name: 'Personnage test',
        type: 'personnage',
        rarity: 'gros_bodycount',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          health: 20, // Trop élevé pour gros_bodycount
          level: 1
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
      };

      const errors = await validateCard(invalidPersonnage);
      expect(errors).toContain('Les PV sont trop élevés pour un personnage de rareté "gros_bodycount"');
    });
  });

  describe('validateCard - Lieu validations', () => {
    it('should validate a valid lieu card', async () => {
      const validLieu: Card = {
        id: 1,
        name: 'Lieu test',
        type: 'lieu',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          distribution_points: 2,
          capacity: 3
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
      };

      const errors = await validateCard(validLieu);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for lieu card with invalid capacity', async () => {
      const invalidLieu: Card = {
        id: 1,
        name: 'Lieu test',
        type: 'lieu',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          distribution_points: 2,
          capacity: 0 // Capacité invalide
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
      };

      const errors = await validateCard(invalidLieu);
      expect(errors).toContain('La capacité doit être un nombre positif');
    });
  });

  describe('validateCard - Objet validations', () => {
    it('should validate a valid objet card', async () => {
      const validObjet: Card = {
        id: 1,
        name: 'Objet test',
        type: 'objet',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          slot: 'main',
          sell_value: 10,
          bonuses: {
            damage: 5
          }
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
      };

      const errors = await validateCard(validObjet);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for objet card with missing slot', async () => {
      const invalidObjet: Card = {
        id: 1,
        name: 'Objet test',
        type: 'objet',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          // slot manquant
          sell_value: 10
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
      };

      const errors = await validateCard(invalidObjet);
      expect(errors).toContain('L\'emplacement d\'équipement est requis pour un objet');
    });
  });

  describe('validateCard - Action validations', () => {
    it('should validate a valid action card', async () => {
      const validAction: Card = {
        id: 1,
        name: 'Action test',
        type: 'action',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          motivation_cost: 3,
          power: 5
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 0,
      };

      const errors = await validateCard(validAction);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for action card with missing motivation cost', async () => {
      const invalidAction: Card = {
        id: 1,
        name: 'Action test',
        type: 'action',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          // motivation_cost manquant
          power: 5
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 0,
      };

      const errors = await validateCard(invalidAction);
      expect(errors).toContain('Le coût en motivation est requis pour une action');
    });
  });

  describe('validateCard - Evenement validations', () => {
    it('should validate a valid evenement card', async () => {
      const validEvenement: Card = {
        id: 1,
        name: 'Evenement test',
        type: 'evenement',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          duration: 3,
          global_effect: 'Effet global'
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
      };

      const errors = await validateCard(validEvenement);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for evenement card with invalid duration', async () => {
      const invalidEvenement: Card = {
        id: 1,
        name: 'Evenement test',
        type: 'evenement',
        rarity: 'interessant',
        description: 'Une description',
        image: 'image.jpg',
        passive_effect: 'Un effet passif',
        properties: {
          duration: 0, // Durée invalide
          global_effect: 'Effet global'
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
      };

      const errors = await validateCard(invalidEvenement);
      expect(errors).toContain('La durée doit être un nombre positif');
    });
  });

  describe('validateSpell and spell effects validations', () => {
    it('should validate a valid spell', () => {
      const validSpell: Spell = {
        id: 1,
        name: 'Sort test',
        description: 'Description',
        power: 5,
        cost: 2,
        range_min: 1,
        range_max: 3,
        effects: [
          {
            type: 'damage',
            value: 10,
            target_type: 'opponent'
          }
        ],
        is_value_percentage: false
      };

      const errors = validateSpell(validSpell);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for spell with negative cost', () => {
      const invalidSpell: Spell = {
        id: 1,
        name: 'Sort test',
        description: 'Description',
        power: 5,
        cost: -1, // Coût négatif
        range_min: 1,
        range_max: 3,
        effects: [
          {
            type: 'damage',
            value: 10,
            target_type: 'opponent'
          }
        ],
        is_value_percentage: false
      };

      const errors = validateSpell(invalidSpell);
      expect(errors).toContain('Le coût ne peut pas être négatif');
    });

    it('should return errors for damage effect with non-positive value', () => {
      const invalidSpell: Spell = {
        id: 1,
        name: 'Sort test',
        description: 'Description',
        power: 5,
        cost: 2,
        range_min: 1,
        range_max: 3,
        effects: [
          {
            type: 'damage',
            value: 0, // Valeur zéro
            target_type: 'opponent'
          }
        ],
        is_value_percentage: false
      };

      const errors = validateSpell(invalidSpell);
      expect(errors).toContain('Effet #1: La valeur doit être positive pour l\'effet damage');
    });

    it('should return errors for apply_alteration effect without alteration', () => {
      const invalidSpell: Spell = {
        id: 1,
        name: 'Sort test',
        description: 'Description',
        power: 5,
        cost: 2,
        range_min: 1,
        range_max: 3,
        effects: [
          {
            type: 'apply_alteration',
            value: 1,
            // alteration manquant
            target_type: 'opponent'
          }
        ],
        is_value_percentage: false
      };

      const errors = validateSpell(invalidSpell);
      expect(errors).toContain('Effet #1: Une altération est requise pour l\'effet apply_alteration');
    });
  });
}); 