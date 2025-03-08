import { v4 as uuidv4 } from 'uuid';
import { Card, Alteration, Tag, Spell } from '../types/index';
import { 
  CardInstance, 
  ActiveAlteration, 
  TagInstance, 
  SpellInstance, 
  TargetType, 
  CombatManager,
  LieuDistributionConfig,
  LieuDistributionResult
} from '../types/combat';
import { CardConversionService } from './cardConversionService';
import { LieuCardService } from './lieuCardService';
import { ActionResolutionService, ActionType } from './actionResolutionService';

/**
 * Implémentation de l'interface CardInstance
 */
export class CardInstanceImpl implements CardInstance {
  public instanceId: string;
  public cardDefinition: Card;
  public currentHealth: number;
  public maxHealth: number;
  public position?: { x: number; y: number };
  public activeAlterations: ActiveAlteration[];
  public activeTags: TagInstance[];
  public availableSpells: SpellInstance[];
  public isExhausted: boolean;
  public isTapped: boolean;
  public counters: { [key: string]: number };
  public temporaryStats: { 
    attack: number;
    defense: number;
    [key: string]: number;
  };
  public damageHistory: Array<{ type: 'damage' | 'heal', amount: number, source?: string, timestamp: number }>;
  public activeEffects: { [key: string]: Array<{ value: number, source: string, isPercentage: boolean }> };

  constructor(card: Card) {
    this.instanceId = uuidv4();
    this.cardDefinition = card;
    
    // Initialiser les valeurs de santé
    this.maxHealth = card.properties.health || 0;
    this.currentHealth = this.maxHealth;
    
    // Initialiser les listes
    this.activeAlterations = [];
    this.activeTags = [];
    this.availableSpells = [];
    
    // Initialiser les états
    this.isExhausted = false;
    this.isTapped = false;
    
    // Initialiser les compteurs
    this.counters = {};
    
    // Initialiser les statistiques temporaires
    this.temporaryStats = {
      attack: card.properties.attack || 0,
      defense: card.properties.defense || 0
    };
    
    // Initialiser l'historique des dégâts
    this.damageHistory = [];
    
    // Initialiser les effets actifs
    this.activeEffects = {};
  }

  // Méthodes pour manipuler l'état
  public applyDamage(amount: number, source?: string): void {
    // Appliquer les modificateurs de dégâts des altérations
    const modifiedAmount = this.applyDamageModifiers(amount);
    
    this.currentHealth = Math.max(0, this.currentHealth - modifiedAmount);
    
    // Enregistrer dans l'historique
    this.damageHistory.push({
      type: 'damage',
      amount: modifiedAmount,
      source,
      timestamp: Date.now()
    });
    
    // Déclencher des effets éventuels liés aux dégâts
    this.triggerOnDamageEffects(modifiedAmount);
  }

  public heal(amount: number, source?: string): void {
    // Appliquer les modificateurs de soin des altérations
    const modifiedAmount = this.applyHealModifiers(amount);
    
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + modifiedAmount);
    
    // Enregistrer dans l'historique
    this.damageHistory.push({
      type: 'heal',
      amount: modifiedAmount,
      source,
      timestamp: Date.now()
    });
    
    // Déclencher des effets éventuels liés aux soins
    this.triggerOnHealEffects(modifiedAmount);
  }

  public addAlteration(alteration: Alteration, source: CardInstance): void {
    // Vérifier si l'altération existe déjà
    const existingAlteration = this.activeAlterations.find(
      a => a.alteration.id === alteration.id
    );

    if (existingAlteration && alteration.stackable) {
      // Incrémenter le compteur si l'altération est empilable
      existingAlteration.stackCount += 1;
      // Réinitialiser la durée
      existingAlteration.remainingDuration = alteration.duration || null;
    } else if (!existingAlteration) {
      // Ajouter une nouvelle altération
      this.activeAlterations.push({
        alteration,
        remainingDuration: alteration.duration || null,
        stackCount: 1,
        source
      });
    }
    
    // Recalculer les statistiques temporaires
    this.recalculateTemporaryStats();
  }

  public removeAlteration(alterationId: number): void {
    this.activeAlterations = this.activeAlterations.filter(
      a => a.alteration.id !== alterationId
    );
    
    // Recalculer les statistiques temporaires
    this.recalculateTemporaryStats();
  }

  public addTag(tag: Tag, isTemporary: boolean = false, duration?: number): void {
    // Vérifier si le tag existe déjà
    const existingTag = this.activeTags.find(t => t.tag.id === tag.id);
    
    if (!existingTag) {
      this.activeTags.push({
        tag,
        isTemporary,
        remainingDuration: duration
      });
      
      // Recalculer les statistiques temporaires si nécessaire
      if (tag.passive_effect) {
        this.recalculateTemporaryStats();
      }
    }
  }

  public removeTag(tagId: number): void {
    const removedTag = this.activeTags.find(t => t.tag.id === tagId);
    this.activeTags = this.activeTags.filter(t => t.tag.id !== tagId);
    
    // Recalculer les statistiques temporaires si nécessaire
    if (removedTag && removedTag.tag.passive_effect) {
      this.recalculateTemporaryStats();
    }
  }

  // Méthodes pour vérifier l'état
  public hasTag(tagId: number): boolean {
    return this.activeTags.some(t => t.tag.id === tagId);
  }

  public hasAlteration(alterationId: number): boolean {
    return this.activeAlterations.some(a => a.alteration.id === alterationId);
  }

  public canUseSpell(spellId: number): boolean {
    const spell = this.availableSpells.find(s => s.spell.id === spellId);
    return spell ? spell.isAvailable && spell.cooldown === 0 : false;
  }

  public canAttack(): boolean {
    return !this.isExhausted && !this.isTapped && this.currentHealth > 0;
  }

  /**
   * Applique les effets des altérations actives (comme les dégâts sur la durée)
   */
  public applyAlterationEffects(): void {
    this.activeAlterations.forEach(alteration => {
      const effect = alteration.alteration.effect;
      
      if (effect.action === 'damage_over_time' && effect.value) {
        const damage = effect.value * alteration.stackCount;
        this.applyDamage(damage, `Altération: ${alteration.alteration.name}`);
      } else if (effect.action === 'heal_over_time' && effect.value) {
        const heal = effect.value * alteration.stackCount;
        this.heal(heal, `Altération: ${alteration.alteration.name}`);
      }
      // Appliquer d'autres types d'effets périodiques ici
    });
  }

  public resetForNextTurn(): void {
    // Réinitialiser l'état d'épuisement
    this.isExhausted = false;
    this.isTapped = false;
    
    // Réduire la durée des altérations et supprimer celles expirées
    const alterationsBeforeUpdate = [...this.activeAlterations];
    
    this.activeAlterations = this.activeAlterations
      .map(alteration => {
        if (alteration.remainingDuration !== null && alteration.remainingDuration > 0) {
          alteration.remainingDuration -= 1;
        }
        return alteration;
      })
      .filter(alteration => 
        alteration.remainingDuration === null || alteration.remainingDuration > 0
      );
    
    // Réduire la durée des tags temporaires et supprimer ceux expirés
    const tagsBeforeUpdate = [...this.activeTags];
    
    this.activeTags = this.activeTags
      .filter(tag => {
        if (!tag.isTemporary) return true;
        if (tag.remainingDuration === undefined) return true;
        
        tag.remainingDuration -= 1;
        return tag.remainingDuration > 0;
      });
    
    // Réduire le cooldown des sorts
    this.availableSpells = this.availableSpells.map(spell => {
      if (spell.cooldown > 0) {
        spell.cooldown -= 1;
      }
      spell.isAvailable = spell.cooldown === 0;
      return spell;
    });
    
    // Recalculer les statistiques si des altérations ou tags ont été modifiés
    if (
      alterationsBeforeUpdate.length !== this.activeAlterations.length ||
      tagsBeforeUpdate.length !== this.activeTags.length
    ) {
      this.recalculateTemporaryStats();
    }
  }
  
  /**
   * Recalcule toutes les statistiques temporaires en fonction des altérations actives
   */
  public recalculateTemporaryStats(): void {
    // Réinitialiser les statistiques aux valeurs de base
    this.temporaryStats = {
      attack: this.cardDefinition.properties.attack || 0,
      defense: this.cardDefinition.properties.defense || 0
    };
    
    // Réinitialiser les effets actifs
    this.activeEffects = {};
    
    // Appliquer les effets des altérations
    this.activeAlterations.forEach(alteration => {
      const effect = alteration.alteration.effect;
      
      if (effect.action === 'modify_attack' && effect.value !== undefined) {
        this.applyStatModifier('attack', effect.value, alteration.stackCount, alteration.alteration.name);
      } else if (effect.action === 'modify_defense' && effect.value !== undefined) {
        this.applyStatModifier('defense', effect.value, alteration.stackCount, alteration.alteration.name);
      }
      
      // Gérer d'autres types de modifications de statistiques
    });
    
    // Appliquer les effets passifs des tags
    this.activeTags.forEach(tagInstance => {
      // Ici, on pourrait parser l'effet passif du tag et l'appliquer
      // Pour l'instant, c'est une implémentation simplifiée
      if (tagInstance.tag.passive_effect && tagInstance.tag.passive_effect.includes('defense+1')) {
        this.applyStatModifier('defense', 1, 1, `Tag: ${tagInstance.tag.name}`);
      }
    });
  }

  // Méthodes privées d'aide
  private applyDamageModifiers(amount: number): number {
    let modifiedAmount = amount;

    // Appliquer les modificateurs des altérations
    this.activeAlterations.forEach(alteration => {
      const effect = alteration.alteration.effect;
      
      if (effect.action === 'modify_damage_taken' || effect.action === 'modify_damage_taken_multiply') {
        // Multiplie ou ajoute selon le type d'effet
        if (effect.value !== undefined) {
          if (typeof effect.value === 'number') {
            if (effect.action.includes('multiply')) {
              modifiedAmount *= effect.value;
            } else {
              modifiedAmount += effect.value;
            }
          }
        }
      }
    });

    return Math.max(0, modifiedAmount);
  }

  private applyHealModifiers(amount: number): number {
    let modifiedAmount = amount;

    // Appliquer les modificateurs des altérations
    this.activeAlterations.forEach(alteration => {
      const effect = alteration.alteration.effect;
      
      if (effect.action === 'modify_healing_received') {
        // Multiplie ou ajoute selon le type d'effet
        if (effect.value !== undefined) {
          if (typeof effect.value === 'number') {
            if (effect.action.startsWith('multiply')) {
              modifiedAmount *= effect.value;
            } else {
              modifiedAmount += effect.value;
            }
          }
        }
      }
    });

    return Math.max(0, modifiedAmount);
  }

  private triggerOnDamageEffects(damageAmount: number): void {
    // Déclencher des effets lorsque des dégâts sont subis
    this.activeAlterations.forEach(alteration => {
      const effect = alteration.alteration.effect;
      
      if (effect.action === 'on_damage_taken') {
        // Implémenter la logique d'effet ici
        console.log(`Effet déclenché sur dégâts: ${alteration.alteration.name}`);
      }
    });
  }

  private triggerOnHealEffects(healAmount: number): void {
    // Déclencher des effets lorsque des soins sont reçus
    this.activeAlterations.forEach(alteration => {
      const effect = alteration.alteration.effect;
      
      if (effect.action === 'on_heal_received') {
        // Implémenter la logique d'effet ici
        console.log(`Effet déclenché sur soin: ${alteration.alteration.name}`);
      }
    });
  }
  
  /**
   * Applique un modificateur à une statistique
   */
  private applyStatModifier(
    statName: string, 
    value: number, 
    stackCount: number = 1,
    sourceName: string = 'unknown',
    isPercentage: boolean = false
  ): void {
    // Enregistrer l'effet
    if (!this.activeEffects[statName]) {
      this.activeEffects[statName] = [];
    }
    
    this.activeEffects[statName].push({
      value: value * stackCount,
      source: sourceName,
      isPercentage
    });
    
    // Appliquer à la statistique
    if (isPercentage) {
      // Pour les effets en pourcentage, on les appliquera à la fin
      // après avoir cumulé tous les effets additifs
    } else {
      // Pour les effets additifs, on les applique directement
      this.temporaryStats[statName] = (this.temporaryStats[statName] || 0) + (value * stackCount);
    }
  }
}

/**
 * Implémentation du gestionnaire de combat
 */
export class CombatManagerImpl implements CombatManager {
  public cardInstances: CardInstance[] = [];
  private cardConversionService: CardConversionService;
  private lieuCardService: LieuCardService;
  private actionResolutionService: ActionResolutionService;

  constructor() {
    this.cardConversionService = new CardConversionService();
    this.lieuCardService = new LieuCardService();
    this.actionResolutionService = new ActionResolutionService();
  }

  public initializeCardInstance(card: Card): CardInstance {
    // Utiliser le service de conversion pour créer une instance
    const cardInstance = this.cardConversionService.convertCardToInstance(card);
    this.cardInstances.push(cardInstance);
    return cardInstance;
  }

  public executeAttack(attacker: CardInstance, target: CardInstance): void {
    if (!attacker.canAttack()) {
      console.log("L'attaquant ne peut pas attaquer");
      return;
    }

    // Plutôt que d'exécuter directement l'attaque, on la planifie pour résolution simultanée
    const actionId = this.actionResolutionService.planAction({
      type: ActionType.ATTACK,
      source: attacker,
      targets: [target],
      priority: 1, // Priorité par défaut
      cost: 1 // Coût par défaut pour une attaque
    });

    console.log(`Attaque planifiée: ${attacker.cardDefinition.name} attaque ${target.cardDefinition.name} (ID: ${actionId})`);
    
    // On ne marque pas immédiatement l'attaquant comme ayant agi, cela sera fait lors de la résolution
  }

  /**
   * Exécute une attaque planifiée
   * @param attacker L'attaquant
   * @param target La cible
   */
  private executeAttackAction(attacker: CardInstance, target: CardInstance): void {
    // Logique d'attaque de base (à étendre selon les règles du jeu)
    const damage = 1; // Valeur par défaut, à remplacer par une formule de calcul
    
    target.applyDamage(damage);
    attacker.isExhausted = true;
    
    console.log(`${attacker.cardDefinition.name} attaque ${target.cardDefinition.name} pour ${damage} dégâts`);
  }

  public castSpell(caster: CardInstance, spell: Spell, targets: CardInstance[]): void {
    // Vérifier si le sort peut être lancé
    if (!caster.canUseSpell(spell.id)) {
      console.log("Le sort ne peut pas être lancé");
      return;
    }

    // Plutôt que d'exécuter directement le sort, on le planifie pour résolution simultanée
    const actionId = this.actionResolutionService.planAction({
      type: ActionType.CAST_SPELL,
      source: caster,
      targets,
      spell,
      priority: 1, // Priorité par défaut
      cost: spell.cost || 0
    });

    console.log(`Sort planifié: ${caster.cardDefinition.name} lance ${spell.name} (ID: ${actionId})`);
    
    // On ne marque pas immédiatement le lanceur comme ayant agi, cela sera fait lors de la résolution
  }

  /**
   * Exécute un sort planifié sur les cibles
   * @param caster Le lanceur du sort
   * @param spell Le sort à lancer
   * @param targets Les cibles du sort
   */
  private executeSpell(caster: CardInstance, spell: Spell, targets: CardInstance[]): void {
    // Appliquer les effets du sort à chaque cible
    spell.effects.forEach(effect => {
      targets.forEach(target => {
        switch (effect.type) {
          case 'damage':
            target.applyDamage(effect.value);
            break;
          case 'heal':
            target.heal(effect.value);
            break;
          case 'apply_alteration':
            // Logique pour appliquer une altération
            if (effect.alteration) {
              // Récupérer l'altération depuis une source de données
              // Pour l'exemple, on suppose que nous avons accès à l'altération
              const alteration: Alteration = {
                id: effect.alteration,
                name: "Altération",
                description: null,
                effect: { action: "dummy" },
                icon: "",
                duration: effect.duration ?? 0,
                stackable: false,
                unique_effect: false,
                type: 'debuff'
              };
              
              target.addAlteration(alteration, caster);
            }
            break;
          // Autres types d'effets...
        }
      });
    });

    // Mettre le sort en cooldown
    const spellInstance = caster.availableSpells.find(s => s.spell.id === spell.id);
    if (spellInstance) {
      spellInstance.cooldown = 1; // Valeur par défaut, à ajuster selon le sort
      spellInstance.isAvailable = false;
    }
    
    // Marquer le lanceur comme ayant agi
    caster.isExhausted = true;
  }

  /**
   * Résout toutes les actions planifiées de manière simultanée
   */
  public resolveAllActions(): void {
    console.log("Résolution des actions planifiées...");
    
    // Résoudre les conflits automatiquement avant l'exécution
    const resolutions = this.actionResolutionService.resolveConflictsAutomatically();
    if (resolutions.length > 0) {
      console.log("Conflits résolus:");
      resolutions.forEach(resolution => {
        console.log(` - ${resolution.resolution}`);
      });
    }
    
    // Exécuter les actions planifiées
    this.actionResolutionService.resolveActions(action => {
      switch (action.type) {
        case ActionType.CAST_SPELL:
          if (action.spell) {
            this.executeSpell(action.source, action.spell, action.targets);
            console.log(`Sort exécuté: ${action.source.cardDefinition.name} lance ${action.spell.name}`);
          }
          break;
        case ActionType.ATTACK:
          // Gérer les attaques de base
          if (action.targets.length > 0) {
            this.executeAttackAction(action.source, action.targets[0]);
          }
          break;
        // Autres types d'actions...
        default:
          console.log(`Type d'action non géré: ${action.type}`);
      }
    });
    
    console.log("Toutes les actions ont été résolues");
  }

  public applyAlterations(): void {
    // Appliquer les effets des altérations actives à chaque tour
    this.cardInstances.forEach(cardInstance => {
      cardInstance.activeAlterations.forEach(alteration => {
        // Logique pour appliquer les effets des altérations
        const effect = alteration.alteration.effect;
        
        if (effect.action === 'damage_over_time' && effect.value) {
          cardInstance.applyDamage(effect.value * alteration.stackCount);
        } else if (effect.action === 'heal_over_time' && effect.value) {
          cardInstance.heal(effect.value * alteration.stackCount);
        }
        // Ajouter d'autres types d'effets selon les besoins
      });
    });
  }

  public checkForDefeated(): CardInstance[] {
    // Identifier les cartes vaincues (PV à 0)
    return this.cardInstances.filter(card => card.currentHealth <= 0);
  }

  public getValidTargets(source: CardInstance, targetType: TargetType, tagId?: number): CardInstance[] {
    // Filtrer les cibles valides selon le type de ciblage
    switch (targetType) {
      case 'self':
        return [source];
      
      case 'tagged':
        if (tagId === undefined) return [];
        return this.cardInstances.filter(card => card.hasTag(tagId));
      
      case 'all':
        return [...this.cardInstances];
      
      case 'opponent':
        // Pour simplifier, on considère que les cartes avec un id différent sont des adversaires
        // Dans une implémentation réelle, il faudrait vérifier l'appartenance à une équipe
        return this.cardInstances.filter(card => card.instanceId !== source.instanceId);
      
      case 'random':
        // Géré par la méthode getRandomTarget
        return [];
      
      default:
        return [];
    }
  }

  public getRandomTarget(source: CardInstance, targetType: TargetType, tagId?: number): CardInstance | null {
    // Obtenir les cibles valides basées sur le type
    let validTargets: CardInstance[] = [];
    
    if (targetType === 'random') {
      // Pour le ciblage purement aléatoire, on prend toutes les cartes sauf la source
      validTargets = this.cardInstances.filter(card => card.instanceId !== source.instanceId);
    } else {
      // Utiliser getValidTargets pour les autres types de ciblage
      validTargets = this.getValidTargets(source, targetType, tagId);
    }
    
    if (validTargets.length === 0) {
      return null;
    }
    
    // Sélectionner une cible aléatoire
    const randomIndex = Math.floor(Math.random() * validTargets.length);
    return validTargets[randomIndex];
  }
  
  /**
   * Sélectionne plusieurs cibles aléatoires
   * @param source La carte source de l'action
   * @param targetType Le type de ciblage
   * @param count Le nombre de cibles à sélectionner
   * @param tagId Optionnel: ID du tag pour le ciblage basé sur les tags
   * @param uniqueTargets Si vrai, les cibles seront toutes différentes
   * @returns Un tableau de cibles aléatoires, pouvant être vide si aucune cible valide
   */
  public getRandomTargets(
    source: CardInstance, 
    targetType: TargetType, 
    count: number, 
    tagId?: number,
    uniqueTargets: boolean = true
  ): CardInstance[] {
    // Obtenir les cibles valides
    let validTargets: CardInstance[] = [];
    
    if (targetType === 'random') {
      validTargets = this.cardInstances.filter(card => card.instanceId !== source.instanceId);
    } else {
      validTargets = this.getValidTargets(source, targetType, tagId);
    }
    
    // Si pas de cibles valides ou count <= 0, retourner un tableau vide
    if (validTargets.length === 0 || count <= 0) {
      return [];
    }
    
    // Si on demande plus de cibles que disponibles et qu'on veut des cibles uniques
    if (uniqueTargets && count > validTargets.length) {
      count = validTargets.length;
    }
    
    const result: CardInstance[] = [];
    
    if (uniqueTargets) {
      // Sélection sans remise (chaque cible ne peut être sélectionnée qu'une fois)
      const availableTargets = [...validTargets];
      
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * availableTargets.length);
        result.push(availableTargets[randomIndex]);
        availableTargets.splice(randomIndex, 1);
      }
    } else {
      // Sélection avec remise (la même cible peut être sélectionnée plusieurs fois)
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * validTargets.length);
        result.push(validTargets[randomIndex]);
      }
    }
    
    return result;
  }
  
  /**
   * Sélectionne une cible aléatoire pondérée par un critère (par ex: les cartes avec moins de PV ont plus de chances d'être ciblées)
   * @param source La carte source de l'action
   * @param targetType Le type de ciblage
   * @param weightFunction Fonction qui attribue un poids à chaque carte (plus le poids est élevé, plus la chance d'être choisi est grande)
   * @param tagId Optionnel: ID du tag pour le ciblage basé sur les tags
   * @returns Une cible aléatoire pondérée, ou null si aucune cible valide
   */
  public getWeightedRandomTarget(
    source: CardInstance,
    targetType: TargetType,
    weightFunction: (card: CardInstance) => number,
    tagId?: number
  ): CardInstance | null {
    // Obtenir les cibles valides
    let validTargets: CardInstance[] = [];
    
    if (targetType === 'random') {
      validTargets = this.cardInstances.filter(card => card.instanceId !== source.instanceId);
    } else {
      validTargets = this.getValidTargets(source, targetType, tagId);
    }
    
    if (validTargets.length === 0) {
      return null;
    }
    
    // Calculer les poids pour chaque cible
    const weights = validTargets.map(weightFunction);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    // Si tous les poids sont nuls, revenir à une sélection uniforme
    if (totalWeight <= 0) {
      const randomIndex = Math.floor(Math.random() * validTargets.length);
      return validTargets[randomIndex];
    }
    
    // Sélection pondérée
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < validTargets.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return validTargets[i];
      }
    }
    
    // En cas d'erreur de calcul, retourner la dernière cible
    return validTargets[validTargets.length - 1];
  }

  /**
   * Distribue les cartes Lieu pour le début d'une partie
   * @param players Tableau de cartes par joueur
   * @param config Configuration de distribution des cartes Lieu
   * @returns Résultat de la distribution
   */
  public distributeLieuCards(
    players: CardInstance[][],
    config: LieuDistributionConfig
  ): LieuDistributionResult {
    return this.lieuCardService.distributeLieuCards(players, config);
  }
  
  /**
   * Sélectionne aléatoirement une carte Lieu active
   * @param commonLieuCards Cartes Lieu disponibles
   * @returns La carte Lieu sélectionnée ou null si aucune carte disponible
   */
  public selectRandomActiveLieu(commonLieuCards: CardInstance[]): CardInstance | null {
    return this.lieuCardService.selectRandomActiveLieu(commonLieuCards);
  }
  
  /**
   * Change la carte Lieu active
   * @param newLieuCard Nouvelle carte Lieu à activer
   */
  public changeLieuCard(newLieuCard: CardInstance): void {
    this.lieuCardService.changeLieuCard(newLieuCard);
  }
  
  /**
   * Retourne la carte Lieu active
   * @returns La carte Lieu active ou null si aucune n'est active
   */
  public getActiveLieuCard(): CardInstance | null {
    return this.lieuCardService.getActiveLieuCard();
  }
} 