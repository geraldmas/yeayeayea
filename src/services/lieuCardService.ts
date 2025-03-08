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
   * Distribue les cartes Lieu au début de la partie
   * @param config Configuration de distribution des cartes Lieu
   * @returns Le résultat de la distribution
   */
  public distributeLieuCards(
    config: LieuDistributionConfig
  ): LieuDistributionResult {
    // Pour cette implémentation simplifiée, nous allons créer des cartes lieu fictives
    // Dans une implémentation réelle, ces cartes seraient chargées depuis une source de données
    
    const mockLieuCards: CardInstance[] = [];
    
    // Création de cartes Lieu fictives pour la simulation
    for (let i = 0; i < config.totalCommonLieuCards; i++) {
      const mockCardDef: Card = {
        id: 1000 + i,
        name: `Lieu ${i + 1}`,
        type: 'lieu',
        rarity: 'interessant',
        description: `Description du lieu ${i + 1}`,
        image: '',
        properties: {},
        is_wip: false,
        is_crap: false,
        summon_cost: 0,
        passive_effect: null
      };
      
      const mockLieuCard = new CardInstanceImpl(mockCardDef);
      mockLieuCards.push(mockLieuCard);
    }
    
    // Mélanger les cartes Lieu
    this.commonLieuCards = this.shuffleArray(mockLieuCards);
    
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