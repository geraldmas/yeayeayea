import { jest } from '@jest/globals';
import { userService } from '../../utils/userService';
import { mockSupabase } from '../mocks/supabase';
import bcrypt from 'bcryptjs';
import { setupMockFrom, setupMockRpc, mockSuccessResponse, mockErrorResponse } from '../utils/testUtils';

// Mock typé pour supabase
const mockSupabaseFrom = mockSupabase.from as jest.Mock;
const mockSupabaseRpc = mockSupabase.rpc as jest.Mock;

// Interface pour les données utilisateur
interface User {
  id: string;
  username: string;
  level?: number;
  experience_points?: number;
  currency?: number;
  properties?: Record<string, any>;
  is_admin?: boolean;
  password_hash?: string;
}

describe('userService', () => {
  // Réinitialisation des mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('devrait créer un nouvel utilisateur avec succès', async () => {
      // Préparer les données et les mocks
      const username = 'testuser';
      const password = 'password123';
      const mockUser: User = { 
        id: '123', 
        username, 
        level: 1, 
        experience_points: 0, 
        currency: 0 
      };

      // Configurer le mock avec notre utilitaire
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleSuccess(mockUser);
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Exécuter la fonction
      const result = await userService.signUp(username, password);

      // Vérifications
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
      expect(result).toEqual(mockUser);
    });

    it('devrait gérer les erreurs lors de la création d\'utilisateur', async () => {
      // Configurer le mock pour simuler une erreur
      const mockError = new Error('Username already exists');
      
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleError(mockError);
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Vérifier que l'erreur est propagée
      await expect(userService.signUp('existinguser', 'password123'))
        .rejects.toThrow();
    });
  });

  describe('signIn', () => {
    it('devrait authentifier un utilisateur avec succès', async () => {
      // Préparer les données et les mocks
      const username = 'testuser';
      const password = 'password123';
      const hashed = await bcrypt.hash(password, 10);
      const mockUser: User = {
        id: '123',
        username,
        password_hash: hashed,
        is_admin: false
      };

      // Configurer les mocks pour la sélection avec eq
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleSuccess(mockUser);
      
      // Configurer le mock pour retourner le même objet pour les deux appels
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Exécuter la fonction
      const result = await userService.signIn(username, password);

      // Vérifications
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
      expect(result).toEqual(mockUser);
    });

    it('devrait rejeter la connexion avec des identifiants invalides', async () => {
      // Configurer le mock pour simuler un échec d'authentification
      const mockError = new Error('Identifiants incorrects');
      
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleError(mockError);
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Vérifier que l'erreur est propagée
      await expect(userService.signIn('wronguser', 'wrongpass'))
        .rejects.toThrow('Identifiants incorrects');
    });
  });

  describe('updateProfile', () => {
    it('devrait mettre à jour le profil utilisateur avec succès', async () => {
      // Préparer les données et les mocks
      const userId = '123';
      const updates = { 
        username: 'newusername',
        level: 2,
        experience_points: 100
      };
      const mockUpdatedUser: User = { 
        id: userId, 
        ...updates 
      };

      // Configurer le mock pour retourner l'utilisateur mis à jour
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleSuccess(mockUpdatedUser);
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Exécuter la fonction
      const result = await userService.updateProfile(userId, updates);

      // Vérifications
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
      expect(result).toEqual(mockUpdatedUser);
    });

    it('devrait gérer les erreurs lors de la mise à jour du profil', async () => {
      // Configurer le mock pour simuler une erreur
      const mockError = new Error('User not found');
      
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleError(mockError);
      mockSupabaseFrom.mockImplementation(() => fromMock());

      // Vérifier que l'erreur est propagée
      await expect(userService.updateProfile('999', { username: 'newname' }))
        .rejects.toThrow();
    });
  });

  // Test pour vérifier que la colonne password_hash est utilisée correctement
  describe('gestion de password_hash', () => {
    it('devrait utiliser password_hash et non password lors de l\'inscription', async () => {
      const username = 'testuser';
      const password = 'password123';
      
      // Mock spécifique pour capturer les arguments
      const { mock: fromMock, helpers } = setupMockFrom();
      helpers.mockSingleSuccess({ id: '123', username });
      mockSupabaseFrom.mockImplementation(() => fromMock());

      await userService.signUp(username, password);
      
      // Vérifier que l'objet inséré contient password_hash et pas password
      expect(helpers.insert).toHaveBeenCalled();
      const insertArgs = helpers.insert.mock.calls[0][0] as any[];
      expect(insertArgs[0]).toHaveProperty('password_hash');
      expect(insertArgs[0].password_hash).not.toBe(password);
      expect(insertArgs[0]).not.toHaveProperty('password');
    });
  });
});
