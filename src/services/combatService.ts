import { v4 as uuidv4 } from 'uuid';
import { Card, Alteration, Tag, Spell } from '../types/index';
import { 
  CardInstance, 
  ActiveAlteration, 
  TagInstance, 
  SpellInstance, 
  TargetType, 
  CombatManager 
} from '../types/combat';

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
  }

  // Méthodes pour manipuler l'état
  public applyDamage(amount: number): void {
    // Appliquer les modificateurs de dégâts des altérations
    const modifiedAmount = this.applyDamageModifiers(amount);
    
    this.currentHealth = Math.max(0, this.currentHealth - modifiedAmount);
    
    // Déclencher des effets éventuels liés aux dégâts
    this.triggerOnDamageEffects(modifiedAmount);
  }

  public heal(amount: number): void {
    // Appliquer les modificateurs de soin des altérations
    const modifiedAmount = this.applyHealModifiers(amount);
    
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + modifiedAmount);
    
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
      existingAlteration.remainingDuration = alteration.duration || 0;
    } else if (!existingAlteration) {
      // Ajouter une nouvelle altération
      this.activeAlterations.push({
        alteration,
        remainingDuration: alteration.duration || 0,
        stackCount: 1,
        source
      });
    }
  }

  public removeAlteration(alterationId: number): void {
    this.activeAlterations = this.activeAlterations.filter(
      a => a.alteration.id !== alterationId
    );
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
    }
  }

  public removeTag(tagId: number): void {
    this.activeTags = this.activeTags.filter(t => t.tag.id !== tagId);
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

  public resetForNextTurn(): void {
    // Réinitialiser l'état d'épuisement
    this.isExhausted = false;
    this.isTapped = false;
    
    // Réduire la durée des altérations et supprimer celles expirées
    this.activeAlterations = this.activeAlterations
      .map(alteration => {
        if (alteration.remainingDuration > 0) {
          alteration.remainingDuration -= 1;
        }
        return alteration;
      })
      .filter(alteration => 
        alteration.remainingDuration > 0 || alteration.remainingDuration === null
      );
    
    // Réduire la durée des tags temporaires et supprimer ceux expirés
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
  }

  // Méthodes privées d'aide
  private applyDamageModifiers(amount: number): number {
    let modifiedAmount = amount;

    // Appliquer les modificateurs des altérations
    this.activeAlterations.forEach(alteration => {
      const effect = alteration.alteration.effect;
      
      if (effect.action === 'modify_damage_taken') {
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
}

/**
 * Implémentation du gestionnaire de combat
 */
export class CombatManagerImpl implements CombatManager {
  public cardInstances: CardInstance[] = [];

  constructor() {
    this.cardInstances = [];
  }

  public initializeCardInstance(card: Card): CardInstance {
    const cardInstance = new CardInstanceImpl(card);
    this.cardInstances.push(cardInstance);
    return cardInstance;
  }

  public executeAttack(attacker: CardInstance, target: CardInstance): void {
    if (!attacker.canAttack()) {
      console.log("L'attaquant ne peut pas attaquer");
      return;
    }

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

  public getRandomTarget(source: CardInstance, targetType: TargetType): CardInstance | null {
    const validTargets = this.getValidTargets(source, targetType);
    
    if (validTargets.length === 0) {
      return null;
    }
    
    // Sélectionner une cible aléatoire
    const randomIndex = Math.floor(Math.random() * validTargets.length);
    return validTargets[randomIndex];
  }
} 