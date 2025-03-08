import { Card, Alteration, Tag, Spell } from './index';

/**
 * Structure représentant une instance de carte en jeu.
 * Contrairement à Card (définition) qui contient la définition statique de la carte,
 * CardInstance contient l'état actuel de la carte pendant une partie.
 */
export interface CardInstance {
  // Identifiant unique pour cette instance spécifique (différent de l'id de la carte)
  instanceId: string;
  
  // Référence à la définition de carte originale
  cardDefinition: Card;
  
  // État actuel de la carte
  currentHealth: number;
  maxHealth: number;
  
  // Position sur le terrain
  position?: {
    x: number;
    y: number;
  };
  
  // Altérations actives sur cette carte
  activeAlterations: ActiveAlteration[];
  
  // Tags actifs pour cette carte (peut être différent des tags initiaux)
  activeTags: TagInstance[];
  
  // Sorts disponibles pour cette carte
  availableSpells: SpellInstance[];
  
  // État de la carte
  isExhausted: boolean; // Si la carte a déjà été utilisée ce tour
  isTapped: boolean;    // Si la carte est inclinée (pour les actions spéciales)
  
  // Compteurs spécifiques
  counters: {
    [key: string]: number;
  };

  // Méthodes pour manipuler l'état
  applyDamage: (amount: number) => void;
  heal: (amount: number) => void;
  addAlteration: (alteration: Alteration, source: CardInstance) => void;
  removeAlteration: (alterationId: number) => void;
  addTag: (tag: Tag, isTemporary?: boolean, duration?: number) => void;
  removeTag: (tagId: number) => void;
  
  // Méthodes pour vérifier l'état
  hasTag: (tagId: number) => boolean;
  hasAlteration: (alterationId: number) => boolean;
  canUseSpell: (spellId: number) => boolean;
  canAttack: () => boolean;
  
  // Restaure la carte à la fin du tour
  resetForNextTurn: () => void;
}

/**
 * Représente une altération active sur une carte
 */
export interface ActiveAlteration {
  alteration: Alteration;
  remainingDuration: number;
  stackCount: number;
  source: CardInstance;
}

/**
 * Représente un tag appliqué à une carte
 */
export interface TagInstance {
  tag: Tag;
  isTemporary: boolean;
  remainingDuration?: number;
}

/**
 * Représente un sort disponible pour une carte
 */
export interface SpellInstance {
  spell: Spell;
  cooldown: number;
  isAvailable: boolean;
}

/**
 * Type de cible pour les actions et sorts
 */
export type TargetType = 'self' | 'opponent' | 'all' | 'tagged' | 'random';

/**
 * Gestionnaire de combat
 */
export interface CombatManager {
  cardInstances: CardInstance[];
  
  // Méthodes de gestion du combat
  initializeCardInstance: (card: Card) => CardInstance;
  executeAttack: (attacker: CardInstance, target: CardInstance) => void;
  castSpell: (caster: CardInstance, spell: Spell, targets: CardInstance[]) => void;
  applyAlterations: () => void;
  checkForDefeated: () => CardInstance[];
  
  // Méthodes de ciblage
  getValidTargets: (source: CardInstance, targetType: TargetType, tagId?: number) => CardInstance[];
  getRandomTarget: (source: CardInstance, targetType: TargetType) => CardInstance | null;
} 