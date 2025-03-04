import { jest } from '@jest/globals';
import { SupabaseClient } from '@supabase/supabase-js';

interface MockQueryBuilder {
  insert: jest.Mock;
  select: jest.Mock;
  single: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  update: jest.Mock;
}

interface MockRpcBuilder {
  mockImplementation: jest.Mock;
  mockResolvedValue: jest.Mock;
  mockRejectedValue: jest.Mock;
}

// Créer un mock de QueryBuilder
const createMockQueryBuilder = () => ({
  insert: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn()
    })
  }),
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      order: jest.fn().mockReturnValue({
        data: []
      })
    })
  }),
  eq: jest.fn().mockReturnValue({
    data: []
  }),
  order: jest.fn().mockReturnValue({
    data: []
  }),
  update: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      error: null
    })
  })
});

// Créer un mock de RpcBuilder
const createMockRpcBuilder = () => ({
  mockImplementation: jest.fn().mockImplementation(() => ({ error: null })),
  mockResolvedValue: jest.fn().mockImplementation(() => ({ error: null })),
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