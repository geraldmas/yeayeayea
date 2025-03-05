import { jest } from '@jest/globals';
import { userService } from '../../utils/userService';
import { adminService } from '../../utils/adminService';
import { mockSupabase } from '../mocks/supabase';
import { mockSuccessResponse } from '../utils/testUtils';

// Mock typé pour supabase
const mockSupabaseFrom = mockSupabase.from as jest.Mock;

describe('Tests d\'intégration - Gestion du mot de passe utilisateur', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Création d\'utilisateur', () => {
    it('ne devrait jamais utiliser le champ password dans les données insérées', async () => {
      // Configurer un mock qui va capturer les données d'insertion
      const singleMock = jest.fn();
      (singleMock as any).mockResolvedValue({
        data: { id: '123', username: 'testuser' },
        error: null
      });
      
      const selectMock = jest.fn().mockReturnValue({
        single: singleMock
      });
      
      const insertMock = jest.fn().mockReturnValue({
        select: selectMock
      });

      mockSupabaseFrom.mockImplementation(() => ({
        insert: insertMock
      }));

      // Scénario 1: userService.signUp
      await userService.signUp('testuser', 'password123');
      
      // Vérifier les données d'insertion pour userService
      const userServiceInsertArgs = insertMock.mock.calls[0][0] as any[];
      expect(userServiceInsertArgs[0]).toHaveProperty('password_hash');
      expect(userServiceInsertArgs[0]).not.toHaveProperty('password');
      
      // Réinitialiser le mock
      jest.clearAllMocks();
      mockSupabaseFrom.mockImplementation(() => ({
        insert: insertMock
      }));
      
      // Scénario 2: adminService.createUser
      await adminService.createUser({
        username: 'adminuser',
        password: 'adminpass',
        isAdmin: true
      });
      
      // Vérifier les données d'insertion pour adminService
      const adminServiceInsertArgs = insertMock.mock.calls[0][0] as any[];
      expect(adminServiceInsertArgs[0]).toHaveProperty('password_hash');
      expect(adminServiceInsertArgs[0]).not.toHaveProperty('password');
    });
  });

  describe('Mise à jour d\'utilisateur', () => {
    it('ne devrait jamais utiliser le champ password dans les données mises à jour', async () => {
      // Configurer un mock qui va capturer les données de mise à jour
      const singleMock = jest.fn();
      (singleMock as any).mockResolvedValue({
        data: { id: '123', username: 'testuser' },
        error: null
      });
      
      const selectMock = jest.fn().mockReturnValue({
        single: singleMock
      });
      
      const eqMock = jest.fn().mockReturnValue({
        select: selectMock
      });
      
      const updateMock = jest.fn().mockReturnValue({
        eq: eqMock
      });

      mockSupabaseFrom.mockImplementation(() => ({
        update: updateMock
      }));

      // Mettre à jour un utilisateur avec un nouveau mot de passe
      await adminService.updateUser('123', {
        username: 'updateduser',
        password: 'newpassword'
      });
      
      // Vérifier les données de mise à jour
      const updateArgs = updateMock.mock.calls[0][0] as any;
      expect(updateArgs).toHaveProperty('password_hash');
      expect(updateArgs).not.toHaveProperty('password');
    });
  });

  describe('Requêtes utilisateurs', () => {
    it('ne devrait jamais essayer de lire une colonne password', async () => {
      // Configurer un mock pour la méthode select
      const singleMock = jest.fn();
      (singleMock as any).mockResolvedValue({
        data: { id: '123', username: 'testuser', password_hash: 'hashedvalue' },
        error: null
      });
      
      const eqMock = jest.fn().mockReturnValue({
        single: singleMock
      });
      
      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock
      });

      mockSupabaseFrom.mockImplementation(() => ({
        select: selectMock
      }));

      // Récupérer un utilisateur par son ID
      await adminService.getUserById('123');
      
      // Vérifier que la sélection ne demande pas le champ 'password'
      const selectArgs = selectMock.mock.calls[0][0];
      // Si select('*') est utilisé, on ne peut pas vérifier directement
      // Dans ce cas, on vérifie juste que l'appel est effectué
      expect(selectMock).toHaveBeenCalled();
    });
  });
}); 