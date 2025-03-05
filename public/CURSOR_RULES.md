# CURSOR_RULES

## Règles et Consignes pour le Développement du TCG Card Editor

Je vais rédiger ce document en français comme demandé pour servir de guide personnel dans le développement de ce jeu de cartes.

### 1. Objectifs Principaux

- **Priorité au plaisir de jeu**: Toutes les fonctionnalités doivent servir à créer une expérience ludique avant tout.
- **Système de synergies riche**: Implémenter des interactions significatives entre les cartes via le système de tags.
- **Modularité**: Maintenir une architecture flexible permettant des ajustements faciles.
- **Accessibilité**: L'interface doit être intuitive malgré la complexité des mécanismes.

### 2. Méthodologie de Développement

- **Approche progressive**: Commencer par les fonctionnalités essentielles avant d'ajouter des mécaniques complexes.
- **Tester en continu**: Implémenter des tests pour chaque élément crucial du système.
- **Documentation systématique**: Documenter chaque fonction, API et mécanisme dès sa création.
- **Feedback visuel**: Prioriser les retours visuels clairs pour chaque action du joueur.

### 3. Architecture et Organisation du Code

- **Séparation claire des responsabilités**:
  - Backend: Logique de jeu, gestion des données, API
  - Frontend: Interface utilisateur, animations, feedback visuel
- **Nommage cohérent**:
  - Utiliser le français pour les commentaires et la documentation
  - Utiliser des noms descriptifs pour les variables et fonctions
  - Suivre un format cohérent pour tous les composants similaires
- **Structure modulaire**:
  - Isoler les différents systèmes (cartes, combat, ressources)
  - Créer des interfaces claires entre ces systèmes

### 4. Priorités de Développement

1. **Implémenter le moteur de règles fondamental**:
   - Système de base pour les cartes et leurs interactions
   - Mécanismes de combat et de résolution des actions
   - Gestion des ressources (motivation, charisme)

2. **Développer l'interface administrateur**:
   - Outils de configuration et de debug
   - Système de simulation pour tester l'équilibre
   - Interface d'édition des cartes et des synergies

3. **Créer l'interface joueur**:
   - Design mobile responsive et intuitif
   - Système de collection et d'ouverture de boosters
   - Interface de combat avec feedback visuel clair

4. **Implémenter l'IA et le mode solo**:
   - Agent IA de base avec stratégies simples
   - Système d'apprentissage pour améliorer l'IA
   - Niveaux de difficulté configurables

### 5. Règles pour les Types de Cartes

- **Cartes Personnage**:
  - Vérifier la cohérence des PV selon la rareté
  - Équilibrer les tags pour éviter les combinaisons trop puissantes
  - Implémenter les systèmes d'évolution progressivement

- **Cartes Lieu**:
  - Garantir que la sélection aléatoire est équitable
  - Implémenter des effets passifs équilibrés
  - Vérifier l'impact sur le gameplay à chaque ajout

- **Cartes Objet**:
  - Maintenir l'équilibre des bonus passifs
  - Implémenter le système de vente en charisme
  - Vérifier les interactions avec les tags

- **Cartes Action et Événement**:
  - Équilibrer les coûts en motivation
  - Tester rigoureusement la résolution simultanée
  - Valider les effets aléatoires pour éviter la frustration

### 6. Développement du Système de Synergies

- **Parser de règles**:
  - Créer un format clair et extensible pour définir les interactions
  - Permettre des conditions complexes mais lisibles
  - Optimiser la performance de l'évaluation

- **Système d'évaluation**:
  - Implémenter un ordre clair de résolution des effets
  - Gérer les conflits de manière prévisible
  - Permettre l'ajout facile de nouvelles règles

- **Visualisation des effets**:
  - Créer des indicateurs clairs pour les synergies actives
  - Montrer l'impact prévu des actions avant confirmation
  - Donner un feedback visuel pour chaque effet appliqué

### 7. Tests et Équilibrage

- **Tests unitaires**:
  - Couvrir tous les composants critiques
  - Vérifier les cas limites et les interactions spéciales
  - Automatiser les tests de régression

- **Tests d'intégration**:
  - Valider le flux complet d'une partie
  - Tester les interactions entre tous les systèmes
  - Vérifier la cohérence des données

- **Équilibrage**:
  - Utiliser le système de simulation pour identifier les déséquilibres
  - Ajuster les valeurs numériques progressivement
  - Conserver l'historique des modifications pour analyse

### 8. Performance et Optimisation

- **Frontend**:
  - Optimiser les rendus et les animations
  - Implémenter le lazy loading pour les ressources
  - Minimiser les re-rendus inutiles

- **Backend**:
  - Optimiser les requêtes à la base de données
  - Implémenter des stratégies de cache efficaces
  - Monitorer la performance et identifier les goulots d'étranglement

- **Mobile**:
  - Optimiser la consommation de batterie
  - Réduire l'utilisation de la mémoire
  - Adapter l'interface aux différentes tailles d'écran

### 9. Communication et Suivi des Tâches

- **Suivre la TODO list de manière méthodique**
- **Marquer clairement les tâches terminées et en cours**
- **Documenter les décisions de conception importantes**
- **Maintenir une vision globale du projet tout en travaillant sur des composants spécifiques**

### 10. Rappels Importants

- **Le fun avant tout**: Ne jamais sacrifier l'expérience utilisateur pour la complexité technique
- **Tester régulièrement**: Valider chaque fonctionnalité dès qu'elle est implémentée
- **Rester flexible**: Être prêt à ajuster les mécaniques selon les résultats des tests
- **Documentation continue**: Maintenir la documentation à jour à chaque étape 