import { migrationService } from '../../utils/migrationService';
import { supabase } from '../../utils/supabaseClient';

jest.mock('../../utils/supabaseClient');

// Timeout plus long pour tous les tests de cette suite
jest.setTimeout(30000);

describe('MigrationService', () => {
  // Variables pour stocker les fonctions console originales
  let originalConsoleError: typeof console.error;
  let originalConsoleLog: typeof console.log;
  
  const mockMigration = {
    version: '001',
    name: 'Test Migration',
    dependencies: [],
    up: jest.fn().mockResolvedValue(undefined),
    down: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Sauvegarder les fonctions console originales
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    
    // Remplacer par des mocks pour les tests
    console.error = jest.fn();
    console.log = jest.fn();
    
    // Amélioration des mocks pour résoudre immédiatement les promesses
    // et s'assurer que toutes les méthodes nécessaires sont disponibles
    (supabase.from as jest.Mock).mockImplementation((table) => {
      const mockSelect = jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null }));
      const mockEq = jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null }));
      const mockOrder = jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null }));
      const mockInsert = jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null }));
      const mockUpdate = jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null }));
      
      const mockBuilder = {
        select: jest.fn().mockReturnValue({ 
          eq: mockEq, 
          order: mockOrder,
          single: jest.fn().mockReturnValue(Promise.resolve({ data: {}, error: null })) 
        }),
        eq: mockEq,
        order: mockOrder,
        insert: mockInsert,
        update: mockUpdate
      };
      
      return mockBuilder;
    });
    
    // Correction du mock de rpc pour qu'il retourne toujours une promesse résolue avec data et error
    (supabase.rpc as jest.Mock).mockImplementation((functionName) => 
      Promise.resolve({ data: true, error: null })
    );
  });
  
  afterEach(() => {
    // Restaurer les fonctions console
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe('registerMigration', () => {
    it('devrait enregistrer une migration avec succès', async () => {
      await migrationService.registerMigration(mockMigration);
      
      // Simplifier le test pour éviter de dépendre de getPendingMigrations
      expect(migrationService['migrations'].get('001')).toBe(mockMigration);
    });
  });

  describe('getPendingMigrations', () => {
    it('devrait retourner les migrations en attente', async () => {
      await migrationService.registerMigration(mockMigration);
      
      const mockSelect = jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null }));
      
      (supabase.from as jest.Mock).mockImplementation(() => {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null }))
          })
        };
      });

      const pendingMigrations = await migrationService.getPendingMigrations();
      expect(pendingMigrations).toHaveLength(1);
      expect(pendingMigrations[0].version).toBe('001');
    });
  });

  describe('runMigrations', () => {
    it('devrait exécuter une migration avec succès', async () => {
      await migrationService.registerMigration(mockMigration);
      
      (supabase.from as jest.Mock).mockImplementation(() => {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null }))
          }),
          insert: jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null }))
        };
      });

      // S'assurer que tous les appels rpc dans runMigrations retournent des valeurs correctes
      (supabase.rpc as jest.Mock).mockImplementation((functionName) => {
        if (functionName === 'can_apply_migration') {
          return Promise.resolve({ data: true, error: null });
        }
        if (functionName === 'backup_before_migration') {
          return Promise.resolve({ data: null, error: null });
        }
        if (functionName === 'get_next_batch') {
          return Promise.resolve({ data: 1, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      await migrationService.runMigrations();
      expect(mockMigration.up).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de l\'exécution', async () => {
      // Simuler une erreur dans la méthode up() de la migration
      mockMigration.up.mockRejectedValueOnce(new Error('Execution error'));
      
      await migrationService.registerMigration(mockMigration);
      
      // Configurer les mocks pour que la migration soit tentée
      (supabase.rpc as jest.Mock).mockImplementation((functionName) => {
        if (functionName === 'can_apply_migration') {
          return Promise.resolve({ data: true, error: null });
        }
        if (functionName === 'backup_before_migration') {
          return Promise.resolve({ data: null, error: null });
        }
        if (functionName === 'get_next_batch') {
          return Promise.resolve({ data: 1, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });
      
      // Configurer le mock pour l'insertion d'une migration échouée
      (supabase.from as jest.Mock).mockImplementation((table) => {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null }))
          }),
          insert: jest.fn().mockReturnValue(Promise.resolve({ data: null, error: null }))
        };
      });

      // L'erreur dans .up() devrait être propagée
      await expect(migrationService.runMigrations()).rejects.toThrow('Execution error');
    });
  });

  describe('rollbackMigration', () => {
    it('devrait effectuer un rollback avec succès', async () => {
      await migrationService.registerMigration(mockMigration);
      
      (supabase.from as jest.Mock).mockImplementation(() => {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(Promise.resolve({ 
              data: [{ version: '001' }], 
              error: null 
            }))
          })
        };
      });

      await migrationService.rollbackMigration('001');
      expect(mockMigration.down).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors du rollback', async () => {
      await migrationService.registerMigration(mockMigration);
      
      // Au lieu de lancer directement une erreur, simuler une erreur dans down()
      mockMigration.down.mockRejectedValueOnce(new Error('Rollback error'));
      
      (supabase.from as jest.Mock).mockImplementation(() => {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(Promise.resolve({
              data: [{ version: '001' }],
              error: null
            }))
          })
        };
      });

      await expect(migrationService.rollbackMigration('001')).rejects.toThrow('Rollback error');
    });
  });

  describe('rollbackBatch', () => {
    it('devrait effectuer un rollback de batch avec succès', async () => {
      await migrationService.registerMigration(mockMigration);
      
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Premier appel : lors de la sélection des migrations
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue(Promise.resolve({
                    data: [{ version: '001' }],
                    error: null
                  }))
                })
              })
            })
          };
        } else {
          // Deuxième appel : lors du rollback
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue(Promise.resolve({
                data: [{ version: '001' }],
                error: null
              }))
            })
          };
        }
      });

      await migrationService.rollbackBatch(1);
      expect(mockMigration.down).toHaveBeenCalled();
    });
  });
}); 