import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import CardForm from './components/CardForm';
import BoosterForm from './components/BoosterForm';
import CardBrowser from './components/CardBrowser';
import Notification from './components/Notification';
import Login from './components/Login';
import { Help } from './components';
import TestDebugger from './components/TestDebugger'; // Importer le nouveau composant
import { Card, Booster, Alteration } from './types';
import { validateCard } from './utils/validation';
import { saveCard, getAllCards } from './utils/supabaseClient';
import { getCardTags, getCardSpells } from './utils/validation';
import './App.css';
import AlterationManager from './components/AlterationManager';

interface LoadedTagsMap {
  [cardId: number]: { id: number; name: string; passive_effect: string | null }[];
}

interface LoadedSpellsMap {
  [cardId: number]: { id: number; name: string; description: string | null; power: number; cost: number | null; range_min: number | null; range_max: number | null; effects: any[]; is_value_percentage: boolean }[];
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'card' | 'booster' | 'browser' | 'help' | 'alterations' | 'debug'>('card');
  const [jsonPreview, setJsonPreview] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [cardData, setCardData] = useState<Card | null>(null);
  const [boosterData, setBoosterData] = useState<Booster>({
    id: '',
    name: '',
    cards: [],
  });
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [spellIds, setSpellIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [loadedTagsMap, setLoadedTagsMap] = useState<LoadedTagsMap>({});
  const [loadedSpellsMap, setLoadedSpellsMap] = useState<LoadedSpellsMap>({});

  const handleAlterationChange = (alteration: Alteration) => {
    console.log('Alteration changed:', alteration);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  const handleExportJSON = async () => {
    try {
      if (activeTab === 'card') {
        if (!cardData) {
          showNotification('Aucune carte à valider', 'error');
          return;
        }

        const errors = await validateCard(cardData);
        if (errors.length > 0) {
          showNotification(`Erreurs de validation : ${errors.join(', ')}`, 'error');
          return;
        }

        try {
          // Sauvegarder la carte sans les propriétés spells et tags
          const savedCard = await saveCard(cardData);

          // Sauvegarder les spells et tags séparément si nécessaire
          // Vous pouvez ajouter ici la logique pour sauvegarder les spells et tags

          showNotification('Carte sauvegardée avec succès', 'success');
          // Réinitialiser le formulaire
          setCardData({
            id: 0,
            name: '',
            description: '',
            image: '',
            type: 'personnage',
            rarity: 'gros_bodycount',
            properties: {},
            is_wip: true, // Par défaut, les nouvelles cartes sont en WIP
            is_crap: false, // Ensure this matches the database schema
            passive_effect: '',
            summon_cost: 0
          });
          setSpellIds([]);
          setTagIds([]);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde de la carte :', error);
          showNotification('Erreur lors de la sauvegarde de la carte', 'error');
        }
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
              setCardData({
                ...parsed,
                summon_cost: parsed.summon_cost || 0,
                rarity: parsed.rarity || 'gros_bodycount'
              } as Card);
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
      const tagsMap: LoadedTagsMap = {};
      const spellsMap: LoadedSpellsMap = {};
      await Promise.all(data.map(async card => {
        const cardTags = await getCardTags(card.id);
        tagsMap[card.id] = cardTags.map(tag => ({ id: tag.tag_id, name: '', passive_effect: '' }));
        const cardSpells = await getCardSpells(card.id);
        spellsMap[card.id] = cardSpells.map(spell => ({ id: spell.spell_id, name: '', description: '', power: 0, cost: 0, range_min: 0, range_max: 0, effects: [], is_value_percentage: false }));
      }));
      setLoadedTagsMap(tagsMap);
      setLoadedSpellsMap(spellsMap);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const handleRandomEdit = (type: string | undefined, setActiveTab: React.Dispatch<React.SetStateAction<'card' | 'booster' | 'browser' | 'help' | 'alterations' | 'debug'>>) => {
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
        cardToEdit = getRandomCard(card => {
          const cardTags = loadedTagsMap[card.id] || [];
          return cardTags.length === 0;
        });
        break;
      case 'spells':
        cardToEdit = getRandomCard(card => {
          const cardSpells = loadedSpellsMap[card.id] || [];
          return cardSpells.length === 0;
        });
        break;
      case 'passiveEffect':
        cardToEdit = getRandomCard(card => !card.passive_effect);
        break;
      default:
        cardToEdit = getRandomCard(card => card.is_wip);
    }

    if (cardToEdit) {
      // S'assurer que toutes les propriétés sont initialisées
      const completeCard = {
        ...cardToEdit,
        image: cardToEdit.image || '',
        description: cardToEdit.description || '',
        rarity: cardToEdit.rarity || 'gros_bodycount'
      };
      setCardData(completeCard);
      setSpellIds(loadedSpellsMap[cardToEdit.id]?.map(spell => spell.id) || []);
      setTagIds(loadedTagsMap[cardToEdit.id]?.map(tag => tag.id) || []);
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
              onClick={() => handleRandomEdit(undefined, setActiveTab)}
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
              <button onClick={() => handleRandomEdit('image', setActiveTab)}>
                🖼️ Compléter les images
              </button>
              <button onClick={() => handleRandomEdit('description', setActiveTab)}>
                📝 Compléter les descriptions
              </button>
              <button onClick={() => handleRandomEdit('tags', setActiveTab)}>
                🏷️ Compléter les tags
              </button>
              <button onClick={() => handleRandomEdit('spells', setActiveTab)}>
                ⚡ Compléter les sorts
              </button>
              <button onClick={() => handleRandomEdit('passiveEffect', setActiveTab)}>
                🔄 Compléter les effets passifs
              </button>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/browser" />} />
          <Route path="/card" element={
            <>
              <CardForm card={cardData} setCard={setCardData} spellIds={spellIds} setSpellIds={setSpellIds} tagIds={tagIds} setTagIds={setTagIds} />
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
          <Route path="/alterations" element={<AlterationManager onChange={handleAlterationChange} />} />
          {/* Ajouter une nouvelle route pour le débogueur */}
          <Route path="/debug" element={<TestDebugger />} />
          <Route path="*" element={<Navigate to="/browser" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
