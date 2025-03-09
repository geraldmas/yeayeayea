import { v4 as uuidv4 } from 'uuid';
import type { Player, MotivationModifier } from '../types/index';
import { gameConfigService } from '../utils/dataService';

/**
 * @file motivationService.ts
 * @description Service de gestion de la ressource de motivation pour le jeu Yeayeayea
 * 
 * Ce service gère la ressource principale du jeu (la motivation) qui permet aux joueurs
 * d'effectuer des actions pendant leur tour, comme jouer des cartes, lancer des sorts,
 * ou activer des effets spéciaux. La motivation est renouvelée à chaque tour et peut
 * être modifiée par divers effets (bonus, malus, altérations).
 * 
 * Le système de motivation comprend :
 * - Une valeur de base (par défaut 10 points par tour)
 * - Des modificateurs temporaires ou permanents
 * - Un mécanisme de consommation pour les actions
 * - Une gestion de la configuration globale des valeurs par défaut
 */

/**
 * Service de gestion de la motivation
 * Fournit des méthodes pour initialiser, renouveler, modifier et consommer 
 * la motivation des joueurs durant une partie
 */
export class MotivationService {
  /** Valeur par défaut de motivation attribuée par tour (configurable) */
  private static DEFAULT_MOTIVATION = 10;
  
  /**
   * Initialise la motivation d'un joueur avec les valeurs par défaut
   * Cette méthode est appelée lors de la création d'un nouveau joueur
   * ou la réinitialisation d'une partie
   * 
   * @param player - Le joueur à initialiser
   * @returns Le joueur mis à jour avec sa motivation initialisée
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
   * actifs et met à jour la durée des effets temporaires
   * 
   * @param player - Le joueur dont la motivation doit être renouvelée
   * @returns Le joueur avec sa motivation renouvelée et ses modificateurs mis à jour
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
   * Ces modificateurs peuvent être utilisés pour représenter des bonus/malus provenant
   * de cartes, altérations, objets ou effets spéciaux
   * 
   * @param player - Le joueur auquel ajouter le modificateur
   * @param value - La valeur du modificateur (positive pour bonus, négative pour malus)
   * @param isPercentage - Si true, la valeur est interprétée comme un pourcentage, sinon comme valeur absolue
   * @param source - L'origine du modificateur (nom de carte, effet, etc.) pour le suivi et l'affichage
   * @param duration - La durée en tours (undefined ou -1 pour un effet permanent)
   * @returns Le joueur mis à jour avec le nouveau modificateur ajouté
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
   * Supprime un modificateur de motivation spécifique par son identifiant
   * Utile pour annuler des effets, dissiper des altérations ou nettoyer 
   * des modificateurs qui ne sont plus pertinents
   * 
   * @param player - Le joueur dont on veut supprimer un modificateur
   * @param modifierId - L'identifiant unique du modificateur à supprimer
   * @returns Le joueur mis à jour avec le modificateur supprimé
   */
  public static removeMotivationModifier(player: Player, modifierId: string): Player {
    return {
      ...player,
      motivationModifiers: player.motivationModifiers.filter((mod: MotivationModifier) => mod.id !== modifierId)
    };
  }
  
  /**
   * Consomme de la motivation pour une action
   * Vérifie d'abord si le joueur a suffisamment de motivation avant de la consommer
   * Cette méthode est utilisée lors de l'exécution d'actions qui nécessitent de la motivation
   * 
   * @param player - Le joueur qui souhaite effectuer l'action
   * @param amount - La quantité de motivation nécessaire pour l'action
   * @returns Le joueur avec sa motivation réduite, ou `null` si la motivation est insuffisante
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
   * Cette méthode permet de récupérer la valeur configurée dans les paramètres globaux
   * Si la valeur n'existe pas dans la configuration, la valeur par défaut est utilisée
   * 
   * @returns La valeur de motivation par défaut configurée ou la valeur par défaut (10)
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