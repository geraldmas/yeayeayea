# TODO

## 🔥 Critique
- [x] Intégrer le système de charisme dans le **CombatService** (gain à la défaite, dépense à l’invocation)
- [x] Relier le **TargetingService** à une interface de sélection manuelle dans React
- [x] Implémenter la réduction des dégâts subis par la base (division par deux configurable)
- [x] Permettre la vente d'objets contre du charisme en tenant compte des modificateurs
- [x] Introduire la classification des cartes **Événement** (instantanée, temporaire, permanente)

## 🚀 Prioritaire
- [ ] Créer un panneau de débug pour modifier en temps réel la configuration via `gameConfigService`
  - Permettre l'édition directe des valeurs `max_personnages`, `emplacements_objet`, `budget_motivation_initial` et `pv_base_initial`.
  - Afficher les paramètres courants et enregistrer les modifications dans Supabase.
- [x] Ajouter des tests unitaires pour `CombatManager` et `TagRuleParserService`
- [ ] Finaliser la gestion de la motivation et de la base du joueur pendant le combat
  - Utiliser `MotivationService.renewMotivation` à chaque début de tour
  - Intégrer `PlayerBaseService` pour appliquer dégâts et soins sur la base des joueurs
- [ ] Utiliser `gameConfigService` pour initialiser `max_personnages` et `pv_base_initial`
  - Charger les valeurs au démarrage du combat et lors des changements de configuration
- [x] Ajouter des tests pour `PlayerBaseService` (dégâts, soins et altérations)

## ⚡ Moyen terme
- [x] Esquisser un module de simulation de parties et stocker les résultats avec `simulationResultsService`
- [x] Documenter le moteur de règles et l’interface de débug dans `docs/technical.md`
- [ ] Afficher les synergies actives lors des combats (tooltips ou logs)
  - Utiliser `tagRuleParser` pour identifier les effets déclenchés et les consigner via `combatLogService`
- [ ] Mettre en place un système d'entraînement de l'IA basé sur les simulations
  - Exécuter régulièrement `simulateGame` pour collecter des métriques et ajuster les stratégies IA
- [x] Documenter un exemple de configuration JSON des synergies dans `cahierdescharges.md`

## 🌱 Améliorations
- [ ] Optimiser l’interface mobile pour les petits écrans
  - Revoir la grille des cartes et l'affichage du GameBoard pour < 600px
- [ ] Nettoyer le code mort et les commentaires obsolètes
  - Passer en revue les services et composants non utilisés
- [ ] Ajouter la possibilité de vendre ses objets depuis l’interface de gestion de deck
  - Connecter l'UI à `PlayerInventoryService.sellItem` et mettre à jour le charisme du joueur en temps réel
- [ ] Mettre en place l'affichage des réalisations des joueurs
  - Exploiter les tables `achievements` et `user_achievements` pour suivre la progression
