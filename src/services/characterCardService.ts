import { v4 as uuidv4 } from 'uuid';
import { CharacterCard, Alteration } from '../types/index';
import { CardInstanceImpl } from './combatService';
import { CardInstance } from '../types/combat';

/**
 * Extension de CardInstanceImpl pour les cartes de type personnage.
 * Ajoute les fonctionnalités de niveau et d'expérience.
 */
export class CharacterCardInstance extends CardInstanceImpl {
  public level: number;
  public maxLevel: number;
  public xp: number;
  public xpToNextLevel: number;

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
   * @param amount Quantité d'XP à ajouter
   * @returns true si le personnage a gagné un niveau, false sinon
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
   * Formule : base * (niveau * facteur)²
   * @param level Niveau actuel
   * @returns Expérience nécessaire pour le niveau suivant
   */
  private calculateXPForNextLevel(level: number): number {
    const baseXP = 100;
    const factor = 1.5;
    return Math.floor(baseXP * Math.pow(level * factor, 2));
  }

  /**
   * Calcule les points de vie maximum en fonction du niveau
   * Formule : base + (niveau - 1) * (facteurCroissance)
   * @param baseHealth PV de base au niveau 1
   * @param level Niveau actuel
   * @returns Points de vie maximum pour le niveau donné
   */
  private calculateMaxHealthForLevel(baseHealth: number, level: number): number {
    const growthFactor = Math.max(5, baseHealth * 0.15); // 15% de la santé de base, minimum 5
    return Math.floor(baseHealth + (level - 1) * growthFactor);
  }
}

/**
 * Service pour gérer les cartes de type personnage
 */
export class CharacterCardService {
  /**
   * Crée une instance de carte personnage à partir d'une définition
   * @param card Définition de la carte personnage
   * @returns Instance de carte personnage initialisée
   */
  public createCharacterInstance(card: CharacterCard): CharacterCardInstance {
    return new CharacterCardInstance(card);
  }

  /**
   * Vérifie si une carte peut être convertie en carte personnage
   * @param card Carte à vérifier
   * @returns true si c'est une carte personnage valide, false sinon
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
   * Convertit une carte en carte personnage si possible
   * @param card Carte à convertir
   * @returns Carte personnage ou null si conversion impossible
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
}

// Exporter une instance unique du service
export const characterCardService = new CharacterCardService(); 