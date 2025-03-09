import { CardInstance, TargetingCriteria, TargetType } from '../types/combat';
import { v4 as uuidv4 } from 'uuid';
import { SpellEffect } from '../types/index';

/**
 * @file targetingService.ts
 * @description Service de gestion du ciblage pour le jeu Yeayeayea
 * Ce module fournit les fonctionnalités pour déterminer quelles cartes peuvent être ciblées
 * par des sorts, actions ou effets, et gère le ciblage manuel par l'utilisateur.
 */

/**
 * Résultat d'une opération de ciblage
 */
export interface TargetingResult {
  /** Identifiant unique de l'opération de ciblage */
  id: string;
  /** Liste des cartes ciblées */
  targets: CardInstance[];
  /** Indique si l'opération de ciblage a réussi */
  success: boolean;
  /** Message d'erreur en cas d'échec */
  error?: string;
}

/**
 * Fonction de callback pour la sélection manuelle de cibles
 * Utilisée pour permettre à l'interface utilisateur de gérer les sélections de cibles
 */
export type ManualTargetingCallback = (options: {
  /** Carte source qui effectue l'action */
  source: CardInstance;
  /** Critères optionnels pour filtrer les cibles disponibles */
  criteria?: TargetingCriteria;
  /** Nombre minimum de cibles à sélectionner */
  minTargets?: number;
  /** Nombre maximum de cibles à sélectionner */
  maxTargets?: number;
  /** Fonction à appeler lorsque la sélection est terminée */
  onComplete: (result: TargetingResult) => void;
  /** Fonction à appeler lorsque la sélection est annulée */
  onCancel: () => void;
}) => void;

/**
 * Service responsable de la gestion du ciblage
 * Permet de déterminer quelles cartes peuvent être ciblées par des sorts ou actions,
 * selon différents critères et types de ciblage (aléatoire, manuel, spécifique).
 */
export class TargetingService {
  /** Callback pour le ciblage manuel, défini par l'interface utilisateur */
  private manualTargetingCallback: ManualTargetingCallback | null = null;
  
  /** Map des opérations de ciblage en attente, avec leurs callbacks de résolution */
  private pendingTargetOperations: Map<string, (targets: CardInstance[]) => void> = new Map();
  
  /**
   * Enregistre le callback pour le ciblage manuel
   * @param callback Fonction à appeler lorsqu'un ciblage manuel est requis
   */
  public registerManualTargetingCallback(callback: ManualTargetingCallback): void {
    this.manualTargetingCallback = callback;
  }
  
  /**
   * Réalise une opération de ciblage (automatique ou manuel)
   * @param source Carte source de l'action
   * @param targetType Type de ciblage (self, opponent, all, tagged, random, manual)
   * @param availableTargets Toutes les cibles disponibles
   * @param effect Effet à appliquer avec des critères de ciblage éventuels
   * @param count Nombre de cibles à sélectionner (par défaut 1)
   * @returns Promise avec le résultat du ciblage
   */
  public async getTargets(
    source: CardInstance,
    targetType: TargetType,
    availableTargets: CardInstance[],
    effect?: SpellEffect,
    count: number = 1
  ): Promise<TargetingResult> {
    const id = uuidv4();
    
    // Filtrer les cibles selon le type de ciblage de base
    let filteredTargets: CardInstance[] = [];
    
    switch (targetType) {
      case 'self':
        filteredTargets = [source];
        break;
        
      case 'opponent':
        filteredTargets = availableTargets.filter(target => target.instanceId !== source.instanceId);
        break;
        
      case 'all':
        filteredTargets = [...availableTargets];
        break;
        
      case 'tagged':
        if (effect?.tagTarget) {
          const tagId = parseInt(effect.tagTarget);
          filteredTargets = availableTargets.filter(target => 
            target.activeTags.some(tag => tag.tag.id === tagId)
          );
        } else {
          return {
            id,
            targets: [],
            success: false,
            error: "Tag cible non spécifié pour le ciblage par tag"
          };
        }
        break;
        
      case 'random':
        // Pour random, on prend toutes les cibles possibles et on en sélectionne une aléatoirement ensuite
        filteredTargets = availableTargets.filter(target => target.instanceId !== source.instanceId);
        
        if (filteredTargets.length === 0) {
          return {
            id,
            targets: [],
            success: false,
            error: "Aucune cible disponible pour le ciblage aléatoire"
          };
        }
        
        // Sélectionner des cibles aléatoires
        const randomTargets: CardInstance[] = [];
        const tempTargets = [...filteredTargets];
        
        for (let i = 0; i < Math.min(count, tempTargets.length); i++) {
          const randomIndex = Math.floor(Math.random() * tempTargets.length);
          randomTargets.push(tempTargets[randomIndex]);
          tempTargets.splice(randomIndex, 1);
        }
        
        return {
          id,
          targets: randomTargets,
          success: true
        };
        
      case 'manual':
        // Vérifier si le callback pour le ciblage manuel est disponible
        if (!this.manualTargetingCallback) {
          return {
            id,
            targets: [],
            success: false,
            error: "Le système de ciblage manuel n'est pas configuré"
          };
        }
        
        // Déterminer les critères de ciblage basés sur l'effet
        const criteria: TargetingCriteria = effect?.manualTargetingCriteria || {};
        
        // Filtrer les cibles en excluant la source par défaut
        filteredTargets = availableTargets.filter(target => target.instanceId !== source.instanceId);
        
        // Créer une promesse pour attendre la sélection de l'utilisateur
        return new Promise<TargetingResult>((resolve) => {
          // Stocker la fonction de résolution pour l'utiliser lorsque l'utilisateur termine sa sélection
          const handleCompletion = (result: TargetingResult) => {
            this.pendingTargetOperations.delete(id);
            resolve(result);
          };
          
          // Définir ce qui se passe en cas d'annulation
          const handleCancel = () => {
            this.pendingTargetOperations.delete(id);
            resolve({
              id,
              targets: [],
              success: false,
              error: "Ciblage annulé par l'utilisateur"
            });
          };
          
          // Appeler le callback pour afficher l'interface de ciblage manuel
          if (this.manualTargetingCallback) {
            this.manualTargetingCallback({
              source,
              criteria,
              minTargets: 1,
              maxTargets: count,
              onComplete: (result) => handleCompletion(result),
              onCancel: () => handleCancel()
            });
          } else {
            handleCancel();
          }
        });
        
      default:
        return {
          id,
          targets: [],
          success: false,
          error: `Type de ciblage non reconnu: ${targetType}`
        };
    }
    
    // Si on arrive ici, c'est un ciblage automatique (sauf 'random' et 'manual' qui sont déjà gérés)
    // Vérifier si des cibles ont été trouvées
    if (filteredTargets.length === 0) {
      return {
        id,
        targets: [],
        success: false,
        error: `Aucune cible ne correspond aux critères de ciblage ${targetType}`
      };
    }
    
    // Limiter le nombre de cibles au nombre demandé
    const finalTargets = filteredTargets.slice(0, count);
    
    return {
      id,
      targets: finalTargets,
      success: true
    };
  }
  
  /**
   * Nettoie toutes les opérations de ciblage en attente
   */
  public clearPendingOperations(): void {
    this.pendingTargetOperations.clear();
  }
} 