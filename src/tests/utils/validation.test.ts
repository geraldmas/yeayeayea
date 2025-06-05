import { jest } from '@jest/globals';
import { validateCardSync } from '../../utils/validation';
import { Card } from '../../types';

describe('validateCardSync', () => {
  // Tests de validation générale
  describe('validation générale', () => {
    it('devrait valider une carte complète et correcte', () => {
      const validCard: Card = {
        id: 1,
        name: 'Carte de Test',
        type: 'personnage',
        rarity: 'interessant',
        description: 'Une carte de test',
        image: 'test.jpg',
        passive_effect: 'Effet passif de test',
        properties: {
          health: 10
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 3
      };
      
      const errors = validateCardSync(validCard);
      expect(errors.length).toBe(0);
    });

    it('devrait détecter des champs requis manquants', () => {
      const invalidCard = {
        id: 1,
        // name manquant
        type: 'personnage',
        // rarity manquant
        description: 'Une carte de test',
        image: 'test.jpg',
        passive_effect: 'Effet passif de test',
        properties: {
          health: 10
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 3
      } as Card;
      
      const errors = validateCardSync(invalidCard);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Le nom est requis');
      expect(errors).toContain('La rareté est requise');
    });
  });

  // Tests spécifiques pour chaque type de carte
  describe('validation par type de carte', () => {
    it('devrait valider une carte personnage correcte', () => {
      const validCharacterCard: Card = {
        id: 1,
        name: 'Personnage Test',
        type: 'personnage',
        rarity: 'interessant',
        description: 'Un personnage de test',
        image: 'personnage.jpg',
        passive_effect: 'Effet passif',
        properties: {
          health: 10
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 3
      };
      
      const errors = validateCardSync(validCharacterCard);
      expect(errors.length).toBe(0);
    });

    it('devrait détecter des points de vie manquants pour un personnage', () => {
      const invalidCharacterCard: Card = {
        id: 1,
        name: 'Personnage Test',
        type: 'personnage',
        rarity: 'interessant',
        description: 'Un personnage de test',
        image: 'personnage.jpg',
        passive_effect: 'Effet passif',
        properties: {
          // health manquant
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 3
      };
      
      const errors = validateCardSync(invalidCharacterCard);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Les points de vie sont requis pour les cartes Personnage');
    });

    it('devrait détecter des points de vie négatifs ou nuls pour un personnage', () => {
      const invalidCharacterCard: Card = {
        id: 1,
        name: 'Personnage Test',
        type: 'personnage',
        rarity: 'interessant',
        description: 'Un personnage de test',
        image: 'personnage.jpg',
        passive_effect: 'Effet passif',
        properties: {
          health: 0
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 3
      };
      
      const errors = validateCardSync(invalidCharacterCard);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Les points de vie doivent être supérieurs à 0');
    });

    it('devrait valider une carte lieu correcte', () => {
      const validLocationCard: Card = {
        id: 1,
        name: 'Lieu Test',
        type: 'lieu',
        rarity: 'interessant',
        description: 'Un lieu de test',
        image: 'lieu.jpg',
        passive_effect: 'Effet passif du lieu',
        properties: {},
        is_wip: false,
        is_crap: false,
        summon_cost: 2
      };
      
      const errors = validateCardSync(validLocationCard);
      expect(errors.length).toBe(0);
    });

    it('devrait détecter un effet passif manquant pour un lieu', () => {
      const invalidLocationCard: Card = {
        id: 1,
        name: 'Lieu Test',
        type: 'lieu',
        rarity: 'interessant',
        description: 'Un lieu de test',
        image: 'lieu.jpg',
        passive_effect: '', // effet passif vide
        properties: {},
        is_wip: false,
        is_crap: false,
        summon_cost: 2
      };
      
      const errors = validateCardSync(invalidLocationCard);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Un effet passif est requis pour les cartes Lieu');
    });

    it('devrait valider une carte action correcte', () => {
      const validActionCard: Card = {
        id: 1,
        name: 'Action Test',
        type: 'action',
        rarity: 'interessant',
        description: 'Une action de test',
        image: 'action.jpg',
        passive_effect: '',
        properties: {},
        is_wip: false,
        is_crap: false,
        summon_cost: 2
      };
      
      const errors = validateCardSync(validActionCard);
      expect(errors.length).toBe(0);
    });

    it('devrait détecter un coût négatif ou nul pour une action', () => {
      const invalidActionCard: Card = {
        id: 1,
        name: 'Action Test',
        type: 'action',
        rarity: 'interessant',
        description: 'Une action de test',
        image: 'action.jpg',
        passive_effect: '',
        properties: {},
        is_wip: false,
        is_crap: false,
        summon_cost: 0
      };
      
      const errors = validateCardSync(invalidActionCard);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Le coût d\'invocation doit être positif pour les cartes action');
    });

    it("devrait exiger eventDuration pour un événement", () => {
      const invalidEvent: Card = {
        id: 1,
        name: 'Event Test',
        type: 'evenement',
        rarity: 'interessant',
        description: '',
        image: 'event.jpg',
        passive_effect: '',
        properties: {},
        is_wip: false,
        is_crap: false,
        summon_cost: 2
      };

      const errors = validateCardSync(invalidEvent);
      expect(errors).toContain("La durée d'\u00E9vénement est requise pour les cartes Evenement");
    });

    it("devrait détecter une valeur eventDuration invalide", () => {
      const invalidEvent: Card = {
        id: 1,
        name: 'Event Test',
        type: 'evenement',
        rarity: 'interessant',
        description: '',
        image: 'event.jpg',
        passive_effect: '',
        properties: {},
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
        eventDuration: 'inconnue' as any
      };

      const errors = validateCardSync(invalidEvent);
      expect(errors).toContain("La durée d'\u00E9vénement doit être 'instantanee', 'temporaire' ou 'permanente'");
    });

    it("devrait valider un événement avec eventDuration", () => {
      const validEvent: Card = {
        id: 1,
        name: 'Event Test',
        type: 'evenement',
        rarity: 'interessant',
        description: '',
        image: 'event.jpg',
        passive_effect: '',
        properties: {},
        is_wip: false,
        is_crap: false,
        summon_cost: 2,
        eventDuration: 'temporaire'
      };

      const errors = validateCardSync(validEvent);
      expect(errors.length).toBe(0);
    });
  });

  // Tests pour la validation de coût par rareté
  describe('validation de coût par rareté', () => {
    it('devrait valider les coûts corrects par rareté', () => {
      const validRarities = [
        { rarity: 'gros_bodycount', cost: 3 },
        { rarity: 'interessant', cost: 5 },
        { rarity: 'banger', cost: 8 },
        { rarity: 'cheate', cost: 10 }
      ];
      
      validRarities.forEach(({ rarity, cost }) => {
        const card: Card = {
          id: 1,
          name: `Carte ${rarity}`,
          type: 'evenement',
          rarity: rarity as any,
          description: `Une carte de rareté ${rarity}`,
          image: 'test.jpg',
          passive_effect: '',
          properties: {},
          is_wip: false,
          is_crap: false,
          summon_cost: cost,
          eventDuration: 'instantanee'
        };
        
        const errors = validateCardSync(card);
        expect(errors.length).toBe(0);
      });
    });

    it('devrait détecter des coûts trop élevés par rareté', () => {
      const invalidRarities = [
        { rarity: 'gros_bodycount', cost: 4, maxCost: 3 },
        { rarity: 'interessant', cost: 6, maxCost: 5 },
        { rarity: 'banger', cost: 9, maxCost: 8 }
      ];
      
      invalidRarities.forEach(({ rarity, cost, maxCost }) => {
        const card: Card = {
          id: 1,
          name: `Carte ${rarity}`,
          type: 'evenement',
          rarity: rarity as any,
          description: `Une carte de rareté ${rarity}`,
          image: 'test.jpg',
          passive_effect: '',
          properties: {},
          is_wip: false,
          is_crap: false,
          summon_cost: cost,
          eventDuration: 'instantanee'
        };
        
        const errors = validateCardSync(card);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors).toContain(`Le coût d'invocation ne devrait pas dépasser ${maxCost} pour la rareté "${rarity}"`);
      });
    });

    it('devrait détecter un coût négatif ou nul pour une carte cheate', () => {
      const invalidCheateCard: Card = {
        id: 1,
        name: 'Carte Cheate',
        type: 'personnage',
        rarity: 'cheate',
        description: 'Une carte cheate',
        image: 'cheate.jpg',
        passive_effect: '',
        properties: {
          health: 100
        },
        is_wip: false,
        is_crap: false,
        summon_cost: 0
      };
      
      const errors = validateCardSync(invalidCheateCard);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Le coût d\'invocation doit être positif même pour les cartes "cheate"');
    });
  });
}); 