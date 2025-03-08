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
  
  // Statistiques temporaires (peuvent être modifiées par des altérations)
  temporaryStats: {
    attack: number;
    defense: number;
    [key: string]: number;
  };
  
  // Historique des changements de PV pour faciliter le débogage et l'affichage
  damageHistory: Array<{
    type: 'damage' | 'heal';
    amount: number;
    source?: string;
    timestamp: number;
  }>;
  
  // Effets actifs par catégorie (pour faciliter les calculs)
  activeEffects: {
    [key: string]: Array<{
      value: number;
      source: string;
      isPercentage: boolean;
    }>;
  };
  
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

  // Propriétés de niveau (spécifiques aux personnages)
  level?: number;
  maxLevel?: number;
  xp?: number;
  xpToNextLevel?: number;
  
  // Méthodes pour manipuler l'état
  applyDamage: (amount: number, source?: string) => void;
  heal: (amount: number, source?: string) => void;
  addAlteration: (alteration: Alteration, source: CardInstance) => void;
  removeAlteration: (alterationId: number) => void;
  addTag: (tag: Tag, isTemporary?: boolean, duration?: number) => void;
  removeTag: (tagId: number) => void;
  addExperience?: (amount: number) => boolean; // Retourne true si le personnage monte de niveau
  levelUp?: () => void;
  
  // Méthodes pour vérifier l'état
  hasTag: (tagId: number) => boolean;
  hasAlteration: (alterationId: number) => boolean;
  canUseSpell: (spellId: number) => boolean;
  canAttack: () => boolean;
  
  // Nouvelle méthode pour appliquer les effets des altérations actives
  applyAlterationEffects: () => void;
  
  // Restaure la carte à la fin du tour
  resetForNextTurn: () => void;
  
  // Recalcule les statistiques temporaires basées sur les altérations actives
  recalculateTemporaryStats: () => void;
}

/**
 * Représente une altération active sur une carte
 */
export interface ActiveAlteration {
  alteration: Alteration;
  remainingDuration: number | null; // null pour les altérations permanentes
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
 * Configuration pour la distribution des cartes Lieu
 */
export interface LieuDistributionConfig {
  // Nombre de cartes lieu par joueur dans son booster
  lieuCardsPerPlayer: number;
  
  // Nombre total de cartes lieu mises en commun
  totalCommonLieuCards: number;
}

/**
 * Résultat de la distribution des cartes Lieu
 */
export interface LieuDistributionResult {
  // Cartes lieu mises en commun (incluant celles des deux joueurs)
  commonLieuCards: CardInstance[];
  
  // Carte lieu active actuellement
  activeLieuCard: CardInstance | null;
}

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
  
  // Méthodes de gestion des cartes Lieu
  distributeLieuCards: (players: CardInstance[][], config: LieuDistributionConfig) => LieuDistributionResult;
  selectRandomActiveLieu: (commonLieuCards: CardInstance[]) => CardInstance | null;
  changeLieuCard: (newLieuCard: CardInstance) => void;
  getActiveLieuCard: () => CardInstance | null;
} 