import { v4 as uuidv4 } from 'uuid';
import { Card, Spell, Tag } from '../types/index';
import { CardInstance, SpellInstance, TagInstance } from '../types/combat';
import { CardInstanceImpl } from './combatService';

/**
 * Service responsable de la conversion des définitions de cartes en instances pour le combat
 */
export class CardConversionService {
  /**
   * Convertit une définition de carte en instance de carte prête pour le combat
   * @param card Définition de la carte
   * @param tags Tags associés à la carte (optionnel)
   * @param spells Sorts associés à la carte (optionnel)
   * @returns Instance de carte prête pour le combat
   */
  public convertCardToInstance(
    card: Card, 
    tags: Tag[] = [], 
    spells: Spell[] = []
  ): CardInstance {
    // Créer une nouvelle instance de carte
    const cardInstance = new CardInstanceImpl(card);
    
    // Ajouter les tags
    tags.forEach(tag => {
      cardInstance.addTag(tag, false); // Ajout permanent des tags initiaux
    });
    
    // Ajouter les sorts disponibles
    spells.forEach(spell => {
      const spellInstance: SpellInstance = {
        spell,
        cooldown: 0,
        isAvailable: true
      };
      cardInstance.availableSpells.push(spellInstance);
    });
    
    // Initialiser d'autres propriétés spécifiques au type de carte
    this.initializeCardTypeSpecificProperties(cardInstance);
    
    return cardInstance;
  }
  
  /**
   * Initialise les propriétés spécifiques au type de carte
   * @param cardInstance Instance de carte à initialiser
   */
  private initializeCardTypeSpecificProperties(cardInstance: CardInstance): void {
    const { type } = cardInstance.cardDefinition;
    
    switch (type) {
      case 'personnage':
        // Initialiser les propriétés spécifiques aux personnages
        // Définir directement les propriétés sur l'instance
        if (cardInstance.cardDefinition.properties.level) {
          (cardInstance as any).level = cardInstance.cardDefinition.properties.level;
        }
        if (cardInstance.cardDefinition.properties.maxLevel) {
          (cardInstance as any).maxLevel = cardInstance.cardDefinition.properties.maxLevel;
        }
        if (cardInstance.cardDefinition.properties.xp) {
          (cardInstance as any).xp = cardInstance.cardDefinition.properties.xp;
        }
        if (cardInstance.cardDefinition.properties.xpToNextLevel) {
          (cardInstance as any).xpToNextLevel = cardInstance.cardDefinition.properties.xpToNextLevel;
        }
        break;
        
      case 'objet':
        // Initialiser les propriétés spécifiques aux objets
        cardInstance.temporaryStats.charismaMod = 
          cardInstance.cardDefinition.properties.charismaMod || 0;
        break;
        
      case 'lieu':
        // Initialiser les propriétés spécifiques aux lieux
        cardInstance.temporaryStats.activationCost = 
          cardInstance.cardDefinition.properties.activationCost || 0;
        break;
        
      case 'action':
      case 'evenement':
        // Initialiser les propriétés spécifiques aux actions/événements
        cardInstance.temporaryStats.motivationCost = 
          cardInstance.cardDefinition.properties.motivationCost || 0;
        break;
    }
  }
  
  /**
   * Nettoie les instances de cartes à la fin d'un combat
   * @param cardInstances Liste des instances de cartes à nettoyer
   */
  public cleanupCardInstances(cardInstances: CardInstance[]): void {
    // Libérer les ressources et supprimer les références
    cardInstances.forEach(cardInstance => {
      // Supprimer les altérations actives
      cardInstance.activeAlterations = [];
      
      // Réinitialiser les stats temporaires
      cardInstance.recalculateTemporaryStats();
      
      // Réinitialiser l'état
      cardInstance.isExhausted = false;
      cardInstance.isTapped = false;
      
      // Réinitialiser la santé
      cardInstance.currentHealth = cardInstance.maxHealth;
      
      // Vider l'historique des dégâts
      cardInstance.damageHistory = [];
    });
  }
  
  /**
   * Convertit plusieurs définitions de cartes en instances pour le combat
   * @param cards Liste des définitions de cartes
   * @param tagsMap Map des tags par ID de carte
   * @param spellsMap Map des sorts par ID de carte
   * @returns Liste des instances de cartes
   */
  public batchConvertCardsToInstances(
    cards: Card[],
    tagsMap: Map<number, Tag[]> = new Map(),
    spellsMap: Map<number, Spell[]> = new Map()
  ): CardInstance[] {
    return cards.map(card => {
      const tags = tagsMap.get(card.id) || [];
      const spells = spellsMap.get(card.id) || [];
      return this.convertCardToInstance(card, tags, spells);
    });
  }
} 