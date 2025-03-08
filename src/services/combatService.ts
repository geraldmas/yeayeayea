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
  LieuDistributionResult,
  ObjectSlot,
  TargetingCriteria
} from '../types/combat';
import { CardConversionService } from './cardConversionService';
import { LieuCardService } from './lieuCardService';
import { ActionResolutionService, ActionType } from './actionResolutionService';
import { gameConfigService } from '../utils/dataService';

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
  public objectSlots?: ObjectSlot[];
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
    
    // Initialiser les emplacements d'objets pour les personnages
    if (card.type === 'personnage') {
      this.initializeObjectSlots();
    }
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

  /**
   * Initialise les emplacements d'objets pour un personnage
   * en fonction de la configuration du jeu
   */
  public async initializeObjectSlots(): Promise<void> {
    try {
      // Récupérer le nombre d'emplacements d'objets depuis la configuration
      const slotsCount = await gameConfigService.getValue<number>('emplacements_objet') || 3;
      
      this.objectSlots = Array(slotsCount).fill(0).map((_, index) => ({
        slotId: index + 1, // Les IDs commencent à 1
        equippedObject: null,
        isLocked: false
      }));
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des emplacements d\'objets:', error);
      // Par défaut, créer 3 emplacements si la configuration n'est pas disponible
      this.objectSlots = Array(3).fill(0).map((_, index) => ({
        slotId: index + 1,
        equippedObject: null,
        isLocked: false
      }));
    }
  }

  /**
   * Équipe un objet dans un emplacement spécifique ou dans le premier emplacement disponible
   * @param objectCard La carte objet à équiper
   * @param slotId (optionnel) L'ID de l'emplacement spécifique où équiper l'objet
   * @returns true si l'objet a été équipé avec succès, false sinon
   */
  public equipObject(objectCard: CardInstance, slotId?: number): boolean {
    // Vérifier que la carte est de type objet
    if (objectCard.cardDefinition.type !== 'objet') {
      console.error('Impossible d\'équiper: la carte n\'est pas un objet');
      return false;
    }
    
    // Vérifier que les emplacements d'objets sont initialisés
    if (!this.objectSlots) {
      console.error('Les emplacements d\'objets ne sont pas disponibles pour cette carte');
      return false;
    }
    
    // Si un slotId spécifique est fourni
    if (slotId !== undefined) {
      const slot = this.objectSlots.find(s => s.slotId === slotId);
      if (!slot) {
        console.error(`L'emplacement d'ID ${slotId} n'existe pas`);
        return false;
      }
      
      if (slot.isLocked) {
        console.error(`L'emplacement d'ID ${slotId} est verrouillé`);
        return false;
      }
      
      if (slot.equippedObject) {
        console.error(`L'emplacement d'ID ${slotId} est déjà occupé`);
        return false;
      }
      
      slot.equippedObject = objectCard;
      return true;
    }
    
    // Si aucun slotId n'est spécifié, utiliser le premier emplacement disponible
    const availableSlot = this.objectSlots.find(s => !s.isLocked && !s.equippedObject);
    if (!availableSlot) {
      console.error('Aucun emplacement disponible pour équiper l\'objet');
      return false;
    }
    
    availableSlot.equippedObject = objectCard;
    return true;
  }

  /**
   * Déséquipe un objet d'un emplacement spécifique
   * @param slotId L'ID de l'emplacement d'où déséquiper l'objet
   * @returns La carte objet déséquipée, ou null si aucun objet n'était équipé
   */
  public unequipObject(slotId: number): CardInstance | null {
    if (!this.objectSlots) {
      console.error('Les emplacements d\'objets ne sont pas disponibles pour cette carte');
      return null;
    }
    
    const slot = this.objectSlots.find(s => s.slotId === slotId);
    if (!slot) {
      console.error(`L'emplacement d'ID ${slotId} n'existe pas`);
      return null;
    }
    
    if (slot.isLocked) {
      console.error(`L'emplacement d'ID ${slotId} est verrouillé et ne peut pas être déséquipé`);
      return null;
    }
    
    const equippedObject = slot.equippedObject;
    slot.equippedObject = null;
    return equippedObject;
  }

  /**
   * Récupère tous les objets équipés
   * @returns Un tableau des cartes objets équipées
   */
  public getEquippedObjects(): CardInstance[] {
    if (!this.objectSlots) {
      return [];
    }
    
    return this.objectSlots
      .filter(slot => slot.equippedObject !== null)
      .map(slot => slot.equippedObject!) as CardInstance[];
  }

  /**
   * Vérifie si le personnage a au moins un emplacement d'objet disponible
   * @returns true s'il y a au moins un emplacement disponible, false sinon
   */
  public hasAvailableObjectSlot(): boolean {
    if (!this.objectSlots) {
      return false;
    }
    
    return this.objectSlots.some(slot => !slot.isLocked && !slot.equippedObject);
  }

  /**
   * Récupère l'ID du premier emplacement d'objet disponible
   * @returns L'ID du premier emplacement disponible, ou null si aucun n'est disponible
   */
  public getAvailableObjectSlot(): number | null {
    if (!this.objectSlots) {
      return null;
    }
    
    const availableSlot = this.objectSlots.find(slot => !slot.isLocked && !slot.equippedObject);
    return availableSlot ? availableSlot.slotId : null;
  }

  /**
   * Applique les effets passifs de tous les objets équipés
   */
  public applyEquippedObjectsEffects(): void {
    if (!this.objectSlots) {
      return;
    }
    
    this.getEquippedObjects().forEach(objectCard => {
      // Appliquer les effets passifs des objets
      const passiveEffect = objectCard.cardDefinition.passive_effect;
      if (passiveEffect) {
        // Ici, nous devrions implémenter la logique pour appliquer les effets passifs
        // Cette implémentation dépendra du format spécifique des effets passifs
        console.log(`Appliquer l'effet passif: ${passiveEffect} de l'objet ${objectCard.cardDefinition.name}`);
        
        // Exemple simple d'effet passif (à adapter selon le format réel des effets)
        // Note: Ceci est un exemple et devrait être adapté au format réel des effets passifs
        try {
          const effect = JSON.parse(passiveEffect);
          if (effect.type && effect.value) {
            switch (effect.type) {
              case 'motivation_boost':
                // Appliquer un boost de motivation (à implémenter plus tard)
                break;
              case 'charisma_boost':
                // Appliquer un boost de charisme (à implémenter plus tard)
                break;
              case 'health_boost':
                // Augmenter les PV max et actuels
                const boostAmount = this.maxHealth * (effect.value / 100);
                this.maxHealth += boostAmount;
                this.currentHealth += boostAmount;
                break;
              case 'attack_boost':
                // Augmenter l'attaque
                this.temporaryStats.attack += (this.temporaryStats.attack * (effect.value / 100));
                break;
              case 'defense_boost':
                // Augmenter la défense
                this.temporaryStats.defense += (this.temporaryStats.defense * (effect.value / 100));
                break;
              default:
                console.warn(`Type d'effet passif non géré: ${effect.type}`);
            }
          }
        } catch (error) {
          console.error(`Erreur lors de l'application de l'effet passif de l'objet ${objectCard.cardDefinition.name}:`, error);
        }
      }
    });
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
  private activeLieuCard: CardInstance | null = null;

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
        
      case 'manual':
        // Pour le ciblage manuel, on retourne par défaut tous les adversaires
        // Le filtrage spécifique sera fait par getManualTargets
        return this.cardInstances.filter(card => card.instanceId !== source.instanceId);
      
      default:
        return [];
    }
  }

  /**
   * Obtient une liste de cibles potentielles pour le ciblage manuel
   * @param source La carte source de l'action
   * @param criteria Critères optionnels pour filtrer les cibles potentielles
   * @returns Liste de cibles potentielles pour un ciblage manuel
   */
  public getManualTargets(source: CardInstance, criteria?: TargetingCriteria): CardInstance[] {
    // Commencer avec les adversaires comme cibles potentielles par défaut
    let potentialTargets = this.cardInstances.filter(card => card.instanceId !== source.instanceId);
    
    // Si aucun critère n'est spécifié, retourner toutes les cibles potentielles
    if (!criteria) {
      return potentialTargets;
    }
    
    // Filtrer par tags si spécifié
    if (criteria.byTag && criteria.byTag.length > 0) {
      potentialTargets = potentialTargets.filter(card => {
        // La carte doit avoir au moins un des tags spécifiés
        return criteria.byTag!.some(tagId => card.hasTag(tagId));
      });
    }
    
    // Filtrer par rareté si spécifié
    if (criteria.byRarity && criteria.byRarity.length > 0) {
      potentialTargets = potentialTargets.filter(card => {
        return criteria.byRarity!.includes(card.cardDefinition.rarity);
      });
    }
    
    // Filtrer par pourcentage de santé si spécifié
    if (criteria.byHealthPercent) {
      potentialTargets = potentialTargets.filter(card => {
        const healthPercent = (card.currentHealth / card.maxHealth) * 100;
        
        // Vérifier le seuil minimum si spécifié
        if (criteria.byHealthPercent!.min !== undefined && healthPercent < criteria.byHealthPercent!.min) {
          return false;
        }
        
        // Vérifier le seuil maximum si spécifié
        if (criteria.byHealthPercent!.max !== undefined && healthPercent > criteria.byHealthPercent!.max) {
          return false;
        }
        
        return true;
      });
    }
    
    // Exclure les cartes ayant certains tags
    if (criteria.excludeTags && criteria.excludeTags.length > 0) {
      potentialTargets = potentialTargets.filter(card => {
        // La carte ne doit avoir aucun des tags à exclure
        return !criteria.excludeTags!.some(tagId => card.hasTag(tagId));
      });
    }
    
    return potentialTargets;
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
   * @param config Configuration de distribution des cartes Lieu
   * @returns Résultat de la distribution
   */
  public distributeLieuCards(config: LieuDistributionConfig): LieuDistributionResult {
    // Déléguer au service spécialisé
    return this.lieuCardService.distributeLieuCards(config);
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

  /**
   * Convertit une carte en instance de carte pour le combat
   * @param card La carte à convertir
   * @param tags Tags optionnels à associer à la carte
   * @param spells Sorts optionnels à associer à la carte
   * @returns L'instance de carte créée
   */
  public convertCardToInstance(card: Card, tags?: Tag[], spells?: Spell[]): CardInstance {
    return this.cardConversionService.convertCardToInstance(card, tags, spells);
  }
} 