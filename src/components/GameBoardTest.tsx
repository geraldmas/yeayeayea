import React, { useState } from 'react';
import GameBoard from './GameBoard';
import { Card, Tag, Spell, Rarity } from '../types';
import { CardInstance, TagInstance, SpellInstance, ActiveAlteration } from '../types/combat';
import './GameBoardTest.css';

/**
 * Composant de test pour GameBoard
 * Permet de visualiser et tester la zone de jeu tactile
 */
const GameBoardTest: React.FC = () => {
  // Création de données de test
  
  // Tags de test
  const createTestTag = (id: number, name: string): Tag => ({
    id,
    name,
    passive_effect: null
  });
  
  const tags = [
    createTestTag(1, 'JOUR'),
    createTestTag(2, 'NUIT'),
    createTestTag(3, 'FRAGILE'),
    createTestTag(4, 'RESISTANT')
  ];
  
  // Création d'une carte de test
  const createTestCard = (
    id: number, 
    name: string, 
    type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action', 
    health: number = 10
  ): Card => ({
    id,
    name,
    description: `Carte test ${name}`,
    type,
    rarity: 'interessant' as Rarity,
    properties: { health },
    summon_cost: 5,
    image: '',
    passive_effect: '',
    is_wip: false,
    is_crap: false
  });
  
  // Création d'une instance de carte à partir d'une carte
  const createCardInstance = (card: Card, health: number = 10): CardInstance => {
    const cardTags: TagInstance[] = tags.slice(0, 2).map(tag => ({
      tag,
      isTemporary: false
    }));
    
    return {
      instanceId: `instance-${card.id}`,
      cardDefinition: card,
      currentHealth: health,
      maxHealth: health,
      temporaryStats: {
        attack: 5,
        defense: 3
      },
      damageHistory: [],
      activeEffects: {},
      activeAlterations: [],
      activeTags: cardTags,
      availableSpells: [],
      isExhausted: false,
      isTapped: false,
      counters: {},
      // Implémentation minimale des méthodes requises
      applyDamage: () => {},
      heal: () => {},
      addAlteration: () => {},
      removeAlteration: () => {},
      addTag: () => {},
      removeTag: () => {},
      hasTag: () => true,
      hasAlteration: () => false,
      canUseSpell: () => true,
      canAttack: () => true,
      applyAlterationEffects: () => {},
      resetForNextTurn: () => {},
      recalculateTemporaryStats: () => {}
    };
  };
  
  // Cartes de test
  const playerCards = [
    createTestCard(1, 'Héros', 'personnage', 20),
    createTestCard(2, 'Allié', 'personnage', 15),
    createTestCard(3, 'Support', 'personnage', 10),
    createTestCard(4, 'Épée', 'objet'),
    createTestCard(5, 'Bouclier', 'objet'),
    createTestCard(6, 'Potion', 'objet'),
    createTestCard(7, 'Attaque', 'action'),
    createTestCard(8, 'Défense', 'action'),
    createTestCard(9, 'Taverne', 'lieu')
  ];
  
  // Instances de cartes sur le terrain
  const [playerCharacters, setPlayerCharacters] = useState<CardInstance[]>([
    createCardInstance(playerCards[0], 20),
    createCardInstance(playerCards[1], 15)
  ]);
  
  const [playerObjects, setPlayerObjects] = useState<CardInstance[]>([
    createCardInstance(playerCards[3])
  ]);
  
  const [opponentCharacters, setOpponentCharacters] = useState<CardInstance[]>([
    createCardInstance(createTestCard(10, 'Ennemi 1', 'personnage', 18), 18),
    createCardInstance(createTestCard(11, 'Ennemi 2', 'personnage', 12), 12),
    createCardInstance(createTestCard(12, 'Boss', 'personnage', 25), 25)
  ]);
  
  const [opponentObjects, setOpponentObjects] = useState<CardInstance[]>([
    createCardInstance(createTestCard(13, 'Arme ennemie', 'objet')),
    createCardInstance(createTestCard(14, 'Artefact', 'objet'))
  ]);
  
  // Carte lieu active
  const [activeLieu, setActiveLieu] = useState<CardInstance | null>(
    createCardInstance(playerCards[8])
  );
  
  // Cartes en main
  const [playerHand, setPlayerHand] = useState<Card[]>([
    playerCards[2], // Un personnage
    playerCards[5], // Un objet
    playerCards[6], // Une action
    playerCards[7]  // Une action
  ]);
  
  // Nombre de cartes dans la main adverse (faces cachées)
  const [opponentHandCount, setOpponentHandCount] = useState<number>(3);
  
  // Nombre de cartes restantes dans les pioches
  const [playerDeckCount, setPlayerDeckCount] = useState<number>(20);
  const [opponentDeckCount, setOpponentDeckCount] = useState<number>(18);
  
  // Nombre de cartes dans les défausses
  const [playerDiscardCount, setPlayerDiscardCount] = useState<number>(5);
  const [opponentDiscardCount, setOpponentDiscardCount] = useState<number>(7);
  
  // Gestion du glisser-déposer des cartes
  const handleCardDrop = (cardId: number, zone: string, slot?: number) => {
    console.log(`Carte ${cardId} déposée dans la zone ${zone}${slot !== undefined ? ` à l'emplacement ${slot}` : ''}`);
    
    // Trouver la carte dans la main du joueur
    const cardIndex = playerHand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = playerHand[cardIndex];
    
    // Traiter en fonction de la zone cible
    if (zone === 'player-character' && card.type === 'personnage' && slot !== undefined) {
      // Ajouter un personnage sur le terrain
      const newCharacter = createCardInstance(card);
      const newPlayerCharacters = [...playerCharacters];
      if (slot < 3) { // Vérifier que l'emplacement est valide
        newPlayerCharacters[slot] = newCharacter;
        setPlayerCharacters(newPlayerCharacters);
        
        // Retirer la carte de la main
        const newHand = [...playerHand];
        newHand.splice(cardIndex, 1);
        setPlayerHand(newHand);
      }
    } 
    else if (zone === 'player-object' && card.type === 'objet' && slot !== undefined) {
      // Ajouter un objet sur le terrain
      const newObject = createCardInstance(card);
      const newPlayerObjects = [...playerObjects];
      if (slot < 3) { // Vérifier que l'emplacement est valide
        newPlayerObjects[slot] = newObject;
        setPlayerObjects(newPlayerObjects);
        
        // Retirer la carte de la main
        const newHand = [...playerHand];
        newHand.splice(cardIndex, 1);
        setPlayerHand(newHand);
      }
    }
  };
  
  // Gestion des clics sur les cartes
  const handleCardClick = (card: any, zone: string) => {
    console.log(`Carte cliquée dans la zone ${zone}:`, card);
    
    // Ajouter ici la logique pour les actions sur les cartes (attaques, sorts, etc.)
  };
  
  return (
    <div className="game-board-test-container">
      <h1>Test de la Zone de Jeu</h1>
      <div className="game-board-container">
        <GameBoard 
          playerHand={playerHand}
          playerCharacters={playerCharacters}
          playerObjects={playerObjects}
          playerDeck={playerDeckCount}
          playerDiscard={playerDiscardCount}
          opponentHand={opponentHandCount}
          opponentCharacters={opponentCharacters}
          opponentObjects={opponentObjects}
          opponentDeck={opponentDeckCount}
          opponentDiscard={opponentDiscardCount}
          activeLieu={activeLieu}
          onCardDrop={handleCardDrop}
          onCardClick={handleCardClick}
        />
      </div>
      <div className="test-controls">
        <h2>Contrôles de Test</h2>
        <button onClick={() => setOpponentHandCount(prev => prev + 1)}>
          Ajouter une carte à la main adverse
        </button>
        <button onClick={() => setPlayerDeckCount(prev => Math.max(0, prev - 1))}>
          Piocher une carte
        </button>
        <button onClick={() => {
          if (playerCharacters.length > 0) {
            const updatedCharacters = [...playerCharacters];
            const character = {...updatedCharacters[0]};
            character.currentHealth = Math.max(1, character.currentHealth - 5);
            updatedCharacters[0] = character;
            setPlayerCharacters(updatedCharacters);
          }
        }}>
          Endommager le 1er personnage
        </button>
      </div>
    </div>
  );
};

export default GameBoardTest; 