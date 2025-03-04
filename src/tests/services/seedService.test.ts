import { seedService } from '../../utils/seedService';
import { supabase } from '../../utils/supabaseClient';

jest.mock('../../utils/supabaseClient');

describe('SeedService', () => {
  // Variables pour stocker les fonctions console originales
  let originalConsoleError: typeof console.error;
  let originalConsoleLog: typeof console.log;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Sauvegarder les fonctions console originales
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    
    // Remplacer par des mocks pour les tests
    console.error = jest.fn();
    console.log = jest.fn();
    
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ error: null })
    });
  });
  
  afterEach(() => {
    // Restaurer les fonctions console
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe('seedTags', () => {
    it('devrait insérer les tags avec succès', async () => {
      await seedService.seedTags();

      expect(supabase.from).toHaveBeenCalledWith('tags');
      expect(supabase.from('tags').insert).toHaveBeenCalledTimes(3); // NUIT, JOUR, FRAGILE
    });

    it('devrait gérer les erreurs lors de l\'insertion des tags', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: new Error('Database error') })
      });

      await expect(seedService.seedTags()).rejects.toThrow('Database error');
    });
  });

  describe('seedSpells', () => {
    it('devrait insérer les sorts avec succès', async () => {
      await seedService.seedSpells();

      expect(supabase.from).toHaveBeenCalledWith('spells');
      expect(supabase.from('spells').insert).toHaveBeenCalledTimes(2); // Boule de Feu, Soin
    });

    it('devrait gérer les erreurs lors de l\'insertion des sorts', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: new Error('Database error') })
      });

      await expect(seedService.seedSpells()).rejects.toThrow('Database error');
    });
  });

  describe('seedAlterations', () => {
    it('devrait insérer les altérations avec succès', async () => {
      await seedService.seedAlterations();

      expect(supabase.from).toHaveBeenCalledWith('alterations');
      expect(supabase.from('alterations').insert).toHaveBeenCalledTimes(2); // Brûlure, Bouclier
    });

    it('devrait gérer les erreurs lors de l\'insertion des altérations', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: new Error('Database error') })
      });

      await expect(seedService.seedAlterations()).rejects.toThrow('Database error');
    });
  });

  describe('seedCards', () => {
    it('devrait insérer les cartes avec succès', async () => {
      await seedService.seedCards();

      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(supabase.from('cards').insert).toHaveBeenCalledTimes(6); // 2 personnages + 1 lieu + 1 objet + 1 action + 1 événement
    });

    it('devrait gérer les erreurs lors de l\'insertion des cartes', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: new Error('Database error') })
      });

      await expect(seedService.seedCards()).rejects.toThrow('Database error');
    });
  });

  describe('seedGameConfig', () => {
    it('devrait insérer la configuration du jeu avec succès', async () => {
      await seedService.seedGameConfig();

      expect(supabase.from).toHaveBeenCalledWith('game_config');
      expect(supabase.from('game_config').insert).toHaveBeenCalledTimes(4); // 4 configurations différentes
    });

    it('devrait gérer les erreurs lors de l\'insertion de la configuration', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ error: new Error('Database error') })
      });

      await expect(seedService.seedGameConfig()).rejects.toThrow('Database error');
    });
  });

  describe('seedAll', () => {
    it('devrait exécuter tous les seeds avec succès', async () => {
      await seedService.seedAll();

      expect(supabase.from).toHaveBeenCalledWith('tags');
      expect(supabase.from).toHaveBeenCalledWith('spells');
      expect(supabase.from).toHaveBeenCalledWith('alterations');
      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(supabase.from).toHaveBeenCalledWith('game_config');
    });

    it('devrait gérer les erreurs lors du seed complet', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null,
              error: new Error('Database error') 
            })
          })
        })
      });

      await expect(seedService.seedAll()).rejects.toThrow('Database error');
      
      // Vérifier que le mock de console.error a été appelé
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 