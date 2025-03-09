import { v4 as uuidv4 } from 'uuid';
import { Player as BasePlayer } from '../types/index';

// Types locaux pour éviter les problèmes d'importation
export type Rarity = 'gros_bodycount' | 'interessant' | 'banger' | 'cheate';

/**
 * Interface pour les modificateurs de motivation.
 * Cette interface définit la structure des modificateurs qui affectent
 * la motivation du joueur.
 */
export interface MotivationModifier {
  id: string;
  value: number;
  isPercentage: boolean;
  source: string;
  duration?: number;
}

/**
 * Interface pour les modificateurs de charisme.
 * Cette interface définit la structure des modificateurs qui affectent
 * la génération, le stockage ou le coût du charisme.
 */
export interface CharismeModifier {
  id: string;
  value: number;
  isPercentage: boolean;
  source: string;
  duration?: number;
  type: 'generation' | 'stockage' | 'cout';
}

/**
 * On étend le type Player de base sans le redéfinir
 */
export type Player = BasePlayer;

/**
 * Interface simplifiée pour les cartes utilisées dans la gestion du charisme.
 */
export interface Card {
  id: number;
  type: string;
  rarity: Rarity | string;
  [key: string]: any; // Pour les autres propriétés
}

/**
 * Constantes par défaut pour le système de charisme
 */
export const DEFAULT_BASE_CHARISME = 0;
export const DEFAULT_MAX_CHARISME = 100;

// Configuration des gains de charisme par rareté
export const CHARISME_GAIN_BY_RARITY: Record<Rarity, number> = {
  'gros_bodycount': 5,  // Rareté 1
  'interessant': 10,    // Rareté 2
  'banger': 20,         // Rareté 3
  'cheate': 40          // Rareté 4
};

/**
 * Initialise les propriétés de charisme d'un joueur
 * 
 * @param player Le joueur à initialiser
 * @returns Le joueur avec les propriétés de charisme initialisées
 */
export const initializePlayerCharisme = (player: Player): Player => {
  return {
    ...player,
    charisme: DEFAULT_BASE_CHARISME,
    baseCharisme: DEFAULT_BASE_CHARISME,
    maxCharisme: DEFAULT_MAX_CHARISME,
    charismeModifiers: []
  };
};

/**
 * Calcule le charisme gagné pour la défaite d'un personnage adverse
 * en fonction de sa rareté
 * 
 * @param card Carte du personnage vaincu
 * @returns Montant de charisme gagné
 */
export const calculateCharismeFromDefeat = (card: Card): number => {
  if (card.type !== 'personnage') {
    return 0;
  }
  
  // Récupérer la valeur en fonction de la rareté
  const rarity = card.rarity as Rarity;
  return CHARISME_GAIN_BY_RARITY[rarity] || 0;
};

/**
 * Ajoute un modificateur de charisme à un joueur
 * 
 * @param player Le joueur auquel ajouter le modificateur
 * @param value Valeur du modificateur
 * @param isPercentage Si le modificateur est un pourcentage
 * @param source Source du modificateur
 * @param type Type de modificateur (génération, stockage, coût)
 * @param duration Durée en tours (optionnel)
 * @returns Le joueur avec le modificateur ajouté
 */
export const addCharismeModifier = (
  player: Player,
  value: number,
  isPercentage: boolean,
  source: string,
  type: 'generation' | 'stockage' | 'cout',
  duration?: number
): Player => {
  const modifier: CharismeModifier = {
    id: uuidv4(),
    value,
    isPercentage,
    source,
    type,
    duration
  };
  
  // Assurer que charismeModifiers existe
  const currentModifiers = player.charismeModifiers || [];
  
  return {
    ...player,
    charismeModifiers: [...currentModifiers, modifier]
  };
};

/**
 * Calcule le charisme généré en appliquant les modificateurs
 * 
 * @param baseValue Valeur de base du charisme généré
 * @param player Joueur pour lequel calculer les modificateurs
 * @returns Valeur après application des modificateurs
 */
export const calculateModifiedCharismeGeneration = (
  baseValue: number,
  player: Player
): number => {
  // Récupérer uniquement les modificateurs de génération
  const generationModifiers = (player.charismeModifiers || []).filter(
    mod => mod.type === 'generation'
  );
  
  // D'abord appliquer les modificateurs à valeur absolue
  let modifiedValue = baseValue;
  generationModifiers
    .filter(mod => !mod.isPercentage)
    .forEach(mod => {
      modifiedValue += mod.value;
    });
  
  // Puis appliquer les modificateurs en pourcentage
  generationModifiers
    .filter(mod => mod.isPercentage)
    .forEach(mod => {
      modifiedValue *= (1 + mod.value / 100);
    });
  
  return Math.max(0, Math.round(modifiedValue));
};

/**
 * Ajoute du charisme à un joueur en respectant le maximum
 * 
 * @param player Le joueur auquel ajouter du charisme
 * @param amount La quantité de charisme à ajouter
 * @returns Le joueur avec son charisme mis à jour
 */
export const addCharisme = (player: Player, amount: number): Player => {
  // S'assurer que le joueur a les propriétés de charisme
  const currentPlayer = player.charisme !== undefined ? player : initializePlayerCharisme(player);
  
  // Appliquer les modificateurs à la génération de charisme
  const modifiedAmount = calculateModifiedCharismeGeneration(amount, currentPlayer);
  
  // Calculer la nouvelle valeur de charisme en respectant le maximum
  const newCharisme = Math.min(
    (currentPlayer.charisme || 0) + modifiedAmount,
    getModifiedMaxCharisme(currentPlayer)
  );
  
  return {
    ...currentPlayer,
    charisme: newCharisme
  };
};

/**
 * Dépense du charisme d'un joueur
 * 
 * @param player Le joueur qui dépense du charisme
 * @param amount La quantité de charisme à dépenser
 * @returns Le joueur avec son charisme mis à jour, ou null si pas assez de charisme
 */
export const spendCharisme = (player: Player, amount: number): Player | null => {
  // S'assurer que le joueur a les propriétés de charisme
  const currentPlayer = player.charisme !== undefined ? player : initializePlayerCharisme(player);
  
  // Calculer le coût modifié avec les modificateurs de coût
  const costModifiers = (currentPlayer.charismeModifiers || []).filter(mod => mod.type === 'cout');
  
  // Appliquer les modificateurs absolus
  let modifiedCost = amount;
  costModifiers
    .filter(mod => !mod.isPercentage)
    .forEach(mod => {
      modifiedCost += mod.value; // Note: les réductions sont des valeurs négatives
    });
  
  // Appliquer les modificateurs en pourcentage
  costModifiers
    .filter(mod => mod.isPercentage)
    .forEach(mod => {
      modifiedCost *= (1 + mod.value / 100); // Note: les réductions sont des pourcentages négatifs
    });
  
  // Arrondir au nombre entier le plus proche
  modifiedCost = Math.max(0, Math.round(modifiedCost));
  
  // Vérifier si le joueur a assez de charisme
  if ((currentPlayer.charisme || 0) < modifiedCost) {
    return null;
  }
  
  // Soustraire le coût et retourner le joueur mis à jour
  return {
    ...currentPlayer,
    charisme: (currentPlayer.charisme || 0) - modifiedCost
  };
};

/**
 * Réduit la durée des modificateurs de charisme temporaires
 * et supprime ceux qui sont expirés
 * 
 * @param player Le joueur dont les modificateurs doivent être mis à jour
 * @returns Le joueur avec les modificateurs mis à jour
 */
export const updateCharismeModifiers = (player: Player): Player => {
  // S'assurer que charismeModifiers existe
  if (!player.charismeModifiers) {
    return player;
  }
  
  const updatedModifiers = player.charismeModifiers
    .map(mod => {
      if (mod.duration === undefined) {
        return mod; // Modificateur permanent
      }
      
      // Réduire la durée de 1
      return {
        ...mod,
        duration: mod.duration - 1
      };
    })
    .filter(mod => mod.duration === undefined || mod.duration > 0); // Supprimer les modificateurs expirés
  
  return {
    ...player,
    charismeModifiers: updatedModifiers
  };
};

/**
 * Calcule la capacité maximale de stockage de charisme en tenant compte des modificateurs
 * 
 * @param player Le joueur pour lequel calculer la capacité
 * @returns La capacité maximale de stockage modifiée
 */
export const getModifiedMaxCharisme = (player: Player): number => {
  // S'assurer que le joueur a les propriétés de charisme
  const currentPlayer = player.maxCharisme !== undefined ? player : initializePlayerCharisme(player);
  
  // Récupérer uniquement les modificateurs de stockage
  const storageModifiers = (currentPlayer.charismeModifiers || []).filter(
    mod => mod.type === 'stockage'
  );
  
  // D'abord appliquer les modificateurs à valeur absolue
  let modifiedMax = currentPlayer.maxCharisme || DEFAULT_MAX_CHARISME;
  storageModifiers
    .filter(mod => !mod.isPercentage)
    .forEach(mod => {
      modifiedMax += mod.value;
    });
  
  // Puis appliquer les modificateurs en pourcentage
  storageModifiers
    .filter(mod => mod.isPercentage)
    .forEach(mod => {
      modifiedMax *= (1 + mod.value / 100);
    });
  
  return Math.max(0, Math.round(modifiedMax));
};

/**
 * Modifie la capacité maximale de stockage de charisme d'un joueur
 * 
 * @param player Le joueur dont la capacité doit être modifiée
 * @param newMax Nouvelle capacité maximale
 * @returns Le joueur avec la capacité maximale mise à jour
 */
export const setMaxCharisme = (player: Player, newMax: number): Player => {
  // S'assurer que le joueur a les propriétés de charisme
  const currentPlayer = player.charisme !== undefined ? player : initializePlayerCharisme(player);
  
  return {
    ...currentPlayer,
    maxCharisme: newMax,
    // Assurer que le charisme actuel ne dépasse pas la nouvelle limite
    charisme: Math.min((currentPlayer.charisme || 0), newMax)
  };
};

/**
 * Gère l'acquisition de charisme suite à la défaite d'un personnage adverse
 * 
 * @param player Le joueur qui gagne du charisme
 * @param defeatedCard La carte du personnage vaincu
 * @returns Le joueur avec son charisme mis à jour
 */
export const handleCharismeFromDefeat = (
  player: Player,
  defeatedCard: Card
): Player => {
  // Calculer le charisme à gagner
  const charismeGain = calculateCharismeFromDefeat(defeatedCard);
  
  // Ajouter le charisme au joueur
  return addCharisme(player, charismeGain);
}; 