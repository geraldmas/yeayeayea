# TODO - Yeayeayea

## 🚨 URGENT (Test rapide du jeu)
- [ ] **Bouton DEBUG pour obtenir des boosters** (admin uniquement)
  - Interface simple dans le panneau de debug pour donner des boosters
  - Intégration avec l'API `/api/users/:userId/grant-booster`
  - Bouton pour ouvrir les boosters obtenus
- [ ] **Interface d'ouverture de boosters** fonctionnelle
  - Composant pour afficher les cartes obtenues
  - Animation d'ouverture de booster
  - Ajout automatique des cartes à l'inventaire du joueur
- [ ] **UI de combat complète et fonctionnelle**
  - Interface de jeu responsive et intuitive
  - Gestion des tours et phases de jeu
  - Affichage des ressources (motivation, charisme)
  - Boutons d'action clairs (attaquer, jouer une carte, etc.)

## 🔥 Critique (Mécaniques de base)
- [ ] **Système de combat fonctionnel** avec UI
  - Intégration complète de `CombatService` avec l'interface
  - Gestion des tours avec `TurnService`
  - Affichage des dégâts et soins en temps réel
  - Résolution des actions avec feedback visuel
- [ ] **Gestion des cartes en main** et sur le terrain
  - Drag & drop pour jouer les cartes
  - Emplacements visuels pour personnages et objets
  - Affichage des statistiques des cartes en jeu
- [ ] **Système de motivation** avec interface
  - Barre de motivation visible et interactive
  - Coût des actions affiché clairement
  - Renouvellement automatique à chaque tour

## 🚀 Prioritaire (Expérience de jeu)
- [ ] **Interface de gestion de deck** complète
  - Sélection des cartes pour construire un deck
  - Validation des règles de deck (taille, raretés)
  - Sauvegarde et chargement des decks
- [ ] **Système de charisme** avec interface
  - Affichage du charisme actuel
  - Boutons pour dépenser le charisme (invoquer, acheter)
  - Gain de charisme lors des combats
- [ ] **Mécaniques de base** (personnages, objets, lieux)
  - Invocation de personnages avec coût en charisme
  - Équipement d'objets sur les personnages
  - Effets des cartes lieu actives
- [ ] **Système de ciblage** fonctionnel
  - Ciblage automatique pour les actions simples
  - Interface de ciblage manuel pour les actions complexes
  - Validation des cibles selon les règles

## ⚡ Moyen terme (Améliorations importantes)
- [ ] **Synergies et interactions** visuelles
  - Affichage des synergies actives avec `SynergyIndicator`
  - Prévisualisation des effets avant action
  - Log des interactions pendant le combat
- [ ] **Système d'altérations** avec interface
  - Affichage des buffs/debuffs actifs
  - Application des effets visuellement
  - Gestion de la durée des altérations
- [ ] **Animations et feedback** visuel
  - Animations pour les actions importantes
  - Effets sonores pour les interactions
  - Indicateurs visuels pour les états spéciaux
- [ ] **Mode solo contre IA** basique
  - IA simple qui joue automatiquement
  - Différents niveaux de difficulté
  - Feedback sur les actions de l'IA

## 🌱 Améliorations (Polish et optimisation)
- [ ] **Interface mobile** optimisée
  - Design responsive pour les petits écrans
  - Contrôles tactiles optimisés
  - Navigation adaptée au mobile
- [ ] **Système de tutoriel** interactif
  - Guide étape par étape des mécaniques
  - Exemples pratiques avec des cartes de test
  - Possibilité de sauter le tutoriel
- [ ] **Sauvegarde et chargement** de parties
  - Sauvegarde automatique de l'état de jeu
  - Reprise de partie interrompue
  - Historique des parties jouées
- [ ] **Statistiques et progression**
  - Suivi des victoires/défaites
  - Statistiques d'utilisation des cartes
  - Déblocage de nouvelles fonctionnalités

## 🎮 Gameplay (Expérience utilisateur)
- [ ] **Système de récompenses** quotidiennes
  - Connexion quotidienne récompensée
  - Défis quotidiens avec récompenses
  - Progression du joueur
- [ ] **Collection de cartes** avec interface
  - Galerie de toutes les cartes obtenues
  - Filtres par type, rareté, tags
  - Statistiques de collection
- [ ] **Mode multijoueur** basique
  - Matchmaking simple
  - Parties en temps réel
  - Chat basique entre joueurs

## 🔧 Technique (Architecture et performance)
- [ ] **Tests de charge** du moteur de combat
  - Simulation de parties avec nombreuses cartes
  - Optimisation des calculs de synergies
  - Gestion de la mémoire pour les longues parties
- [ ] **Système de récupération** après erreurs
  - Gestion gracieuse des crashes
  - Sauvegarde automatique de l'état
  - Logs détaillés pour le débogage
- [ ] **Optimisation des performances**
  - Cache des règles fréquemment utilisées
  - Lazy loading des composants
  - Optimisation des requêtes base de données

## 📊 Analytics et Monitoring
- [ ] **Métriques de gameplay** basiques
  - Temps de partie moyen
  - Cartes les plus utilisées
  - Taux de victoire par deck
- [ ] **Système de reporting** simple
  - Rapports sur l'équilibre des cartes
  - Alertes pour les bugs fréquents
  - Statistiques d'utilisation

---

## ✅ Terminé (Archives)

### 🔥 Critique (Terminé)
- [x] **Système de charisme** intégré dans `CombatService`
  - Gain à la défaite des personnages selon la rareté
  - Dépense pour l'invocation de nouveaux personnages
- [x] **Ciblage manuel** relié à l'interface React
  - `TargetingService` connecté à `ManualTargetSelector`
  - Interface de sélection de cibles fonctionnelle
- [x] **Réduction des dégâts** sur la base (division par deux configurable)
  - Implémenté dans `PlayerBaseService`
  - Coefficient ajustable via configuration
- [x] **Vente d'objets** contre du charisme
  - `PlayerInventoryService.sellItem` fonctionnel
  - Modificateurs de valeur pris en compte
- [x] **Classification des cartes Événement** (instantanée, temporaire, permanente)
  - Système de classification implémenté
  - Gestion des différents types d'événements

### 🚀 Prioritaire (Terminé)
- [x] **Panneau de debug** pour la configuration en temps réel
  - Interface pour modifier `max_personnages`, `emplacements_objet`, etc.
  - Intégration avec `gameConfigService`
  - Sauvegarde automatique dans Supabase
- [x] **Tests unitaires** pour les services critiques
  - `CombatManager` et `TagRuleParserService` testés
  - Couverture de test satisfaisante
- [x] **Gestion de la motivation** et de la base pendant le combat
  - `MotivationService.renewMotivation` à chaque tour
  - `PlayerBaseService` pour les dégâts et soins
- [x] **Configuration via `gameConfigService`**
  - `max_personnages` et `pv_base_initial` chargés au démarrage
  - Mise à jour dynamique lors des changements

### ⚡ Moyen terme (Terminé)
- [x] **Module de simulation** de parties
  - `simulateGame` fonctionnel
  - Stockage des résultats avec `simulationResultsService`
- [x] **Documentation technique** du moteur de règles
  - `docs/technical.md` mis à jour
  - Exemples de configuration JSON documentés
- [x] **Affichage des synergies** actives
  - `SynergyIndicator` avec tooltips
  - Intégration avec `combatLogService`
- [x] **Système d'entraînement IA** basé sur les simulations
  - `aiTrainingService` fonctionnel
  - Collecte de métriques et ajustement des stratégies

### 🌱 Améliorations (Terminé)
- [x] **Interface mobile** optimisée
  - GameBoard responsive pour < 600px
  - Grille des cartes adaptée aux petits écrans
- [x] **Nettoyage du code** mort
  - Suppression des composants obsolètes
  - Commentaires et code inutilisé supprimés
- [x] **Vente d'objets** depuis l'interface
  - UI connectée à `PlayerInventoryService`
  - Mise à jour en temps réel du charisme
- [x] **Système de réalisations** des joueurs
  - Tables `achievements` et `user_achievements` exploitées
  - Suivi de la progression des joueurs

### 🎮 Gameplay (Terminé)
- [x] **Tutoriel interactif**
  - Scénarios guidés pour les mécaniques de base
  - Tooltips contextuels pour les nouvelles fonctionnalités
- [x] **Effets visuels** pour les interactions importantes
  - Animations des dégâts et soins sur la base
  - Visualisation des synergies actives
- [x] **Système de récompenses quotidiennes**
  - Charisme et objets bonus pour la connexion régulière
  - Défis quotidiens avec récompenses spéciales

### 🔧 Technique (Terminé)
- [x] **Optimisation des performances** du moteur de combat
  - Réduction de la complexité des calculs de synergies
  - Cache des résultats des règles fréquemment utilisées
- [x] **Gestion des erreurs** améliorée
  - Logs détaillés pour le débogage
  - Système de récupération après crash
- [x] **Tests de charge** mis en place
  - Simulation de parties avec de nombreuses cartes
  - Identification et résolution des goulots d'étranglement
