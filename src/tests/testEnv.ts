// Configuration de l'environnement de test Jest.
// Ce fichier charge les variables d'environnement dédiées aux tests et met en
// place des mocks globaux (ici pour Supabase) afin d'isoler les tests du code
// externe.
import dotenv from 'dotenv';

// Charger les variables d'environnement de test
dotenv.config({ path: '.env.test' });

// Mock de Supabase
jest.mock('../utils/supabaseClient', () => {
  const mockFrom = jest.fn();
  const mockRpc = jest.fn();
  const mockAuth = {
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  };

  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
      auth: mockAuth,
    },
  };
}); 