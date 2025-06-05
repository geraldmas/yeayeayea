# TODO

## 🔥 Critique
- [ ] Intégrer le système de charisme dans le **CombatService** (gain à la défaite, dépense à l’invocation)
- [ ] Relier le **TargetingService** à une interface de sélection manuelle dans React
- [ ] Implémenter la réduction des dégâts subis par la base (division par deux configurable)
- [ ] Permettre la vente d'objets contre du charisme en tenant compte des modificateurs
- [ ] Introduire la classification des cartes **Événement** (instantanée, temporaire, permanente)

## 🚀 Prioritaire
- [ ] Créer un panneau de débug pour modifier en temps réel la configuration via `gameConfigService`
- [ ] Ajouter des tests unitaires pour `CombatManager` et `TagRuleParserService`
- [ ] Finaliser la gestion de la motivation et de la base du joueur pendant le combat
- [ ] Utiliser `gameConfigService` pour initialiser `max_personnages` et `pv_base_initial`
- [ ] Ajouter des tests pour `PlayerBaseService` (dégâts, soins et altérations)

## ⚡ Moyen terme
- [ ] Esquisser un module de simulation de parties et stocker les résultats avec `simulationResultsService`
- [ ] Documenter le moteur de règles et l’interface de débug dans `docs/technical.md`
- [ ] Afficher les synergies actives lors des combats (tooltips ou logs)
- [ ] Mettre en place un système d'entraînement de l'IA basé sur les simulations

## 🌱 Améliorations
- [ ] Optimiser l’interface mobile pour les petits écrans
- [ ] Nettoyer le code mort et les commentaires obsolètes
- [ ] Ajouter la possibilité de vendre ses objets depuis l’interface de gestion de deck
