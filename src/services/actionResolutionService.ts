import { CardInstance } from '../types/combat';
import { Spell, SpellEffect } from '../types/index';

/**
 * @file actionResolutionService.ts
 * @description Service de résolution des actions pour le système de combat du jeu Yeayeayea
 * 
 * Ce service est responsable de la gestion du flux d'actions pendant le combat :
 * - Planification des actions (attaques, sorts, capacités...)
 * - Détection et résolution des conflits entre actions
 * - Exécution des actions avec respect des priorités et des dépendances
 * 
 * La particularité de ce système est qu'il permet une résolution "simultanée" des actions
 * où les joueurs planifient leurs actions, puis celles-ci sont exécutées en tenant compte
 * des interactions possibles entre elles, plutôt qu'une simple exécution séquentielle.
 */

/**
 * Types d'actions possibles dans le système de combat
 * Définit les différentes catégories d'actions que les joueurs peuvent effectuer
 */
export enum ActionType {
  /** Attaque de base entre deux cartes */
  ATTACK = 'attack',
  
  /** Lancement d'un sort par une carte */
  CAST_SPELL = 'cast_spell',
  
  /** Utilisation d'une capacité spéciale */
  USE_ABILITY = 'use_ability',
  
  /** Utilisation d'un objet ou item */
  USE_ITEM = 'use_item',
  
  /** Activation d'un effet passif ou d'une réaction */
  ACTIVATE_EFFECT = 'activate_effect',
}

/**
 * Interface représentant une action planifiée dans le système de combat
 * Contient toutes les informations nécessaires pour résoudre l'action
 */
export interface PlannedAction {
  /** Identifiant unique de l'action */
  id: string;                  
  
  /** Type d'action (attaque, sort, etc.) */
  type: ActionType;            
  
  /** Carte qui initie l'action */
  source: CardInstance;        
  
  /** Cibles de l'action (peut être multiple) */
  targets: CardInstance[];     
  
  /** Sort utilisé si l'action est de type CAST_SPELL */
  spell?: Spell;               
  
  /** Priorité de l'action (plus élevé = exécuté en premier en cas de conflit) */
  priority: number;            
  
  /** Horodatage de planification pour départager les actions simultanées */
  timestamp: number;           
  
  /** Coût en motivation pour exécuter l'action */
  cost: number;                
  
  /** Données supplémentaires spécifiques à l'action */
  additionalData?: any;        
}

/**
 * Service responsable de la gestion des actions et de leur résolution simultanée
 * Permet de planifier, annuler et résoudre des actions de combat en gérant
 * les conflits potentiels entre actions concurrentes
 */
export class ActionResolutionService {
  /** Liste des actions planifiées en attente d'exécution */
  private plannedActions: PlannedAction[] = [];
  
  /**
   * Planifie une nouvelle action à exécuter
   * L'action est ajoutée à la file d'attente pour être résolue lors de la prochaine étape de résolution
   * 
   * @param action - L'action à planifier (sans id ni timestamp qui sont générés automatiquement)
   * @returns L'identifiant unique de l'action planifiée
   */
  public planAction(action: Omit<PlannedAction, 'id' | 'timestamp'>): string {
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullAction: PlannedAction = {
      ...action,
      id: actionId,
      timestamp: Date.now()
    };
    
    this.plannedActions.push(fullAction);
    return actionId;
  }
  
  /**
   * Annule une action planifiée qui n'a pas encore été exécutée
   * Permet aux joueurs de reconsidérer leurs décisions ou d'annuler une action en cas d'erreur
   * 
   * @param actionId - L'identifiant unique de l'action à annuler
   * @returns `true` si l'action a été trouvée et annulée, `false` si l'action n'existait pas
   */
  public cancelAction(actionId: string): boolean {
    const initialLength = this.plannedActions.length;
    this.plannedActions = this.plannedActions.filter(action => action.id !== actionId);
    return initialLength !== this.plannedActions.length;
  }
  
  /**
   * Récupère la liste des actions actuellement planifiées
   * Utile pour afficher les actions en attente ou pour les analyser avant résolution
   * 
   * @returns Une copie de la liste des actions planifiées
   */
  public getPlannedActions(): PlannedAction[] {
    return [...this.plannedActions];
  }
  
  /**
   * Résout toutes les actions planifiées selon leur priorité
   * Cette méthode constitue le cœur du système de résolution d'actions:
   * 1. Trie les actions par priorité et horodatage
   * 2. Résout les conflits potentiels
   * 3. Exécute les actions dans l'ordre approprié
   * 4. Vide la liste des actions planifiées
   * 
   * @param executionCallback - Fonction appelée pour exécuter chaque action
   */
  public resolveActions(
    executionCallback: (action: PlannedAction) => void
  ): void {
    if (this.plannedActions.length === 0) {
      return;
    }
    
    // Trier les actions par priorité (décroissante) et timestamp (croissant)
    const sortedActions = [...this.plannedActions].sort((a, b) => {
      // D'abord par priorité (décroissante)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Ensuite par timestamp (croissant)
      return a.timestamp - b.timestamp;
    });
    
    // Créer une copie de l'état actuel avant toute modification
    // (Dans une implémentation réelle, on devrait cloner l'état du combat)
    
    // Appliquer toutes les actions dans l'ordre de priorité
    sortedActions.forEach(action => {
      executionCallback(action);
    });
    
    // Vider la liste des actions après résolution
    this.plannedActions = [];
  }
  
  /**
   * Détecte les conflits potentiels entre les actions planifiées
   * Un conflit peut exister lorsque deux actions ciblent la même carte,
   * lorsqu'une action pourrait empêcher l'autre d'être exécutée,
   * ou lorsque deux actions ont des effets contradictoires
   * 
   * @returns Un tableau des conflits détectés, chaque conflit contenant les deux actions
   * en conflit et la raison du conflit
   */
  public detectConflicts(): { action1: PlannedAction, action2: PlannedAction, reason: string }[] {
    const conflicts: { action1: PlannedAction, action2: PlannedAction, reason: string }[] = [];
    
    // Parcourir toutes les paires d'actions pour détecter les conflits
    for (let i = 0; i < this.plannedActions.length; i++) {
      const action1 = this.plannedActions[i];
      
      for (let j = i + 1; j < this.plannedActions.length; j++) {
        const action2 = this.plannedActions[j];
        
        // Vérifier les différents types de conflits possibles
        
        // 1. Conflit de ressource (même source épuisant ses ressources)
        if (action1.source.instanceId === action2.source.instanceId) {
          const totalCost = action1.cost + action2.cost;
          // Vérifier si la source a assez de motivation pour les deux actions
          // (Ici on suppose qu'il existe une propriété motivation, à adapter selon l'implémentation réelle)
          if (action1.source.temporaryStats.motivation < totalCost) {
            conflicts.push({
              action1,
              action2,
              reason: "Ressources insuffisantes pour exécuter les deux actions"
            });
          }
        }
        
        // 2. Conflit d'exclusivité (certaines actions ne peuvent pas être exécutées ensemble)
        // Exemple: deux sorts avec le même effet exclusif sur la même cible
        if (action1.type === ActionType.CAST_SPELL && action2.type === ActionType.CAST_SPELL &&
            action1.spell && action2.spell) {
          
          // Vérifier si les sorts ont des effets d'altération qui sont mutuellement exclusifs
          const hasAction1Alteration = action1.spell.effects.some((effect: SpellEffect) => effect.type === 'apply_alteration');
          const hasAction2Alteration = action2.spell.effects.some((effect: SpellEffect) => effect.type === 'apply_alteration');
          
          if (hasAction1Alteration && hasAction2Alteration) {
            // Vérifier si les actions partagent des cibles communes
            const commonTargets = action1.targets.filter(target1 => 
              action2.targets.some(target2 => target1.instanceId === target2.instanceId)
            );
            
            if (commonTargets.length > 0) {
              conflicts.push({
                action1,
                action2,
                reason: "Altérations potentiellement exclusives sur les mêmes cibles"
              });
            }
          }
        }
        
        // D'autres types de conflits peuvent être ajoutés selon les règles du jeu
      }
    }
    
    return conflicts;
  }
  
  /**
   * Résout automatiquement les conflits entre actions en appliquant des règles prédéfinies
   * Cette méthode applique une série de règles pour déterminer quelle action
   * doit être conservée en cas de conflit :
   * 1. L'action avec la priorité la plus élevée est conservée
   * 2. En cas d'égalité de priorité, l'action planifiée en premier est conservée
   * 
   * Les actions en conflit qui ne sont pas conservées sont automatiquement annulées
   * 
   * @returns Un tableau contenant les conflits résolus avec la règle appliquée pour chacun
   */
  public resolveConflictsAutomatically(): { conflict: any, resolution: string }[] {
    const conflicts = this.detectConflicts();
    const resolutions: { conflict: any, resolution: string }[] = [];
    
    // Pour chaque conflit, appliquer une règle de résolution
    conflicts.forEach(conflict => {
      const { action1, action2 } = conflict;
      
      // Règle 1: Priorité plus élevée gagne
      if (action1.priority !== action2.priority) {
        const lowerPriorityAction = action1.priority < action2.priority ? action1 : action2;
        this.cancelAction(lowerPriorityAction.id);
        
        resolutions.push({
          conflict,
          resolution: `Action "${lowerPriorityAction.id}" annulée car priorité inférieure`
        });
      }
      // Règle 2: En cas d'égalité de priorité, la première action planifiée est conservée
      else {
        const laterAction = action1.timestamp > action2.timestamp ? action1 : action2;
        this.cancelAction(laterAction.id);
        
        resolutions.push({
          conflict,
          resolution: `Action "${laterAction.id}" annulée car planifiée plus tard`
        });
      }
    });
    
    return resolutions;
  }
} 