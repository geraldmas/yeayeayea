import { migrationService } from '../utils/migrationService';
import { initialSchema } from '../migrations/001_initial_schema';

export async function main() {
  try {
    // Enregistrer les migrations
    await migrationService.registerMigration(initialSchema);

    // Exécuter les migrations en attente
    await migrationService.runMigrations();

    console.log('Migrations terminées avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'exécution des migrations:', error);
    // Ne pas utiliser process.exit dans les tests
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
} 