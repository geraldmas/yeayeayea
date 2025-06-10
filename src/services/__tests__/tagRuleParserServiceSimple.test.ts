import { TagRuleParserService } from '../tagRuleParserService';
import { 
  TagRule, 
  TagRuleEffectType,
  TagRuleTargetType,
  TagRuleDefinition
} from '../../types/rules';

describe('TagRuleParserService - Tests simples', () => {
  let parser: TagRuleParserService;

  beforeEach(() => {
    parser = new TagRuleParserService();
  });

  test('Devrait initialiser correctement le service', () => {
    expect(parser).toBeDefined();
  });

  test('Devrait charger et récupérer des règles pour un tag', () => {
    const rules: TagRuleDefinition[] = [
      {
        tagName: 'TEST_TAG',
        rules: [
          {
            id: 1,
            name: 'Test Rule',
            description: 'Une règle de test',
            effectType: TagRuleEffectType.DAMAGE_MODIFIER,
            value: 10,
            isPercentage: true,
            targetType: TagRuleTargetType.SELF
          }
        ]
      }
    ];

    parser.loadRules(rules);
    const loadedRules = parser.getRulesForTag('TEST_TAG');
    
    expect(loadedRules).toHaveLength(1);
    expect(loadedRules[0].name).toBe('Test Rule');
    expect(loadedRules[0].value).toBe(10);
  });

  test('Devrait ajouter une nouvelle règle', () => {
    const rule: TagRule = {
      name: 'New Rule',
      description: 'Une nouvelle règle',
      effectType: TagRuleEffectType.HEALTH_MODIFIER,
      value: 5,
      isPercentage: false,
      targetType: TagRuleTargetType.SELF
    };

    parser.addRuleForTag('NEW_TAG', rule);
    const rules = parser.getRulesForTag('NEW_TAG');
    
    expect(rules).toHaveLength(1);
    expect(rules[0].name).toBe('New Rule');
  });

  test('Devrait parser une règle à partir d\'un texte', () => {
    const ruleText = 'damageModifier:self:+15%:Augmente les dégâts de 15%';
    const parsedRule = parser.parseRuleFromText(ruleText);
    
    // Vérifier que la règle a été parsée
    expect(parsedRule).not.toBeNull();
    
    // Si le parsing a échoué, on arrête le test ici
    if (!parsedRule) return;
    
    // Sinon, on vérifie les propriétés de la règle
    expect(parsedRule.effectType).toBe(TagRuleEffectType.DAMAGE_MODIFIER);
    expect(parsedRule.targetType).toBe(TagRuleTargetType.SELF);
    expect(parsedRule.value).toBe(15);
    expect(parsedRule.isPercentage).toBe(true);
    expect(parsedRule.description).toBe('Augmente les dégâts de 15%');
  });

  test('Devrait utiliser un cache pour les règles appliquées', () => {
    const rules: TagRuleDefinition[] = [
      {
        tagName: 'CACHE_TAG',
        rules: [
          {
            id: 1,
            name: 'Cache Rule',
            description: 'Rule for cache',
            effectType: TagRuleEffectType.DAMAGE_MODIFIER,
            value: 5,
            isPercentage: false,
            targetType: TagRuleTargetType.SELF
          }
        ]
      }
    ];

    parser.loadRules(rules);

    const card: any = {
      instanceId: 'c1',
      cardDefinition: { id: 1, name: 'Test', type: 'personnage', rarity: 'banger', description: '', image: '', passive_effect: '', properties: { health: 10, attack: 1, defense: 1 }, is_wip: false, is_crap: false, summon_cost: 1 },
      activeTags: [],
      activeAlterations: [],
      availableSpells: [],
      currentHealth: 10,
      maxHealth: 10,
      isExhausted: false,
      isTapped: false,
      unableToAttack: false,
      counters: {},
      temporaryStats: { attack: 1, defense: 1 },
      damageHistory: [],
      activeEffects: {},
    };

    const gameState: any = { currentTurn: 1 };
    const spy = jest.spyOn(parser, 'getRulesForTag');

    parser.applyTagRules('CACHE_TAG', card, [card], gameState);
    parser.applyTagRules('CACHE_TAG', card, [card], gameState);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('Les règles sont triées par priorité lors du chargement', () => {
    const rules: TagRuleDefinition[] = [
      {
        tagName: 'SORT_TAG',
        rules: [
          {
            id: 1,
            name: 'Low',
            description: 'low',
            effectType: TagRuleEffectType.DAMAGE_MODIFIER,
            value: 1,
            isPercentage: false,
            targetType: TagRuleTargetType.SELF,
            priority: 1,
          },
          {
            id: 2,
            name: 'High',
            description: 'high',
            effectType: TagRuleEffectType.DAMAGE_MODIFIER,
            value: 2,
            isPercentage: false,
            targetType: TagRuleTargetType.SELF,
            priority: 5,
          },
        ],
      },
    ];

    parser.loadRules(rules);
    const loaded = parser.getRulesForTag('SORT_TAG');
    expect(loaded[0].id).toBe(2);
    expect(loaded[1].id).toBe(1);
  });
});
