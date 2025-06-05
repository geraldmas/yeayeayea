import { jest } from '@jest/globals';
import { SupabaseClient } from '@supabase/supabase-js';

// Définition des types pour nos données de réponse
type DataResponse<T> = { data: T, error: null };
type ErrorResponse = { data: null, error: Error };
type EmptyResponse = { error: null };

// Type pour les callbacks utilisés dans nos mocks
type PromiseCallback<T> = (response: T) => any;

interface MockQueryBuilder {
  insert: jest.Mock;
  select: jest.Mock;
  single: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

interface MockRpcBuilder {
  mockImplementation: jest.Mock;
  mockResolvedValue: jest.Mock;
  mockRejectedValue: jest.Mock;
}

// Créer un mock générique pour mockResolvedValue qui accepte n'importe quel argument
const createMockResolvedValue = () => {
  return jest.fn().mockImplementation((value) => value);
};

// Fonction qui retourne un objet avec une structure then correctement typée
const createMockThenObject = <T>(response: T) => ({
  then: jest.fn().mockImplementation(function(this: any, callback: any) {
    return Promise.resolve(callback(response));
  })
});

// Créer un mock de QueryBuilder
const createMockQueryBuilder = () => ({
  insert: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockImplementation(() => createMockThenObject({ data: {}, error: null }))
    })
  }),
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      order: jest.fn().mockImplementation(() => createMockThenObject({ data: [], error: null })),
      single: jest.fn().mockImplementation(() => createMockThenObject({ data: {}, error: null }))
    }),
    order: jest.fn().mockImplementation(() => createMockThenObject({ data: [], error: null }))
  }),
  eq: jest.fn().mockReturnValue({
    data: []
  }),
  order: jest.fn().mockReturnValue({
    data: []
  }),
  update: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockImplementation(() => createMockThenObject({ data: {}, error: null }))
      }),
      error: null
    })
  }),
  delete: jest.fn().mockReturnValue({
    eq: jest.fn().mockImplementation(() => createMockThenObject({ error: null }))
  })
});

// Créer un mock de RpcBuilder
const createMockRpcBuilder = () => ({
  mockImplementation: jest.fn().mockImplementation(() => ({ error: null })),
  mockResolvedValue: jest.fn().mockImplementation((value) => value),
  mockRejectedValue: jest.fn().mockImplementation(() => {
    throw new Error('Database error');
  })
});

const mockAuth = {
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
};

// Créer un mock complet de SupabaseClient
const mockSupabaseClient = {
  from: jest.fn().mockImplementation(() => createMockQueryBuilder()),
  rpc: jest.fn().mockImplementation(() => createMockRpcBuilder()),
  auth: mockAuth,
} as unknown as SupabaseClient;

// Ajouter les méthodes de mock directement sur l'objet
Object.assign(mockSupabaseClient, {
  from: jest.fn().mockImplementation(() => createMockQueryBuilder()),
  rpc: jest.fn().mockImplementation(() => createMockRpcBuilder()),
});

export const mockSupabase = mockSupabaseClient;

jest.mock('../../utils/supabaseClient', () => ({
  supabase: mockSupabase,
}));
