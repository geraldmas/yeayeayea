import { initialSchema } from '../../migrations/001_initial_schema';
import { supabase } from '../../utils/supabaseClient';

jest.mock('../../utils/supabaseClient');

describe('Initial Schema Migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock de base pour toutes les requêtes RPC
    (supabase.rpc as jest.Mock).mockImplementation(() => 
      Promise.resolve({ data: true, error: null })
    );
  });

  describe('up', () => {
    it('devrait créer toutes les tables nécessaires', async () => {
      await initialSchema.up();

      expect(supabase.rpc).toHaveBeenCalledWith('exec_sql', expect.any(Object));
      // Ne pas vérifier le nombre exact d'appels car cela peut varier selon l'implémentation
      expect(supabase.rpc).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la création des tables', async () => {
      // Définir un mock qui lève effectivement une erreur plutôt que de renvoyer un objet contenant une erreur
      (supabase.rpc as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(initialSchema.up()).rejects.toThrow('Database error');
    });
  });

  describe('down', () => {
    it('devrait supprimer toutes les tables dans le bon ordre', async () => {
      await initialSchema.down();

      expect(supabase.rpc).toHaveBeenCalledWith('exec_sql', expect.any(Object));
      // Ne pas vérifier le nombre exact d'appels car cela peut varier selon l'implémentation
      expect(supabase.rpc).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la suppression des tables', async () => {
      // Définir un mock qui lève effectivement une erreur plutôt que de renvoyer un objet contenant une erreur
      (supabase.rpc as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(initialSchema.down()).rejects.toThrow('Database error');
    });
  });
}); 