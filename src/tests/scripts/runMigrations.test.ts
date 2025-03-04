import { migrationService } from '../../utils/migrationService';
import { initialSchema } from '../../migrations/001_initial_schema';
import { main } from '../../scripts/runMigrations';

// Mock du module migrationService
jest.mock('../../utils/migrationService', () => ({
  migrationService: {
    registerMigration: jest.fn(),
    runMigrations: jest.fn()
  }
}));

// Remplacer temporairement console.error et console.log pour les tests
let originalConsoleError: typeof console.error;
let originalConsoleLog: typeof console.log;

describe('runMigrations Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Sauvegarde et remplacement des fonctions console
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.error = jest.fn();
    console.log = jest.fn();
    
    // Réinitialiser les mocks
    (migrationService.registerMigration as jest.Mock).mockReset();
    (migrationService.runMigrations as jest.Mock).mockReset();
  });
  
  afterEach(() => {
    // Restaurer les fonctions console
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  it('devrait enregistrer et exécuter les migrations avec succès', async () => {
    // Mock des fonctions
    (migrationService.registerMigration as jest.Mock).mockResolvedValue(undefined);
    (migrationService.runMigrations as jest.Mock).mockResolvedValue(undefined);

    // Exécuter le script
    await main();

    // Vérifier que les fonctions ont été appelées
    expect(migrationService.registerMigration).toHaveBeenCalledWith(initialSchema);
    expect(migrationService.runMigrations).toHaveBeenCalled();
  });

  it('devrait gérer les erreurs lors de l\'enregistrement des migrations', async () => {
    expect.assertions(1); // S'assurer qu'un expect est appelé
    
    // Mock d'une erreur lors de l'enregistrement
    (migrationService.registerMigration as jest.Mock).mockRejectedValue(
      new Error('Registration error')
    );

    // Utiliser expect.rejects au lieu de try/catch
    await expect(main()).rejects.toThrow('Registration error');
  });

  it('devrait gérer les erreurs lors de l\'exécution des migrations', async () => {
    expect.assertions(1); // S'assurer qu'un expect est appelé
    
    // Mock d'une erreur lors de l'exécution
    (migrationService.registerMigration as jest.Mock).mockResolvedValue(undefined);
    (migrationService.runMigrations as jest.Mock).mockRejectedValue(
      new Error('Execution error')
    );

    // Utiliser expect.rejects au lieu de try/catch
    await expect(main()).rejects.toThrow('Execution error');
  });
}); 