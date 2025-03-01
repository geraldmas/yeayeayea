import React, { useState } from 'react';
import { Card } from '../types';
import { saveCard } from '../utils/supabaseClient';
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
      
      // Cas 0: Tableau vide (cas qui causait le bug)
      const testCard0: Card = {
        id: 'test-card-0',
        name: 'Test Card Empty Arrays',
        description: 'Test avec tableaux vides',
        type: 'personnage',
        rarity: 'banger',
        health: 10,
        image: '',
        spells: [], // Tableau vide qui causait le problème
        tags: [],   // Tableau vide qui causait le problème
        isWIP: true
      };
      
      log('Test 0: Tableau vide (cas du bug)');
      log(`spells: ${JSON.stringify(testCard0.spells)}`);
      log(`tags: ${JSON.stringify(testCard0.tags)}`);
      
      try {
        await saveCard(testCard0);
        log('Test 0 réussi ✅');
      } catch (error: any) {
        log(`Test 0 échoué ❌: ${error.message}`);
      }

      // Cas 1: Test avec tableaux contenant null
      const testCard1: any = {
        id: 'test-card-1',
        name: 'Test Card with Null Arrays',
        description: 'Test avec tableaux null',
        type: 'personnage',
        rarity: 'banger',
        health: 10,
        image: '',
        spells: null,
        tags: null,
        isWIP: true
      };
      
      log('Test 1: Tableaux null');
      log(`spells: ${JSON.stringify(testCard1.spells)}`);
      log(`tags: ${JSON.stringify(testCard1.tags)}`);
      
      try {
        await saveCard(testCard1 as Card);
        log('Test 1 réussi ✅');
      } catch (error: any) {
        log(`Test 1 échoué ❌: ${error.message}`);
      }

      // Cas 2: Test avec tableaux contenant des éléments
      const testCard2: Card = {
        id: 'test-card-2',
        name: 'Test Card with String Arrays',
        description: 'Test avec tableaux de strings',
        type: 'personnage',
        rarity: 'banger',
        health: 10,
        image: '',
        spells: ['spell1', 'spell2'],
        tags: ['tag1', 'tag2'],
        isWIP: true
      };
      
      log('Test 2: Tableaux de strings');
      log(`spells: ${JSON.stringify(testCard2.spells)}`);
      log(`tags: ${JSON.stringify(testCard2.tags)}`);
      
      try {
        await saveCard(testCard2);
        log('Test 2 réussi ✅');
      } catch (error: any) {
        log(`Test 2 échoué ❌: ${error.message}`);
      }
      
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