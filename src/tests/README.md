# Tests pour TCG Card Editor

Ce dossier contient les tests unitaires et d'intégration pour l'application TCG Card Editor.

## Structure des tests

- **services/** - Tests unitaires pour les services utilisés dans l'application
- **integration/** - Tests d'intégration pour vérifier l'interaction entre plusieurs composants
- **mocks/** - Mocks utilisés dans les tests
- **setup.ts** - Configuration pour Jest et initialisation avant les tests

## Tests d'authentification

Les tests d'authentification (`userService.test.ts`, `adminService.test.ts`, et `user-password-hash.test.ts`) vérifient que :

1. L'authentification des utilisateurs fonctionne correctement
2. La gestion des mots de passe est sécurisée
3. Les colonnes `password` et `password_hash` sont utilisées correctement

### Tests spécifiques pour le bug `password_hash`

Le fichier `user-password-hash.test.ts` teste spécifiquement :
- Que les services n'utilisent jamais une colonne `password` dans les requêtes d'insertion/mise à jour
- Que les données insérées/mises à jour utilisent toujours `password_hash` et non `password`
- Que les requêtes de lecture ne tentent pas d'accéder à une colonne `password` inexistante

## Exécution des tests

### Tous les tests

```bash
npm test
```

### Tests d'authentification uniquement

```bash
npm run test:auth
```

### Tests en intégration continue

```bash
npm run test:ci
```

## Ajout de nouveaux tests

1. Suivez la structure existante pour ajouter de nouveaux tests
2. Utilisez les mocks existants ou créez-en de nouveaux dans `/mocks`
3. Si vous ajoutez un nouveau type de test, pensez à créer un script npm dédié

## Bonnes pratiques

- Assurez-vous que les tests sont indépendants
- Utilisez `beforeEach` pour réinitialiser les mocks
- Testez les cas de succès et d'erreur
- Testez les cas limites et les cas extrêmes
- Testez spécifiquement les bugs qui ont été corrigés pour éviter leur réapparition 