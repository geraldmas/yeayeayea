import { CardInstance } from '../types/combat';
import { Spell, SpellEffect } from '../types/index';

/**
 * Types d'actions possibles dans le système de combat
 */
export enum ActionType {
  ATTACK = 'attack',
  CAST_SPELL = 'cast_spell',
  USE_ABILITY = 'use_ability',
  USE_ITEM = 'use_item',
  ACTIVATE_EFFECT = 'activate_effect',
}

/**
 * Interface représentant une action planifiée
 */
export interface PlannedAction {
  id: string;                  // Identifiant unique de l'action
  type: ActionType;            // Type d'action
  source: CardInstance;        // Carte qui initie l'action
  targets: CardInstance[];     // Cibles de l'action
  spell?: Spell;               // Sort utilisé (si applicable)
  priority: number;            // Priorité de l'action (plus élevé = exécuté en premier en cas de conflit)
  timestamp: number;           // Horodatage de planification
  cost: number;                // Coût en motivation
  additionalData?: any;        // Données supplémentaires spécifiques à l'action
}

/**
 * Service responsable de la gestion des actions et de leur résolution simultanée
 */
export class ActionResolutionService {
  private plannedActions: PlannedAction[] = [];
  
  /**
   * Planifie une nouvelle action à exécuter
   * @param action L'action à planifier
   * @returns L'identifiant de l'action planifiée
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
   * Annule une action planifiée
   * @param actionId L'identifiant de l'action à annuler
   * @returns true si l'annulation a réussi, false sinon
   */
  public cancelAction(actionId: string): boolean {
    const initialLength = this.plannedActions.length;
    this.plannedActions = this.plannedActions.filter(action => action.id !== actionId);
    return initialLength !== this.plannedActions.length;
  }
  
  /**
   * Obtient toutes les actions planifiées
   * @returns La liste des actions planifiées
   */
  public getPlannedActions(): PlannedAction[] {
    return [...this.plannedActions];
  }
  
  /**
   * Résout toutes les actions planifiées de manière simultanée
   * @param executionCallback Fonction appelée pour exécuter chaque action
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
   * Vérifie les conflits potentiels entre les actions planifiées
   * @returns Liste des conflits détectés
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
   * Résout automatiquement les conflits en appliquant des règles prédéfinies
   * @returns Liste des conflits qui ont été résolus
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