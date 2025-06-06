import { CardInstance } from '../types/combat';
import { Spell, SpellEffect } from '../types/index';
import { gameConfigService } from '../utils/dataService';

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
 * Définit les différentes stratégies de résolution des conflits disponibles
 * @enum {string}
 */
export enum ConflictResolutionStrategy {
  /** Résout les conflits en favorisant la première action planifiée (FIFO - First In, First Out) */
  FIFO = 'fifo',
  
  /** Résout les conflits en favorisant la dernière action planifiée (LIFO - Last In, First Out) */
  LIFO = 'lifo',
  
  /** Résout les conflits de manière aléatoire */
  RANDOM = 'random',
  
  /** Résout les conflits en fonction de la priorité définie par l'utilisateur */
  PRIORITY = 'priority',
  
  /** Résout les conflits en priorisant les actions ayant le plus haut coût */
  COST = 'cost',
  
  /** Résout les conflits en priorisant les actions ayant le plus bas coût */
  LOW_COST = 'low_cost'
}

/**
 * Interface représentant les détails d'un conflit entre deux actions
 */
export interface ConflictDetails {
  /** Première action impliquée dans le conflit */
  action1: PlannedAction;
  
  /** Deuxième action impliquée dans le conflit */
  action2: PlannedAction;
  
  /** Description textuelle de la raison du conflit */
  reason: string;
  
  /** Type de conflit identifié */
  type: 'resource' | 'exclusivity' | 'target' | 'other';
}

/**
 * Interface décrivant la résolution d'un conflit
 */
export interface ConflictResolution {
  /** Détails du conflit qui a été résolu */
  conflict: ConflictDetails;
  
  /** Description de la règle appliquée pour résoudre le conflit */
  resolution: string;
  
  /** Identifiant de l'action qui a été conservée */
  keptActionId: string;
  
  /** Identifiant de l'action qui a été annulée */
  cancelledActionId: string;
}

/**
 * Service responsable de la gestion des actions et de leur résolution simultanée
 * Permet de planifier, annuler et résoudre des actions de combat en gérant
 * les conflits potentiels entre actions concurrentes
 */
export class ActionResolutionService {
  /** Liste des actions planifiées en attente d'exécution */
  private plannedActions: PlannedAction[] = [];
  
  /** Stratégie de résolution de conflits actuelle */
  private conflictStrategy: ConflictResolutionStrategy = ConflictResolutionStrategy.FIFO;
  
  /** Probabilité d'utiliser l'aléatoire pour résoudre un conflit (0-100) */
  private randomResolutionChance: number = 0;
  
  /**
   * Crée une nouvelle instance du service de résolution d'actions
   * @param strategy Stratégie de résolution de conflits à utiliser (par défaut: FIFO)
   * @param randomChance Probabilité d'utiliser l'aléatoire pour résoudre un conflit (0-100)
   */
  constructor(
    strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.FIFO,
    randomChance: number = 0
  ) {
    this.conflictStrategy = strategy;
    this.randomResolutionChance = Math.min(100, Math.max(0, randomChance));
  }
  
  /**
   * Modifie la stratégie de résolution de conflits
   * @param strategy Nouvelle stratégie à utiliser
   */
  public setConflictStrategy(strategy: ConflictResolutionStrategy): void {
    this.conflictStrategy = strategy;
  }
  
  /**
   * Modifie la probabilité d'utiliser l'aléatoire pour résoudre les conflits
   * @param chance Probabilité entre 0 et 100
   */
  public setRandomResolutionChance(chance: number): void {
    this.randomResolutionChance = Math.min(100, Math.max(0, chance));
  }
  
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
    
    // Résout les conflits avant de trier et d'exécuter les actions
    this.resolveConflictsAutomatically();
    
    // Trier les actions selon la stratégie actuelle
    const sortedActions = this.sortActionsByStrategy();
    
    // Appliquer toutes les actions dans l'ordre de priorité
    sortedActions.forEach(action => {
      executionCallback(action);
    });
    
    // Vider la liste des actions après résolution
    this.plannedActions = [];
  }
  
  /**
   * Trie les actions selon la stratégie de résolution définie
   * @returns Les actions triées selon la stratégie actuelle
   */
  private sortActionsByStrategy(): PlannedAction[] {
    const actions = [...this.plannedActions];
    
    switch (this.conflictStrategy) {
      case ConflictResolutionStrategy.FIFO:
        // Premier arrivé, premier servi (timestamp croissant)
        return actions.sort((a, b) => a.timestamp - b.timestamp);
        
      case ConflictResolutionStrategy.LIFO:
        // Dernier arrivé, premier servi (timestamp décroissant)
        return actions.sort((a, b) => b.timestamp - a.timestamp);
        
      case ConflictResolutionStrategy.RANDOM:
        // Ordre aléatoire
        return this.shuffleArray(actions);
        
      case ConflictResolutionStrategy.PRIORITY:
        // Trier par priorité puis par timestamp
        return actions.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority; // Priorité décroissante
          }
          return a.timestamp - b.timestamp; // Timestamp croissant
        });
        
      case ConflictResolutionStrategy.COST:
        // Trier par coût puis par timestamp
        return actions.sort((a, b) => {
          if (a.cost !== b.cost) {
            return b.cost - a.cost; // Coût décroissant
          }
          return a.timestamp - b.timestamp; // Timestamp croissant
        });
        
      case ConflictResolutionStrategy.LOW_COST:
        // Trier par coût faible puis par timestamp
        return actions.sort((a, b) => {
          if (a.cost !== b.cost) {
            return a.cost - b.cost; // Coût croissant
          }
          return a.timestamp - b.timestamp; // Timestamp croissant
        });
        
      default:
        // Par défaut, FIFO
        return actions.sort((a, b) => a.timestamp - b.timestamp);
    }
  }
  
  /**
   * Mélange un tableau de manière aléatoire
   * @param array Tableau à mélanger
   * @returns Le tableau mélangé
   */
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
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
  public detectConflicts(): ConflictDetails[] {
    const conflicts: ConflictDetails[] = [];
    
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
          if (action1.source.temporaryStats.motivation < totalCost) {
            conflicts.push({
              action1,
              action2,
              reason: "Ressources insuffisantes pour exécuter les deux actions",
              type: 'resource'
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
                reason: "Altérations potentiellement exclusives sur les mêmes cibles",
                type: 'exclusivity'
              });
            }
          }
        }
        
        // 3. Conflit de ciblage (actions qui s'annulent potentiellement sur la même cible)
        // Par exemple un heal et un dégât appliqués en même temps
        const commonTargets = action1.targets.filter(target1 => 
          action2.targets.some(target2 => target1.instanceId === target2.instanceId)
        );
        
        if (commonTargets.length > 0 && 
            ((action1.type === ActionType.CAST_SPELL && action2.type === ActionType.CAST_SPELL) || 
             (action1.type === ActionType.ATTACK && action2.type === ActionType.ATTACK))) {
          
          conflicts.push({
            action1,
            action2,
            reason: "Actions potentiellement contradictoires sur les mêmes cibles",
            type: 'target'
          });
        }
        
        // D'autres types de conflits peuvent être ajoutés selon les règles du jeu
      }
    }
    
    return conflicts;
  }
  
  /**
   * Résout automatiquement les conflits entre actions en appliquant des règles prédéfinies
   * Cette méthode applique la stratégie de résolution définie pour déterminer quelle action
   * doit être conservée en cas de conflit.
   * 
   * Les actions en conflit qui ne sont pas conservées sont automatiquement annulées
   * 
   * @returns Un tableau contenant les conflits résolus avec la règle appliquée pour chacun
   */
  public resolveConflictsAutomatically(): ConflictResolution[] {
    const conflicts = this.detectConflicts();
    const resolutions: ConflictResolution[] = [];
    
    // Pour chaque conflit, appliquer la stratégie de résolution
    conflicts.forEach(conflict => {
      const { action1, action2 } = conflict;
      
      // Déterminer si on utilise l'aléatoire pour ce conflit
      const useRandom = Math.random() * 100 < this.randomResolutionChance;
      
      // Fonction pour déterminer quelle action conserver
      let keepAction1: boolean;
      let resolutionDescription: string;
      
      if (useRandom) {
        // Résolution aléatoire
        keepAction1 = Math.random() < 0.5;
        resolutionDescription = "Résolution aléatoire du conflit";
      } else {
        // Appliquer la stratégie définie
        switch (this.conflictStrategy) {
          case ConflictResolutionStrategy.FIFO:
            // Premier arrivé, premier servi
            keepAction1 = action1.timestamp < action2.timestamp;
            resolutionDescription = keepAction1 
              ? "Conservation de l'action planifiée en premier" 
              : "Conservation de l'action planifiée en dernier";
            break;
            
          case ConflictResolutionStrategy.LIFO:
            // Dernier arrivé, premier servi
            keepAction1 = action1.timestamp > action2.timestamp;
            resolutionDescription = keepAction1 
              ? "Conservation de l'action planifiée plus tard" 
              : "Conservation de l'action planifiée plus tôt";
            break;
            
          case ConflictResolutionStrategy.PRIORITY:
            // Action avec la priorité la plus élevée
            if (action1.priority !== action2.priority) {
              keepAction1 = action1.priority > action2.priority;
              resolutionDescription = keepAction1 
                ? "Conservation de l'action avec priorité supérieure" 
                : "Conservation de l'action avec priorité inférieure";
            } else {
              // En cas d'égalité, on utilise FIFO
              keepAction1 = action1.timestamp < action2.timestamp;
              resolutionDescription = keepAction1 
                ? "Priorités égales, conservation de l'action planifiée en premier" 
                : "Priorités égales, conservation de l'action planifiée en second";
            }
            break;
            
          case ConflictResolutionStrategy.COST:
            // Action avec le coût le plus élevé
            if (action1.cost !== action2.cost) {
              keepAction1 = action1.cost > action2.cost;
              resolutionDescription = keepAction1 
                ? "Conservation de l'action avec coût supérieur" 
                : "Conservation de l'action avec coût inférieur";
            } else {
              // En cas d'égalité, on utilise FIFO
              keepAction1 = action1.timestamp < action2.timestamp;
              resolutionDescription = keepAction1 
                ? "Coûts égaux, conservation de l'action planifiée en premier" 
                : "Coûts égaux, conservation de l'action planifiée en second";
            }
            break;
            
          case ConflictResolutionStrategy.LOW_COST:
            // Action avec le coût le plus faible
            if (action1.cost !== action2.cost) {
              keepAction1 = action1.cost < action2.cost;
              resolutionDescription = keepAction1 
                ? "Conservation de l'action avec coût inférieur" 
                : "Conservation de l'action avec coût supérieur";
            } else {
              // En cas d'égalité, on utilise FIFO
              keepAction1 = action1.timestamp < action2.timestamp;
              resolutionDescription = keepAction1 
                ? "Coûts égaux, conservation de l'action planifiée en premier" 
                : "Coûts égaux, conservation de l'action planifiée en second";
            }
            break;
            
          case ConflictResolutionStrategy.RANDOM:
            // Choix aléatoire
            keepAction1 = Math.random() < 0.5;
            resolutionDescription = "Résolution aléatoire du conflit";
            break;
            
          default:
            // Par défaut, FIFO
            keepAction1 = action1.timestamp < action2.timestamp;
            resolutionDescription = keepAction1 
              ? "Conservation de l'action planifiée en premier (par défaut)" 
              : "Conservation de l'action planifiée en second (par défaut)";
        }
      }
      
      // Annuler l'action qui n'est pas conservée
      const keptAction = keepAction1 ? action1 : action2;
      const cancelledAction = keepAction1 ? action2 : action1;
      
      // Canceller l'action non conservée
      this.cancelAction(cancelledAction.id);
      
      // Enregistrer la résolution
      resolutions.push({
        conflict,
        resolution: resolutionDescription,
        keptActionId: keptAction.id,
        cancelledActionId: cancelledAction.id
      });
    });
    
    return resolutions;
  }
  
  /**
   * Récupère des informations sur les conflits et leur résolution pour l'interface utilisateur
   * @returns Un objet contenant les détails des conflits détectés et de leur résolution
   */
  public getConflictInfo(): {
    strategy: ConflictResolutionStrategy;
    randomChance: number;
    conflicts: ConflictDetails[];
    resolutions: ConflictResolution[];
  } {
    const conflicts = this.detectConflicts();
    const resolutions = this.resolveConflictsAutomatically();
    
    return {
      strategy: this.conflictStrategy,
      randomChance: this.randomResolutionChance,
      conflicts,
      resolutions
    };
  }

  /**
   * Charge la configuration de résolution des conflits depuis gameConfigService
   */
  public static async loadConfig(): Promise<{
    strategy: ConflictResolutionStrategy;
    randomChance: number;
  }> {
    try {
      const strategyVal = await gameConfigService.getValue<string>('conflict_strategy');
      const chanceVal = await gameConfigService.getValue<number>('conflict_random_chance');
      return {
        strategy: (strategyVal as ConflictResolutionStrategy) || ConflictResolutionStrategy.FIFO,
        randomChance: chanceVal ?? 0,
      };
    } catch (error) {
      console.error('Erreur chargement configuration conflits:', error);
      return { strategy: ConflictResolutionStrategy.FIFO, randomChance: 0 };
    }
  }

  /**
   * Met à jour la stratégie de résolution des conflits
   */
  public static async updateStrategy(strategy: ConflictResolutionStrategy): Promise<void> {
    try {
      await gameConfigService.update('conflict_strategy', { value: strategy });
    } catch (error) {
      console.error('Erreur mise à jour stratégie:', error);
    }
  }

  /**
   * Met à jour la probabilité d'utilisation de l'aléatoire
   */
  public static async updateRandomChance(chance: number): Promise<void> {
    try {
      await gameConfigService.update('conflict_random_chance', { value: chance });
    } catch (error) {
      console.error('Erreur mise à jour chance aléatoire:', error);
    }
  }
}
