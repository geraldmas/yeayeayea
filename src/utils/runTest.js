// Ce script permet d'exécuter le test de diagnostic pour les problèmes de type avec Supabase
// Utilisation: npx ts-node src/utils/runTest.js

// Importer le fichier de test
require('ts-node/register');
require('./supabaseTest.ts').testCardSave()
  .then(() => {
    console.log('Tests terminés!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur lors de l\'exécution des tests:', err);
    process.exit(1);
  });