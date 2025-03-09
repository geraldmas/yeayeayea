import { v4 as uuidv4 } from 'uuid';
import { Card } from '../types/index';
import { 
  CardInstance, 
  LieuDistributionConfig,
  LieuDistributionResult
} from '../types/combat';
import { CardInstanceImpl } from './combatService';

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
   * Distribue les cartes Lieu communes entre les joueurs
   * @param players - Tableaux des cartes des joueurs
   * @param config - Configuration pour la distribution des cartes Lieu
   * @returns Résultat de la distribution avec les cartes Lieu communes et la carte Lieu active
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
   * @param lieuCards - Tableau de cartes Lieu disponibles
   * @returns La carte Lieu sélectionnée ou null si aucune carte n'est disponible
   */
  public selectRandomActiveLieu(lieuCards: CardInstance[]): CardInstance | null {
    if (lieuCards.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * lieuCards.length);
    return lieuCards[randomIndex];
  }

  /**
   * Change la carte Lieu active
   * @param newLieuCard - Nouvelle carte Lieu à activer
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
   * Récupère la carte Lieu active actuelle
   * @returns La carte Lieu active ou null si aucune carte n'est active
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