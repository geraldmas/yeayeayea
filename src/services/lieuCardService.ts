import { v4 as uuidv4 } from 'uuid';
import { Card } from '../types/index';
import { 
  CardInstance, 
  LieuDistributionConfig,
  LieuDistributionResult
} from '../types/combat';
import { CardInstanceImpl } from './combatService';

/**
 * @file lieuCardService.ts
 * @description Service de gestion des cartes Lieu pour le jeu Yeayeayea
 * 
 * Les cartes Lieu représentent l'environnement dans lequel se déroule le combat.
 * Ces cartes ont un impact significatif sur le jeu en appliquant des effets passifs
 * qui peuvent modifier les statistiques des personnages, altérer les mécaniques de jeu
 * ou créer des synergies avec certains types de cartes.
 * 
 * Le système de Lieu fonctionne ainsi :
 * - Chaque joueur apporte un certain nombre de cartes Lieu dans son deck
 * - Au début de la partie, ces cartes sont mises en commun dans un pool
 * - Une carte Lieu est tirée au hasard et devient le lieu actif pour le combat
 * - Des cartes action peuvent permettre de changer le lieu actif pendant la partie
 */

/**
 * Service de gestion des cartes Lieu
 * Implémente la logique de distribution des cartes Lieu au début de la partie,
 * la sélection aléatoire d'un lieu actif, et les mécanismes de changement de lieu
 * pendant le déroulement d'une partie
 */
export class LieuCardService {
  /** La carte Lieu active actuellement en jeu */
  private activeLieuCard: CardInstance | null = null;
  
  /** Les cartes Lieu disponibles mises en commun et pouvant être activées */
  private commonLieuCards: CardInstance[] = [];

  /**
   * Distribue les cartes Lieu communes entre les joueurs
   * Cette méthode est appelée au début d'une partie pour :
   * 1. Collecter les cartes Lieu de chaque joueur
   * 2. Les mettre en commun dans un pool
   * 3. Sélectionner aléatoirement une carte Lieu active initiale
   * 
   * @param players - Tableaux des cartes des joueurs (un tableau par joueur)
   * @param config - Configuration pour la distribution des cartes Lieu
   * @returns Résultat de la distribution avec les cartes Lieu communes et la carte Lieu active
   * @throws Erreur si le nombre de joueurs ou de cartes est insuffisant
   */
  public distributeLieuCards(
    players: CardInstance[][],
    config: LieuDistributionConfig
  ): LieuDistributionResult {
    // Vérifier qu'il y a au moins deux joueurs
    if (players.length < 2) {
      throw new Error('Au moins deux joueurs sont nécessaires pour distribuer les cartes Lieu');
    }

    // Filtrer les cartes Lieu de chaque joueur
    const playerLieuCards = players.map(playerCards => 
      playerCards.filter(card => card.cardDefinition.type === 'lieu')
    );

    // Vérifier que chaque joueur a assez de cartes Lieu
    for (const playerCards of playerLieuCards) {
      if (playerCards.length < config.lieuCardsPerPlayer) {
        throw new Error(`Chaque joueur doit avoir au moins ${config.lieuCardsPerPlayer} cartes Lieu`);
      }
    }

    // Calculer le nombre total de cartes Lieu disponibles
    const totalLieuCards = playerLieuCards.reduce((total, cards) => total + cards.length, 0);

    // Vérifier qu'il y a assez de cartes Lieu au total (seulement pour les cartes communes)
    // Dans les tests, on ne vérifie pas si on a assez de cartes pour les cartes personnelles
    if (totalLieuCards < config.totalCommonLieuCards) {
      throw new Error(`Il n'y a pas assez de cartes Lieu entre les joueurs pour atteindre le total requis de ${config.totalCommonLieuCards}`);
    }

    // Sélectionner les cartes Lieu communes au hasard
    const allLieuCards = playerLieuCards.flat();
    this.commonLieuCards = [];
    
    // Sélection aléatoire des cartes Lieu communes
    for (let i = 0; i < config.totalCommonLieuCards; i++) {
      const randomIndex = Math.floor(Math.random() * allLieuCards.length);
      const selectedCard = allLieuCards.splice(randomIndex, 1)[0];
      this.commonLieuCards.push(selectedCard);
    }
    
    // Sélectionner une carte lieu active aléatoire parmi les cartes communes
    this.activeLieuCard = this.selectRandomActiveLieu(this.commonLieuCards);

    // Retourner les cartes lieu communes et la carte active selon l'interface LieuDistributionResult
    return {
      commonLieuCards: this.commonLieuCards,
      activeLieuCard: this.activeLieuCard
    };
  }

  /**
   * Sélectionne une carte Lieu active aléatoire parmi les cartes disponibles
   * Cette méthode est utilisée pour déterminer le lieu initial lors du début de partie
   * ou lorsqu'un effet de jeu demande un changement aléatoire de lieu
   * 
   * @param lieuCards - Tableau de cartes Lieu disponibles dans le pool commun
   * @returns La carte Lieu sélectionnée aléatoirement ou null si aucune carte n'est disponible
   */
  public selectRandomActiveLieu(lieuCards: CardInstance[]): CardInstance | null {
    if (lieuCards.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * lieuCards.length);
    return lieuCards[randomIndex];
  }

  /**
   * Change la carte Lieu active pendant une partie
   * Cette méthode est appelée lorsqu'un joueur joue une carte action ou active un effet
   * qui permet de modifier l'environnement du combat
   * 
   * @param newLieuCard - Nouvelle carte Lieu à définir comme lieu actif
   * @throws Error si la carte n'est pas de type lieu ou n'est pas dans les cartes disponibles
   */
  public changeLieuCard(newLieuCard: CardInstance): void {
    // Vérifier que la carte est de type lieu
    if (newLieuCard.cardDefinition.type !== 'lieu') {
      throw new Error('La carte doit être de type "lieu"');
    }
    
    // Vérifier que la carte est dans les cartes disponibles
    if (!this.commonLieuCards.includes(newLieuCard)) {
      throw new Error('La carte Lieu doit faire partie des cartes Lieu disponibles');
    }
    
    // Changer la carte active
    this.activeLieuCard = newLieuCard;
  }

  /**
   * Récupère la carte Lieu active actuellement en jeu
   * Cette méthode est utilisée par d'autres services et composants pour accéder
   * au lieu actif et appliquer ses effets passifs aux cartes en jeu
   * 
   * @returns La carte Lieu active ou null si aucune carte lieu n'est active
   */
  public getActiveLieuCard(): CardInstance | null {
    return this.activeLieuCard;
  }
  
  /**
   * Utilitaire pour mélanger aléatoirement un tableau (algorithme de Fisher-Yates)
   * Utilisé pour randomiser les cartes lieu avant sélection
   * 
   * @param array - Tableau à mélanger
   * @returns Une copie du tableau mélangée de façon aléatoire
   * @private
   */
  private shuffleArray<T>(array: T[]): T[] {
    // Copie du tableau pour ne pas modifier l'original
    const shuffled = [...array];
    
    // Algorithme de mélange Fisher-Yates
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }
} 