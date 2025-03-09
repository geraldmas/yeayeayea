import { v4 as uuidv4 } from 'uuid';
import { CharacterCard, Alteration } from '../types/index';
import { CardInstanceImpl } from './combatService';
import { CardInstance } from '../types/combat';

/**
 * @file characterCardService.ts
 * @description Service de gestion des cartes personnage pour le jeu Yeayeayea
 * 
 * Les cartes personnage sont les entités principales que les joueurs utilisent pour combattre.
 * Contrairement aux autres types de cartes, les personnages peuvent :
 * - Gagner de l'expérience et monter en niveau
 * - Avoir des statistiques qui évoluent avec leur niveau
 * - Lancer des sorts et subir des altérations
 * - Équiper des objets
 * 
 * Ce service fournit les classes et méthodes nécessaires pour instancier des cartes personnage,
 * gérer leur évolution, et manipuler leurs statistiques pendant le jeu.
 */

/**
 * Extension de CardInstanceImpl pour les cartes de type personnage.
 * Ajoute les fonctionnalités de niveau et d'expérience qui permettent
 * aux personnages d'évoluer au cours d'une partie et de devenir plus puissants.
 */
export class CharacterCardInstance extends CardInstanceImpl {
  /** Niveau actuel du personnage */
  public level: number;
  
  /** Niveau maximum que le personnage peut atteindre */
  public maxLevel: number;
  
  /** Points d'expérience actuels */
  public xp: number;
  
  /** Points d'expérience nécessaires pour passer au niveau suivant */
  public xpToNextLevel: number;

  /**
   * Crée une nouvelle instance de carte personnage à partir d'une définition
   * Initialise les propriétés de niveau et d'expérience, et calcule les statistiques de base
   * 
   * @param card - Définition de carte personnage à instancier
   */
  constructor(card: CharacterCard) {
    super(card);
    
    // Initialisation des propriétés de niveau
    this.level = card.properties.level || 1;
    this.maxLevel = card.properties.maxLevel || 10;
    this.xp = card.properties.xp || 0;
    this.xpToNextLevel = card.properties.xpToNextLevel || this.calculateXPForNextLevel(this.level);
    
    // Ajustement des PV en fonction du niveau
    this.maxHealth = this.calculateMaxHealthForLevel(card.properties.baseHealth || card.properties.health, this.level);
    this.currentHealth = this.maxHealth;
    
    // Initialiser les statistiques temporaires
    this.updateStatsForLevel();
  }

  /**
   * Met à jour les statistiques en fonction du niveau actuel
   * Calcule l'attaque et la défense avec des bonus basés sur le niveau du personnage
   */
  public updateStatsForLevel(): void {
    const characterCard = this.cardDefinition as CharacterCard;
    const baseAttack = characterCard.properties.attack || 1;
    const baseDefense = characterCard.properties.defense || 0;
    
    // Bonus de niveau
    const attackBonus = Math.floor(this.level / 2) * 2; // +2 tous les 2 niveaux
    const defenseBonus = Math.floor(this.level / 3); // +1 tous les 3 niveaux
    
    // Met à jour les statistiques temporaires
    this.temporaryStats = {
      ...this.temporaryStats,
      attack: baseAttack + attackBonus,
      defense: baseDefense + defenseBonus
    };
  }

  /**
   * Ajoute de l'expérience à un personnage et gère le passage de niveau
   * Cette méthode est appelée lors de la défaite d'adversaires ou l'accomplissement d'objectifs
   * Si l'XP dépasse le seuil requis, le personnage monte automatiquement de niveau
   * 
   * @param amount - Quantité d'XP à ajouter au personnage
   * @returns `true` si le personnage a gagné un niveau grâce à cette expérience, `false` sinon
   */
  public addExperience(amount: number): boolean {
    if (this.level >= this.maxLevel) {
      return false; // Niveau maximum déjà atteint
    }

    this.xp += amount;
    
    if (this.xp >= this.xpToNextLevel) {
      this.levelUp();
      return true;
    }
    
    return false;
  }

  /**
   * Fait monter le personnage d'un niveau
   * Augmente ses statistiques, réinitialise son compteur d'XP et recalcule le seuil pour le niveau suivant
   * Cette méthode est appelée automatiquement par addExperience ou peut être déclenchée directement
   * par des effets spéciaux de cartes
   */
  public levelUp(): void {
    if (this.level >= this.maxLevel) {
      return; // Niveau maximum déjà atteint
    }

    // Enregistre l'ancienne santé maximale pour calculer le pourcentage actuel
    const oldMaxHealth = this.maxHealth;
    const healthPercentage = this.currentHealth / oldMaxHealth;

    // Incrémente le niveau
    this.level++;
    
    // Calcule les nouvelles statistiques
    this.xp = this.xp - this.xpToNextLevel; // L'expérience excédentaire est conservée
    this.xpToNextLevel = this.calculateXPForNextLevel(this.level);
    
    // Mise à jour des PV
    const characterCard = this.cardDefinition as CharacterCard;
    this.maxHealth = this.calculateMaxHealthForLevel(
      characterCard.properties.baseHealth || characterCard.properties.health, 
      this.level
    );
    
    // Garde le même pourcentage de vie qu'avant le level up
    this.currentHealth = Math.floor(this.maxHealth * healthPercentage);
    
    // Mise à jour des statistiques
    this.updateStatsForLevel();
    
    // Re-calcule toutes les statistiques temporaires basées sur les altérations
    this.recalculateTemporaryStats();
  }

  /**
   * Calcule l'XP nécessaire pour atteindre le niveau suivant
   * Utilise une formule quadratique pour créer une courbe d'expérience
   * qui devient de plus en plus exigeante aux niveaux supérieurs
   * Formule : base * (niveau * facteur)²
   * 
   * @param level - Niveau actuel du personnage
   * @returns Quantité d'XP nécessaire pour passer au niveau suivant
   * @private
   */
  private calculateXPForNextLevel(level: number): number {
    const baseXP = 100;
    const factor = 1.5;
    return Math.floor(baseXP * Math.pow(level * factor, 2));
  }

  /**
   * Calcule les points de vie maximum en fonction du niveau
   * Augmente les PV de façon linéaire à chaque niveau, avec un facteur
   * de croissance proportionnel à la santé de base du personnage
   * Formule : base + (niveau - 1) * (facteurCroissance)
   * 
   * @param baseHealth - PV de base au niveau 1
   * @param level - Niveau actuel du personnage
   * @returns Points de vie maximum pour le niveau donné
   * @private
   */
  private calculateMaxHealthForLevel(baseHealth: number, level: number): number {
    const growthFactor = Math.max(5, baseHealth * 0.15); // 15% de la santé de base, minimum 5
    return Math.floor(baseHealth + (level - 1) * growthFactor);
  }
}

/**
 * Service pour gérer les cartes de type personnage
 * Fournit des méthodes utilitaires pour créer, valider et convertir des cartes personnage
 * Ce service est utilisé par le système de combat et d'autres composants qui manipulent
 * des cartes personnage
 */
export class CharacterCardService {
  /**
   * Crée une instance de carte personnage à partir d'une définition
   * Cette méthode est le point d'entrée principal pour instancier des cartes personnage
   * dans le système de combat
   * 
   * @param card - Définition de la carte personnage à instancier
   * @returns Une nouvelle instance de carte personnage initialisée avec ses propriétés de niveau
   */
  public createCharacterInstance(card: CharacterCard): CharacterCardInstance {
    return new CharacterCardInstance(card);
  }

  /**
   * Vérifie si une carte peut être considérée comme une carte personnage valide
   * Utilisé pour valider les données avant de créer une instance de carte personnage
   * 
   * @param card - Carte à vérifier
   * @returns `true` si la carte est un personnage valide avec les propriétés requises, `false` sinon
   */
  public isValidCharacterCard(card: any): card is CharacterCard {
    return (
      card &&
      card.type === 'personnage' &&
      card.properties &&
      typeof card.properties.health === 'number'
    );
  }

  /**
   * Convertit une carte générique en carte personnage typée si possible
   * Cette méthode est utile pour traiter des cartes provenant d'API ou de sources externes
   * où le typage strict n'est pas garanti
   * 
   * @param card - Carte générique à convertir en carte personnage
   * @returns La carte convertie en CharacterCard ou `null` si la conversion est impossible
   */
  public toCharacterCard(card: any): CharacterCard | null {
    if (!this.isValidCharacterCard(card)) {
      return null;
    }

    // S'assure que toutes les propriétés requises sont présentes
    const characterCard: CharacterCard = {
      ...card,
      properties: {
        ...card.properties,
        baseHealth: card.properties.baseHealth || card.properties.health,
        level: card.properties.level || 1,
        maxLevel: card.properties.maxLevel || 10,
        xp: card.properties.xp || 0,
        xpToNextLevel: card.properties.xpToNextLevel || 0, // Sera recalculé à l'initialisation
        attack: card.properties.attack || 1,
        defense: card.properties.defense || 0
      }
    };

    return characterCard;
  }
  
  /**
   * Calcule les PV maximums d'une carte personnage en fonction de son niveau
   * Utilise la même formule que dans l'instance pour garantir la cohérence
   * 
   * @param baseHealth - PV de base de la carte
   * @param level - Niveau pour lequel calculer les PV
   * @returns Les points de vie maximums calculés
   */
  public calculateMaxHealthForLevel(baseHealth: number, level: number): number {
    const growthFactor = Math.max(5, baseHealth * 0.15); // 15% de la santé de base, minimum 5
    return Math.floor(baseHealth + (level - 1) * growthFactor);
  }
  
  /**
   * Calcule l'XP nécessaire pour passer au niveau suivant
   * Utilise la même formule que dans l'instance pour garantir la cohérence
   * 
   * @param level - Niveau actuel
   * @returns La quantité d'XP nécessaire pour atteindre le niveau suivant
   */
  public calculateXPForNextLevel(level: number): number {
    const baseXP = 100;
    const factor = 1.5;
    return Math.floor(baseXP * Math.pow(level * factor, 2));
  }
}

// Exporter une instance unique du service
export const characterCardService = new CharacterCardService(); 