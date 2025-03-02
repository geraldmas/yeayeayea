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
  - Gagné lors de la mort d’un adversaire, en fonction de sa rareté :
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
  - L’adversaire ne peut être attaqué directement tant qu'il a au moins un personnage sur le terrain
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


