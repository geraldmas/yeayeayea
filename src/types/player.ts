/**
 * @file player.ts
 * @description Types spécifiques au joueur et à sa base pour le jeu Yeayeayea
 * Ce fichier définit les interfaces pour la gestion des joueurs et leurs bases
 */

import { CardInstance } from './combat';
import { Alteration } from '../types';

/**
 * Interface représentant la base d'un joueur
 * La base est une entité distincte mais liée au joueur,
 * avec ses propres points de vie et pouvant recevoir des altérations
 */
export interface PlayerBase {
  /**
   * Identifiant unique de la base
   */
  id: string;
  
  /**
   * Points de vie actuels de la base
   */
  currentHealth: number;
  
  /**
   * Points de vie maximum de la base
   * Ce montant est configurable via les paramètres globaux
   */
  maxHealth: number;
  
  /**
   * Altérations actives sur la base
   * Permet d'appliquer des effets temporaires comme des bonus/malus
   */
  activeAlterations: {
    alteration: Alteration;
    remainingDuration: number | null; // null pour les altérations permanentes
    stackCount: number;
    source: CardInstance | null;
  }[];
  
  /**
   * Applique des dégâts à la base
   * @param amount - Quantité de dégâts à appliquer
   * @param source - Source des dégâts (carte ou autre)
   * @returns - Quantité de dégâts réellement appliqués
   */
  applyDamage: (amount: number, source?: string) => number;
  
  /**
   * Soigne la base
   * @param amount - Quantité de points de vie à restaurer
   * @param source - Source du soin
   * @returns - Quantité de points de vie réellement restaurés
   */
  heal: (amount: number, source?: string) => number;
  
  /**
   * Ajoute une altération à la base
   * @param alteration - L'altération à appliquer
   * @param source - Source de l'altération
   */
  addAlteration: (alteration: Alteration, source: CardInstance | null) => void;
  
  /**
   * Supprime une altération de la base
   * @param alterationId - ID de l'altération à supprimer
   */
  removeAlteration: (alterationId: number) => void;
  
  /**
   * Vérifie si la base a une altération spécifique
   * @param alterationId - ID de l'altération à vérifier
   * @returns - True si l'altération est présente
   */
  hasAlteration: (alterationId: number) => boolean;
  
  /**
   * Applique les effets des altérations actives
   */
  applyAlterationEffects: () => void;
  
  /**
   * Restaure la base pour le tour suivant
   * Réduit la durée des altérations temporaires, etc.
   */
  resetForNextTurn: () => void;
  
  /**
   * Vérifie si la base est détruite (PV <= 0)
   * @returns - True si la base est détruite
   */
  isDestroyed: () => boolean;
}

/**
 * Interface représentant un joueur dans le jeu
 */
export interface Player {
  /**
   * Identifiant unique du joueur
   */
  id: string;
  
  /**
   * Nom du joueur
   */
  name: string;
  
  /**
   * La base du joueur
   */
  base: PlayerBase;
  
  /**
   * Les personnages actuellement sur le terrain
   */
  characters: CardInstance[];
  
  /**
   * Les objets actuellement sur le terrain
   */
  objects: CardInstance[];
  
  /**
   * Les cartes dans la main du joueur
   */
  hand: CardInstance[];
  
  /**
   * Les cartes dans la pioche du joueur
   */
  deck: CardInstance[];
  
  /**
   * Les cartes dans la défausse du joueur
   */
  discard: CardInstance[];
  
  /**
   * La quantité actuelle de motivation
   * (ressource utilisée pour jouer des cartes action et des sorts)
   */
  motivation: number;
  
  /**
   * La quantité actuelle de charisme
   * (ressource utilisée pour invoquer des personnages et acquérir des objets)
   */
  charisme: number;
  
  /**
   * Récupère tous les personnages et objets du joueur
   * @returns - Tableau contenant tous les personnages et objets
   */
  getAllEntities: () => CardInstance[];
  
  /**
   * Vérifie si le joueur a perdu (base détruite)
   * @returns - True si le joueur a perdu
   */
  hasLost: () => boolean;
}

/**
 * Interface pour les options de configuration de la base du joueur
 */
export interface PlayerBaseConfig {
  /**
   * Points de vie maximum de la base
   * @default 100
   */
  maxHealth?: number;
} 