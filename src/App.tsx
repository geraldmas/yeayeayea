import React, { useState, useEffect } from 'react';
import CardForm from './components/CardForm';
import BoosterForm from './components/BoosterForm';
import Notification from './components/Notification';
import { Card, Booster } from './types';
import { validateCard } from './utils/validation';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'card' | 'booster'>('card');
  const [jsonPreview, setJsonPreview] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [cardData, setCardData] = useState<Card>({
    id: '',
    name: '',
    description: '',
    image: '',
    health: 0,
    spells: [],
    tags: [],
    type: 'personnage',
    rarity: 'gros_bodycount',
  });
  const [boosterData, setBoosterData] = useState<Booster>({
    id: '',
    name: '',
    cards: [],
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  const handleExportJSON = () => {
    try {
      if (activeTab === 'card') {
        const errors = validateCard(cardData);
        if (errors.length > 0) {
          showNotification(`Erreurs de validation : ${errors.join(', ')}`, 'error');
          return;
        }
      } else {
        // Validation simple du booster
        if (!boosterData.id || !boosterData.name) {
          showNotification("L'ID et le nom du booster sont obligatoires", 'error');
          return;
        }
      }

      const dataToExport = activeTab === 'card' ? cardData : boosterData;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${activeTab}-${Date.now()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      showNotification(`${activeTab === 'card' ? 'Carte' : 'Booster'} exporté(e) avec succès`, 'success');
    } catch (error) {
      console.error("Erreur lors de l'exportation :", error);
      showNotification("Erreur lors de l'exportation du fichier", 'error');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        try {
          const result = event.target?.result;
          if (typeof result === 'string') {
            const parsed = JSON.parse(result);
            if (activeTab === 'card' && parsed.id && parsed.name && parsed.type) {
              // Assurez-vous que les tableaux sont définis
              parsed.spells = parsed.spells || [];
              parsed.tags = parsed.tags || [];
              
              setCardData(parsed as Card);
              showNotification('Carte importée avec succès', 'success');
            } else if (activeTab === 'booster' && parsed.id && parsed.name && Array.isArray(parsed.cards)) {
              setBoosterData(parsed as Booster);
              showNotification('Booster importé avec succès', 'success');
            } else {
              showNotification("Le format du fichier importé ne correspond pas au type sélectionné", 'error');
            }
          }
        } catch (error) {
          console.error("Erreur lors de l'import du JSON :", error);
          showNotification("Erreur lors de l'import du fichier. Vérifiez que le format est correct", 'error');
        }
      };
      fileReader.readAsText(files[0]);
      e.target.value = '';
    }
  };

  // Met à jour l'aperçu JSON en temps réel
  useEffect(() => {
    setJsonPreview(JSON.stringify(activeTab === 'card' ? cardData : boosterData, null, 2));
  }, [activeTab, cardData, boosterData]);

  return (
    <div className="container">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <header>
        <h1>Éditeur de Cartes TCG</h1>
      </header>

      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === 'card' ? 'active' : ''}`}
          onClick={() => setActiveTab('card')}
        >
          Carte
        </button>
        <button
          className={`tab-button ${activeTab === 'booster' ? 'active' : ''}`}
          onClick={() => setActiveTab('booster')}
        >
          Booster
        </button>
      </div>

      <div className="card-editor">
        {activeTab === 'card' ? (
          <CardForm card={cardData} setCard={setCardData} />
        ) : (
          <BoosterForm booster={boosterData} setBooster={setBoosterData} />
        )}

        <div className="editor-section">
          <div className="form-row">
            <button onClick={handleExportJSON}>Exporter en JSON</button>
            <div>
              <input
                type="file"
                id="import-json"
                accept=".json"
                onChange={handleImportJSON}
                style={{ display: 'none' }}
              />
              <button onClick={() => document.getElementById('import-json')?.click()}>
                Importer un JSON
              </button>
            </div>
          </div>
        </div>

        <div className="editor-section">
          <h3>Aperçu JSON</h3>
          <pre className="preview-section">{jsonPreview}</pre>
        </div>
      </div>
    </div>
  );
};

export default App;
