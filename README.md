# TCG Card Editor

Un éditeur de cartes pour jeu de cartes à collectionner (TCG) qui vous permet de créer, modifier et exporter des cartes au format JSON selon une structure de types prédéfinie.

## Caractéristiques

- Création et édition de cartes avec tous les champs (sorts, effets, tags, etc.)
- Création de boosters contenant plusieurs cartes
- Export/import JSON avec validation des données
- Prévisualisation en temps réel du JSON généré
- Interface intuitive pour la gestion des éléments complexes (sorts, effets, tags)
- Validation de données pour éviter les erreurs de structure
- Support complet pour tous les types de cartes et d'effets

## Démarrage

1. Assurez-vous d'avoir Node.js installé (version 14 ou supérieure recommandée)

2. Clonez le dépôt:
   ```
   git clone https://github.com/votre-nom/tcg-card-editor.git
   cd tcg-card-editor
   ```

3. Installez les dépendances:
   ```
   npm install
   ```

4. Lancez l'application:
   ```
   npm start
   ```

5. L'application sera disponible sur `http://localhost:3000`

## Utilisation

### Créer une carte

1. Sélectionnez l'onglet "Carte"
2. Remplissez les champs requis (ID, nom, type, etc.)
3. Ajoutez des sorts en cliquant sur "Ajouter un sort"
4. Pour chaque sort, ajoutez des effets en cliquant sur "Ajouter un effet"
5. Ajoutez des tags en cliquant sur "Ajouter un tag"
6. Si la carte est un personnage, vous pouvez ajouter un talent
7. Vérifiez l'aperçu JSON en bas de page
8. Exportez la carte au format JSON avec le bouton "Exporter en JSON"

### Guide détaillé des champs

#### Informations de base d'une carte
- **ID**: Identifiant unique de la carte (obligatoire)
- **Nom**: Nom de la carte (obligatoire)
- **Description**: Description de la carte
- **Image**: URL ou chemin d'accès à l'image de la carte
- **Type**: Type de la carte (personnage, objet, événement)
- **Points de vie**: Santé de la carte (pour les personnages)
- **Effet passif**: Effet qui s'applique en permanence sans action requise
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

### Créer un booster

1. Sélectionnez l'onglet "Booster"
2. Remplissez les informations du booster (ID, nom)
3. Importez des cartes JSON existantes avec le bouton "Importer des cartes JSON"
4. Ajoutez des cartes au booster en cliquant sur "Ajouter" pour chaque carte
5. Exportez le booster complet au format JSON

## Validation des données

L'application effectue automatiquement les validations suivantes:
- Tous les champs obligatoires sont remplis
- Les valeurs numériques sont dans des plages acceptables
- Les types d'effets correspondent aux options autorisées
- Les relations entre les différents éléments sont cohérentes

## Import/Export

### Export JSON
- Cliquez sur "Exporter en JSON" pour télécharger votre carte ou booster
- Le fichier généré inclut tous les champs, y compris ceux laissés vides
- Les fichiers sont nommés automatiquement avec le format `[type]-[timestamp].json`

### Import JSON
- Cliquez sur "Importer un JSON" et sélectionnez votre fichier
- L'application valide la structure du fichier
- Si le fichier est valide, tous les champs sont remplis automatiquement
- Si une erreur est détectée, un message vous informera du problème

## Dépannage

### Problèmes courants et solutions

1. **L'export JSON ne se déclenche pas**
   - Vérifiez que tous les champs obligatoires sont remplis (ID, nom, type)
   - Assurez-vous que les valeurs numériques sont correctement formatées

2. **L'import JSON échoue**
   - Vérifiez que votre fichier JSON est correctement formaté
   - Assurez-vous que la structure correspond à celle attendue par l'application
   - Confirmez que le type de carte/booster sélectionné correspond au contenu du fichier

3. **Les effets de sort ne s'affichent pas correctement**
   - Vérifiez que le type d'effet est l'un des types autorisés
   - Assurez-vous que les valeurs des effets sont des nombres

4. **La prévisualisation JSON ne se met pas à jour**
   - Essayez de cliquer en dehors du champ que vous venez de modifier
   - Vérifiez qu'il n'y a pas d'erreurs dans la console du navigateur

## Exemples

Des exemples sont disponibles dans le dossier `src/examples/`:
- `example-card.json` - Un exemple de carte complète
- `example-booster.json` - Un exemple de booster contenant plusieurs cartes

### Exemple d'une carte complète
```json
{
  "id": "fire-mage-001",
  "name": "Mage de feu",
  "description": "Un puissant lanceur de sorts élémentaires",
  "image": "images/fire-mage.png",
  "health": 80,
  "spells": [
    {
      "name": "Boule de feu",
      "description": "Lance une puissante boule de feu sur l'adversaire",
      "power": 30,
      "range": {"min": 1, "max": 3},
      "effects": [
        {
          "type": "damage",
          "value": 30,
          "targetType": "opponent"
        },
        {
          "type": "status",
          "value": 5,
          "targetType": "opponent",
          "duration": 2,
          "chance": 75
        }
      ],
      "cost": 2
    }
  ],
  "passiveEffect": "Gagne +5 de puissance pour tous les sorts de type feu",
  "tags": [
    {
      "name": "Feu",
      "passiveEffect": "Résistance aux dégâts de feu"
    },
    {
      "name": "Magicien",
      "passiveEffect": "Peut lancer deux sorts par tour"
    }
  ],
  "type": "character",
  "isEX": true,
  "talent": {
    "name": "Renfort de feu",
    "description": "Renforce la carte active avec une aura de feu",
    "power": 15,
    "effects": [
      {
        "type": "resource",
        "value": 10,
        "targetType": "tagged",
        "tagTarget": "Feu"
      }
    ],
    "cost": 1
  },
  "position": "bench"
}
```

## Structure des données

L'application est basée sur la structure de types suivante:

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
    type: 'character' | 'object' | 'event';
    isEX?: boolean;
    talent?: Spell;
    position?: 'active' | 'bench' | 'hand' | 'inventory';
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
5. **Sauvegarde régulière** - Exportez régulièrement vos cartes pour éviter toute perte de données

## Contribuer

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.
