import React, { useState } from 'react';
import './GameBoard.css';
import { Card, CardFrontend } from '../types/index';
import { CardInstance } from '../types/combat';

interface GameBoardProps {
  // Propriétés du joueur
  playerHand: Card[];
  playerCharacters: CardInstance[];
  playerObjects: CardInstance[];
  playerDeck: number; // Nombre de cartes restantes dans la pioche
  playerDiscard: number; // Nombre de cartes dans la défausse
  
  // Propriétés de l'adversaire
  opponentHand: number; // Nombre de cartes en main (faces cachées)
  opponentCharacters: CardInstance[];
  opponentObjects: CardInstance[];
  opponentDeck: number;
  opponentDiscard: number;
  
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
  opponentHand,
  opponentCharacters,
  opponentObjects,
  opponentDeck,
  opponentDiscard,
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
      onCardDrop(draggedCard.id, zone, slot);
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

  // Rendu de la main du joueur
  const renderPlayerHand = () => {
    return (
      <div className="player-hand">
        {playerHand.map((card) => (
          <div 
            key={`hand-card-${card.id}`}
            className="hand-card"
            draggable
            onDragStart={(e) => handleDragStart(e, card)}
            onClick={() => handleCardClick(card, 'player-hand')}
          >
            <div className="card-name">{card.name}</div>
            <div className="card-type">{card.type}</div>
          </div>
        ))}
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

  return (
    <div className="game-board">
      <div className="opponent-area">
        {renderOpponentHand()}
        <div className="opponent-battlefield">
          <div className="characters-row">
            {renderCharacterSlots(opponentCharacters, false)}
          </div>
          <div className="objects-row">
            {renderObjectSlots(opponentObjects, false)}
          </div>
        </div>
        {renderDeckAndDiscard(false)}
      </div>
      
      <div className="center-area">
        {renderActiveLieu()}
      </div>
      
      <div className="player-area">
        {renderDeckAndDiscard(true)}
        <div className="player-battlefield">
          <div className="objects-row">
            {renderObjectSlots(playerObjects, true)}
          </div>
          <div className="characters-row">
            {renderCharacterSlots(playerCharacters, true)}
          </div>
        </div>
        {renderPlayerHand()}
      </div>
    </div>
  );
};

export default GameBoard; 