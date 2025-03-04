Document de Spécifications pour le Jeu Mobile « [Nom du Jeu] »
1. Introduction
Ce document décrit en détail les règles, concepts et mécaniques du jeu mobile en développement. L’objectif principal n’est pas la conquête du marché, mais de proposer une expérience de jeu fun et innovante, avec une profondeur stratégique accessible à tous. Le jeu repose sur un système de cartes interactives (personnages, lieux, objets, actions et événements) qui interagissent par le biais de synergies définies via des tags. Cursor est invité à utiliser ce document comme feuille de route pour implémenter, tester et ajuster les différentes mécaniques du jeu tout en gardant une vision globale de l’expérience ludique souhaitée.

2. Vision et Objectifs
Expérience ludique : Créer un jeu avant tout fun, qui surprend et divertit par la richesse de ses interactions.
Stratégie et Synergies : Offrir des combinaisons de cartes et d’effets via des tags prédéfinis, où chaque choix influence la stratégie globale.
Modularité et Évolutivité : Mettre en place un moteur de règles dynamique et une interface de débug qui permettent d’ajuster les paramètres, de simuler des parties et d’entraîner une IA pour le mode solo.
Focus sur le fun : Toutes les mécaniques doivent servir l’expérience de jeu amusante, même si elles impliquent des interactions complexes.
3. Spécifications Fonctionnelles
3.1. Terrain et Cartes
3.1.1. Cartes Personnage
Configuration :

Le nombre maximum de personnages par joueur, défini par {max_personnages}, est paramétrable (via fichier de config et/ou interface de débug).
Attributs :

Chaque personnage possède des Points de Vie (PV), des sorts et une liste préétablie de tags (ex. #NUIT, #JOUR, #FRAGILE, etc.).
Synergies et Interactions :

Les tags interagissent entre eux selon des règles configurables.
Exemple :
Tag A augmente de 10% la génération de charisme du joueur.
Tag B inflige 20% de dégâts en plus aux cibles portant le tag A.
Tag C diminue la génération de charisme adverse de 15% par tag A présent sur le terrain.
Évolution :

Possibilité d’évolution via montée en niveau, amélioration des sorts ou fusion de cartes en combat.
3.1.2. Cartes Lieu
Distribution :

Chaque joueur reçoit un nombre fixe de cartes lieu (par exemple, 3, réglable via métaparamétrage).
Un ensemble fixe (par exemple, 6 cartes) est mis en commun au début de la partie.
Sélection du Lieu Actif :

Les cartes lieu de chaque joueur sont rassemblées, puis l’une est tirée au sort pour être active.
Les autres intègrent une pioche commune, avec la possibilité pour des actions/événements de modifier cette sélection (par exemple, forcer le tirage d’une carte ou défausser certaines cartes).
3.1.3. Cartes Objet
Emplacements et Modifications :

Le nombre d’emplacements pour les objets, défini par {emplacements_objet}, est paramétrable et peut évoluer (certains objets, actions, événements ou passifs peuvent l’augmenter ou le réduire).
Effets Passifs :

Les objets fournissent divers bonus en jeu, par exemple :
Objet X : Augmente de 20% la génération de charisme.
Objet Y : Augmente de 20% la motivation générée par tour.
Objet Z : Augmente de 30% les PV de tous les éléments portant le tag D.
Option de Vente :

Les objets peuvent être vendus contre du charisme, avec des valeurs modulables par d’autres effets.
3.1.4. Cartes Action et Événement
Cartes Action :

Coût en motivation, dont la valeur peut être influencée par des passifs, objets, lieux ou événements.
Cartes Événement :

Classification : Instantanée, temporaire ou permanente, pour encadrer les effets.
Distribution et Secret :
Les cartes événement restent cachées dans la main du joueur jusqu’à leur utilisation.
Les cartes événement des deux joueurs sont mélangées dans un pool commun pour déterminer aléatoirement le nombre de cartes piochées par chaque joueur.
Exemple : Une carte événement peut donner 50% de chances de mourir à toutes les entités portant le tag E, ou échanger les objets entre joueurs.
3.2. Mécanique de Combat
3.2.1. Déroulement du Tour
Budget de Motivation :

Chaque tour débute avec 10 motivations par joueur (valeur ajustable via paramètres, évolution, objets, etc.).
Déploiement des Actions :

Les joueurs peuvent lancer des sorts et utiliser des cartes action par n’importe quel personnage présent sur le terrain, dans l’ordre de leur choix, dans la limite de leur budget de motivation.
Ciblage :

Par défaut, le ciblage est aléatoire.
Pour certaines actions, sorts ou objets, une option de ciblage manuel sera proposée via une interface dédiée, avec des options tactiques (priorisation par tags, par altérations ou par passifs).
3.2.2. Résolution des Actions et Sorts
Simultanéité :
Les actions et sorts se résolvent de manière simultanée.
Système de Conflits :
Un mécanisme de résolution des conflits doit être implémenté pour gérer les interactions multiples (par exemple, bonus de dégâts en présence de tags spécifiques).
La hiérarchisation initiale pourra se baser sur l’ancienneté, avec la possibilité d’une évolution proposée par Cursor en fonction des tests.
3.3. Gestion des Ressources
3.3.1. Motivation
Renouvellement :
Le budget de motivation se renouvelle intégralement à chaque tour, sauf modifications dues à des effets spécifiques (ex. création d’une réserve).
Modificateurs :
Les effets en valeur absolue s’additionnent, tandis que les effets en valeur relative se multiplient. Ce comportement est configurable pour faciliter l’équilibrage.
3.3.2. Charisme
Acquisition et Utilisation :
Gagné lors de la défaite des personnages adverses, le charisme est attribué en fonction de la rareté.
Il sert à invoquer de nouveaux personnages ou à acquérir des objets.
Stockage :
Le charisme est stocké de manière cumulative dans une réserve évolutive, modifiée par certains objets ou événements.
3.4. Base et Attaques
3.4.1. Base du Joueur
Points de Vie et Résistance :
La base commence avec, par exemple, 100 PV (modifiable par lieux, événements, etc.).
Par défaut, les dégâts subis par la base sont divisés par deux. Ce coefficient peut être ajusté par des effets spécifiques.
Options Défensives :
Des boucliers ou autres mécanismes de défense peuvent être intégrés en option, tout en gardant la division des dégâts comme règle de base.
3.4.2. Attaques sur la Base
Conditions d’Attaque :
Une attaque directe sur la base n’est autorisée que lorsque l’adversaire n’a plus de personnages sur le terrain, sauf en cas de capacités spéciales (ex. attaques par poison ou effets directs).
Modulation des Dégâts :
La réduction des dégâts (division par deux) est modulable par divers effets, permettant une adaptation aux différentes stratégies.
3.5. Paramétrage et Testabilité
Interface de Débug :
Une interface de débug permettra de modifier en temps réel les paramètres clés du jeu (nombre de personnages, PV de la base, budget de motivation, taille des decks, gestion des personnages « cheatés »).
Simulation et Entraînement IA :
Mise en place d’un système de simulation de parties pour tester l’équilibre entre les cartes et les effets.
Ce module servira également à entraîner un agent IA qui jouera en mode solo, offrant ainsi une expérience de jeu variée et dynamique.
4. Mécanique des Synergies et Interactions
Les synergies constituent le cœur du système de jeu. Le moteur de règles dynamique doit permettre :

Configuration Facile :

Définir les interactions entre tags, objets et événements via un format configurable (par exemple, des fichiers JSON ou scripts modifiables).
Exemples de Synergies :

Tags :
Tag A : +10% de génération de charisme pour le joueur.
Tag B : +20% de dégâts sur les cibles ayant le tag A.
Tag C : -15% de génération de charisme pour l'adversaire par chaque instance de tag A sur son terrain.
Objets :
Objet X : Augmente de 20% la génération de charisme.
Objet Y : Augmente de 20% la motivation générée chaque tour.
Objet Z : Augmente de 30% les PV de tous les éléments portant le tag D.
Cartes Événement :
Une carte donnant 50% de chances de mourir à toutes les entités portant le tag E.
Une carte échangeant les objets entre les deux joueurs.
Interface et Documentation :

Le moteur de règles doit être accompagné d’une documentation claire et d’une interface de débug permettant de visualiser et tester les synergies en temps réel.
5. Aspects Techniques et Architecture
Stack Technique :
Le back-end est développé en Node.js et le front-end en React avec TypeScript, comme indiqué dans le fichier package.json.
Frameworks :
Utilisation de @mui pour l’interface, ts-node pour le serveur et autres outils pour le développement et les tests (concurrently, react-scripts, etc.).
Architecture Modulaire :
La conception modulaire permet l’ajout ou la modification des règles de jeu (synergies, interactions entre cartes, etc.) sans refonte majeure.
Moteur de Règles Dynamique :
Un système configurable (via JSON ou scripts) pour gérer les interactions entre tags, objets et événements, basé sur la structure de données fournie (cf. schéma de la base de données).
6. Aspects de Gameplay et Feedback
Interactivité :
L’interface de jeu doit proposer un feedback visuel clair (animations, notifications) pour illustrer les synergies et interactions, tout en préservant le secret des cartes événement.
Ciblage Tactique :
Pour les actions nécessitant un ciblage manuel, l’interface devra offrir des options tactiques (priorisation basée sur tags, altérations ou passifs) afin d’enrichir la stratégie.
Aspect Fun :
Chaque mécanique, même complexe, doit toujours être pensée pour maximiser le plaisir de jeu. Le design doit encourager la découverte et l’expérimentation sans complexifier inutilement l’expérience de l’utilisateur.
7. Annexes
Dépendances et Configuration :
Se référer au fichier package.json pour la liste complète des dépendances et outils.
Structure des Données :
La structure de la base de données (cf. fichier schema.sql) servira de base pour le moteur de règles et l’organisation des interactions entre cartes.
Documentation Technique Complémentaire :
Des documents techniques détaillés pour chaque module (gestion des cartes, moteur de combat, interface de débug, système de simulation/IA) seront fournis afin d’assurer la cohérence et la maintenabilité du projet.