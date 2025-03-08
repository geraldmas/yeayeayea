# TODO Liste - TCG Card Editor

Ce document est organisé par niveaux de priorité pour permettre un développement et des tests optimaux du TCG Card Editor, conformément au cahier des charges et aux principes établis dans CURSOR_RULES.md.

## Légende des priorités
- 🔥 **CRITIQUE** : Fonctionnalité essentielle pour le fonctionnement de base
- 🚀 **HAUTE** : Nécessaire pour une expérience complète
- ⚡ **MOYENNE** : Amélioration importante mais non bloquante
- 🌱 **BASSE** : Amélioration ou optimisation future

## 1. Système de Base de Données et Backend

### 1.1 Base de données
- [x] 🔥 Définir le schéma de base de données pour les cartes et les interactions
- [x] 🔥 Créer les types et interfaces TypeScript pour les structures de données
- [x] 🔥 Mettre en place la connexion à la base de données (Supabase)
- [x] 🔥 Créer la table des utilisateurs et le système d'authentification
- [ ] Implémenter le système de migrations de base de données
  - [x] 🔥 Créer la première migration d'initialisation
  - [ ] 🚀 Créer le service de gestion des migrations
  - [ ] ⚡ Implémenter les fonctions de sauvegarde et restauration
- [ ] Implémenter les tests unitaires pour la couche de données
  - [x] 🚀 Tests du service d'authentification
  - [ ] 🚀 Tests des opérations CRUD sur les cartes
  - [ ] ⚡ Tests de la migration initiale

### 1.2 API Backend
- [x] 🔥 Mettre en place les routes CRUD de base pour les cartes
- [x] 🔥 Implémenter le système d'authentification
  - [x] 🔥 Système de login/register
  - [x] 🔥 Gestion des sessions
  - [x] 🚀 Vérification d'administration
- [ ] Développer le système de validation des données
  - [x] 🔥 Validation des cartes (type, coût, etc.)
  - [ ] 🚀 Validation des relations (sorts, tags)
- [ ] Créer les endpoints pour la gestion des boosters et collections
  - [x] 🚀 Création de base pour les boosters
  - [ ] 🚀 Distribution et ouverture de boosters
  - [ ] ⚡ Gestion de l'inventaire des cartes

## 2. Éditeur de Cartes

### 2.1 Interface d'édition
- [x] 🔥 Développer l'interface principale d'édition de cartes
- [x] 🔥 Implémenter le formulaire d'édition pour tous les types de cartes
- [x] 🔥 Créer l'interface de gestion des altérations
- [x] 🔥 Mettre en place la gestion des sorts et leurs effets
- [x] 🔥 Développer la gestion des tags et synergies
- [x] 🔥 Créer l'interface de prévisualisation des cartes
- [ ] Améliorer l'interface avec des fonctionnalités avancées
  - [ ] 🚀 Historique des modifications
  - [ ] ⚡ Mode clone/duplication
  - [ ] ⚡ Suggestions intelligentes

### 2.2 Gestion des médias
- [x] 🔥 Implémenter le chargement et l'affichage des images de cartes
- [ ] 🚀 Optimiser le chargement et le stockage des images
- [ ] ⚡ Ajouter des outils d'édition d'image basiques (recadrage, redimensionnement)

## 3. Système de Cartes

### 3.1 Types de Cartes
- [x] 🔥 Implémenter la structure de base pour les cartes Personnage
- [x] 🔥 Implémenter la structure de base pour les cartes Lieu
- [x] 🔥 Implémenter la structure de base pour les cartes Objet
- [x] 🔥 Implémenter la structure de base pour les cartes Action
- [x] 🔥 Implémenter la structure de base pour les cartes Événement
- [ ] Développer les mécaniques spécifiques des cartes Personnage
  - [x] 🔥 Système de PV et niveau
  - [ ] 🚀 Système de sorts et d'évolution
  - [ ] 🚀 Gestion avancée des tags
- [ ] Développer les mécaniques spécifiques des cartes Lieu
  - [ ] 🔥 Système de distribution initiale
  - [ ] 🚀 Mécanique de sélection active
- [ ] Développer les mécaniques spécifiques des cartes Objet
  - [ ] 🔥 Système d'emplacements (sur le terrain, pas de système d'équipement !)
  - [ ] 🚀 Effets passifs
  - [ ] 🚀 Système de vente en charisme

### 3.2 Système de Tags
- [x] 🔥 Créer l'interface de gestion des tags
- [ ] Développer le moteur de règles pour les tags
  - [ ] 🔥 Parser de règles pour les effets
  - [ ] 🚀 Système d'évaluation des effets
  - [ ] 🚀 Gestion des priorités d'application
- [ ] Implémenter les synergies entre tags
  - [ ] 🚀 Système de combinaisons
  - [ ] 🚀 Effets cumulatifs
  - [ ] ⚡ Limitations et caps d'effets

## 4. Interface Utilisateur

### 4.1 Interface Administrateur
- [x] 🚀 Concevoir le layout de base pour l'administration
  - [x] 🚀 Navigation entre les différentes sections
  - [x] 🚀 Composants UI réutilisables
- [ ] Développer le module de gestion des utilisateurs
  - [x] 🚀 Interface d'édition des utilisateurs
  - [ ] ⚡ Gestion des droits et permissions
- [ ] Implémenter le module de configuration du jeu
  - [ ] 🚀 Éditeur de paramètres globaux
  - [ ] ⚡ Gestionnaire de règles et synergies
- [ ] Créer le module d'analyse et statistiques
  - [ ] ⚡ Rapports d'utilisation
  - [ ] 🌱 Visualisation des données

### 4.2 Interface Joueur
- [ ] Concevoir le layout mobile responsive
  - [ ] 🚀 Navigation intuitive
  - [ ] 🚀 Adaptabilité aux différentes tailles d'écran
- [ ] Développer le menu principal
  - [ ] 🚀 Interface de profil joueur
  - [ ] ⚡ Système de monnaie et ressources
- [ ] Créer le module de collection/inventaire
  - [ ] 🚀 Visualisation de l'inventaire
    - [ ] 🚀 Gestion des références aux cartes et leur quantité par niveau
    - [ ] ⚡ Filtres et recherche de cartes
  - [ ] 🚀 Gestion des decks
- [ ] Concevoir l'interface de partie
  - [ ] 🔥 Zone de jeu tactile
  - [ ] 🔥 Affichage des informations de jeu
  - [ ] 🚀 Système de tour et actions

## 5. Mécaniques de Jeu

### 5.1 Système de Combat
- [ ] Implémenter la gestion des instances de carte en combat
  - [x] 🔥 Créer la structure CardInstance distincte de CardDefinition
  - [x] 🚀 Propriétés d'état temporaire (PV actuels, altérations)
  - [x] 🚀 Méthodes de manipulation d'état (applyDamage, heal, etc.)
  - [x] 🚀 Système de conversion Card→CardInstance au début du combat
  - [x] ⚡ Nettoyage des instances à la fin du combat
  - [x] ⚡ Mécanisme de persistance sélective d'effets entre tours
- [ ] Développer le système de ciblage
  - [x] 🔥 Ciblage aléatoire
  - [ ] 🚀 Ciblage manuel (option tactique)
- [ ] Créer le système de résolution des actions
  - [ ] 🔥 Gestion de la simultanéité
  - [ ] 🚀 Système de conflits et priorités

### 5.2 Gestion des Ressources
- [ ] Implémenter le système de motivation
  - [ ] 🔥 Renouvellement par tour
  - [ ] 🚀 Modificateurs et effets
- [ ] Développer le système de charisme
  - [ ] 🔥 Acquisition et stockage
  - [ ] 🚀 Utilisation et limitations

### 5.3 Base et Attaques
- [ ] Créer le système de base
  - [ ] 🔥 Points de vie et résistance
  - [ ] 🚀 Système de guérison
- [ ] Implémenter le système d'attaques
  - [ ] 🔥 Conditions d'attaque
  - [ ] 🚀 Modulation des dégâts

## 6. Intelligence Artificielle

### 6.1 Mode Solo
- [ ] Développer l'agent IA de base
  - [ ] ⚡ Stratégie de base
  - [ ] ⚡ Prise de décision
  - [ ] 🌱 Adaptation aux situations
- [ ] Mettre en place le système d'entraînement
  - [ ] ⚡ Génération de données
  - [ ] 🌱 Apprentissage et optimisation
- [ ] Implémenter les niveaux de difficulté
  - [ ] ⚡ Paramètres configurables
  - [ ] 🌱 Adaptation du comportement

### 6.2 Simulation
- [ ] Créer le moteur de simulation
  - [ ] ⚡ Génération de scénarios
  - [ ] ⚡ Simulation de parties
  - [ ] 🌱 Analyse des résultats
- [ ] Développer le système d'équilibrage automatique
  - [ ] ⚡ Analyse des données
  - [ ] 🌱 Ajustements des paramètres
  - [ ] 🌱 Validation des changements

## 7. Tests et Documentation

### 7.1 Tests
- [ ] Développer les tests unitaires
  - [x] 🚀 Composants de base
  - [ ] 🚀 Services et utilitaires
  - [ ] ⚡ Logique métier
- [ ] Mettre en place les tests d'intégration
  - [ ] 🚀 Flux de jeu
  - [ ] ⚡ Interactions entre composants
  - [ ] ⚡ API et endpoints
- [ ] Implémenter les tests end-to-end
  - [ ] ⚡ Scénarios de jeu
  - [ ] 🌱 Tests utilisateur
  - [ ] 🌱 Performance

### 7.2 Documentation
- [x] 🚀 Créer la documentation de base du projet
- [x] 🚀 Documenter les règles et consignes de développement
- [x] 🚀 Rédiger la documentation technique initiale
- [ ] 🚀 Développer la documentation complète de l'API
- [ ] ⚡ Créer des guides utilisateurs détaillés
- [ ] ⚡ Mettre en place la documentation des mécaniques de jeu

## 8. Optimisation et Performance

### 8.1 Performance
- [ ] Optimiser les requêtes à la base de données
  - [ ] ⚡ Indexation stratégique
    - [ ] 🌱 Optimisation des jointures
- [ ] Améliorer la performance frontend
  - [ ] ⚡ Optimisation du rendu
  - [ ] 🌱 Gestion de la mémoire
- [ ] Optimiser le chargement des ressources
  - [ ] ⚡ Compression des images
  - [ ] 🌱 Lazy loading stratégique
- [ ] Mettre en place un système de cache efficace
  - [ ] ⚡ Cache serveur
  - [ ] 🌱 Cache client

### 8.2 Scalabilité
- [ ] Développer une architecture scalable
    - [ ] ⚡ Séparation des responsabilités
  - [ ] 🌱 Modularité des composants
- [ ] Mettre en place le monitoring
  - [ ] ⚡ Métriques de performance
  - [ ] 🌱 Alertes et notifications
- [ ] Implémenter un système de backup robuste
  - [ ] ⚡ Sauvegarde automatique
  - [ ] 🌱 Procédures de restauration
- [ ] Optimiser le processus de déploiement
  - [ ] ⚡ Pipeline CI/CD
    - [ ] 🌱 Tests automatisés
    - [ ] 🌱 Déploiement continu

## Tâches réalisées

### Environnement de développement
- [x] 🔥 Configurer le projet React avec TypeScript
- [x] 🔥 Mettre en place l'environnement Node.js
- [x] 🔥 Intégrer les dépendances nécessaires
- [x] 🔥 Structurer les répertoires
- [x] 🚀 Configurer le système de versionnement

### Interface de base
- [x] 🔥 Créer les composants UI fondamentaux
- [x] 🔥 Mettre en place le routage de l'application
- [x] 🔥 Implémenter le système d'authentification
- [x] 🔥 Développer l'interface d'édition de cartes
- [x] 🔥 Créer le gestionnaire d'altérations
- [x] 🔥 Implémenter la gestion des sorts et tags

### Base de données et API
- [x] 🔥 Définir le schéma de base de données initial
- [x] 🔥 Mettre en place la connexion Supabase
- [x] 🔥 Implémenter les opérations CRUD de base
- [x] 🔥 Créer la première migration