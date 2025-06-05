import { jest } from '@jest/globals';

/**
 * Crée un mock pour simuler une requête Supabase réussie
 */
export function mockSuccessResponse<T>(data: T): any {
  return { data, error: null };
}

/**
 * Crée un mock pour simuler une erreur Supabase
 */
export function mockErrorResponse(error: Error): any {
  return { data: null, error };
}

// Interface pour les helpers de mockFrom
export interface FromHelpers {
  insert: jest.Mock;
  select: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  mockSingleSuccess: <T>(data: T) => void;
  mockSingleError: (error: Error) => void;
}

/**
 * Configure un mock pour la fonction from() de Supabase
 * Retourne un mock configuré avec des helpers pour faciliter les tests
 */
export function setupMockFrom(): { mock: () => any, helpers: FromHelpers } {
  // Mocks pour les méthodes les plus courantes
  const eqMock = jest.fn();
  const singleMock = jest.fn();
  
  // Créer un mock pour select qui peut retourner soit single, soit eq
  const selectMock = jest.fn().mockImplementation(() => {
    return {
      single: singleMock,
      eq: eqMock
    };
  });
  
  const insertMock = jest.fn().mockReturnValue({ select: selectMock });
  const updateMock = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: selectMock }) });
  const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });

  // Création du mock principal
  const fromMock = () => ({
    insert: insertMock,
    select: selectMock,
    update: updateMock,
    delete: deleteMock
  });

  // Helpers pour configurer rapidement des réponses
  const helpers: FromHelpers = {
    insert: insertMock,
    select: selectMock,
    update: updateMock,
    delete: deleteMock,
    eq: eqMock,
    mockSingleSuccess: <T>(data: T) => {
      (singleMock as any).mockResolvedValue(mockSuccessResponse(data));
    },
    mockSingleError: (error: Error) => {
      (singleMock as any).mockResolvedValue(mockErrorResponse(error));
    }
  };

  // Configurer eqMock pour qu'il retourne un objet avec eq et single
  (eqMock as any).mockImplementation(() => {
    return {
      eq: eqMock,
      single: singleMock
    };
  });

  return { mock: fromMock, helpers };
}

/**
 * Fonction utilitaire pour créer un mock pour Supabase.rpc()
 */
export function setupMockRpc() {
  const mockResolvedValue = jest.fn();
  const mockImplementation = jest.fn();
  const mockRejectedValue = jest.fn();

  const rpc = jest.fn().mockReturnValue({
    mockResolvedValue,
    mockImplementation,
    mockRejectedValue
  });

  return {
    mock: rpc,
    helpers: {
      // Configurez mockResolvedValue pour retourner une réponse réussie
      mockRpcSuccess: <T>(data: T) => {
        // @ts-ignore - Nécessaire car TypeScript ne peut pas inférer le type correct
        mockResolvedValue.mockResolvedValue(mockSuccessResponse(data));
        return mockResolvedValue;
      },
      // Configurez mockResolvedValue pour retourner une erreur
      mockRpcError: (error: Error) => {
        // @ts-ignore - Nécessaire car TypeScript ne peut pas inférer le type correct
        mockResolvedValue.mockResolvedValue(mockErrorResponse(error));
        return mockResolvedValue;
      },
      // Récupérer les mocks individuels pour les tests
      mockResolvedValue,
      mockImplementation,
      mockRejectedValue
    }
  };
}
