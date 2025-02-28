# TCG Card Editor

Un éditeur de cartes pour jeu de cartes à collectionner (TCG) qui vous permet de créer et modifier des cartes facilement en renseignant une structure prédéfinie.

Application disponible en ligne : [TCG Card Editor](https://geraldmas.github.io/yeayeayea/)

## Caractéristiques

- Création et édition de cartes avec tous les champs (sorts, effets, tags, etc.)
- Prévisualisation en temps réel des cartes avec leur apparence finale
- Sauvegarde automatique des cartes en cours d'édition
- Interface intuitive pour la gestion des éléments complexes (sorts, effets, tags)
- Validation de données pour éviter les erreurs de structure
- Support complet pour tous les types de cartes et d'effets
- Système de rareté avec badges visuels
- Gestion des images avec support des URLs
- Sélection aléatoire de cartes à compléter
- Stockage des données dans une base de données en ligne
- Navigation et recherche dans la collection de cartes existantes

## Utilisation

### Créer une carte

1. Sélectionnez l'onglet "Carte"
2. Remplissez les champs requis (ID, nom, type, etc.)
   - L'application suggère automatiquement les valeurs précédemment utilisées pour :
     - Les noms de cartes
     - Les descriptions
     - Les URLs d'images
3. Ajoutez des sorts en cliquant sur "Ajouter un sort"
4. Pour chaque sort, ajoutez des effets en cliquant sur "Ajouter un effet"
5. Ajoutez des tags en cliquant sur "Ajouter un tag"
6. Si la carte est un personnage, vous pouvez ajouter un talent
7. Vérifiez l'aperçu en temps réel de votre carte
8. La carte est automatiquement sauvegardée lors de vos modifications

### Compléter une carte au hasard

1. Dans l'onglet "Carte", cliquez sur le bouton "Remplir aléatoirement"
2. Choisissez le type de complètement souhaité :
   - Image : sélectionne une carte sans image
   - Description : sélectionne une carte sans description
   - Tags : sélectionne une carte sans tags
   - Sorts : sélectionne une carte sans sorts
   - En cours : sélectionne une carte marquée comme "en cours" (WIP)
3. La carte sélectionnée sera chargée dans l'éditeur pour que vous puissiez la compléter

### Guide détaillé des champs

#### Informations de base d'une carte
- **ID**: Identifiant unique de la carte (généré automatiquement si non spécifié)
- **Nom**: Nom de la carte (obligatoire)
- **Description**: Description de la carte
- **Image**: URL ou chemin d'accès à l'image de la carte
- **Type**: Type de la carte (personnage, objet, événement, lieu, action)
- **Points de vie**: Santé de la carte (pour les personnages)
- **Effet passif**: Effet qui s'applique en permanence sans action requise
- **Rareté**: Niveau de rareté de la carte (gros bodycount, intéressant, banger, cheaté)
- **Carte EX**: Cochez si la carte vaut 2 points au lieu de 1
- **Position**: Position initiale de la carte (active, banc, main, inventaire)

#### Sorts
Chaque carte peut avoir plusieurs sorts avec les champs suivants:
- **Nom**: Nom du sort
- **Description**: Description du comportement du sort
- **Puissance**: Valeur de base de puissance du sort
- **Portée Min/Max**: Portée minimale et maximale (en cases) du sort
- **Coût**: Coût en points d'action pour utiliser le sort

#### Effets de sort
Chaque sort peut avoir plusieurs effets:
- **Type**: Le type d'effet (dégâts, soins, statut, pioche, poison, ressource, spécial)
- **Valeur**: Puissance/valeur numérique de l'effet
- **Type de cible**: Qui est affecté par l'effet (soi-même, adversaire, tous, tag spécifique)
- **Tag ciblé**: Si le type de cible est "tagged", spécifiez quel tag est ciblé
- **Chance**: Probabilité (en %) que l'effet se produise
- **Durée**: Nombre de tours pendant lesquels l'effet persiste

#### Tags
Les tags permettent de catégoriser les cartes et d'activer des synergies:
- **Nom**: Nom du tag (ex: "Feu", "Eau", "Insecte")
- **Effet passif**: Description de l'effet passif lié à ce tag

#### Talent (spécifique aux personnages)
Un talent est un sort spécial qui peut être utilisé depuis le banc:
- Mêmes champs qu'un sort normal
- Limité à un seul talent par carte de personnage

### Navigation et recherche

L'application dispose d'un système complet de navigation et de filtrage :

#### Recherche
- Barre de recherche textuelle pour trouver rapidement une carte par son nom, sa description ou son type
- Affichage en temps réel du nombre de cartes correspondant aux critères

#### Filtres
1. **Statut**
   - 🚧 En cours (WIP)
   - ✅ Terminé
2. **Type**
   - 👤 Personnage
   - 🎁 Objet
   - ⚡ Événement
   - 🏰 Lieu
   - 🎯 Action
3. **Rareté**
   - Gros bodycount
   - Intéressant
   - Banger (avec animation)
   - Cheaté (avec animation)
4. **🚨 Éléments manquants**
   - Sans image
   - Sans description
   - Sans tags
   - Sans sorts
5. **Tags spécifiques**
   - Sélection multiple de tags
   - Filtrage par combinaison de tags (ET logique)

#### Fonctionnalités supplémentaires
- Double-clic sur une carte pour l'éditer
- Prévisualisation de la carte sélectionnée
- Export des cartes filtrées au format CSV
- Réinitialisation rapide de tous les filtres

## Sauvegarde des données

### Sauvegarde automatique
- Les modifications sont sauvegardées automatiquement dans la base de données en ligne
- Les valeurs fréquemment utilisées (noms, descriptions, URLs d'images) sont mémorisées localement pour faciliter la saisie
- Une copie de secours des cartes est conservée dans le stockage local du navigateur

### Synchronisation
- Les cartes sont automatiquement synchronisées avec la base de données
- Les modifications sont immédiatement visibles dans l'interface de navigation
- La recherche et le filtrage sont mis à jour en temps réel

## Validation des données

L'application effectue automatiquement les validations suivantes :
- Tous les champs obligatoires sont remplis
- Les valeurs numériques sont dans des plages acceptables
- Les types d'effets correspondent aux options autorisées
- Les relations entre les différents éléments sont cohérentes

## Dépannage

### Problèmes courants et solutions

1. **La sauvegarde ne fonctionne pas**
   - Vérifiez votre connexion internet
   - Rafraîchissez la page
   - Vérifiez que tous les champs obligatoires sont remplis

2. **Les effets de sort ne s'affichent pas correctement**
   - Vérifiez que le type d'effet est l'un des types autorisés
   - Assurez-vous que les valeurs des effets sont des nombres

3. **La prévisualisation ne se met pas à jour**
   - Essayez de cliquer en dehors du champ que vous venez de modifier
   - Vérifiez qu'il n'y a pas d'erreurs dans la console du navigateur

## Structure des données

L'application est basée sur la structure suivante :

```typescript
export interface Spell {
    name: string;
    description: string;
    power: number;
    range?: { min: number, max: number };
    effects: SpellEffect[];
    cost?: number;
}

export interface SpellEffect {
    type: 'damage' | 'heal' | 'status' | 'draw' | 'poison' | 'resource' | 'special';
    value: number;
    targetType?: 'self' | 'opponent' | 'all' | 'tagged';
    tagTarget?: string;
    chance?: number;
    duration?: number;
}

export interface Tag {
    name: string;
    passiveEffect: string;
}

export interface Card {
    id: string;
    name: string;
    description: string;
    image: string;
    spells: Spell[];
    passiveEffect?: string;
    health: number;
    tags: Tag[];
    type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
    rarity: 'gros_bodycount' | 'interessant' | 'banger' | 'cheate';
    isEX?: boolean;
    talent?: Spell;
    position?: 'active' | 'bench' | 'hand' | 'inventory';
    isWIP: boolean; // Indique si la carte est en cours de travail
}

export interface Booster {
    id: string;
    name: string;
    cards: Card[];
}
```

## Bonnes pratiques

1. **Identifiants uniques** - Utilisez toujours des ID uniques et descriptifs pour vos cartes
2. **Description claire** - Écrivez des descriptions précises pour faciliter la compréhension du gameplay
3. **Équilibrage** - Veillez à équilibrer la puissance des cartes et des effets
4. **Organisation** - Utilisez les tags de manière cohérente pour créer des synergies
5. **Vérification** - Relisez vos cartes pour vérifier la cohérence des effets

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request pour suggérer des améliorations.

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.
