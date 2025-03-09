/**
 * @file attackConditionsService.ts
 * @description Service de gestion des conditions d'attaque
 * Ce service implémente la logique pour déterminer si une attaque est possible,
 * notamment les attaques directes sur la base adverse.
 */

import { CardInstance } from '../types/combat';
import { Player } from '../types/player';

/**
 * Énumération des types de cibles d'attaque
 */
export enum AttackTargetType {
  /** Attaque visant un personnage ou un objet */
  ENTITY = 'entity',
  /** Attaque visant directement la base adverse */
  BASE = 'base'
}

/**
 * Interface définissant les options d'attaque
 */
export interface AttackOptions {
  /** Entité qui effectue l'attaque */
  attacker: CardInstance;
  
  /** Joueur qui possède l'attaquant */
  sourcePlayer: Player;
  
  /** Joueur cible de l'attaque */
  targetPlayer: Player;
  
  /** Type de cible visée par l'attaque */
  targetType: AttackTargetType;
  
  /** Option pour ignorer certaines conditions (pour les capacités spéciales) */
  ignoreConditions?: boolean;
}

/**
 * Service gérant la logique des conditions d'attaque
 */
export class AttackConditionsService {
  /**
   * Vérifie si une attaque est possible en fonction des règles du jeu
   * @param options - Options d'attaque contenant les informations nécessaires
   * @returns Objet contenant le résultat de la vérification et un message explicatif
   */
  static canAttack(options: AttackOptions): { canAttack: boolean; reason?: string } {
    const { attacker, sourcePlayer, targetPlayer, targetType, ignoreConditions } = options;
    
    // Vérifier si l'attaquant peut attaquer (n'est pas épuisé, etc.)
    if (!attacker.canAttack()) {
      return { canAttack: false, reason: "Cette entité ne peut pas attaquer actuellement." };
    }
    
    // Si on cible la base, vérifier les conditions spécifiques
    if (targetType === AttackTargetType.BASE) {
      return this.canAttackBase(sourcePlayer, targetPlayer, ignoreConditions);
    }
    
    // Pour une attaque sur une entité, aucune condition particulière
    return { canAttack: true };
  }
  
  /**
   * Vérifie si une attaque directe sur la base adverse est possible
   * @param sourcePlayer - Joueur qui effectue l'attaque
   * @param targetPlayer - Joueur dont la base est ciblée
   * @param ignoreConditions - Option pour ignorer certaines conditions (capacités spéciales)
   * @returns Objet contenant le résultat de la vérification et un message explicatif
   */
  static canAttackBase(
    sourcePlayer: Player,
    targetPlayer: Player,
    ignoreConditions?: boolean
  ): { canAttack: boolean; reason?: string } {
    // Si l'option d'ignorer les conditions est activée (capacité spéciale),
    // on autorise l'attaque directe
    if (ignoreConditions) {
      return { canAttack: true };
    }
    
    // Vérifier si l'adversaire a des personnages sur le terrain
    // (règle du cahier des charges : l'adversaire ne peut être attaqué directement
    // tant qu'il a au moins un personnage sur le terrain)
    if (targetPlayer.characters.length > 0) {
      return { 
        canAttack: false, 
        reason: "Impossible d'attaquer directement la base tant que l'adversaire a des personnages sur le terrain."
      };
    }
    
    // Si l'adversaire n'a plus de personnages, l'attaque sur la base est autorisée
    return { canAttack: true };
  }
  
  /**
   * Applique les modificateurs de dégâts pour une attaque sur la base
   * Selon le cahier des charges, les dégâts sur la base sont divisés par deux de base
   * mais cette valeur peut être modifiée par des effets spécifiques
   * @param damage - Le montant initial des dégâts
   * @param attacker - L'entité qui effectue l'attaque
   * @param targetPlayer - Le joueur dont la base est ciblée
   * @returns Le montant des dégâts après application des modificateurs
   */
  static applyBaseAttackModifiers(
    damage: number,
    attacker: CardInstance,
    targetPlayer: Player
  ): number {
    // Par défaut, les dégâts sur la base sont divisés par deux
    let modifiedDamage = damage / 2;
    
    // Ici, on pourrait ajouter des modificateurs supplémentaires 
    // en fonction des tags, objets équipés, lieux actifs, etc.
    
    // Assurer que les dégâts ne soient jamais négatifs
    return Math.max(0, Math.floor(modifiedDamage));
  }
} 