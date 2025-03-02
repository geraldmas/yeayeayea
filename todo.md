

# Ajustements Recommandés pour le Schéma de Base de Données

Voici quelques modifications et ajouts pour faciliter l'implémentation des fonctionnalités décrites :

- champ propriétés pour les cartes (pdv, isFullArt, ...)
- cartes cheatés : abilité divine

## 4. Clarification des Champs pour les Cartes

- **Attributs Spécifiques**  
  - Renommer le champ `health` en `max_health` pour les cartes de type `personnage`, afin de mieux différencier les PV maximums des PV courants (si une gestion de l'état en cours de combat est envisagée).
  - Si certaines cartes n'utilisent pas certains attributs (ex. `health` pour un lieu ou une action), envisager d'ajouter une colonne `properties` en `jsonb` pour stocker des attributs spécifiques selon le type de carte.

## 5. Indexation et Contraintes

- **Indexation**  
  - Créer des index sur des colonnes fréquemment filtrées comme `type` et `rarity` dans la table `cards` pour améliorer les performances des requêtes.
  
- **Contraintes de Référence**  
  - Les fonctions de validation pour les colonnes `spells` et `tags` seront moins nécessaires si vous utilisez des tables de jointure, car l'intégrité référentielle sera assurée par des clés étrangères.

## 6. Tables de Configuration et de Paramétrage

- **Paramètres de Partie**  
  - Créer une table (par exemple `game_config` ou `match_settings`) avec une colonne `config` de type `jsonb` permet de stocker les paramètres ajustables (nombre de personnages sur le terrain, PV de la base, budget de motivation par tour, etc.) et de les charger avant chaque partie.
  
## 7. Gestion des Versions et du Déploiement

- **Migration et Tests**  
  - Intégrer ces ajustements dans un système de migration (par exemple avec Flyway ou Liquibase) facilitera l'évolution du schéma pendant le prototypage et le testing.
  
---

Ces modifications devraient simplifier l’implémentation des mécanismes de jeu, en assurant une meilleure structure relationnelle et une plus grande flexibilité pour gérer des effets complexes et des paramètres modulables.
