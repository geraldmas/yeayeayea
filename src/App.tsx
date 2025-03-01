import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import CardForm from './components/CardForm';
import BoosterForm from './components/BoosterForm';
import CardBrowser from './components/CardBrowser';
import Notification from './components/Notification';
import Login from './components/Login';
import { Help } from './components';
import TestDebugger from './components/TestDebugger'; // Importer le nouveau composant
import { Card, Booster } from './types';
import { validateCard } from './utils/validation';
import { saveCard, getAllCards } from './utils/supabaseClient';
import './App.css';
import AlterationManager from './components/AlterationManager';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'card' | 'booster' | 'browser' | 'help' | 'alterations' | 'debug'>('card');
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
    isWIP: true, // Par défaut, les nouvelles cartes sont en WIP
  });
  const [boosterData, setBoosterData] = useState<Booster>({
    id: '',
    name: '',
    cards: [],
  });
  const [allCards, setAllCards] = useState<Card[]>([]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  const handleExportJSON = async () => {
    try {
      if (activeTab === 'card') {
        const errors = await validateCard(cardData);
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
            isWIP: true, // Par défaut, les nouvelles cartes sont en WIP
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

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await getAllCards();
      setAllCards(data);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const handleRandomEdit = (type?: string) => {
    let cardToEdit: Card | null = null;
    const getRandomCard = (filterFn?: (card: Card) => boolean) => {
      const eligibleCards = filterFn ? allCards.filter(filterFn) : allCards;
      if (eligibleCards.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * eligibleCards.length);
      return eligibleCards[randomIndex];
    };

    switch (type) {
      case 'image':
        cardToEdit = getRandomCard(card => !card.image);
        break;
      case 'description':
        cardToEdit = getRandomCard(card => !card.description);
        break;
      case 'tags':
        cardToEdit = getRandomCard(card => !card.tags || card.tags.length === 0);
        break;
      case 'spells':
        cardToEdit = getRandomCard(card => !card.spells || card.spells.length === 0);
        break;
      case 'passiveEffect':
        cardToEdit = getRandomCard(card => !card.passiveEffect);
        break;
      default:
        cardToEdit = getRandomCard(card => card.isWIP);
    }

    if (cardToEdit) {
      // S'assurer que toutes les propriétés sont initialisées
      const completeCard = {
        ...cardToEdit,
        image: cardToEdit.image || '',
        description: cardToEdit.description || '',
        spells: cardToEdit.spells || [],
        tags: cardToEdit.tags || [],
        passiveEffect: cardToEdit.passiveEffect || '',
      };
      setCardData(completeCard);
      setActiveTab('card');
    } else {
      showNotification('Aucune carte ne correspond à ces critères !', 'info');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.random-button-container')) {
        const menu = document.querySelector('.random-menu');
        if (menu && menu.classList.contains('show')) {
          menu.classList.remove('show');
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} />;
  }

  return (
    <Router>
      <div className="container">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <header>
          <h1>Éditeur de cartes</h1>
        </header>

        <nav className="tab-container">
          <Link 
            to="/card" 
            className={`tab-button ${activeTab === 'card' ? 'active' : ''}`}
            onClick={() => setActiveTab('card')}
          >
            Nouvelle Carte
          </Link>
          <Link 
            to="/browser" 
            className={`tab-button ${activeTab === 'browser' ? 'active' : ''}`}
            onClick={() => setActiveTab('browser')}
          >
            Parcourir
          </Link>
          <Link 
            to="/booster" 
            className={`tab-button ${activeTab === 'booster' ? 'active' : ''}`}
            onClick={() => setActiveTab('booster')}
          >
            Booster
          </Link>
          <Link 
            to="/help" 
            className={`tab-button ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            Aide
          </Link>
          <Link 
            to="/alterations" 
            className={`tab-button ${activeTab === 'alterations' ? 'active' : ''}`}
            onClick={() => setActiveTab('alterations')}
          >
            Altérations
          </Link>
          {/* Ajouter un nouvel onglet pour le débogueur */}
          <Link 
            to="/debug" 
            className={`tab-button ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveTab('debug')}
          >
            🔍 Débogueur
          </Link>
          <div className="random-button-container">
            <button 
              className="tab-button random-button"
              onClick={() => handleRandomEdit()}
            >
              🎲 Hasard
            </button>
            <button 
              className="tab-button random-dropdown-button"
              onClick={(e) => {
                e.stopPropagation();
                const menu = document.querySelector('.random-menu');
                if (menu) menu.classList.toggle('show');
              }}
            >
              ▼
            </button>
            <div className="random-menu">
              <button onClick={() => handleRandomEdit('image')}>
                🖼️ Compléter les images
              </button>
              <button onClick={() => handleRandomEdit('description')}>
                📝 Compléter les descriptions
              </button>
              <button onClick={() => handleRandomEdit('tags')}>
                🏷️ Compléter les tags
              </button>
              <button onClick={() => handleRandomEdit('spells')}>
                ⚡ Compléter les sorts
              </button>
              <button onClick={() => handleRandomEdit('passiveEffect')}>
                🔄 Compléter les effets passifs
              </button>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/browser" />} />
          <Route path="/card" element={
            <>
              <CardForm card={cardData} setCard={setCardData} />
              <div className="editor-section">
                <div className="form-row">
                  <button onClick={handleExportJSON}>
                    Sauvegarder la carte
                  </button>
                </div>
                <div className="editor-section">
                  <h3>Aperçu</h3>
                  <pre className="preview-section">{jsonPreview}</pre>
                </div>
              </div>
            </>
          } />
          <Route path="/browser" element={<CardBrowser />} />
          <Route path="/booster" element={
            <>
              <BoosterForm booster={boosterData} setBooster={setBoosterData} />
              <div className="editor-section">
                <div className="form-row">
                  <button onClick={handleExportJSON}>
                    Sauvegarder le booster
                  </button>
                </div>
                <div className="editor-section">
                  <h3>Aperçu</h3>
                  <pre className="preview-section">{jsonPreview}</pre>
                </div>
              </div>
            </>
          } />
          <Route path="/help" element={<Help />} />
          <Route path="/alterations" element={<AlterationManager />} />
          {/* Ajouter une nouvelle route pour le débogueur */}
          <Route path="/debug" element={<TestDebugger />} />
          <Route path="*" element={<Navigate to="/browser" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
