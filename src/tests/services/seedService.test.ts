import { seedService } from '../../utils/seedService';
import { supabase } from '../../utils/supabaseClient';

jest.mock('../../utils/supabaseClient');

describe('SeedService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('seedTags', () => {
    it('devrait créer les tags prédéfinis avec succès', async () => {
      // Remplacer la console.log pour éviter les sorties lors des tests
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      // Exécuter la fonction
      await seedService.seedTags();

      expect(supabase.from).toHaveBeenCalledWith('tags');
      expect(supabase.from('tags').insert).toHaveBeenCalledTimes(3); // NUIT, JOUR, FRAGILE
      
      // Restaurer console.log
      console.log = originalConsoleLog;
    });
  });
}); 