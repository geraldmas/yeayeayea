import tagRulesConfig from '../config/tagRules.json';
import { 
  TagRule, 
  TagRuleEffectType, 
  TagRuleTargetType, 
  TagRuleConditionType, 
  TagRuleCondition,
  TagRuleApplicationResult,
  TagRuleDefinition
} from '../types/rules';
import { CardInstance } from '../types/combat';

/**
 * @file tagRuleParserService.ts
 * @description Service de parsing et d'application des règles de tags pour le jeu Yeayeayea
 * 
 * Ce service est responsable de l'interprétation et de l'application des règles qui définissent 
 * comment les tags interagissent entre eux et affectent les cartes en jeu. Il constitue
 * le cœur du système de synergies du jeu, permettant des interactions complexes entre
 * les différents éléments.
 * 
 * Les règles peuvent inclure :
 * - Modificateurs de génération de charisme
 * - Modificateurs de dégâts
 * - Modificateurs de motivation
 * - Modificateurs de santé
 * - Application d'altérations
 * - Effets de synergie conditionnels
 */

/**
 * Service responsable de parser et d'appliquer les règles de tags
 * Implémente un pattern Singleton pour assurer une instance unique dans l'application
 */
export class TagRuleParserService {
  /** Map stockant les règles par nom de tag */
  private rules: Map<string, TagRule[]> = new Map();
  
  /** Instance unique du service (pattern Singleton) */
  private static instance: TagRuleParserService;

  /**
   * Obtenir l'instance singleton du service
   * @returns L'instance unique du service TagRuleParserService
   */
  public static getInstance(): TagRuleParserService {
    if (!TagRuleParserService.instance) {
      TagRuleParserService.instance = new TagRuleParserService();
    }
    return TagRuleParserService.instance;
  }

  /**
   * Charge les règles à partir d'une définition JSON
   * @param definitions - Tableau de définitions de règles de tags
   */
  public loadRules(definitions: TagRuleDefinition[]): void {
    this.rules.clear(); // Clear existing rules before loading new ones
    for (const definition of definitions) {
      this.rules.set(definition.tagName, definition.rules);
    }
  }

  /**
   * Loads rules from a JSON file at the given path. In a browser context, the
   * file is fetched via HTTP. In a Node context, it falls back to using the `fs`
   * module.
   *
   * @param filePath - Path or URL to the JSON file containing TagRuleDefinition[]
   */
  public async loadRulesFromConfig(filePath: string): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const definitions: TagRuleDefinition[] = JSON.parse(rawData);
        this.loadRules(definitions);
      } else {
        const response = await fetch(filePath);
        const definitions: TagRuleDefinition[] = await response.json();
        this.loadRules(definitions);
      }
      console.log(`Successfully loaded tag rules from ${filePath}`);
    } catch (error) {
      console.error(`Error loading tag rules from ${filePath}:`, error);
    }
  }

  /**
   * Nettoie toutes les règles chargées
   * Utile pour réinitialiser l'état ou avant de charger un nouveau jeu de règles
   */
  public clearRules(): void {
    this.rules.clear();
  }

  /**
   * Récupère les règles pour un tag spécifique
   * @param tagName - Nom du tag dont on veut récupérer les règles
   * @returns Tableau des règles associées au tag (vide si aucune règle n'existe)
   */
  public getRulesForTag(tagName: string): TagRule[] {
    return this.rules.get(tagName) || [];
  }

  /**
   * Ajoute une nouvelle règle pour un tag
   * Si le tag n'existe pas encore, il sera créé avec la règle fournie
   * @param tagName - Nom du tag auquel ajouter la règle
   * @param rule - Règle à ajouter
   */
  public addRuleForTag(tagName: string, rule: TagRule): void {
    const existingRules = this.rules.get(tagName) || [];
    existingRules.push(rule);
    this.rules.set(tagName, existingRules);
  }

  /**
   * Modifie une règle existante pour un tag spécifique
   * @param tagName - Nom du tag contenant la règle à modifier
   * @param ruleId - Identifiant unique de la règle à modifier
   * @param updatedRule - Nouvelle version de la règle avec les modifications
   * @returns `true` si la règle a été trouvée et mise à jour, `false` sinon
   */
  public updateRule(tagName: string, ruleId: number, updatedRule: TagRule): boolean {
    const existingRules = this.rules.get(tagName) || [];
    const ruleIndex = existingRules.findIndex(rule => rule.id === ruleId);
    
    if (ruleIndex === -1) return false;
    
    existingRules[ruleIndex] = { ...updatedRule, id: ruleId };
    this.rules.set(tagName, existingRules);
    return true;
  }

  /**
   * Supprime une règle existante pour un tag spécifique
   * @param tagName - Nom du tag contenant la règle à supprimer
   * @param ruleId - Identifiant unique de la règle à supprimer
   * @returns `true` si la règle a été trouvée et supprimée, `false` sinon
   */
  public deleteRule(tagName: string, ruleId: number): boolean {
    const existingRules = this.rules.get(tagName) || [];
    const ruleIndex = existingRules.findIndex(rule => rule.id === ruleId);
    
    if (ruleIndex === -1) return false;
    
    existingRules.splice(ruleIndex, 1);
    this.rules.set(tagName, existingRules);
    return true;
  }

  /**
   * Applique toutes les règles associées à un tag spécifique
   * Cette méthode principale est appelée lorsqu'une carte portant ce tag est en jeu
   * et que ses effets doivent être appliqués
   * 
   * @param tagName - Nom du tag dont les règles doivent être appliquées
   * @param sourceCard - Carte qui possède le tag et qui est la source des effets
   * @param allCards - Tableau de toutes les cartes actuellement en jeu
   * @param gameState - État actuel du jeu contenant les informations nécessaires à l'évaluation des conditions
   * @returns Tableau des résultats d'application de chaque règle du tag
   */
  public applyTagRules(
    tagName: string, 
    sourceCard: CardInstance, 
    allCards: CardInstance[], 
    gameState: any
  ): TagRuleApplicationResult[] {
    const rules = this.getRulesForTag(tagName);
    const results: TagRuleApplicationResult[] = [];

    // Trier les règles par priorité
    const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of sortedRules) {
      try {
        const result = this.applySingleRule(rule, tagName, sourceCard, allCards, gameState);
        results.push(result);
      } catch (error) {
        console.error(`Erreur lors de l'application de la règle ${rule.name}:`, error);
        results.push({
          success: false,
          sourceTag: tagName,
          affectedEntities: [],
          effectDescription: rule.description,
          originalValue: 0,
          newValue: 0,
          failureReason: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return results;
  }

  /**
   * Applique une règle spécifique à une carte source et ses cibles potentielles
   * Cette méthode est le cœur de l'application des règles et dispatche vers les méthodes
   * spécialisées selon le type d'effet (dégâts, charisme, altérations, etc.)
   * 
   * @param rule - Règle à appliquer
   * @param tagName - Nom du tag source de la règle
   * @param sourceCard - Carte qui possède le tag et déclenche l'effet
   * @param allCards - Toutes les cartes actuellement en jeu
   * @param gameState - État du jeu contenant les informations contextuelles
   * @returns Résultat détaillé de l'application de la règle, incluant les entités affectées et les valeurs modifiées
   * @private
   */
  private applySingleRule(
    rule: TagRule, 
    tagName: string, 
    sourceCard: CardInstance, 
    allCards: CardInstance[], 
    gameState: any
  ): TagRuleApplicationResult {
    // Obtenir les cibles de la règle
    const targets = this.getTargetsForRule(rule, sourceCard, allCards);
    
    // Vérifier si la condition est remplie
    if (rule.condition && !this.checkCondition(rule.condition, sourceCard, targets, gameState)) {
      return {
        success: false,
        sourceTag: tagName,
        affectedEntities: [],
        effectDescription: rule.description,
        originalValue: 0,
        newValue: 0,
        failureReason: 'Condition non remplie'
      };
    }

    // Appliquer l'effet selon son type
    const result: TagRuleApplicationResult = {
      success: true,
      sourceTag: tagName,
      affectedEntities: targets.map(card => card.instanceId),
      effectDescription: rule.description,
      originalValue: 0,
      newValue: 0
    };

    switch (rule.effectType) {
      case TagRuleEffectType.CHARISME_GENERATION:
        return this.applyCharismeGenerationEffect(rule, sourceCard, targets, result, gameState);
      
      case TagRuleEffectType.DAMAGE_MODIFIER:
        return this.applyDamageModifierEffect(rule, sourceCard, targets, result, gameState);
      
      case TagRuleEffectType.MOTIVATION_MODIFIER:
        return this.applyMotivationModifierEffect(rule, sourceCard, targets, result, gameState);
      
      case TagRuleEffectType.HEALTH_MODIFIER:
        return this.applyHealthModifierEffect(rule, sourceCard, targets, result, gameState);
      
      case TagRuleEffectType.APPLY_ALTERATION:
        return this.applyAlterationEffect(rule, sourceCard, targets, result, gameState);
      
      case TagRuleEffectType.CONDITIONAL_EFFECT:
        // Cette logique est déjà gérée par la vérification de condition plus haut
        result.success = true;
        return result;
      
      case TagRuleEffectType.SYNERGY_EFFECT:
        return this.applySynergyEffect(rule, sourceCard, targets, result, allCards, gameState);
      
      // --- Add new effect types here ---
      case TagRuleEffectType.ATTACK_MODIFIER:
        return this.applyAttackModifierEffect(rule, sourceCard, targets, result, gameState);

      case TagRuleEffectType.DEFENSE_MODIFIER:
        return this.applyDefenseModifierEffect(rule, sourceCard, targets, result, gameState);
      // --- End new effect types ---
      
      default:
        result.success = false;
        result.failureReason = `Type d'effet non supporté: ${rule.effectType}`;
        return result;
    }
  }

  /**
   * Détermine les cartes ciblées par une règle en fonction de son type de ciblage
   * Les types de ciblage incluent : soi-même, l'adversaire, tous, les cartes avec un tag spécifique, etc.
   * 
   * @param rule - Règle dont on veut déterminer les cibles
   * @param sourceCard - Carte source qui possède le tag déclenchant la règle
   * @param allCards - Toutes les cartes actuellement en jeu
   * @returns Tableau des instances de carte ciblées par la règle
   * @private
   */
  private getTargetsForRule(rule: TagRule, sourceCard: CardInstance, allCards: CardInstance[]): CardInstance[] {
    switch (rule.targetType) {
      case TagRuleTargetType.SELF:
        return [sourceCard];
      
      case TagRuleTargetType.ALL:
        return allCards;
      
      case TagRuleTargetType.TAGGED:
        if (!rule.targetTag) {
          throw new Error('Tag cible non spécifié pour le type de cible TAGGED');
        }
        return allCards.filter(card => 
          card.activeTags.some(tagInstance => tagInstance.tag.name === rule.targetTag)
        );
      
      case TagRuleTargetType.OPPONENT:
        // Logique simplifiée - à adapter selon la structure réelle du jeu
        return allCards.filter(card => 
          card.instanceId !== sourceCard.instanceId && 
          !this.isInSameTeam(card, sourceCard)
        );
      
      case TagRuleTargetType.OWN_TEAM:
        return allCards.filter(card => this.isInSameTeam(card, sourceCard));
      
      case TagRuleTargetType.OPPONENT_TEAM:
        return allCards.filter(card => !this.isInSameTeam(card, sourceCard));
      
      default:
        throw new Error(`Type de cible non supporté: ${rule.targetType}`);
    }
  }

  /**
   * Vérifie si une condition est remplie
   * @param condition Condition à vérifier
   * @param sourceCard Carte source
   * @param targets Cartes cibles
   * @param gameState État du jeu
   * @returns Booléen indiquant si la condition est remplie
   */
  private checkCondition(
    condition: TagRuleCondition, 
    sourceCard: CardInstance, 
    targets: CardInstance[],
    gameState: any
  ): boolean {
    switch (condition.type) {
      case TagRuleConditionType.HAS_TAG:
        if (!condition.tagName) {
          return false;
        }
        return targets.some(card => 
          card.activeTags.some(tagInstance => tagInstance.tag.name === condition.tagName)
        );
      
      case TagRuleConditionType.HAS_ALTERATION:
        if (!condition.alterationId) {
          return false;
        }
        return targets.some(card => 
          card.activeAlterations.some(alt => alt.alteration.id === condition.alterationId)
        );
      
      case TagRuleConditionType.HEALTH_PERCENTAGE:
        if (targets.length === 0) {
          return false;
        }
        
        // Vérifier le pourcentage de santé pour chaque cible
        const healthPercentageValue = Number(condition.value);
        const healthComparison = condition.comparison || 'equal';
        
        return targets.some(card => {
          const healthPercentage = (card.currentHealth / card.maxHealth) * 100;
          return this.compareValues(healthPercentage, healthPercentageValue, healthComparison);
        });
      
      case TagRuleConditionType.CHARISME_AMOUNT:
        // Ici on doit vérifier le charisme du joueur - à adapter selon l'implémentation
        const charismeValue = Number(condition.value);
        const charismeComparison = condition.comparison || 'equal';
        const charisme = gameState.players.find((p: any) => 
          p.cards.some((c: any) => c.instanceId === sourceCard.instanceId)
        )?.charisme || 0;
        
        return this.compareValues(charisme, charismeValue, charismeComparison);
      
      case TagRuleConditionType.MOTIVATION_AMOUNT:
        // Similaire à CHARISME_AMOUNT
        const motivationValue = Number(condition.value);
        const motivationComparison = condition.comparison || 'equal';
        const motivation = gameState.players.find((p: any) => 
          p.cards.some((c: any) => c.instanceId === sourceCard.instanceId)
        )?.motivation || 0;
        
        return this.compareValues(motivation, motivationValue, motivationComparison);
      
      case TagRuleConditionType.ACTIVE_LIEU:
        if (!condition.lieuName) {
          return false;
        }
        
        // Vérifier si le lieu actif correspond
        return gameState.activeLieuCard?.cardDefinition.name === condition.lieuName;
      
      case TagRuleConditionType.CHANCE:
        // Effet basé sur une probabilité
        const chanceValue = Number(condition.value);
        return Math.random() * 100 < chanceValue;
      
      default:
        console.warn(`Type de condition non supporté: ${condition.type}`);
        return false;
    }
  }

  /**
   * Compare deux valeurs selon un opérateur de comparaison
   * @param a Première valeur
   * @param b Seconde valeur
   * @param operator Opérateur de comparaison
   * @returns Résultat de la comparaison
   */
  private compareValues(a: number, b: number, operator: string): boolean {
    switch (operator) {
      case 'equal': return a === b;
      case 'notEqual': return a !== b;
      case 'greater': return a > b;
      case 'less': return a < b;
      case 'greaterOrEqual': return a >= b;
      case 'lessOrEqual': return a <= b;
      default: return false;
    }
  }

  /**
   * Vérifie si deux cartes sont dans la même équipe
   * @param card1 Première carte
   * @param card2 Seconde carte
   * @returns Booléen indiquant si les cartes sont dans la même équipe
   */
  private isInSameTeam(card1: CardInstance, card2: CardInstance): boolean {
    // À adapter selon la structure réelle du jeu
    // Par exemple, on pourrait comparer l'appartenance au joueur
    return card1.instanceId.split('_')[0] === card2.instanceId.split('_')[0]; // Simplified team check
  }

  /**
   * Applique un effet de modification de la statistique d'attaque.
   */
  private applyAttackModifierEffect(
    rule: TagRule,
    sourceCard: CardInstance,
    targets: CardInstance[],
    result: TagRuleApplicationResult,
    gameState: any
  ): TagRuleApplicationResult {
    for (const target of targets) {
      if (!target.temporaryStats) { // Should be initialized by CardInstanceImpl
        target.temporaryStats = { attack: 0, defense: 0 }; // Fallback, though ideally already set
      }
      
      const originalAttack = target.temporaryStats.attack;
      if (targets.indexOf(target) === 0) { // Capture original value from the first target
        result.originalValue = originalAttack;
      }

      let modification = 0;
      if (rule.isPercentage) {
        // Percentage based on the card's base attack from definition, not current temporary attack to avoid compounding issues
        const baseAttack = (target.cardDefinition.properties as any).attack || 0; 
        modification = Math.floor(baseAttack * (rule.value / 100));
      } else {
        modification = rule.value;
      }
      target.temporaryStats.attack += modification;
      
      if (targets.indexOf(target) === 0) { // Capture new value from the first target
        result.newValue = target.temporaryStats.attack;
      }

      // Optional: record the specific effect application on the target if needed for complex scenarios or UI
      if (!target.activeEffects) target.activeEffects = {};
      if (!target.activeEffects.attackModifier) target.activeEffects.attackModifier = [];
      target.activeEffects.attackModifier.push({
        value: rule.value, // Could store `modification` if more granular tracking is needed
        source: `Tag: ${result.sourceTag} (Rule: ${rule.name})`,
        isPercentage: rule.isPercentage,
      });
    }
    result.success = true;
    return result;
  }

  /**
   * Applique un effet de modification de la statistique de défense.
   */
  private applyDefenseModifierEffect(
    rule: TagRule,
    sourceCard: CardInstance,
    targets: CardInstance[],
    result: TagRuleApplicationResult,
    gameState: any
  ): TagRuleApplicationResult {
    for (const target of targets) {
      if (!target.temporaryStats) {
        target.temporaryStats = { attack: 0, defense: 0 };
      }

      const originalDefense = target.temporaryStats.defense;
      if (targets.indexOf(target) === 0) {
        result.originalValue = originalDefense;
      }

      let modification = 0;
      if (rule.isPercentage) {
        const baseDefense = (target.cardDefinition.properties as any).defense || 0;
        modification = Math.floor(baseDefense * (rule.value / 100));
      } else {
        modification = rule.value;
      }
      target.temporaryStats.defense += modification;

      if (targets.indexOf(target) === 0) {
        result.newValue = target.temporaryStats.defense;
      }

      if (!target.activeEffects) target.activeEffects = {};
      if (!target.activeEffects.defenseModifier) target.activeEffects.defenseModifier = [];
      target.activeEffects.defenseModifier.push({
        value: rule.value,
        source: `Tag: ${result.sourceTag} (Rule: ${rule.name})`,
        isPercentage: rule.isPercentage,
      });
    }
    result.success = true;
    return result;
  }

  /**
   * Applique un effet de modification de génération de charisme
   */
  private applyCharismeGenerationEffect(
    rule: TagRule,
    sourceCard: CardInstance,
    targets: CardInstance[],
    result: TagRuleApplicationResult,
    gameState: any
  ): TagRuleApplicationResult {
    // Pour simplifier, on va supposer que l'effet modifie une propriété du gameState
    const player = gameState.players.find((p: any) => 
      p.cards.some((c: any) => c.instanceId === sourceCard.instanceId)
    );
    
    if (!player) {
      result.success = false;
      result.failureReason = 'Joueur non trouvé';
      return result;
    }
    
    result.originalValue = player.charismeGenerationModifier || 1.0;
    
    if (rule.isPercentage) {
      // La valeur est un pourcentage (ex: +10%)
      const modifier = rule.value / 100;
      player.charismeGenerationModifier = result.originalValue * (1 + modifier);
    } else {
      // La valeur est absolue
      player.charismeGenerationModifier = result.originalValue + rule.value;
    }
    
    result.newValue = player.charismeGenerationModifier;
    result.success = true;
    return result;
  }

  /**
   * Applique un effet de modification de dégâts
   */
  private applyDamageModifierEffect(
    rule: TagRule,
    sourceCard: CardInstance,
    targets: CardInstance[],
    result: TagRuleApplicationResult,
    gameState: any
  ): TagRuleApplicationResult {
    for (const target of targets) {
      // On modifie la stat temporaire de defense ou d'attaque
      if (!target.temporaryStats) {
        target.temporaryStats = { attack: 0, defense: 0 };
      }
      
      // On stocke la valeur originale d'une des cibles
      if (targets.indexOf(target) === 0) {
        result.originalValue = target.temporaryStats.attack || 0;
      }
      
      if (rule.isPercentage) {
        // La valeur est un pourcentage
        const modifier = rule.value / 100;
        target.temporaryStats.attack += target.temporaryStats.attack * modifier;
      } else {
        // La valeur est absolue
        target.temporaryStats.attack += rule.value;
      }
      
      // Ajouter l'effet actif pour le tracking
      if (!target.activeEffects) {
        target.activeEffects = {};
      }
      
      if (!target.activeEffects.damageModifier) {
        target.activeEffects.damageModifier = [];
      }
      
      target.activeEffects.damageModifier.push({
        value: rule.value,
        source: `Tag: ${result.sourceTag}`,
        isPercentage: rule.isPercentage
      });
    }
    
    if (targets.length > 0) {
      result.newValue = targets[0].temporaryStats.attack;
    }
    
    result.success = true;
    return result;
  }

  /**
   * Applique un effet de modification de motivation
   */
  private applyMotivationModifierEffect(
    rule: TagRule,
    sourceCard: CardInstance,
    targets: CardInstance[],
    result: TagRuleApplicationResult,
    gameState: any
  ): TagRuleApplicationResult {
    // Pour simplifier, on va supposer que l'effet modifie une propriété du gameState
    const player = gameState.players.find((p: any) => 
      p.cards.some((c: any) => c.instanceId === sourceCard.instanceId)
    );
    
    if (!player) {
      result.success = false;
      result.failureReason = 'Joueur non trouvé';
      return result;
    }
    
    result.originalValue = player.motivationModifier || 1.0;
    
    if (rule.isPercentage) {
      // La valeur est un pourcentage (ex: +10%)
      const modifier = rule.value / 100;
      player.motivationModifier = result.originalValue * (1 + modifier);
    } else {
      // La valeur est absolue
      player.motivationModifier = result.originalValue + rule.value;
    }
    
    result.newValue = player.motivationModifier;
    result.success = true;
    return result;
  }

  /**
   * Applique un effet de modification de santé
   */
  private applyHealthModifierEffect(
    rule: TagRule,
    sourceCard: CardInstance,
    targets: CardInstance[],
    result: TagRuleApplicationResult,
    gameState: any
  ): TagRuleApplicationResult {
    for (const target of targets) {
      // On stocke la valeur originale d'une des cibles
      if (targets.indexOf(target) === 0) {
        result.originalValue = target.maxHealth;
      }
      
      if (rule.isPercentage) {
        // La valeur est un pourcentage
        const modifier = rule.value / 100;
        const healthIncrease = Math.floor(target.maxHealth * modifier);
        target.maxHealth += healthIncrease;
        target.currentHealth += healthIncrease;
      } else {
        // La valeur est absolue
        target.maxHealth += rule.value;
        target.currentHealth += rule.value;
      }
      
      // Empêcher les PV de dépasser le maximum
      target.currentHealth = Math.min(target.currentHealth, target.maxHealth);
      
      // Ajouter l'effet actif pour le tracking
      if (!target.activeEffects) {
        target.activeEffects = {};
      }
      
      if (!target.activeEffects.healthModifier) {
        target.activeEffects.healthModifier = [];
      }
      
      target.activeEffects.healthModifier.push({
        value: rule.value,
        source: `Tag: ${result.sourceTag}`,
        isPercentage: rule.isPercentage
      });
    }
    
    if (targets.length > 0) {
      result.newValue = targets[0].maxHealth;
    }
    
    result.success = true;
    return result;
  }

  /**
   * Applique un effet d'ajout d'altération
   */
  private applyAlterationEffect(
    rule: TagRule,
    sourceCard: CardInstance,
    targets: CardInstance[],
    result: TagRuleApplicationResult,
    gameState: any
  ): TagRuleApplicationResult {
    if (!rule.alterationId) {
      result.success = false;
      result.failureReason = 'ID d\'altération non spécifié';
      return result;
    }
    
    // Trouver l'altération dans le gameState
    const alteration = gameState.alterations.find((a: any) => a.id === rule.alterationId);
    
    if (!alteration) {
      result.success = false;
      result.failureReason = `Altération avec ID ${rule.alterationId} non trouvée`;
      return result;
    }
    
    let appliedCount = 0;
    for (const target of targets) {
      try {
        target.addAlteration(alteration, sourceCard);
        appliedCount++;
      } catch (error) {
        console.warn(`Impossible d'appliquer l'altération à ${target.instanceId}:`, error);
      }
    }
    
    result.originalValue = 0;
    result.newValue = appliedCount;
    result.success = appliedCount > 0;
    
    if (!result.success) {
      result.failureReason = 'Aucune altération appliquée avec succès';
    }
    
    return result;
  }

  /**
   * Applique un effet de synergie
   */
  private applySynergyEffect(
    rule: TagRule,
    sourceCard: CardInstance,
    targets: CardInstance[],
    result: TagRuleApplicationResult,
    allCards: CardInstance[],
    gameState: any
  ): TagRuleApplicationResult {
    if (!rule.synergyTags || rule.synergyTags.length === 0) {
      result.success = false;
      result.failureReason = 'Aucun tag de synergie spécifié';
      return result;
    }
    
    // Compte le nombre de tags de synergie présents
    const synergiesCount = this.countSynergies(rule.synergyTags, allCards);
    
    // Si aucune synergie n'est active, on ne fait rien
    if (synergiesCount === 0) {
      result.success = false;
      result.failureReason = 'Aucune synergie active';
      return result;
    }
    
    // L'effet est multiplié par le nombre de synergies
    const multiplier = rule.isPercentage ? (rule.value / 100) * synergiesCount : rule.value * synergiesCount;
    
    // Appliquer un effet de base (par exemple, augmentation de dégâts)
    // Ceci est simplifié et doit être adapté selon la logique spécifique du jeu
    for (const target of targets) {
      if (!target.temporaryStats) {
        target.temporaryStats = { attack: 0, defense: 0 };
      }
      
      if (targets.indexOf(target) === 0) {
        result.originalValue = target.temporaryStats.attack;
      }
      
      target.temporaryStats.attack += multiplier;
      
      // Ajouter l'effet actif pour le tracking
      if (!target.activeEffects) {
        target.activeEffects = {};
      }
      
      if (!target.activeEffects.synergyEffect) {
        target.activeEffects.synergyEffect = [];
      }
      
      target.activeEffects.synergyEffect.push({
        value: multiplier,
        source: `Synergie: ${result.sourceTag} avec ${rule.synergyTags.join(', ')}`,
        isPercentage: false
      });
    }
    
    if (targets.length > 0) {
      result.newValue = targets[0].temporaryStats.attack;
    }
    
    result.success = true;
    return result;
  }

  /**
   * Compte le nombre d'instances de cartes possédant les tags de synergie spécifiés
   * Utilisé pour calculer la puissance des effets de synergie qui dépendent du nombre de tags présents
   * 
   * @param synergyTags - Tableau des noms de tags à rechercher dans les cartes
   * @param allCards - Toutes les cartes actuellement en jeu
   * @returns Le nombre total d'instances de tags trouvées
   * @private
   */
  private countSynergies(synergyTags: string[], allCards: CardInstance[]): number {
    let count = 0;
    
    for (const tag of synergyTags) {
      // Compter le nombre de cartes ayant ce tag
      const cardsWithTag = allCards.filter(card => 
        card.activeTags.some(tagInstance => tagInstance.tag.name === tag)
      );
      
      count += cardsWithTag.length;
    }
    
    return count;
  }

  /**
   * Parse une règle définie en format textuel et la convertit en objet TagRule
   * Cette méthode est cruciale pour la définition de règles en texte par les concepteurs du jeu
   * 
   * Format: "TypeEffet:TypeCible:Valeur:Description[:Condition]"
   * Exemples:
   * - "damageModifier:tagged(#NUIT):+20%:Augmente les dégâts de 20% sur les cibles ayant le tag #NUIT"
   * - "charismeGeneration:self:+10%:Augmente la génération de charisme de 10%"
   * - "healthModifier:self:+5:Augmente les PV de 5:IF(healthPercentage,less,50)"
   * 
   * @param ruleText - Texte de la règle à parser au format spécifié
   * @returns Un objet TagRule structuré ou null si le parsing a échoué
   */
  public parseRuleFromText(ruleText: string): TagRule | null {
    try {
      // Format simple: "Type:Cible:Valeur:Description"
      // Exemple: "damageModifier:tagged(#NUIT):+20%:Augmente les dégâts de 20% sur les cibles ayant le tag #NUIT"
      const parts = ruleText.split(':');
      
      if (parts.length < 4) {
        console.error('Format de règle invalide, au moins 4 parties attendues');
        return null;
      }
      
      // Parser le type d'effet
      const effectTypeStr = parts[0].trim();
      const effectType = Object.values(TagRuleEffectType).find(type => type === effectTypeStr);
      
      if (!effectType) {
        console.error(`Type d'effet invalide: ${effectTypeStr}`);
        return null;
      }
      
      // Parser la cible
      const targetStr = parts[1].trim();
      let targetType: TagRuleTargetType | undefined;
      let targetTag: string | undefined;
      
      // Expression régulière pour capturer "tagged(TAG)"
      const taggedRegex = /^tagged\((.+)\)$/;
      const taggedMatch = targetStr.match(taggedRegex);
      
      if (taggedMatch) {
        targetType = TagRuleTargetType.TAGGED;
        targetTag = taggedMatch[1]; // Capture le contenu entre parenthèses
      } else {
        targetType = Object.values(TagRuleTargetType).find(type => type === targetStr);
      }
      
      if (!targetType) {
        console.error(`Type de cible invalide: ${targetStr}`);
        return null;
      }
      
      // Parser la valeur
      const valueStr = parts[2].trim();
      let value: number;
      let isPercentage = false;
      
      if (valueStr.endsWith('%')) {
        isPercentage = true;
        value = parseFloat(valueStr.slice(0, -1));
      } else {
        value = parseFloat(valueStr);
      }
      
      if (isNaN(value)) {
        console.error(`Valeur invalide: ${valueStr}`);
        return null;
      }
      
      // Description
      const description = parts[3].trim();
      
      // Créer la règle
      const rule: TagRule = {
        name: `Règle ${effectType} sur ${targetType}`,
        description,
        effectType,
        value,
        isPercentage,
        targetType,
        targetTag
      };
      
      // Parser d'éventuelles conditions ou synergies (si présentes)
      if (parts.length > 4) {
        const conditionStr = parts[4].trim();
        
        // Nouvelle regex pour capturer IF(type,comparison,value)
        const conditionRegex = /^IF\(([^,]+),([^,]+),(.+)\)$/;
        const conditionMatch = conditionStr.match(conditionRegex);
        
        if (conditionMatch) {
          const [, conditionType, comparison, value] = conditionMatch;
          
          // Rechercher le type de condition correspondant
          const conditionTypeEnum = Object.values(TagRuleConditionType).find(type => type === conditionType.trim());
          
          if (conditionTypeEnum) {
            rule.condition = {
              type: conditionTypeEnum,
              comparison: comparison.trim() as 'equal' | 'notEqual' | 'greater' | 'less' | 'greaterOrEqual' | 'lessOrEqual',
              value: value.trim()
            };
            
            // Ajouter des propriétés spécifiques selon le type de condition
            switch (conditionTypeEnum) {
              case TagRuleConditionType.HAS_TAG:
                rule.condition.tagName = value.trim();
                break;
              case TagRuleConditionType.HAS_ALTERATION:
                rule.condition.alterationId = parseInt(value.trim());
                break;
              case TagRuleConditionType.ACTIVE_LIEU:
                rule.condition.lieuName = value.trim();
                break;
            }
          } else {
            console.error(`Type de condition invalide: ${conditionType}`);
          }
        } else if (conditionStr.startsWith('IF:')) {
          // Ancien format pour la rétrocompatibilité
          const conditionData = conditionStr.slice(3);
          rule.condition = this.parseConditionFromText(conditionData);
        } else if (conditionStr.startsWith('SYNERGY:')) {
          rule.synergyTags = conditionStr.slice(8).split(',').map(tag => tag.trim());
        }
      }
      
      return rule;
    } catch (error) {
      console.error('Erreur lors du parsing de la règle:', error);
      return null;
    }
  }

  /**
   * Parse une condition à partir d'un texte et la convertit en objet TagRuleCondition
   * Cette méthode est utilisée pour analyser les conditions qui déterminent quand une règle s'applique
   * 
   * Format: "type:comparison:value[:args]"
   * Exemples:
   * - "healthPercentage:less:50" - S'applique si les PV sont inférieurs à 50%
   * - "hasTag:equal:NUIT" - S'applique si la carte a le tag NUIT
   * - "chance:greater:75" - S'applique avec 75% de chance
   * 
   * @param conditionText - Texte de la condition à parser
   * @returns Un objet TagRuleCondition structuré ou undefined si le parsing a échoué
   * @private
   */
  private parseConditionFromText(conditionText: string): TagRuleCondition | undefined {
    try {
      // Format: "Type:Comparaison:Valeur"
      // Exemple: "HEALTH_PERCENTAGE:less:50" (PV < 50%)
      const parts = conditionText.split(':');
      
      if (parts.length < 3) {
        console.error('Format de condition invalide');
        return undefined;
      }
      
      const typeStr = parts[0].trim();
      const conditionType = Object.values(TagRuleConditionType).find(type => type === typeStr);
      
      if (!conditionType) {
        console.error(`Type de condition invalide: ${typeStr}`);
        return undefined;
      }
      
      const comparison = parts[1].trim() as 'equal' | 'notEqual' | 'greater' | 'less' | 'greaterOrEqual' | 'lessOrEqual';
      const value = parts[2].trim();
      
      const condition: TagRuleCondition = {
        type: conditionType,
        comparison,
        value
      };
      
      // Ajouter des propriétés spécifiques selon le type de condition
      switch (conditionType) {
        case TagRuleConditionType.HAS_TAG:
          condition.tagName = value;
          break;
        case TagRuleConditionType.HAS_ALTERATION:
          condition.alterationId = parseInt(value);
          break;
        case TagRuleConditionType.ACTIVE_LIEU:
          condition.lieuName = value;
          break;
      }
      
      return condition;
    } catch (error) {
      console.error('Erreur lors du parsing de la condition:', error);
      return undefined;
    }
  }
}

// Export de l'instance pour un accès facile et chargement automatique des règles
const tagRuleParser = TagRuleParserService.getInstance();
tagRuleParser.loadRules(tagRulesConfig as TagRuleDefinition[]);

export { tagRuleParser }; // Export the initialized instance