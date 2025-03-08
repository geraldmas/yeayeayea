import { LieuCardService } from '../lieuCardService';
import { Card } from '../../types';
import { CardInstance, LieuDistributionConfig } from '../../types/combat';
import { CardInstanceImpl } from '../combatService';

describe('LieuCardService', () => {
  let lieuCardService: LieuCardService;
  
  // Données factices pour les tests
  const createMockCard = (id: number, type: string = 'personnage'): Card => ({
    id,
    name: `Carte ${id}`,
    description: `Description de la carte ${id}`,
    type: type as any,
    rarity: 'interessant',
    properties: { health: 10 },
    summon_cost: 5,
    image: '',
    passive_effect: '',
    is_wip: false,
    is_crap: false
  });
  
  const createMockCardInstance = (id: number, type: string = 'personnage'): CardInstance => {
    const card = createMockCard(id, type);
    return new CardInstanceImpl(card);
  };
  
  const createMockPlayerCards = (
    playerIndex: number, 
    totalCards: number, 
    lieuCardCount: number
  ): CardInstance[] => {
    const cards: CardInstance[] = [];
    
    // Ajouter des cartes Lieu
    for (let i = 0; i < lieuCardCount; i++) {
      cards.push(createMockCardInstance(
        playerIndex * 100 + i, 
        'lieu'
      ));
    }
    
    // Ajouter d'autres types de cartes
    for (let i = lieuCardCount; i < totalCards; i++) {
      cards.push(createMockCardInstance(
        playerIndex * 100 + i, 
        'personnage'
      ));
    }
    
    return cards;
  };
  
  beforeEach(() => {
    lieuCardService = new LieuCardService();
  });
  
  describe('distributeLieuCards', () => {
    it('devrait distribuer correctement les cartes Lieu', () => {
      // Configuration pour ce test
      const config: LieuDistributionConfig = {
        lieuCardsPerPlayer: 3,
        totalCommonLieuCards: 6
      };
      
      // Créer les cartes pour 2 joueurs
      const player1Cards = createMockPlayerCards(1, 20, 4); // 4 cartes Lieu, 16 autres
      const player2Cards = createMockPlayerCards(2, 20, 4); // 4 cartes Lieu, 16 autres
      
      const players = [player1Cards, player2Cards];
      
      // Exécuter la distribution
      const result = lieuCardService.distributeLieuCards(players, config);
      
      // Assertions
      expect(result.commonLieuCards).toHaveLength(config.totalCommonLieuCards);
      expect(result.activeLieuCard).not.toBeNull();
      expect(result.commonLieuCards).toContain(result.activeLieuCard);
      
      // Vérifier que toutes les cartes sont bien de type 'lieu'
      result.commonLieuCards.forEach(card => {
        expect(card.cardDefinition.type).toBe('lieu');
      });
    });
    
    it('devrait lever une erreur si un joueur n\'a pas assez de cartes Lieu', () => {
      // Configuration pour ce test
      const config: LieuDistributionConfig = {
        lieuCardsPerPlayer: 3,
        totalCommonLieuCards: 6
      };
      
      // Le premier joueur n'a que 2 cartes Lieu
      const player1Cards = createMockPlayerCards(1, 20, 2);
      const player2Cards = createMockPlayerCards(2, 20, 4);
      
      const players = [player1Cards, player2Cards];
      
      // La distribution devrait échouer
      expect(() => {
        lieuCardService.distributeLieuCards(players, config);
      }).toThrow(`Chaque joueur doit avoir au moins ${config.lieuCardsPerPlayer} cartes Lieu`);
    });
    
    it('devrait lever une erreur s\'il n\'y a pas assez de cartes Lieu au total', () => {
      // Configuration où le total requis est trop élevé
      const config: LieuDistributionConfig = {
        lieuCardsPerPlayer: 2,
        totalCommonLieuCards: 10  // 2 joueurs x 2 cartes = 4 cartes disponibles, pas assez
      };
      
      const player1Cards = createMockPlayerCards(1, 20, 2);
      const player2Cards = createMockPlayerCards(2, 20, 2);
      
      const players = [player1Cards, player2Cards];
      
      expect(() => {
        lieuCardService.distributeLieuCards(players, config);
      }).toThrow(`Il n'y a pas assez de cartes Lieu entre les joueurs pour atteindre le total requis de ${config.totalCommonLieuCards}`);
    });
    
    it('devrait lever une erreur s\'il n\'y a pas assez de joueurs', () => {
      const config: LieuDistributionConfig = {
        lieuCardsPerPlayer: 3,
        totalCommonLieuCards: 6
      };
      
      const player1Cards = createMockPlayerCards(1, 20, 4);
      const players = [player1Cards]; // Un seul joueur
      
      expect(() => {
        lieuCardService.distributeLieuCards(players, config);
      }).toThrow('Au moins deux joueurs sont nécessaires pour distribuer les cartes Lieu');
    });
  });
  
  describe('selectRandomActiveLieu', () => {
    it('devrait sélectionner une carte Lieu aléatoire', () => {
      const lieuCards = [
        createMockCardInstance(1, 'lieu'),
        createMockCardInstance(2, 'lieu'),
        createMockCardInstance(3, 'lieu')
      ];
      
      const selectedCard = lieuCardService.selectRandomActiveLieu(lieuCards);
      
      expect(selectedCard).not.toBeNull();
      expect(lieuCards).toContain(selectedCard);
      expect(selectedCard!.cardDefinition.type).toBe('lieu');
    });
    
    it('devrait retourner null si aucune carte n\'est disponible', () => {
      const selectedCard = lieuCardService.selectRandomActiveLieu([]);
      expect(selectedCard).toBeNull();
    });
  });
  
  describe('changeLieuCard', () => {
    it('devrait changer la carte Lieu active', () => {
      // Configuration pour ce test
      const config: LieuDistributionConfig = {
        lieuCardsPerPlayer: 3,
        totalCommonLieuCards: 6
      };
      
      // Créer les cartes pour 2 joueurs
      const player1Cards = createMockPlayerCards(1, 20, 4);
      const player2Cards = createMockPlayerCards(2, 20, 4);
      
      const players = [player1Cards, player2Cards];
      
      // Exécuter la distribution
      const result = lieuCardService.distributeLieuCards(players, config);
      
      // Sélectionner une autre carte Lieu (pas la carte active)
      const otherLieuCard = result.commonLieuCards.find(
        card => card !== result.activeLieuCard
      );
      
      // Changer la carte Lieu active
      lieuCardService.changeLieuCard(otherLieuCard!);
      
      // Vérifier que la carte active a bien changé
      const newActiveLieu = lieuCardService.getActiveLieuCard();
      expect(newActiveLieu).toBe(otherLieuCard);
      expect(newActiveLieu).not.toBe(result.activeLieuCard);
    });
    
    it('devrait lever une erreur si la carte n\'est pas de type lieu', () => {
      // Configuration pour ce test
      const config: LieuDistributionConfig = {
        lieuCardsPerPlayer: 3,
        totalCommonLieuCards: 6
      };
      
      // Créer les cartes pour 2 joueurs
      const player1Cards = createMockPlayerCards(1, 20, 4);
      const player2Cards = createMockPlayerCards(2, 20, 4);
      
      const players = [player1Cards, player2Cards];
      
      // Exécuter la distribution
      lieuCardService.distributeLieuCards(players, config);
      
      // Créer une carte qui n'est pas de type 'lieu'
      const nonLieuCard = createMockCardInstance(999, 'personnage');
      
      // Tenter de changer la carte active avec une carte non-lieu
      expect(() => {
        lieuCardService.changeLieuCard(nonLieuCard);
      }).toThrow('La carte doit être de type "lieu"');
    });
    
    it('devrait lever une erreur si la carte n\'est pas dans les cartes disponibles', () => {
      // Configuration pour ce test
      const config: LieuDistributionConfig = {
        lieuCardsPerPlayer: 3,
        totalCommonLieuCards: 6
      };
      
      // Créer les cartes pour 2 joueurs
      const player1Cards = createMockPlayerCards(1, 20, 4);
      const player2Cards = createMockPlayerCards(2, 20, 4);
      
      const players = [player1Cards, player2Cards];
      
      // Exécuter la distribution
      lieuCardService.distributeLieuCards(players, config);
      
      // Créer une nouvelle carte Lieu qui n'est pas dans la liste des cartes disponibles
      const externalLieuCard = createMockCardInstance(999, 'lieu');
      
      // Tenter de changer la carte active avec une carte externe
      expect(() => {
        lieuCardService.changeLieuCard(externalLieuCard);
      }).toThrow('La carte Lieu doit faire partie des cartes Lieu disponibles');
    });
  });
  
  describe('getActiveLieuCard', () => {
    it('devrait retourner la carte Lieu active', () => {
      // Configuration pour ce test
      const config: LieuDistributionConfig = {
        lieuCardsPerPlayer: 3,
        totalCommonLieuCards: 6
      };
      
      // Créer les cartes pour 2 joueurs
      const player1Cards = createMockPlayerCards(1, 20, 4);
      const player2Cards = createMockPlayerCards(2, 20, 4);
      
      const players = [player1Cards, player2Cards];
      
      // Exécuter la distribution
      const result = lieuCardService.distributeLieuCards(players, config);
      
      // Vérifier que getActiveLieuCard retourne la même carte que celle distribuée
      const activeLieu = lieuCardService.getActiveLieuCard();
      expect(activeLieu).toBe(result.activeLieuCard);
    });
    
    it('devrait retourner null si aucune carte n\'est active', () => {
      // Aucune distribution n'a été faite
      const activeLieu = lieuCardService.getActiveLieuCard();
      expect(activeLieu).toBeNull();
    });
  });
}); 