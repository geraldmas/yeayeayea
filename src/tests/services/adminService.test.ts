import { jest } from '@jest/globals';
import { adminService } from '../../utils/adminService';
import { mockSupabase } from '../mocks/supabase';
import { setupMockFrom } from '../utils/testUtils';

// Mock typé pour supabase
const mockSupabaseFrom = mockSupabase.from as jest.Mock;

// Interface pour les données utilisateur
interface User {
  id: string;
  username: string;
  is_admin?: boolean;
  experience_points?: number;
  level?: number;
  password_hash?: string;
}

// Fonctions helpers pour les tests
const mockSuccessResponse = <T>(data: T) => ({ data, error: null });
const mockErrorResponse = (error: Error) => ({ data: null, error });

describe('adminService', () => {
  // Réinitialisation des mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('devrait récupérer tous les utilisateurs avec succès', async () => {
      // Préparer les données de mock
      const mockUsers: User[] = [
        { id: '1', username: 'user1', is_admin: false },
        { id: '2', username: 'user2', is_admin: true }
      ];

      // Configurer le mock avec notre utilitaire
      const { mock: fromMock, helpers } = setupMockFrom();
      // Créer un mock spécifique pour order dans ce cas
      const orderMock = jest.fn();
      (orderMock as any).mockResolvedValue(mockSuccessResponse(mockUsers));
      
      // Remplacer le select par un mock qui inclut order
      const selectMock = jest.fn().mockReturnValue({
        order: orderMock
      });
      
      const customFromMock = jest.fn().mockReturnValue({
        select: selectMock
      });
      
      mockSupabaseFrom.mockImplementation(() => customFromMock());

      // Exécuter la fonction
      const result = await adminService.getAllUsers();

      // Vérifications
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
      expect(result).toEqual(mockUsers);
    });

    it('devrait gérer les erreurs lors de la récupération des utilisateurs', async () => {
      // Configurer le mock pour simuler une erreur
      const mockError = new Error('Database error');
      
      // Créer un mock spécifique pour order dans ce cas
      const orderMock = jest.fn();
      (orderMock as any).mockResolvedValue(mockErrorResponse(mockError));
      
      // Remplacer le select par un mock qui inclut order
      const selectMock = jest.fn().mockReturnValue({
        order: orderMock
      });
      
      const customFromMock = jest.fn().mockReturnValue({
        select: selectMock
      });
      
      mockSupabaseFrom.mockImplementation(() => customFromMock());

      // Vérifier que l'erreur est propagée
      await expect(adminService.getAllUsers())
        .rejects.toThrow();
    });
  });

  describe('createUser', () => {
    it('devrait créer un utilisateur avec succès', async () => {
      // Préparer les données de mock
      const userData = {
        username: 'newuser',
        password: 'password123',
        isAdmin: true,
        experience_points: 100,
        level: 2
      };
      const mockCreatedUser: User = {
        id: '123',
        username: userData.username,
        is_admin: userData.isAdmin,
        experience_points: userData.experience_points,
        level: userData.level
      };

      // Configurer le mock avec notre utilitaire
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleSuccess(mockCreatedUser);
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Exécuter la fonction
      const result = await adminService.createUser(userData);

      // Vérifications
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
      expect(result).toEqual(mockCreatedUser);
      
      // Vérifier que password_hash est utilisé et non password
      expect(helpers.insert).toHaveBeenCalled();
      const insertArgs = helpers.insert.mock.calls[0][0] as any[];
      expect(insertArgs[0]).toHaveProperty('password_hash');
      expect(insertArgs[0]).not.toHaveProperty('password');
    });

    it('devrait gérer les erreurs lors de la création d\'un utilisateur', async () => {
      // Configurer le mock pour simuler une erreur
      const mockError = new Error('Username already exists');
      
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleError(mockError);
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Vérifier que l'erreur est propagée
      await expect(adminService.createUser({
        username: 'existinguser',
        password: 'password123'
      })).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('devrait mettre à jour un utilisateur avec succès', async () => {
      // Préparer les données de mock
      const userId = '123';
      const updates = {
        username: 'updateduser',
        password: 'newpassword',
        isAdmin: true
      };
      const mockUpdatedUser: User = {
        id: userId,
        username: updates.username,
        is_admin: updates.isAdmin
      };

      // Configurer le mock avec notre utilitaire
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleSuccess(mockUpdatedUser);
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Exécuter la fonction
      const result = await adminService.updateUser(userId, updates);

      // Vérifications
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
      expect(result).toEqual(mockUpdatedUser);
      
      // Vérifier que password_hash est utilisé et non password
      expect(helpers.update).toHaveBeenCalled();
      const updateArgs = helpers.update.mock.calls[0][0];
      expect(updateArgs).toHaveProperty('password_hash');
      expect(updateArgs).not.toHaveProperty('password');
    });

    it('devrait gérer les erreurs lors de la mise à jour d\'un utilisateur', async () => {
      // Configurer le mock pour simuler une erreur
      const mockError = new Error('User not found');
      
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleError(mockError);
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Vérifier que l'erreur est propagée
      await expect(adminService.updateUser('999', { username: 'newname' }))
        .rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('devrait supprimer un utilisateur avec succès', async () => {
      // Configurer le mock avec notre utilitaire
      const { mock: fromMock, helpers } = setupMockFrom();
      // Créer un mock spécial pour eq qui retourne directement la réponse
      const eqMock = jest.fn();
      (eqMock as any).mockResolvedValue(mockSuccessResponse(null));
      const delMock = jest.fn().mockReturnValue({ eq: eqMock });
      
      const customFromMock = jest.fn().mockReturnValue({
        delete: delMock
      });
      
      mockSupabaseFrom.mockImplementation(() => customFromMock());

      // Exécuter la fonction
      const result = await adminService.deleteUser('123');

      // Vérifications
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
      expect(result).toBe(true);
    });

    it('devrait gérer les erreurs lors de la suppression d\'un utilisateur', async () => {
      // Configurer le mock pour simuler une erreur
      const mockError = new Error('User not found');
      
      // Créer un mock spécial pour eq qui retourne directement l'erreur
      const eqMock = jest.fn();
      (eqMock as any).mockResolvedValue(mockErrorResponse(mockError));
      const delMock = jest.fn().mockReturnValue({ eq: eqMock });
      
      const customFromMock = jest.fn().mockReturnValue({
        delete: delMock
      });
      
      mockSupabaseFrom.mockImplementation(() => customFromMock());

      // Vérifier que l'erreur est propagée
      await expect(adminService.deleteUser('999'))
        .rejects.toThrow();
    });
  });

  describe('setAdminStatus', () => {
    it('devrait modifier le statut admin d\'un utilisateur avec succès', async () => {
      // Préparer les données de mock
      const userId = '123';
      const isAdmin = true;
      const mockUpdatedUser: User = {
        id: userId,
        username: 'user',
        is_admin: isAdmin
      };

      // Configurer le mock avec notre utilitaire
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleSuccess(mockUpdatedUser);
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Exécuter la fonction
      const result = await adminService.setAdminStatus(userId, isAdmin);

      // Vérifications
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
      expect(result).toEqual(mockUpdatedUser);
    });

    it('devrait gérer les erreurs lors de la modification du statut admin', async () => {
      // Configurer le mock pour simuler une erreur
      const mockError = new Error('User not found');
      
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleError(mockError);
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Vérifier que l'erreur est propagée
      await expect(adminService.setAdminStatus('999', true))
        .rejects.toThrow();
    });
  });
}); 