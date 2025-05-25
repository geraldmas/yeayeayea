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
import { AttackConditionsService, AttackTargetType } from './attackConditionsService';
import { Player } from '../types/player';
import { tagRuleParser } from './tagRuleParserService'; // Import the tagRuleParser

/**
 * @file combatService.ts
 * @description Service central de gestion du combat pour le jeu Yeayeayea
 * Ce module implémente le système de combat complet avec la gestion des instances de cartes,
 * des altérations, du ciblage, et de la résolution des actions et sorts.
 */

/**
 * Implémentation de l'interface CardInstance
 * Représente une instance de carte en jeu avec son état actuel (santé, altérations, etc.)
 */
export class CardInstanceImpl implements CardInstance {
  /** Identifiant unique pour cette instance spécifique */
  public instanceId: string;
  
  /** Référence à la définition de carte originale */
  public cardDefinition: Card;
  
  /** Points de vie actuels */
  public currentHealth: number;
  
  /** Points de vie maximum */
  public maxHealth: number;
  
  /** Position sur le terrain (optionnelle) */
  public position?: { x: number; y: number };
  
  /** Altérations actives sur cette carte */
  public activeAlterations: ActiveAlteration[];
  
  /** Tags actifs sur cette carte */
  public activeTags: TagInstance[];
  
  /** Sorts disponibles pour cette carte */
  public availableSpells: SpellInstance[];
  
  /** Emplacements d'objets (uniquement pour les personnages) */
  public objectSlots?: ObjectSlot[];
  
  /** Indique si la carte a déjà été utilisée ce tour */
  public isExhausted: boolean;
  
  /** Indique si la carte est inclinée (pour les actions spéciales) */
  public isTapped: boolean;
  
  /** Compteurs spécifiques */
  public counters: { [key: string]: number };
  
  /** Statistiques temporaires modifiées par les altérations */
  public temporaryStats: { 
    attack: number;
    defense: number;
    [key: string]: number;
  };
  
  /** Historique des changements de PV pour débogage et affichage */
  public damageHistory: Array<{ type: 'damage' | 'heal', amount: number, source?: string, timestamp: number }>;
  
  /** Effets actifs par catégorie pour faciliter les calculs */
  public activeEffects: { [key: string]: Array<{ value: number, source: string, isPercentage: boolean }> };

  /**
   * Crée une nouvelle instance de carte à partir d'une définition de carte
   * @param card - La définition de carte à instancier
   */
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

  /**
   * Applique des dégâts à cette instance de carte
   * @param amount - Quantité de dégâts à infliger (avant modificateurs)
   * @param source - Source des dégâts (pour l'historique et le débogage)
   */
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

  /**
   * Soigne cette instance de carte
   * @param amount - Quantité de soin à appliquer (avant modificateurs)
   * @param source - Source du soin (pour l'historique et le débogage)
   */
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

  /**
   * Ajoute une altération à cette instance de carte
   * @param alteration - L'altération à appliquer
   * @param source - La carte source qui applique l'altération
   */
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

  /**
   * Supprime une altération active sur cette instance de carte
   * @param alterationId - Identifiant de l'altération à supprimer
   */
  public removeAlteration(alterationId: number): void {
    this.activeAlterations = this.activeAlterations.filter(
      a => a.alteration.id !== alterationId
    );
    
    // Recalculer les statistiques temporaires
    this.recalculateTemporaryStats();
  }

  /**
   * Ajoute un tag à cette instance de carte
   * @param tag - Le tag à ajouter
   * @param isTemporary - Indique si le tag est temporaire (défaut: false)
   * @param duration - Durée en tours pour les tags temporaires (optionnel)
   */
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

  /**
   * Supprime un tag de cette instance de carte
   * @param tagId - Identifiant du tag à supprimer
   */
  public removeTag(tagId: number): void {
    const removedTag = this.activeTags.find(t => t.tag.id === tagId);
    this.activeTags = this.activeTags.filter(t => t.tag.id !== tagId);
    
    // Recalculer les statistiques temporaires si nécessaire
    if (removedTag && removedTag.tag.passive_effect) {
      this.recalculateTemporaryStats();
    }
  }

  /**
   * Vérifie si cette instance de carte possède un tag spécifique
   * @param tagId - Identifiant du tag à vérifier
   * @returns Vrai si la carte possède le tag, faux sinon
   */
  public hasTag(tagId: number): boolean {
    return this.activeTags.some(t => t.tag.id === tagId);
  }

  /**
   * Vérifie si cette instance de carte possède une altération spécifique
   * @param alterationId - Identifiant de l'altération à vérifier
   * @returns Vrai si la carte possède l'altération, faux sinon
   */
  public hasAlteration(alterationId: number): boolean {
    return this.activeAlterations.some(a => a.alteration.id === alterationId);
  }

  /**
   * Vérifie si cette instance de carte peut utiliser un sort spécifique
   * @param spellId - Identifiant du sort à vérifier
   * @returns Vrai si le sort est disponible et n'est pas en temps de recharge, faux sinon
   */
  public canUseSpell(spellId: number): boolean {
    const spell = this.availableSpells.find(s => s.spell.id === spellId);
    return spell ? spell.isAvailable && spell.cooldown === 0 : false;
  }

  /**
   * Vérifie si cette instance de carte peut attaquer
   * @returns Vrai si la carte peut attaquer, faux sinon
   */
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

  /**
   * Réinitialise l'état de la carte pour le début du prochain tour
   * Réduit la durée des altérations temporaires, actualise les sorts, etc.
   */
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
   * Recalcule toutes les statistiques temporaires en fonction des altérations et tags actifs
   * Cette méthode est appelée après chaque modification des altérations ou tags,
   * et actualise les statistiques d'attaque, défense et autres attributs modifiables.
   */
  public recalculateTemporaryStats(allCardsInPlay: CardInstance[], gameState: any): void {
    // 1. Réinitialiser les statistiques aux valeurs de base de la définition de la carte
    this.temporaryStats = {
      attack: (this.cardDefinition.properties as any).attack || 0,
      defense: (this.cardDefinition.properties as any).defense || 0,
      // ... réinitialiser d'autres statistiques si elles sont modifiables par les tags/altérations
    };
    
    // Réinitialiser les effets actifs (si vous utilisez activeEffects pour tracker les sources de modifs)
    this.activeEffects = {};
    
    // 2. Appliquer les effets des règles de tags actifs
    // L'ordre des tags peut importer si les règles ont des priorités différentes.
    // tagRuleParser.applyTagRules s'occupe déjà du tri par priorité des règles pour UN tag donné.
    // Si l'ordre d'application des tags eux-mêmes est important, il faudrait les trier ici.
    // Pour l'instant, on les applique dans l'ordre où ils sont stockés.
    this.activeTags.forEach(tagInstance => {
      // `applyTagRules` va modifier `this.temporaryStats` directement si `this` est une cible.
      const applicationResults = tagRuleParser.applyTagRules(
        tagInstance.tag.name, 
        this, // sourceCard (peut être la carte elle-même ou une autre carte affectant celle-ci)
              // Pour les effets SELF, `this` sera à la fois source et cible.
        allCardsInPlay, 
        gameState
      );
      
      // Optionnel: logguer ou traiter les résultats de l'application des règles de tag
      applicationResults.forEach(result => {
        if (result.success) {
          // console.log(`Rule '${result.effectDescription}' from tag '${result.sourceTag}' applied to ${this.cardDefinition.name}.`);
        } else if (result.failureReason !== 'Condition non remplie') { // Ne pas logguer toutes les conditions non remplies comme des erreurs
          // console.warn(`Failed to apply rule '${result.effectDescription}' from tag '${result.sourceTag}': ${result.failureReason}`);
        }
      });
    });

    // 3. Appliquer les effets des altérations (après les tags)
    // Cette partie conserve la logique existante d'application des altérations.
    // Assurez-vous que `applyStatModifier` est compatible avec le fait que les stats
    // ont déjà été potentiellement modifiées par les tags.
    // Les altérations pourraient modifier les stats déjà affectées par les tags.
    this.activeAlterations.forEach(alteration => {
      const effect = alteration.alteration.effect;
      
      // Exemple: si les altérations modifient directement les temporaryStats
      if (effect.action === 'modify_attack' && effect.value !== undefined) {
        // Note: `applyStatModifier` a été retiré, donc on modifie directement.
        // Ou alors, on s'assure que `applyStatModifier` est bien défini et fait ce qu'on attend.
        // Pour l'instant, modification directe :
        this.temporaryStats.attack += effect.value * alteration.stackCount;
        // Enregistrer l'effet si besoin:
        if (!this.activeEffects.attack) this.activeEffects.attack = [];
        this.activeEffects.attack.push({ value: effect.value * alteration.stackCount, source: `Alteration: ${alteration.alteration.name}`, isPercentage: false /* ou basé sur effect */ });

      } else if (effect.action === 'modify_defense' && effect.value !== undefined) {
        this.temporaryStats.defense += effect.value * alteration.stackCount;
        if (!this.activeEffects.defense) this.activeEffects.defense = [];
        this.activeEffects.defense.push({ value: effect.value * alteration.stackCount, source: `Alteration: ${alteration.alteration.name}`, isPercentage: false });
      }
      // Gérer d'autres types de modifications de statistiques par les altérations
    });

    // Remarque: La méthode applyStatModifier a été retirée de l'extrait original.
    // Si elle existait et était utilisée par les altérations, cette logique doit être revue.
    // Ici, on suppose que les altérations modifient directement temporaryStats ou utilisent un mécanisme similaire.
    // La logique de `activeEffects` a été simplifiée pour l'exemple.
  }

  /**
   * Applique les modificateurs de dégâts provenant des altérations et tags actifs
   * @param amount - Montant initial des dégâts
   * @returns Montant modifié des dégâts après application des modificateurs
   * @private
   */
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
      const slotsCount = await gameConfigService.getValue<number>('emplacements_objet');
      
      // Utiliser une valeur par défaut (3) si slotsCount est null ou undefined
      const finalSlotsCount = slotsCount !== null && slotsCount !== undefined ? slotsCount : 3;
      
      this.objectSlots = Array(finalSlotsCount).fill(0).map((_, index) => ({
        slotId: index + 1, // Les IDs commencent à 1
        equippedObject: null,
        isLocked: false
      }));
    } catch (error) {
      console.warn('Utilisation de la configuration par défaut pour les emplacements d\'objets:', error);
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
        console.warn(`L'emplacement d'ID ${slotId} est verrouillé`);
        return false;
      }
      
      if (slot.equippedObject) {
        console.warn(`L'emplacement d'ID ${slotId} est déjà occupé`);
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
      console.warn(`L'emplacement d'ID ${slotId} est verrouillé et ne peut pas être déséquipé`);
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
 * @class CombatManagerImpl
 * @implements {CombatManager}
 * @description Implémentation du gestionnaire de combat principal
 * Cette classe est responsable de la gestion globale du combat, incluant
 * la conversion des cartes en instances, l'exécution des attaques et sorts,
 * la résolution des actions, et la gestion des cartes lieu.
 */
export class CombatManagerImpl implements CombatManager {
  /** Liste des instances de cartes en jeu */
  public cardInstances: CardInstance[] = [];
  
  /** Service de conversion des cartes en instances de combat */
  private cardConversionService: CardConversionService;
  
  /** Service de gestion des cartes lieu */
  private lieuCardService: LieuCardService;
  
  /** Service de résolution des actions */
  private actionResolutionService: ActionResolutionService;
  
  /** Carte lieu actuellement active dans la partie */
  private activeLieuCard: CardInstance | null = null;

  /**
   * Crée une nouvelle instance du gestionnaire de combat
   * Initialise les services nécessaires pour le fonctionnement du combat
   */
  constructor() {
    this.cardConversionService = new CardConversionService();
    this.lieuCardService = new LieuCardService();
    this.actionResolutionService = new ActionResolutionService();
  }

  /**
   * Initialise une instance de carte à partir d'une définition de carte
   * @param card - La définition de carte à convertir en instance
   * @returns L'instance de carte initialisée
   */
  public initializeCardInstance(card: Card): CardInstance {
    // Utiliser le service de conversion pour créer une instance
    const cardInstance = this.cardConversionService.convertCardToInstance(card);
    this.cardInstances.push(cardInstance);
    return cardInstance;
  }

  /**
   * Planifie une attaque entre un attaquant et une cible
   * L'attaque sera résolue lors de la prochaine résolution des actions
   * @param attacker - La carte qui attaque
   * @param target - La carte ciblée par l'attaque
   */
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
   * Distribue les cartes Lieu au début de la partie
   * @param config Configuration de distribution des cartes Lieu
   * @returns Résultat de la distribution
   */
  public distributeLieuCards(config: LieuDistributionConfig): LieuDistributionResult {
    // Pour simuler les cartes des joueurs, nous allons créer deux groupes de cartes
    // En situation réelle, ces données viendraient de l'état du jeu
    const playerIds = ["player1", "player2"];
    
    // Si nous n'avons pas assez de cartes, créons quelques exemples
    if (this.cardInstances.length < 10) {
      // Créer des cartes Lieu fictives
      for (let i = 0; i < 10; i++) {
        const mockCard: Card = {
          id: 2000 + i,
          name: `Lieu ${i}`,
          type: 'lieu',
          rarity: 'interessant',
          description: `Description du lieu ${i}`,
          properties: {},
          summon_cost: 0,
          image: '',
          passive_effect: null,
          is_wip: false,
          is_crap: false
        };
        
        const cardInstance = this.convertCardToInstance(mockCard);
        this.cardInstances.push(cardInstance);
      }
    }
    
    // Répartir artificiellement les cartes en deux groupes de joueurs
    const playerCards: CardInstance[][] = [];
    
    // Diviser les cartes disponibles en deux groupes
    for (let i = 0; i < playerIds.length; i++) {
      const startIdx = i * Math.floor(this.cardInstances.length / playerIds.length);
      const endIdx = (i + 1) * Math.floor(this.cardInstances.length / playerIds.length);
      playerCards.push(this.cardInstances.slice(startIdx, endIdx));
    }
    
    // Déléguer au service spécialisé
    return this.lieuCardService.distributeLieuCards(playerCards, config);
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

  /**
   * Vérifie si un joueur peut attaquer directement la base adverse
   * @param attacker - La carte qui effectue l'attaque
   * @param sourcePlayer - Le joueur qui possède l'attaquant
   * @param targetPlayer - Le joueur dont la base est ciblée
   * @param ignoreConditions - Option pour ignorer certaines conditions (capacités spéciales)
   * @returns Objet contenant le résultat de la vérification et un message explicatif
   */
  public canAttackBase(
    attacker: CardInstance,
    sourcePlayer: Player,
    targetPlayer: Player,
    ignoreConditions: boolean = false
  ): { canAttack: boolean; reason?: string } {
    return AttackConditionsService.canAttack({
      attacker,
      sourcePlayer,
      targetPlayer,
      targetType: AttackTargetType.BASE,
      ignoreConditions
    });
  }

  /**
   * Exécute une attaque sur la base d'un joueur
   * @param attacker - La carte qui effectue l'attaque
   * @param sourcePlayer - Le joueur qui possède l'attaquant
   * @param targetPlayer - Le joueur dont la base est ciblée
   * @param ignoreConditions - Option pour ignorer certaines conditions (capacités spéciales)
   * @returns Le montant de dégâts infligés, ou -1 si l'attaque n'est pas possible
   */
  public attackBase(
    attacker: CardInstance,
    sourcePlayer: Player,
    targetPlayer: Player,
    ignoreConditions: boolean = false
  ): number {
    // Vérifier si l'attaque est possible
    const attackCheck = this.canAttackBase(attacker, sourcePlayer, targetPlayer, ignoreConditions);
    
    if (!attackCheck.canAttack) {
      return -1; // Attaque impossible
    }
    
    // Calculer les dégâts de base (à adapter selon les mécaniques du jeu)
    const baseDamage = attacker.temporaryStats.attack || 0;
    
    // Appliquer les modificateurs spécifiques aux attaques sur la base
    const modifiedDamage = AttackConditionsService.applyBaseAttackModifiers(
      baseDamage,
      attacker,
      targetPlayer
    );
    
    // Appliquer les dégâts à la base
    const damageDealt = targetPlayer.base.applyDamage(modifiedDamage, attacker.cardDefinition.name);
    
    // Marquer l'attaquant comme ayant agi
    attacker.isExhausted = true;
    
    return damageDealt;
  }

  /**
   * Vérifie si une entité peut attaquer une autre entité
   * @param attacker - L'entité qui attaque
   * @param target - L'entité ciblée
   * @param sourcePlayer - Le joueur qui possède l'attaquant
   * @param targetPlayer - Le joueur qui possède la cible
   * @returns Objet contenant le résultat de la vérification et un message explicatif
   */
  public canAttackEntity(
    attacker: CardInstance,
    target: CardInstance,
    sourcePlayer: Player,
    targetPlayer: Player
  ): { canAttack: boolean; reason?: string } {
    return AttackConditionsService.canAttack({
      attacker,
      sourcePlayer,
      targetPlayer,
      targetType: AttackTargetType.ENTITY
    });
  }
} 