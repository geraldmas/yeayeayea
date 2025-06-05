/**
 * @file PlayerBaseService.ts
 * @description Service de gestion de la base du joueur
 * Implémente les méthodes pour manipuler les points de vie et les altérations de la base
 */

import { v4 as uuidv4 } from 'uuid';
import { PlayerBase, PlayerBaseConfig } from '../types/player';
import { Alteration } from '../types';
import { CardInstance } from '../types/combat';

/**
 * Implémentation de la base du joueur
 * Gère les points de vie, les dégâts, la guérison et les altérations
 */
export class PlayerBaseImpl implements PlayerBase {
  id: string;
  currentHealth: number;
  maxHealth: number;
  /**
   * Facteur de réduction des dégâts reçus
   */
  private damageReductionFactor: number;
  activeAlterations: {
    alteration: Alteration;
    remainingDuration: number | null;
    stackCount: number;
    source: CardInstance | null;
  }[];
  
  /**
   * Historique des changements de santé pour le débogage
   * Non exposé dans l'interface publique
   */
  private healthChangeHistory: Array<{
    type: 'damage' | 'heal';
    amount: number;
    source?: string;
    timestamp: number;
  }> = [];
  
  /**
   * Crée une nouvelle instance de base de joueur
   * @param config - Configuration optionnelle
   */
  constructor(config?: PlayerBaseConfig) {
    this.id = uuidv4();
    this.maxHealth = config?.maxHealth || 100;
    this.currentHealth = this.maxHealth;
    this.damageReductionFactor = config?.damageReductionFactor ?? 0.5;
    this.activeAlterations = [];
  }
  
  /**
   * Applique des dégâts à la base
   * @param amount - Quantité de dégâts à appliquer
   * @param source - Source des dégâts (carte ou autre)
   * @returns - Quantité de dégâts réellement appliqués
   */
  applyDamage(amount: number, source?: string): number {
    if (amount <= 0) return 0;

    const reducedAmount = amount * this.damageReductionFactor;
    const actualDamage = Math.min(this.currentHealth, reducedAmount);
    this.currentHealth -= actualDamage;
    
    // Enregistre l'historique de dégâts pour le débogage
    this.healthChangeHistory.push({
      type: 'damage',
      amount: actualDamage,
      source,
      timestamp: Date.now()
    });
    
    return actualDamage;
  }
  
  /**
   * Soigne la base
   * @param amount - Quantité de points de vie à restaurer
   * @param source - Source du soin
   * @returns - Quantité de points de vie réellement restaurés
   */
  heal(amount: number, source?: string): number {
    if (amount <= 0) return 0;
    
    const missingHealth = this.maxHealth - this.currentHealth;
    const actualHeal = Math.min(missingHealth, amount);
    this.currentHealth += actualHeal;
    
    // Enregistre l'historique de soin pour le débogage
    this.healthChangeHistory.push({
      type: 'heal',
      amount: actualHeal,
      source,
      timestamp: Date.now()
    });
    
    return actualHeal;
  }
  
  /**
   * Ajoute une altération à la base
   * @param alteration - L'altération à appliquer
   * @param source - Source de l'altération
   */
  addAlteration(alteration: Alteration, source: CardInstance | null): void {
    // Si l'altération n'est pas empilable, vérifier si elle existe déjà
    if (!alteration.stackable) {
      const existingIndex = this.activeAlterations.findIndex(
        a => a.alteration.id === alteration.id
      );
      
      // Si elle existe, réinitialiser sa durée
      if (existingIndex >= 0) {
        this.activeAlterations[existingIndex].remainingDuration = 
          alteration.duration || null;
        return;
      }
    } else {
      // Si l'altération est empilable, vérifier si elle existe déjà
      const existingIndex = this.activeAlterations.findIndex(
        a => a.alteration.id === alteration.id
      );
      
      // Si elle existe, augmenter son compteur d'empilement
      if (existingIndex >= 0) {
        this.activeAlterations[existingIndex].stackCount += 1;
        // Réinitialise la durée si elle est temporaire
        if (alteration.duration) {
          this.activeAlterations[existingIndex].remainingDuration = 
            alteration.duration;
        }
        return;
      }
    }
    
    // Ajouter une nouvelle altération
    this.activeAlterations.push({
      alteration,
      remainingDuration: alteration.duration || null,
      stackCount: 1,
      source
    });
  }
  
  /**
   * Supprime une altération de la base
   * @param alterationId - ID de l'altération à supprimer
   */
  removeAlteration(alterationId: number): void {
    const index = this.activeAlterations.findIndex(
      a => a.alteration.id === alterationId
    );
    
    if (index >= 0) {
      this.activeAlterations.splice(index, 1);
    }
  }
  
  /**
   * Vérifie si la base a une altération spécifique
   * @param alterationId - ID de l'altération à vérifier
   * @returns - True si l'altération est présente
   */
  hasAlteration(alterationId: number): boolean {
    return this.activeAlterations.some(a => a.alteration.id === alterationId);
  }
  
  /**
   * Applique les effets des altérations actives
   */
  applyAlterationEffects(): void {
    // Implémentation future pour appliquer les effets spécifiques des altérations
    // Pour l'instant, nous nous contentons de gérer leur durée
  }
  
  /**
   * Restaure la base pour le tour suivant
   * Réduit la durée des altérations temporaires, etc.
   */
  resetForNextTurn(): void {
    // Met à jour les durées des altérations
    for (let i = this.activeAlterations.length - 1; i >= 0; i--) {
      const alteration = this.activeAlterations[i];
      
      // Si l'altération a une durée
      if (alteration.remainingDuration !== null) {
        alteration.remainingDuration--;
        
        // Supprime l'altération si sa durée est écoulée
        if (alteration.remainingDuration <= 0) {
          this.activeAlterations.splice(i, 1);
        }
      }
    }
  }
  
  /**
   * Vérifie si la base est détruite (PV <= 0)
   * @returns - True si la base est détruite
   */
  isDestroyed(): boolean {
    return this.currentHealth <= 0;
  }
}

/**
 * Crée une nouvelle instance de base de joueur
 * @param config - Configuration optionnelle
 * @returns - Une nouvelle instance de PlayerBase
 */
export const createPlayerBase = (config?: PlayerBaseConfig): PlayerBase => {
  return new PlayerBaseImpl(config);
}; 
