import React, { useState } from 'react';
import TestDiagnostic from './TestDiagnostic';

const TestDebugger: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showAdvancedTests, setShowAdvancedTests] = useState(false);

  const log = (message: string) => {
    setTestResults(prev => [...prev, message]);
    console.log(message);
  };

  const runTest = async () => {
    setTestResults([]);
    setIsRunning(true);

    try {
      log('=== DÉMARRAGE DU TEST DE DIAGNOSTIC ===');
      
      // Removed diagnostic test code
      
      log('=== FIN DU TEST DE DIAGNOSTIC ===');
    } catch (error: any) {
      log(`Erreur globale: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ margin: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Débogueur de Sauvegarde de Carte</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={runTest} 
          disabled={isRunning}
          style={{
            padding: '10px 15px',
            backgroundColor: isRunning ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
          }}
        >
          {isRunning ? 'Test en cours...' : 'Lancer les tests de diagnostic de base'}
        </button>

        <button 
          onClick={() => setShowAdvancedTests(!showAdvancedTests)} 
          style={{
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showAdvancedTests ? 'Masquer les tests avancés' : 'Afficher les tests avancés'}
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '4px',
        fontFamily: 'monospace',
        maxHeight: '400px',
        overflowY: 'auto',
        marginBottom: '20px'
      }}>
        {testResults.map((result, index) => (
          <div key={index} style={{ 
            marginBottom: '5px',
            color: result.includes('❌') ? '#d9534f' : 
                   result.includes('✅') ? '#5cb85c' : 
                   '#333'
          }}>
            {result}
          </div>
        ))}
        {isRunning && <div>Exécution en cours...</div>}
      </div>

      {showAdvancedTests && (
        <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
          <TestDiagnostic />
        </div>
      )}
    </div>
  );
};

export default TestDebugger;