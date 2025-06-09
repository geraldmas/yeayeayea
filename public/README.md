# Documentation du Gestionnaire de Cartes


### 2. Types de Données Principaux
 
#### 2.1 Carte (Card)
- **Propriétés principales** :
  - `id`: Identifiant unique
  - `name`: Nom de la carte
  - `type`: Type de carte ('personnage', 'objet', 'evenement', 'lieu', 'action')
  - `rarity`: Rareté ('gros_bodycount', 'interessant', 'banger', 'cheate')
  - `description`: Description textuelle
  - `image`: URL de l'image
  - `passive_effect`: Effet passif de la carte
  - `properties`: Propriétés spécifiques (points de vie, etc.)
  - `summon_cost`: Coût d'invocation
  - `eventDuration`: Pour les cartes `evenement`, indique si l'effet est `instantanee`, `temporaire` ou `permanente`
  - `is_wip`: Indique si la carte est en cours de développement
  - `is_crap`: Indique si la carte est à retravailler

#### 2.2 Sort (Spell)
- **Propriétés principales** :
  - `id`: Identifiant unique
  - `name`: Nom du sort
- `description`: Description de l'effet
  - `cost`: Coût en ressources
  - `range_min/max`: Portée du sort
  - `effects`: Tableau des effets du sort
  - `is_value_percentage`: Indique si les valeurs sont en pourcentage

#### 2.3 Altération (Alteration)
- **Propriétés principales** :
  - `name`: Nom de l'altération
  - `description`: Description de l'effet
  - `type`: Type ('buff', 'debuff', 'status', 'other')
  - `duration`: Durée en tours
  - `stackable`: Peut être cumulée
  - `unique_effect`: A un effet unique
  - `effect`: Configuration détaillée de l'effet
 
#### 2.4 Système de Tags et Règles
- **Concept** : Les tags permettent de créer des synergies entre cartes via un système de règles dynamiques
- **Types d'effets** :
  - `charismeGeneration`: Modifie la génération de charisme
  - `damageModifier`: Modifie les dégâts infligés ou reçus  
  - `motivationModifier`: Modifie la motivation générée ou consommée
  - `healthModifier`: Modifie les PV max ou actuels
  - `applyAlteration`: Applique une altération
  - `conditionalEffect`: Effet qui s'applique sous condition
  - `synergyEffect`: Effet qui s'applique en fonction d'autres tags

- **Syntaxe du parser de règles** :
  ```
  TypeEffet:TypeCible:Valeur:Description:Condition
  ```
  
  - **TypeEffet** : Un des types listés ci-dessus (ex: `damageModifier`)
  - **TypeCible** : 
    - `self` : Le possesseur du tag
    - `opponent` : L'adversaire du possesseur
    - `tagged(TAG)` : Les personnages portant un tag spécifique
    - `all` : Tous les personnages
    - `ownTeam` : Les personnages de l'équipe du possesseur
    - `opponentTeam` : Les personnages de l'équipe adverse
  - **Valeur** : 
    - Nombre absolu (ex: `5`) ou 
    - Pourcentage (ex: `+20%`)
  - **Description** : Texte explicatif de l'effet
  - **Condition** (optionnelle) : Format `IF(typeCondition,comparison,valeur)`
    - **typeCondition** :
      - `healthPercentage` : Pourcentage de PV
      - `charismeAmount` : Montant de charisme
      - `motivationAmount` : Montant de motivation
      - `hasTag` : Possession d'un tag
      - `hasAlteration` : Possession d'une altération
      - `activeLieu` : Lieu actif
      - `chance` : Probabilité (%)
    - **comparison** : `equal`, `notEqual`, `greater`, `less`, `greaterOrEqual`, `lessOrEqual`
    - **valeur** : Valeur de comparaison

- **Exemples de règles** :
  - `damageModifier:tagged(FRAGILE):+20%:Augmente les dégâts de 20% sur les cibles fragiles`
  - `charismeGeneration:self:+10%:Augmente la génération de charisme de 10%`
  - `healthModifier:self:+5:Augmente les PV de 5:IF(healthPercentage,less,50)`
  - `applyAlteration:opponentTeam:0:Applique poison à l'équipe adverse:IF(chance,greater,75)`
 

# Canevas Système de Combat – Jeu de Carte Mobile

## 1. Terrain et Cartes

### 1.1. Cartes Personnage
- **Nombre maximum par joueur** : `{max_personnages}` (ex. 3)
- **Attributs principaux** :
  - Points de vie (PV)
  - Sorts
  - Tags (ex. `#NUIT`, `#JOUR`, `#FRAGILE`, etc.)
- **Exemples d'effets liés aux tags** :
  - `#NUIT` : Soin de 5% des PV par tour (via le lieu "Bar")
  - `#JOUR` : Réduction de 20% d'attaque (via le lieu "Bar")

### 1.2. Cartes Lieu
- **Distribution** :
  - Chaque joueur a `{nombre_lieu_joueur}` cartes lieu dans son booster (ex. 3)
  - En début de partie, `{total_lieux_communs}` cartes lieu sont mises en commun (ex. 6)
- **Sélection** :
  - Un lieu actif est choisi aléatoirement parmi ces cartes
- **Effets passifs** :
  - S'appliquent uniquement tant que le lieu est actif
  - Exemple : Lieu "Bar" – bonus pour `#NUIT`, malus pour `#JOUR`
- **Extensions** :
  - Possibilité d'utiliser des cartes action pour changer le lieu et valoriser l'ensemble du pool

### 1.3. Cartes Objet
- **Emplacements par joueur** : `{emplacements_objet}` (ex. 3)
- **Fonctions** :
  - Effets passifs en jeu
  - Option de vente contre du charisme
- **Exemples d'effets** :
  - Augmentation de la motivation (+20%)
  - Modification de la génération ou de la dépense de charisme

### 1.4. Cartes Action et Événement
- **Cartes Action** :
  - Coût en points de motivation
  - Fonctionnement similaire aux sorts
- **Cartes Événement** :
  - Effets instantanés, temporaires ou permanents
  - Peuvent modifier des paramètres de la partie

## 2. Mécanique de Combat

### 2.1. Déroulement du Tour
- **Tour par tour** :
  - Chaque joueur reçoit un budget de motivation renouvelé en début de tour
- **Utilisation des ressources** :
  - Possibilité de lancer des sorts et d'utiliser des cartes action de n'importe quel personnage sur le terrain, dans l'ordre choisi, dans la limite du budget
- **Ciblage** :
  - Par défaut, aléatoire
  - Possibilité d'altérer ce comportement au cas par cas

### 2.2. Résolution des Actions et Sorts
- **Résolution simultanée** des actions (à valider selon tests)
- **Interactions entre sorts** :
  - Effets variables en fonction des tags
  - Exemples :
    - Sort infligeant 10% de dégâts supplémentaires aux cibles avec le tag `#FRAGILE`
    - Sort exclusif avec des effets conditionnels (ex. : empoisonnement)

## 3. Gestion des Ressources

### 3.1. Motivation
- **Régénération** :
  - Se renouvelle à chaque début de tour
- **Coûts** :
  - Chaque sort, action ou carte a un coût en motivation (peut être 0 ou variable)
- **Modificateurs** :
  - Objets, lieux ou sorts peuvent augmenter ou diminuer la motivation (ex. : objet +20% / lieu -50%)

### 3.2. Charisme
- **Acquisition** :
  - Gagné lors de la mort d'un adversaire, en fonction de sa rareté :
    - Rareté 1 : `{pts_rareté1}` pts (ex. 5 pts)
    - Rareté 2 : `{pts_rareté2}` pts (ex. 10 pts)
    - Rareté 3 : `{pts_rareté3}` pts (ex. 20 pts)
    - Rareté 4 : `{pts_rareté4}` pts (ex. 40 pts)
- **Utilisation** :
  - Invoquer un nouveau personnage ou un objet
- **Stockage** :
  - Ressource cumulable, non réinitialisée à chaque tour, avec une limite maximale à définir
- **Influence externe** :
  - Certains objets et événements peuvent modifier sa génération ou son utilisation

## 4. Base et Attaques

### 4.1. Base du Joueur
- **Points de vie** :
  - Par exemple, 100 PV par base
- **Objectif principal** :
  - Détruire la base adverse

### 4.2. Attaques sur la Base
- **Condition** :
  - L'adversaire ne peut être attaqué directement tant qu'il a au moins un personnage sur le terrain
- **Dégâts** :
  - Dégâts sur la base divisés par deux (modifiable via objets/événements)
- **Continuité des effets** :
  - L'adversaire peut continuer à utiliser ses cartes action, objets et effets de lieu (ex. contre-attaques, défenses)

## 5. Paramétrage et Testabilité

- **Fichier de configuration JSON** :
  - Permet de modifier avant le début de partie :
    - Nombre de personnages sur le terrain
    - PV de la base
    - Budget de motivation par tour
    - Taille du deck (ex. 30 cartes)
    - Autorisation ou non de personnages "cheatés"
- **Utilisation** :
  - Paramétrage initial pour tests et équilibrage
  - Modifications avant le début de la partie pour éviter les bugs


