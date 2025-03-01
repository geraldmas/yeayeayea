import React, { useState } from 'react';
import { testArrayFormats, setupColumnTypesRPC } from '../utils/arrayTestDiagnostic';

const TestDiagnostic: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const runArrayTests = async () => {
    setLoading(true);
    setResults(['Démarrage des tests...']);

    try {
      // Rediriger console.log vers notre interface
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;

      console.log = (...args) => {
        originalConsoleLog(...args);
        setResults(prev => [...prev, args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')]);
      };

      console.error = (...args) => {
        originalConsoleError(...args);
        setResults(prev => [...prev, `ERROR: ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')}`]);
      };

      await testArrayFormats();

      // Restaurer console.log
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erreur inconnue';
      setResults(prev => [...prev, `Erreur: ${errorMessage}`]);
    } finally {
      setLoading(false);
    }
  };

  const showSetupSQL = async () => {
    setLoading(true);
    setResults(['Génération du SQL pour la fonction RPC...']);

    try {
      const sql = await setupColumnTypesRPC();
      setResults(prev => [...prev, sql]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erreur inconnue';
      setResults(prev => [...prev, `Erreur: ${errorMessage}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Diagnostic des problèmes de tableaux avec Supabase</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runArrayTests} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Exécution en cours...' : 'Exécuter les tests d\'arrays'}
        </button>

        <button 
          onClick={showSetupSQL} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Afficher SQL pour fonction RPC
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Résultats:</h3>
        <div 
          style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '4px',
            maxHeight: '500px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            color: '#333'
          }}
        >
          {results.length > 0 ? (
            results.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '6px',
                color: result.startsWith('ERROR:') ? 'red' : 'inherit'
              }}>
                {result}
              </div>
            ))
          ) : (
            <div>Aucun résultat pour l'instant. Exécutez les tests pour voir les résultats.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestDiagnostic;