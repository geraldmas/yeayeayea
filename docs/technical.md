# Documentation Technique - Yeayeayea

## Architecture Globale

Le projet est une application React TypeScript qui permet de gérer et éditer des cartes pour un jeu de cartes à collectionner (YYY). L'application utilise Supabase comme backend et est structurée de manière modulaire.

## Structure des Données

### Types Principaux

#### Card
```typescript
interface Card {
  id: number;
  name: string;
  type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
  rarity: Rarity;
  description: string;
  image: string;
  passive_effect: string;
  properties: {
    health?: number;
    [key: string]: any;
  };
  is_wip: boolean;
  is_crap: boolean;
  summon_cost: number;
  tags?: Array<{
    id: number;
    name: string;
    passive_effect: string | null;
  }>;
}
```

#### Spell
```typescript
interface Spell {
  id: number;
  name: string;
  description: string | null;
  cost: number | null;
  effects: SpellEffect[];
  is_value_percentage: boolean;
}
```

#### Tag
```typescript
interface Tag {
  id: number;
  name: string;
  passive_effect: string | null;
}
```

#### Alteration
```typescript
interface Alteration {
  id?: number;
  name: string;
  description: string;
  type: 'buff' | 'debuff' | 'status' | 'other';
  duration?: number;
  stackable: boolean;
  unique_effect: boolean;
  icon?: string;
  effect: AlterationEffect;
  color?: string;
}
```

## Composants Principaux

### App.tsx
Le composant principal qui gère :
- L'authentification des utilisateurs
- La navigation entre les différentes vues
- La gestion des cartes (création, modification, suppression)
- L'état global de l'application

#### Fonctions Principales
- `handleCardSave`: Sauvegarde une carte dans la base de données
- `handleDeleteCard`: Supprime une carte
- `loadCards`: Charge toutes les cartes avec leurs tags et sorts associés
- `handleRandomEdit`: Sélectionne aléatoirement une carte à éditer selon des critères spécifiques

### CardForm
Composant pour la création et l'édition des cartes.

### BoosterForm
Composant pour la création de boosters de cartes.

### CardBrowser
Interface de navigation et de recherche des cartes.

### AlterationManager
Gestionnaire des altérations (buffs, debuffs, etc.).

## Base de Données

### Tables Principales
- `cards`: Stocke les informations de base des cartes
- `card_tags`: Table de liaison entre cartes et tags
- `card_spells`: Table de liaison entre cartes et sorts
- `tags`: Stocke les tags disponibles
- `spells`: Stocke les sorts disponibles
- `alterations`: Stocke les altérations disponibles

## Système d'Authentification

L'application utilise un système d'authentification basé sur Supabase avec :
- Stockage local du token
- Gestion des sessions
- Vérification des droits administrateur

## Gestion des États

L'application utilise React hooks pour la gestion des états :
- `useState` pour les états locaux
- `useEffect` pour les effets de bord
- Context API pour certains états globaux

## Utilitaires

### supabaseClient
Client Supabase pour les interactions avec la base de données.

## Moteur de règles

Le `TagRuleParserService` joue le rôle de moteur de règles. Il charge les
définitions de synergies à partir de fichiers JSON ou de chaînes de texte puis
applique ces règles pendant les combats.

Les règles sont regroupées par nom de tag via l'interface
`TagRuleDefinition` :

```typescript
interface TagRuleDefinition {
  tagName: string;
  rules: TagRule[];
}
```

Chaque objet `TagRule` décrit l'effet à appliquer :

```typescript
interface TagRule {
  id?: number;
  name: string;
  description: string;
  effectType: TagRuleEffectType;
  value: number;
  isPercentage: boolean;
  targetType: TagRuleTargetType;
  targetTag?: string;
  alterationId?: number;
  condition?: TagRuleCondition;
  synergyTags?: string[];
  priority?: number;
}
```

Exemple de règle textuelle :
`damageModifier:self:+15%:Augmente les dégâts de 15%`.

Un nouvel `effectType` nommé `DISABLE_ATTACK` permet d'empêcher les cartes ciblées
d'attaquer. Exemple dans `tagRules.json` :

```json
{
  "tagName": "PROTECTEUR",
  "rules": [
    {
      "id": 2,
      "name": "Intimidation",
      "description": "Empêche les Berserkers ennemis d'attaquer.",
      "effectType": "DISABLE_ATTACK",
      "targetType": "TAGGED",
      "targetTag": "BERSERKER",
      "value": 0,
      "isPercentage": false
    }
  ]
}
```

Le service gère la priorité d'application et permet de tester facilement de
nouvelles synergies.

## Visualisation des synergies

Un composant `SynergyIndicator` affiche une icône sur chaque carte lorsqu'un
effet de synergie est actif. Les informations détaillées sont accessibles via un
tooltip et proviennent du `combatLogService`. Cette indication visuelle aide à
comprendre rapidement quelles cartes profitent des combinaisons de tags.

## Interface de débug

Une interface de débug (voir tâche 3) permet de modifier en temps réel les
paramètres stockés dans la table `game_config` à l'aide du
`gameConfigService`. Ce panneau facilite l'équilibrage en ajustant immédiatement
les valeurs de génération de charisme, de coûts ou de limitations sans devoir
redémarrer l'application.

## Styles

L'application utilise :
- CSS modules pour les styles modulaires
- CSS global pour les styles communs
- Classes utilitaires pour les composants réutilisables

## Bonnes Pratiques

1. **TypeScript**
   - Utilisation stricte des types
   - Interfaces pour les structures de données
   - Types génériques pour la réutilisation

2. **React**
   - Composants fonctionnels
   - Hooks personnalisés
   - Gestion optimisée des re-rendus

3. **Base de Données**
   - Relations normalisées
   - Indexation appropriée
   - Gestion des transactions

## Sécurité

- Validation des données côté serveur
- Protection des routes sensibles
- Gestion sécurisée des tokens
- Sanitization des entrées utilisateur

## Performance

- Chargement paresseux des composants
- Mise en cache des données
- Optimisation des requêtes
- Gestion efficace des images

## Tests

- Tests unitaires pour les composants
- Tests d'intégration pour les flux
- Tests end-to-end pour les scénarios critiques
- Tests de performance

## Déploiement

- Build optimisé
- Gestion des variables d'environnement
- Monitoring des performances
- Gestion des versions 