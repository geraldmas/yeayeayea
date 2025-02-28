import React, { useState, useEffect } from 'react';
import CardForm from './components/CardForm';
import BoosterForm from './components/BoosterForm';
import CardBrowser from './components/CardBrowser';
import Notification from './components/Notification';
import { Card, Booster } from './types';
import { validateCard } from './utils/validation';
import { saveCard } from './utils/supabaseClient';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'card' | 'booster' | 'browser'>('card');
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

  const handleExportJSON = async () => {
    try {
      if (activeTab === 'card') {
        const errors = validateCard(cardData);
        if (errors.length > 0) {
          showNotification(`Erreurs de validation : ${errors.join(', ')}`, 'error');
          return;
        }

        try {
          await saveCard(cardData);
          showNotification('Carte sauvegardée avec succès', 'success');
          // Réinitialiser le formulaire
          setCardData({
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
        } catch (error) {
          console.error('Erreur lors de la sauvegarde:', error);
          showNotification('Erreur lors de la sauvegarde de la carte', 'error');
        }
      } else {
        // ...existing booster export code...
      }
    } catch (error) {
      console.error("Erreur lors de l'exportation :", error);
      showNotification("Erreur lors de l'exportation", 'error');
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
          Nouvelle Carte
        </button>
        <button
          className={`tab-button ${activeTab === 'browser' ? 'active' : ''}`}
          onClick={() => setActiveTab('browser')}
        >
          Parcourir
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
        ) : activeTab === 'browser' ? (
          <CardBrowser />
        ) : (
          <BoosterForm booster={boosterData} setBooster={setBoosterData} />
        )}

        {activeTab !== 'browser' && (
          <div className="editor-section">
            <div className="form-row">
              <button onClick={handleExportJSON}>
                {activeTab === 'card' ? 'Sauvegarder la carte' : 'Sauvegarder le booster'}
              </button>
            </div>
            <div className="editor-section">
              <h3>Aperçu</h3>
              <pre className="preview-section">{jsonPreview}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
