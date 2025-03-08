import { CardInstance, TargetingCriteria, TargetType } from '../types/combat';
import { v4 as uuidv4 } from 'uuid';
import { SpellEffect } from '../types/index';

/**
 * Résultat d'une opération de ciblage
 */
export interface TargetingResult {
  id: string;
  targets: CardInstance[];
  success: boolean;
  error?: string;
}

/**
 * Fonction de callback pour la sélection manuelle de cibles
 */
export type ManualTargetingCallback = (options: {
  source: CardInstance;
  criteria?: TargetingCriteria;
  minTargets?: number;
  maxTargets?: number;
  onComplete: (result: TargetingResult) => void;
  onCancel: () => void;
}) => void;

/**
 * Service responsable de la gestion du ciblage
 */
export class TargetingService {
  private manualTargetingCallback: ManualTargetingCallback | null = null;
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
   * @param targetType Type de ciblage
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