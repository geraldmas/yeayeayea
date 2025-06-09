import { seedService } from '../utils/seedService';

async function main() {
  try {
    console.log('Début du seed de la base de données...');
    await seedService.seedAll();
    console.log('Seed de la base de données terminé avec succès');
  } catch (error) {
    console.error('Erreur lors du seed de la base de données:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main };
