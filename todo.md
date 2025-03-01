

## Débug formulaire ajout tag, ajout sort, ...

# bug validation tag
# bug champs obligatoires

## Supprimer système ex

# Moyen terme
## Système d'objectifs

# Jeu
## Système de comptes 
### Inventaire
### Argent => achat boosters 
### Quêtes => boosters
## Système de combat
## IA ? 

Système de combat à penser : 
- 3 cartes sur le terrain 
- 1 lieu pioché au hasard (parmi les cartes des joueurs ?)
- 3 emplacements objets
- battle royale entre les 3 personnages par joueur du terrain
- 6 motivations par tour par joueur sauf modification, la motivation sert à jouer des actions (certains sorts coutent 4 pa, d'autres 2, ...)
- chaque joueur a 30 cartes dans son deck, sa base a 100 pv par exemple
- le but est d'abattre la base adverse
- on ne peut infliger des dégats à son adversaire que s'il n'a aucun personnage présent sur le terrain 
- tous les dégats sont divisés par deux contre une base 
- invoquer des personnages sur le terrain ou jouer des cartes action coûte du charisme, qui agit comme une monnaie gagnée à chaque mort adverse ou lors de certains événements (ou en tapant la base adverse ?)
- max de 3 personnages sur le terrain par joueur

- les cartes lieu ont un effet passif sur tous les joueurs toute la partie
- les cartes personnages ont des pv, peuvent mourir, ont des sorts et des tags
- les cartes objets sont posées et peuvent être vendues contre du charisme. Elles ont un effet passif jusqu'à qu'ils disparaissent
- les cartes événement ont un effet instantanné, durant un tour, ou plusieurs tours, ou indéfiniment. Elles peuvent changer des paramètres de la partie comme ne rien faire. 
- les cartes action coûtent des points de motivation et fonctionnent comme les sorts. 

- paramètres modifiables : 
- nombre de personages sur le terrain (1 à 5 ?)
- pv de la base
- motivation par tour 
- taille des decks ? 
- personnages cheatés autorisés ? 

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

---

*Utilise ce canevas pour structurer et affiner le design de ton système de combat, tout en itérant sur les différents mécanismes pour équilibrer le gameplay.*
