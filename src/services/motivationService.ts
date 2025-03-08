import { v4 as uuidv4 } from 'uuid';
import { Player, MotivationModifier } from '../types';
import { gameConfigService } from '../utils/dataService';

/**
 * Service de gestion de la motivation
 * La motivation est la ressource principale utilisée pour lancer des sorts et utiliser des actions
 */
export class MotivationService {
  // Valeur par défaut de motivation par tour
  private static DEFAULT_MOTIVATION = 10;
  
  /**
   * Initialise la motivation d'un joueur avec les valeurs par défaut
   * @param player Le joueur à initialiser
   * @returns Le joueur avec sa motivation initialisée
   */
  public static initializePlayerMotivation(player: Player): Player {
    return {
      ...player,
      baseMotivation: this.DEFAULT_MOTIVATION,
      motivation: this.DEFAULT_MOTIVATION,
      motivationModifiers: []
    };
  }
  
  /**
   * Renouvelle la motivation d'un joueur au début de son tour
   * Cette méthode calcule la motivation en tenant compte des modificateurs
   * @param player Le joueur dont la motivation doit être renouvelée
   * @returns Le joueur avec sa motivation renouvelée
   */
  public static renewMotivation(player: Player): Player {
    // Récupérer la motivation de base du joueur
    const baseMotivation = player.baseMotivation || this.DEFAULT_MOTIVATION;
    
    // Filtrer les modificateurs expirés
    const activeModifiers = player.motivationModifiers.filter((mod: MotivationModifier) => 
      mod.duration === undefined || mod.duration === -1 || mod.duration > 0
    );
    
    // Réduire la durée des modificateurs temporaires
    const updatedModifiers = activeModifiers.map((mod: MotivationModifier) => {
      if (mod.duration !== undefined && mod.duration > 0) {
        return { ...mod, duration: mod.duration - 1 };
      }
      return mod;
    });
    
    // Calculer la nouvelle valeur de motivation en appliquant les modificateurs
    let newMotivation = baseMotivation;
    
    // Appliquer d'abord tous les modificateurs en valeur absolue
    const absoluteModifiers = updatedModifiers.filter((mod: MotivationModifier) => !mod.isPercentage);
    for (const mod of absoluteModifiers) {
      newMotivation += mod.value;
    }
    
    // Puis appliquer tous les modificateurs en pourcentage
    const percentageModifiers = updatedModifiers.filter((mod: MotivationModifier) => mod.isPercentage);
    for (const mod of percentageModifiers) {
      newMotivation *= (1 + mod.value / 100);
    }
    
    // Arrondir la motivation et s'assurer qu'elle n'est pas négative
    newMotivation = Math.max(0, Math.round(newMotivation));
    
    // Mettre à jour le joueur
    return {
      ...player,
      motivation: newMotivation,
      motivationModifiers: updatedModifiers
    };
  }
  
  /**
   * Ajoute un modificateur à la motivation d'un joueur
   * @param player Le joueur à modifier
   * @param value La valeur du modificateur (absolu ou pourcentage)
   * @param isPercentage Indique si la valeur est un pourcentage
   * @param source L'origine du modificateur (carte, effet, etc.)
   * @param duration La durée en tours (undefined ou -1 = permanent)
   * @returns Le joueur avec le modificateur ajouté
   */
  public static addMotivationModifier(
    player: Player,
    value: number,
    isPercentage: boolean = false,
    source: string,
    duration?: number
  ): Player {
    const newModifier: MotivationModifier = {
      id: uuidv4(),
      value,
      isPercentage,
      source,
      duration
    };
    
    return {
      ...player,
      motivationModifiers: [...player.motivationModifiers, newModifier]
    };
  }
  
  /**
   * Supprime un modificateur de motivation par son ID
   * @param player Le joueur à modifier
   * @param modifierId L'ID du modificateur à supprimer
   * @returns Le joueur avec le modificateur supprimé
   */
  public static removeMotivationModifier(player: Player, modifierId: string): Player {
    return {
      ...player,
      motivationModifiers: player.motivationModifiers.filter((mod: MotivationModifier) => mod.id !== modifierId)
    };
  }
  
  /**
   * Consomme de la motivation pour une action
   * @param player Le joueur qui consomme la motivation
   * @param amount La quantité de motivation à consommer
   * @returns Le joueur avec sa motivation mise à jour, ou null si la motivation est insuffisante
   */
  public static consumeMotivation(player: Player, amount: number): Player | null {
    if (player.motivation < amount) {
      return null; // Motivation insuffisante
    }
    
    return {
      ...player,
      motivation: player.motivation - amount
    };
  }
  
  /**
   * Charge la valeur de motivation par défaut depuis la configuration du jeu
   * Si la valeur n'est pas définie, utilise la valeur par défaut (10)
   * @returns La valeur de motivation par défaut
   */
  public static async loadDefaultMotivation(): Promise<number> {
    try {
      const configValue = await gameConfigService.getValue<number>('default_motivation');
      return configValue !== null ? configValue : this.DEFAULT_MOTIVATION;
    } catch (error) {
      console.error('Erreur lors du chargement de la motivation par défaut:', error);
      return this.DEFAULT_MOTIVATION;
    }
  }
  
  /**
   * Met à jour la valeur de motivation par défaut dans la configuration
   * @param value La nouvelle valeur par défaut
   */
  public static async updateDefaultMotivation(value: number): Promise<void> {
    try {
      await gameConfigService.update('default_motivation', { value });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la motivation par défaut:', error);
      throw error;
    }
  }
} 