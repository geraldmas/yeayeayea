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
}); 