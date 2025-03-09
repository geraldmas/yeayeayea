import React, { useState } from 'react';
import './GameBoard.css';
import { Card, CardFrontend } from '../types/index';
import { CardInstance } from '../types/combat';
import MotivationDisplay from './MotivationDisplay';
import CharismeDisplay from './CharismeDisplay';

interface GameBoardProps {
  // Propriétés du joueur
  playerHand: Card[];
  playerCharacters: CardInstance[];
  playerObjects: CardInstance[];
  playerDeck: number; // Nombre de cartes restantes dans la pioche
  playerDiscard: number; // Nombre de cartes dans la défausse
  playerCharisme?: number;
  playerMaxCharisme?: number;
  playerCharismeModifiers?: any[];
  
  // Propriétés de l'adversaire
  opponentHand: number; // Nombre de cartes en main (faces cachées)
  opponentCharacters: CardInstance[];
  opponentObjects: CardInstance[];
  opponentDeck: number;
  opponentDiscard: number;
  opponentCharisme?: number;
  opponentMaxCharisme?: number;
  opponentCharismeModifiers?: any[];
  
  // Lieu actif
  activeLieu: CardInstance | null;
  
  // Actions
  onCardDrop?: (cardId: number, zone: string, slot?: number) => void;
  onCardClick?: (card: Card | CardInstance, zone: string) => void;
}

/**
 * Composant GameBoard - Zone de jeu tactile
 * 
 * Affiche le terrain de jeu complet avec:
 * - Main du joueur en bas
 * - Main adverse en haut (faces cachées)
 * - Emplacements des personnages (3 par joueur)
 * - Emplacements des objets (3 par joueur)
 * - Carte lieu au centre
 * - Pioches et défausses
 */
const GameBoard: React.FC<GameBoardProps> = ({
  playerHand,
  playerCharacters,
  playerObjects,
  playerDeck,
  playerDiscard,
  playerCharisme = 0,
  playerMaxCharisme = 100,
  playerCharismeModifiers = [],
  opponentHand,
  opponentCharacters,
  opponentObjects,
  opponentDeck,
  opponentDiscard,
  opponentCharisme = 0,
  opponentMaxCharisme = 100,
  opponentCharismeModifiers = [],
  activeLieu,
  onCardDrop,
  onCardClick
}) => {
  // État pour le glisser-déposer
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);

  // Gestionnaires d'événements pour le glisser-déposer
  const handleDragStart = (e: React.DragEvent, card: Card) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Nécessaire pour autoriser le drop
  };

  const handleDrop = (e: React.DragEvent, zone: string, slot?: number) => {
    e.preventDefault();
    if (draggedCard && onCardDrop) {
      // Gérer spécifiquement les cartes action qui peuvent être déposées n'importe où
      if (draggedCard.type === 'action' || draggedCard.type === 'evenement') {
        // Les cartes action et événement peuvent être activées où qu'elles soient déposées
        onCardDrop(draggedCard.id, 'activate', slot);
      } else {
        // Pour les autres types de cartes, utiliser la logique standard
        onCardDrop(draggedCard.id, zone, slot);
      }
    }
    setDraggedCard(null);
  };

  const handleCardClick = (card: Card | CardInstance, zone: string) => {
    if (onCardClick) {
      onCardClick(card, zone);
    }
  };

  // Rendu des emplacements de personnages
  const renderCharacterSlots = (characters: CardInstance[], isPlayer: boolean) => {
    const slots = [];
    const maxSlots = 3; // Nombre d'emplacements de personnages

    for (let i = 0; i < maxSlots; i++) {
      const character = characters[i] || null;
      
      slots.push(
        <div 
          key={`character-slot-${isPlayer ? 'player' : 'opponent'}-${i}`}
          className={`character-slot ${character ? 'occupied' : 'empty'}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, isPlayer ? 'player-character' : 'opponent-character', i)}
        >
          {character ? (
            <div 
              className="character-card"
              onClick={() => handleCardClick(character, isPlayer ? 'player-character' : 'opponent-character')}
            >
              <div className="card-name">{character.cardDefinition.name}</div>
              <div className="card-health">❤️ {character.currentHealth}/{character.maxHealth}</div>
              {/* Afficher les tags actifs */}
              <div className="card-tags">
                {character.activeTags.map((tagInstance, idx) => (
                  <span key={idx} className="tag">{tagInstance.tag.name}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-slot-text">Emplacement personnage</div>
          )}
        </div>
      );
    }

    return slots;
  };

  // Rendu des emplacements d'objets
  const renderObjectSlots = (objects: CardInstance[], isPlayer: boolean) => {
    const slots = [];
    const maxSlots = 3; // Nombre d'emplacements d'objets

    for (let i = 0; i < maxSlots; i++) {
      const object = objects[i] || null;
      
      slots.push(
        <div 
          key={`object-slot-${isPlayer ? 'player' : 'opponent'}-${i}`}
          className={`object-slot ${object ? 'occupied' : 'empty'}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, isPlayer ? 'player-object' : 'opponent-object', i)}
        >
          {object ? (
            <div 
              className="object-card"
              onClick={() => handleCardClick(object, isPlayer ? 'player-object' : 'opponent-object')}
            >
              <div className="card-name">{object.cardDefinition.name}</div>
            </div>
          ) : (
            <div className="empty-slot-text">Emplacement objet</div>
          )}
        </div>
      );
    }

    return slots;
  };

  // Rendu de la main du joueur avec gestion spéciale des cartes événement
  const renderPlayerHand = () => {
    return (
      <div className="player-hand-container">
        <div className="section-title">Votre Main</div>
        <div className="player-hand">
          {playerHand.length > 0 ? (
            playerHand.map((card) => (
              <div 
                key={`hand-card-${card.id}`}
                className={`hand-card hand-card-${card.type} ${card.type === 'evenement' ? 'face-down' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, card)}
                onClick={() => handleCardClick(card, 'player-hand')}
              >
                {card.type !== 'evenement' ? (
                  <>
                    <div className="card-name">{card.name}</div>
                    <div className="card-type">{card.type}</div>
                    {card.type === 'personnage' && card.properties && card.properties.health && (
                      <div className="card-health">❤️ {card.properties.health}</div>
                    )}
                    {card.rarity && (
                      <div className="card-rarity">{card.rarity}</div>
                    )}
                    {card.type === 'action' && (
                      <div className="action-indicator">Activable partout</div>
                    )}
                  </>
                ) : (
                  <div className="event-card-back">Événement</div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-hand-message">
              <span>Aucune carte en main</span>
              <div className="hand-hint">Utilisez le bouton "Piocher une carte" ci-dessous</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Rendu de la main de l'adversaire (faces cachées)
  const renderOpponentHand = () => {
    const handCards = [];
    for (let i = 0; i < opponentHand; i++) {
      handCards.push(
        <div 
          key={`opponent-hand-${i}`}
          className="opponent-hand-card face-down"
        />
      );
    }
    return <div className="opponent-hand">{handCards}</div>;
  };

  // Rendu des pioches et défausses
  const renderDeckAndDiscard = (isPlayer: boolean) => {
    const deckCount = isPlayer ? playerDeck : opponentDeck;
    const discardCount = isPlayer ? playerDiscard : opponentDiscard;
    
    return (
      <div className={`${isPlayer ? 'player' : 'opponent'}-deck-area`}>
        <div className="deck">
          <div className="deck-card">
            <span className="deck-count">{deckCount}</span>
          </div>
        </div>
        <div className="discard">
          <div className="discard-card">
            <span className="discard-count">{discardCount}</span>
          </div>
        </div>
      </div>
    );
  };

  // Rendu du lieu actif
  const renderActiveLieu = () => {
    return (
      <div className="active-lieu">
        {activeLieu ? (
          <div 
            className="lieu-card"
            onClick={() => handleCardClick(activeLieu, 'active-lieu')}
          >
            <div className="card-name">{activeLieu.cardDefinition.name}</div>
            <div className="card-description">{activeLieu.cardDefinition.description}</div>
          </div>
        ) : (
          <div className="empty-lieu">Aucun lieu actif</div>
        )}
      </div>
    );
  };

  // Créer des objets Player simplifiés pour les affichages
  const playerData = {
    id: 'player',
    name: 'Joueur',
    charisme: playerCharisme,
    baseCharisme: 0,
    maxCharisme: playerMaxCharisme,
    charismeModifiers: playerCharismeModifiers,
    motivation: 10, // Valeurs fictives pour le moment
    baseMotivation: 10,
    motivationModifiers: [],
    // Autres propriétés requises par l'interface Player
    activeCard: null,
    benchCards: [],
    inventory: [],
    hand: [],
    movementPoints: 0,
    points: 0,
    effects: []
  };
  
  const opponentData = {
    id: 'opponent',
    name: 'Adversaire',
    charisme: opponentCharisme,
    baseCharisme: 0,
    maxCharisme: opponentMaxCharisme,
    charismeModifiers: opponentCharismeModifiers,
    motivation: 10,
    baseMotivation: 10,
    motivationModifiers: [],
    // Autres propriétés requises par l'interface Player
    activeCard: null,
    benchCards: [],
    inventory: [],
    hand: [],
    movementPoints: 0,
    points: 0,
    effects: []
  };
  
  // Ajout des composants d'affichage de charisme
  const renderPlayerInfo = () => {
    return (
      <div className="player-info">
        <MotivationDisplay player={playerData} isActive={true} />
        <CharismeDisplay player={playerData} isActive={true} />
      </div>
    );
  };
  
  const renderOpponentInfo = () => {
    return (
      <div className="opponent-info">
        <MotivationDisplay player={opponentData} isActive={false} />
        <CharismeDisplay player={opponentData} isActive={false} />
      </div>
    );
  };

  return (
    <div className="game-board">
      <div className="opponent-area">
        {renderOpponentInfo()}
        {renderOpponentHand()}
        <div className="opponent-play-area">
          {renderCharacterSlots(opponentCharacters, false)}
          {renderObjectSlots(opponentObjects, false)}
        </div>
        {renderDeckAndDiscard(false)}
      </div>
      
      <div className="middle-area">
        {renderActiveLieu()}
      </div>
      
      <div className="player-area">
        {renderDeckAndDiscard(true)}
        <div className="player-play-area">
          {renderCharacterSlots(playerCharacters, true)}
          {renderObjectSlots(playerObjects, true)}
        </div>
        {renderPlayerHand()}
        {renderPlayerInfo()}
      </div>
    </div>
  );
};

export default GameBoard; 