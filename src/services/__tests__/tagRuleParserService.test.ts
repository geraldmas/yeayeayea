import { TagRuleParserService } from '../tagRuleParserService';
import { 
  TagRule, 
  TagRuleEffectType, 
  TagRuleTargetType, 
  TagRuleConditionType, 
  TagRuleDefinition
} from '../../types/rules';
import { CardInstance } from '../../types/combat';
import { Card, Tag } from '../../types/index';

// Extension du type Card pour les tests
type TestCard = Card & {
  tags?: Array<{
    id: number;
    name: string;
    passive_effect: string | null;
  }>;
};

// Mock des types nécessaires pour les tests
const createMockCard = (id: number, name: string, tags: string[] = []): TestCard => ({
  id,
  name,
  type: 'personnage',
  rarity: 'interessant',
  description: `Carte test ${name}`,
  image: '',
  passive_effect: '',
  properties: { health: 100 },
  is_wip: false,
  is_crap: false,
  summon_cost: 10,
  tags: tags.map((tagName, index) => ({
    id: index + 1,
    name: tagName,
    passive_effect: null
  }))
});

const createMockCardInstance = (card: TestCard, id: string = `player1_${card.id}`): CardInstance => {
  // Créer les instances de tags actifs
  const activeTags = (card.tags || []).map(tag => ({
    tag: tag as Tag,
    isTemporary: false
  }));

  // Créer une instance de carte avec les méthodes nécessaires
  const instance: Partial<CardInstance> = {
    instanceId: id,
    cardDefinition: card as Card,
    currentHealth: card.properties.health || 100,
    maxHealth: card.properties.health || 100,
    temporaryStats: {
      attack: 10,
      defense: 5
    },
    damageHistory: [],
    activeEffects: {},
    activeTags: activeTags,
    activeAlterations: [],
    availableSpells: [],
    isExhausted: false,
    isTapped: false,
    unableToAttack: false,
    counters: {},
    
    // Implémentations simplifiées des méthodes requises
    applyDamage: jest.fn((amount: number) => {
      instance.currentHealth! -= amount;
    }),
    heal: jest.fn((amount: number) => {
      instance.currentHealth = Math.min(instance.currentHealth! + amount, instance.maxHealth!);
    }),
    addAlteration: jest.fn(),
    removeAlteration: jest.fn(),
    addTag: jest.fn((tag: Tag) => {
      instance.activeTags!.push({ tag, isTemporary: false });
    }),
    removeTag: jest.fn(),
    hasTag: jest.fn((tagId: number) => {
      return instance.activeTags!.some(t => t.tag.id === tagId);
    }),
    hasAlteration: jest.fn(() => false),
    canUseSpell: jest.fn(() => true),
    canAttack: jest.fn(() => !instance.isExhausted),
    applyAlterationEffects: jest.fn(),
    resetForNextTurn: jest.fn(() => {
      instance.isExhausted = false;
    }),
    recalculateTemporaryStats: jest.fn()
  };

  return instance as CardInstance;
};

// Helper pour créer un mock gameState pour les tests
const createMockGameState = (cards: CardInstance[]) => {
  // Organiser les cartes par joueur
  const player1Cards = cards.filter(c => c.instanceId.startsWith('player1_'));
  const player2Cards = cards.filter(c => c.instanceId.startsWith('player2_'));

  return {
    players: [
      {
        id: 'player1',
        cards: player1Cards,
        charisme: 50,
        motivation: 10,
        charismeGenerationModifier: 1.0,
        motivationModifier: 1.0
      },
      {
        id: 'player2',
        cards: player2Cards,
        charisme: 40,
        motivation: 10,
        charismeGenerationModifier: 1.0,
        motivationModifier: 1.0
      }
    ],
    alterations: [
      { id: 1, name: 'Poison', type: 'debuff' },
      { id: 2, name: 'Force', type: 'buff' }
    ],
    activeLieuCard: null
  };
};

describe('TagRuleParserService', () => {
  let parserService: TagRuleParserService;
  let mockCards: TestCard[];
  let mockCardInstances: CardInstance[];
  let mockGameState: any;

  beforeEach(() => {
    // Réinitialiser l'instance pour chaque test
    parserService = new TagRuleParserService();
    
    // Créer des cartes de test avec des tags différents
    mockCards = [
      createMockCard(1, 'Personnage1', ['NUIT', 'FRAGILE']),
      createMockCard(2, 'Personnage2', ['JOUR']),
      createMockCard(3, 'Personnage3', ['NUIT', 'FORT'])
    ];
    
    // Créer des instances pour les deux joueurs
    mockCardInstances = [
      createMockCardInstance(mockCards[0], 'player1_1'),
      createMockCardInstance(mockCards[1], 'player1_2'),
      createMockCardInstance(mockCards[2], 'player2_1')
    ];
    
    // Créer un état de jeu simulé
    mockGameState = createMockGameState(mockCardInstances);
  });

  describe('Gestion des règles', () => {
    test('Devrait charger des règles à partir d\'une définition', () => {
      // Définir des règles de test
      const tagRules: TagRuleDefinition[] = [
        {
          tagName: 'NUIT',
          rules: [
            {
              id: 1,
              name: 'Bonus de charisme nocturne',
              description: 'Augmente la génération de charisme de 10%',
              effectType: TagRuleEffectType.CHARISME_GENERATION,
              value: 10,
              isPercentage: true,
              targetType: TagRuleTargetType.SELF
            }
          ]
        }
      ];
      
      // Charger les règles
      parserService.loadRules(tagRules);
      
      // Vérifier que les règles sont correctement chargées
      const loadedRules = parserService.getRulesForTag('NUIT');
      expect(loadedRules).toHaveLength(1);
      expect(loadedRules[0].name).toBe('Bonus de charisme nocturne');
    });

    test('Devrait ajouter une nouvelle règle à un tag', () => {
      // Ajouter une règle
      const newRule: TagRule = {
        name: 'Nouvelle règle',
        description: 'Description de test',
        effectType: TagRuleEffectType.DAMAGE_MODIFIER,
        value: 20,
        isPercentage: true,
        targetType: TagRuleTargetType.TAGGED,
        targetTag: 'FRAGILE'
      };
      
      parserService.addRuleForTag('NUIT', newRule);
      
      // Vérifier que la règle a été ajoutée
      const rules = parserService.getRulesForTag('NUIT');
      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('Nouvelle règle');
    });

    test('Devrait mettre à jour une règle existante', () => {
      // Ajouter puis mettre à jour une règle
      const initialRule: TagRule = {
        id: 1,
        name: 'Règle initiale',
        description: 'Description initiale',
        effectType: TagRuleEffectType.HEALTH_MODIFIER,
        value: 5,
        isPercentage: false,
        targetType: TagRuleTargetType.SELF
      };
      
      parserService.addRuleForTag('JOUR', initialRule);
      
      const updatedRule: TagRule = {
        ...initialRule,
        name: 'Règle mise à jour',
        value: 10
      };
      
      const result = parserService.updateRule('JOUR', 1, updatedRule);
      
      // Vérifier que la mise à jour a réussi
      expect(result).toBe(true);
      
      const rules = parserService.getRulesForTag('JOUR');
      expect(rules[0].name).toBe('Règle mise à jour');
      expect(rules[0].value).toBe(10);
    });

    test('Devrait supprimer une règle existante', () => {
      // Ajouter puis supprimer une règle
      const rule: TagRule = {
        id: 1,
        name: 'Règle à supprimer',
        description: 'Sera supprimée',
        effectType: TagRuleEffectType.MOTIVATION_MODIFIER,
        value: 15,
        isPercentage: true,
        targetType: TagRuleTargetType.OWN_TEAM
      };
      
      parserService.addRuleForTag('FORT', rule);
      
      // Vérifier que la règle existe
      expect(parserService.getRulesForTag('FORT')).toHaveLength(1);
      
      // Supprimer la règle
      const result = parserService.deleteRule('FORT', 1);
      
      // Vérifier que la suppression a réussi
      expect(result).toBe(true);
      expect(parserService.getRulesForTag('FORT')).toHaveLength(0);
    });
  });
  
  describe('Parsing de règles textuelles', () => {
    test('Devrait parser une règle simple au format texte', () => {
      const ruleText = 'damageModifier:tagged(FRAGILE):+20%:Augmente les dégâts de 20% sur les cibles fragiles';
      
      const parsedRule = parserService.parseRuleFromText(ruleText);
      
      // Vérifier si la règle a été correctement parsée
      expect(parsedRule).not.toBeNull();
      
      // Si null, les tests suivants seraient ignorés
      if (!parsedRule) return;
      
      // Tester les propriétés de la règle
      expect(parsedRule.effectType).toBe(TagRuleEffectType.DAMAGE_MODIFIER);
      expect(parsedRule.targetType).toBe(TagRuleTargetType.TAGGED);
      expect(parsedRule.targetTag).toBe('FRAGILE');
      expect(parsedRule.value).toBe(20);
      expect(parsedRule.isPercentage).toBe(true);
      expect(parsedRule.description).toBe('Augmente les dégâts de 20% sur les cibles fragiles');
    });

    test('Devrait parser une règle avec condition', () => {
      // Utiliser un format de condition qui fonctionne avec notre parser
      const ruleText = 'healthModifier:self:+5:Augmente les PV de 5:IF(healthPercentage,less,50)';
      
      const parsedRule = parserService.parseRuleFromText(ruleText);
      
      // Vérifier si la règle a été correctement parsée
      expect(parsedRule).not.toBeNull();
      
      // Si null, les tests suivants seraient ignorés
      if (!parsedRule) return;
      
      // Tester les propriétés de la règle
      expect(parsedRule.effectType).toBe(TagRuleEffectType.HEALTH_MODIFIER);
      expect(parsedRule.value).toBe(5);
      expect(parsedRule.isPercentage).toBe(false);
        
      // Vérifier la condition
      expect(parsedRule.condition).toBeDefined();
      
      // Si pas de condition, les tests suivants seraient ignorés
      if (!parsedRule.condition) return;
      
      expect(parsedRule.condition.type).toBe(TagRuleConditionType.HEALTH_PERCENTAGE);
      expect(parsedRule.condition.comparison).toBe('less');
      expect(parsedRule.condition.value).toBe('50');
    });
  });
  
  describe('Application des règles', () => {
    test('Devrait appliquer une règle de modification de charisme', () => {
      // Configurer une règle qui augmente le charisme
      const rule: TagRule = {
        name: 'Bonus de charisme nocturne',
        description: 'Augmente la génération de charisme de 10%',
        effectType: TagRuleEffectType.CHARISME_GENERATION,
        value: 10,
        isPercentage: true,
        targetType: TagRuleTargetType.SELF
      };
      
      parserService.addRuleForTag('NUIT', rule);
      
      // Source card avec le tag NUIT
      const sourceCard = mockCardInstances[0]; // player1_1 avec tag NUIT
      
      // Appliquer la règle
      const results = parserService.applyTagRules('NUIT', sourceCard, mockCardInstances, mockGameState);
      
      // Vérifier les résultats
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      
      // Vérifier que le modificateur de charisme a été modifié
      const player = mockGameState.players[0]; // player1
      expect(player.charismeGenerationModifier).toBeCloseTo(1.1); // 1.0 * (1 + 10/100)
    });

    test('Devrait appliquer une règle de dégâts aux cibles avec un tag spécifique', () => {
      // Règle qui augmente les dégâts sur les cibles FRAGILE
      const rule: TagRule = {
        name: 'Dégâts supplémentaires sur cibles fragiles',
        description: 'Augmente les dégâts de 20% sur les cibles fragiles',
        effectType: TagRuleEffectType.DAMAGE_MODIFIER,
        value: 20,
        isPercentage: true,
        targetType: TagRuleTargetType.TAGGED,
        targetTag: 'FRAGILE'
      };
      
      parserService.addRuleForTag('FORT', rule);
      
      // Source card avec le tag FORT
      const sourceCard = mockCardInstances[2]; // player2_1 avec tag FORT
      
      // Appliquer la règle
      const results = parserService.applyTagRules('FORT', sourceCard, mockCardInstances, mockGameState);
      
      // Vérifier les résultats
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      
      // Vérifier que les stats temporaires de la cible ont été mises à jour
      const targetCard = mockCardInstances[0]; // player1_1 qui a le tag FRAGILE
      expect(targetCard.activeEffects.damageModifier).toBeDefined();
      expect(targetCard.activeEffects.damageModifier[0].value).toBe(20);
      expect(targetCard.activeEffects.damageModifier[0].isPercentage).toBe(true);
    });

    test('Devrait appliquer un bonus d\'attaque', () => {
      const rule: TagRule = {
        name: 'Bonus d\'attaque',
        description: 'Augmente l\'attaque de 5',
        effectType: TagRuleEffectType.ATTACK_MODIFIER,
        value: 5,
        isPercentage: false,
        targetType: TagRuleTargetType.SELF
      };

      parserService.addRuleForTag('NUIT', rule);

      const sourceCard = mockCardInstances[0];
      const results = parserService.applyTagRules('NUIT', sourceCard, mockCardInstances, mockGameState);

      expect(results[0].success).toBe(true);
      expect(sourceCard.temporaryStats.attack).toBe(15); // base 10 + 5
    });

    test('Devrait appliquer un bonus de défense en pourcentage', () => {
      const rule: TagRule = {
        name: 'Bonus de défense',
        description: 'Augmente la défense de 50%',
        effectType: TagRuleEffectType.DEFENSE_MODIFIER,
        value: 50,
        isPercentage: true,
        targetType: TagRuleTargetType.SELF
      };

      parserService.addRuleForTag('JOUR', rule);

      const sourceCard = mockCardInstances[1]; // player1_2 avec tag JOUR
      sourceCard.temporaryStats.defense = 4;
      (sourceCard.cardDefinition.properties as any).defense = 4;

      const results = parserService.applyTagRules('JOUR', sourceCard, mockCardInstances, mockGameState);

      expect(results[0].success).toBe(true);
      expect(sourceCard.temporaryStats.defense).toBe(6); // 4 + 50% of base (4) => +2
    });

    test("Devrait désactiver l'attaque des cibles", () => {
      const rule: TagRule = {
        name: 'Intimidation',
        description: 'Empêche la cible d\'attaquer',
        effectType: TagRuleEffectType.DISABLE_ATTACK,
        value: 0,
        isPercentage: false,
        targetType: TagRuleTargetType.TAGGED,
        targetTag: 'FRAGILE'
      };

      parserService.addRuleForTag('JOUR', rule);

      const sourceCard = mockCardInstances[1]; // player1_2 avec tag JOUR
      const targetCard = mockCardInstances[0];

      const results = parserService.applyTagRules('JOUR', sourceCard, mockCardInstances, mockGameState);

      expect(results[0].success).toBe(true);
      // @ts-ignore - property added dynamically
      expect(targetCard.unableToAttack).toBe(true);
    });
  });
});
