import { v4 as uuidv4 } from 'uuid';
import { Card } from '../types/index';
import { 
  CardInstance, 
  LieuDistributionConfig,
  LieuDistributionResult
} from '../types/combat';

/**
 * Service de gestion des cartes Lieu
 * Implémente la logique de distribution des cartes Lieu au début de la partie
 * et la gestion du lieu actif pendant une partie
 */
export class LieuCardService {
  // La carte Lieu active actuellement
  private activeLieuCard: CardInstance | null = null;
  
  // Les cartes Lieu disponibles mises en commun
  private commonLieuCards: CardInstance[] = [];

  /**
   * Distribue les cartes Lieu au début de la partie
   * @param players Tableaux de cartes de chaque joueur
   * @param config Configuration de distribution des cartes Lieu
   * @returns Le résultat de la distribution
   */
  public distributeLieuCards(
    players: CardInstance[][],
    config: LieuDistributionConfig
  ): LieuDistributionResult {
    // Vérifier qu'il y a suffisamment de joueurs
    if (players.length < 2) {
      throw new Error('Au moins deux joueurs sont nécessaires pour distribuer les cartes Lieu');
    }

    // Extraire les cartes Lieu de chaque joueur
    const lieuCardsFromPlayers: CardInstance[] = [];
    
    players.forEach(playerCards => {
      // Filtrer les cartes de type 'lieu'
      const playerLieuCards = playerCards.filter(
        card => card.cardDefinition.type === 'lieu'
      );
      
      // Vérifier que le joueur a suffisamment de cartes Lieu
      if (playerLieuCards.length < config.lieuCardsPerPlayer) {
        throw new Error(`Chaque joueur doit avoir au moins ${config.lieuCardsPerPlayer} cartes Lieu`);
      }
      
      // Prendre seulement le nombre configuré de cartes Lieu par joueur
      const selectedLieuCards = playerLieuCards.slice(0, config.lieuCardsPerPlayer);
      lieuCardsFromPlayers.push(...selectedLieuCards);
    });
    
    // Vérifier qu'il y a suffisamment de cartes Lieu au total
    if (lieuCardsFromPlayers.length < config.totalCommonLieuCards) {
      throw new Error(`Il n'y a pas assez de cartes Lieu entre les joueurs pour atteindre le total requis de ${config.totalCommonLieuCards}`);
    }
    
    // Mélanger les cartes Lieu des joueurs
    const shuffledLieuCards = this.shuffleArray(lieuCardsFromPlayers);
    
    // Sélectionner le nombre configuré de cartes Lieu pour la mise en commun
    this.commonLieuCards = shuffledLieuCards.slice(0, config.totalCommonLieuCards);
    
    // Sélectionner aléatoirement une carte Lieu active
    this.activeLieuCard = this.selectRandomActiveLieu(this.commonLieuCards);
    
    return {
      commonLieuCards: this.commonLieuCards,
      activeLieuCard: this.activeLieuCard
    };
  }

  /**
   * Sélectionne aléatoirement une carte Lieu active
   * @param commonLieuCards Cartes Lieu disponibles
   * @returns La carte Lieu sélectionnée ou null si aucune carte disponible
   */
  public selectRandomActiveLieu(commonLieuCards: CardInstance[]): CardInstance | null {
    if (commonLieuCards.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * commonLieuCards.length);
    return commonLieuCards[randomIndex];
  }

  /**
   * Change la carte Lieu active
   * @param newLieuCard Nouvelle carte Lieu à activer
   */
  public changeLieuCard(newLieuCard: CardInstance): void {
    // Vérifier que la carte est bien de type 'lieu'
    if (newLieuCard.cardDefinition.type !== 'lieu') {
      throw new Error('La carte doit être de type "lieu"');
    }
    
    // Vérifier que la carte est dans les cartes disponibles
    const isInCommonLieuCards = this.commonLieuCards.some(
      card => card.instanceId === newLieuCard.instanceId
    );
    
    if (!isInCommonLieuCards) {
      throw new Error('La carte Lieu doit faire partie des cartes Lieu disponibles');
    }
    
    this.activeLieuCard = newLieuCard;
  }

  /**
   * Retourne la carte Lieu active
   * @returns La carte Lieu active ou null si aucune n'est active
   */
  public getActiveLieuCard(): CardInstance | null {
    return this.activeLieuCard;
  }
  
  /**
   * Utilitaire pour mélanger un tableau (algorithme de Fisher-Yates)
   * @param array Tableau à mélanger
   * @returns Tableau mélangé (modifie également le tableau original)
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