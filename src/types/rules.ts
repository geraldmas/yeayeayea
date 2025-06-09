/**
 * Types pour le système de parsing de règles d'effets pour les tags
 */

/**
 * Types d'effets possibles pour les règles de tags
 */
export enum TagRuleEffectType {
  CHARISME_GENERATION = 'charismeGeneration',  // Modifie la génération de charisme
  DAMAGE_MODIFIER = 'damageModifier',         // Modifie les dégâts infligés ou reçus
  MOTIVATION_MODIFIER = 'motivationModifier', // Modifie la motivation générée ou consommée
  HEALTH_MODIFIER = 'healthModifier',         // Modifie les PV max ou actuels
  ATTACK_MODIFIER = 'attackModifier',         // Modifie la statistique d'attaque de base
  DEFENSE_MODIFIER = 'defenseModifier',       // Modifie la statistique de défense de base
  APPLY_ALTERATION = 'applyAlteration',       // Applique une altération
  CONDITIONAL_EFFECT = 'conditionalEffect',   // Effet qui s'applique sous condition
  SYNERGY_EFFECT = 'synergyEffect',           // Effet qui s'applique en fonction d'autres tags
  DISABLE_ATTACK = 'disableAttack',           // Empêche les cartes ciblées d'attaquer
}

/**
 * Types de cibles possibles pour les règles de tags
 */
export enum TagRuleTargetType {
  SELF = 'self',               // Le possesseur du tag
  OPPONENT = 'opponent',       // L'adversaire du possesseur
  ALL = 'all',                 // Tous les personnages
  TAGGED = 'tagged',           // Les personnages portant un tag spécifique
  OWN_TEAM = 'ownTeam',        // Les personnages de l'équipe du possesseur
  OPPONENT_TEAM = 'opponentTeam' // Les personnages de l'équipe adverse
}

/**
 * Types de conditions possibles pour les règles conditionnelles
 */
export enum TagRuleConditionType {
  HAS_TAG = 'hasTag',          // Si la cible a un tag spécifique
  HAS_ALTERATION = 'hasAlteration', // Si la cible a une altération spécifique
  HEALTH_PERCENTAGE = 'healthPercentage', // En fonction du pourcentage de PV
  CHARISME_AMOUNT = 'charismeAmount', // En fonction du montant de charisme
  MOTIVATION_AMOUNT = 'motivationAmount', // En fonction du montant de motivation
  ACTIVE_LIEU = 'activeLieu',  // En fonction du lieu actif
  CHANCE = 'chance'            // Effet basé sur une probabilité
}

/**
 * Interface représentant une règle d'effet pour un tag
 */
export interface TagRule {
  id?: number;                 // Identifiant unique de la règle
  name: string;                // Nom de la règle
  description: string;         // Description de la règle
  effectType: TagRuleEffectType; // Type d'effet
  value: number;               // Valeur de l'effet
  isPercentage: boolean;       // Si la valeur est un pourcentage
  targetType: TagRuleTargetType; // Type de cible
  targetTag?: string;          // Tag ciblé (pour targetType === TAGGED)
  alterationId?: number;       // ID de l'altération à appliquer
  condition?: TagRuleCondition; // Condition optionnelle
  synergyTags?: string[];      // Tags qui interagissent pour un effet de synergie
  priority?: number;           // Priorité de la règle (plus élevé = appliqué en premier)
  subEffect?: Omit<TagRule, 'id' | 'name' | 'description' | 'condition' | 'synergyTags' | 'subEffect' | 'priority' | 'sourceTag'>; // The actual effect to scale/apply, sourceTag is also excluded as it's implicit to the parent rule
}

/**
 * Interface représentant une condition pour une règle de tag
 */
export interface TagRuleCondition {
  type: TagRuleConditionType;  // Type de condition
  value: number | string;      // Valeur de la condition
  comparison?: 'equal' | 'notEqual' | 'greater' | 'less' | 'greaterOrEqual' | 'lessOrEqual'; // Type de comparaison
  tagName?: string;            // Nom du tag pour les conditions HAS_TAG
  alterationId?: number;       // ID de l'altération pour les conditions HAS_ALTERATION
  lieuName?: string;           // Nom du lieu pour les conditions ACTIVE_LIEU
}

/**
 * Interface pour stocker le résultat de l'application d'une règle de tag
 */
export interface TagRuleApplicationResult {
  success: boolean;            // Si la règle a été appliquée avec succès
  sourceTag: string;           // Le tag source de la règle
  affectedEntities: string[];  // Les identifiants des entités affectées
  effectDescription: string;   // Description de l'effet appliqué
  originalValue: number;       // Valeur originale
  newValue: number;            // Nouvelle valeur après application
  failureReason?: string;      // Raison de l'échec si success === false
}

/**
 * Format pour les règles de tags définies en JSON
 */
export interface TagRuleDefinition {
  tagName: string;             // Nom du tag
  rules: TagRule[];            // Liste des règles associées à ce tag
} 