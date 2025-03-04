import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import CardForm from './components/CardForm';
import BoosterForm from './components/BoosterForm';
import CardBrowser from './components/CardBrowser';
import Notification from './components/Notification';
import Login from './components/Login';
import Help from './components/Help';
import { Card, Booster, User } from './types';
import { saveCard, getAllCards, deleteCard } from './utils/supabaseClient';
import './App.css';
import AlterationManager from './components/AlterationManager';
import Objectives from './components/Objectives';
import { supabase } from './utils/supabaseClient';

interface LoadedTagsMap {
  [cardId: number]: { id: number; name: string; passive_effect: string | null }[];
}

interface LoadedSpellsMap {
  [cardId: number]: { id: number; name: string; description: string | null; power: number; cost: number | null; range_min: number | null; range_max: number | null; effects: any[]; is_value_percentage: boolean }[];
}

interface SaveCardResult {
  data?: Card;
  error?: Error;
}

interface CardTag {
  tag_id: number;
}

interface CardSpell {
  spell_id: number;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'card' | 'booster' | 'browser' | 'help' | 'alterations'>('card');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [cardData, setCardData] = useState<Card | null>({
    id: 0,
    name: '',
    type: 'personnage',
    description: '',
    image: '',
    rarity: 'gros_bodycount',
    summon_cost: 0,
    passive_effect: '',
    is_wip: true,
    is_crap: false,
    properties: {}
  });
  const [boosterData, setBoosterData] = useState<Booster>({
    id: '',
    name: '',
    cards: []
  });
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [spellIds, setSpellIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [loadedSpellsMap, setLoadedSpellsMap] = useState<LoadedSpellsMap>({});

  const resetCard = () => {
    setCardData({
      id: 0,
      name: '',
      type: 'personnage',
      description: '',
      image: '',
      rarity: 'gros_bodycount',
      summon_cost: 0,
      passive_effect: '',
      is_wip: true,
      is_crap: false,
      properties: {}
    });
    setSpellIds([]);
    setTagIds([]);
  };

  const handleAlterationChange = (alteration: any) => {
    // Logique de gestion des altérations
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  const handleCardSave = async (card: Card) => {
    try {
      const { data, error } = await saveCard(card);
      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la carte :', error);
    }
  };

  const handleDeleteCard = async (card: Card) => {
    if (!card || !card.id) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette carte ? Cette action est irréversible.')) {
      try {
        await deleteCard(card.id);
        showNotification('Carte supprimée avec succès', 'success');
        resetCard();
        loadCards(); // Recharger la liste des cartes
        setActiveTab('browser'); // Retourner à la liste des cartes
      } catch (error) {
        console.error('Erreur lors de la suppression de la carte:', error);
        showNotification('Erreur lors de la suppression de la carte', 'error');
      }
    }
  };

  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      const userData = JSON.parse(rememberedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await getAllCards();
      const cardsWithTags = await Promise.all(data.map(async card => {
        const { data: cardTags } = await supabase
          .from('card_tags')
          .select('tag_id')
          .eq('card_id', card.id);
        
        const { data: tags } = await supabase
          .from('tags')
          .select('*')
          .in('id', (cardTags || []).map((tag: CardTag) => tag.tag_id));

        return {
          ...card,
          tags: tags || []
        };
      }));

      setAllCards(cardsWithTags);
      
      const spellsMap: LoadedSpellsMap = {};
      await Promise.all(data.map(async card => {
        const { data: cardSpells } = await supabase
          .from('card_spells')
          .select('spell_id')
          .eq('card_id', card.id);
        
        spellsMap[card.id] = (cardSpells || []).map((spell: CardSpell) => ({ 
          id: spell.spell_id, 
          name: '', 
          description: '', 
          power: 0, 
          cost: 0, 
          range_min: 0, 
          range_max: 0, 
          effects: [], 
          is_value_percentage: false 
        }));
      }));
      setLoadedSpellsMap(spellsMap);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const handleRandomEdit = (type: string | undefined, setActiveTab: React.Dispatch<React.SetStateAction<'card' | 'booster' | 'browser' | 'help' | 'alterations'>>) => {
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
      setTagIds(cardToEdit.tags?.map(tag => tag.id) || []);
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

  const handleObjectiveComplete = (message: string) => {
    showNotification(message, 'success');
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
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
          <nav>
            <ul className="nav-links">
              <li>
                <button
                  className={activeTab === 'card' ? 'active' : ''}
                  onClick={() => setActiveTab('card')}
                >
                  Éditeur de Carte
                </button>
              </li>
              {user?.isAdmin && (
                <li>
                  <button
                    className={activeTab === 'booster' ? 'active' : ''}
                    onClick={() => setActiveTab('booster')}
                  >
                    Éditeur de Booster
                  </button>
                </li>
              )}
              <li>
                <button
                  className={activeTab === 'browser' ? 'active' : ''}
                  onClick={() => setActiveTab('browser')}
                >
                  Navigateur de Cartes
                </button>
              </li>
              <li>
                <button
                  className={activeTab === 'alterations' ? 'active' : ''}
                  onClick={() => setActiveTab('alterations')}
                >
                  Altérations
                </button>
              </li>
              <li>
                <button
                  className={activeTab === 'help' ? 'active' : ''}
                  onClick={() => setActiveTab('help')}
                >
                  Aide
                </button>
              </li>
              <li>
                <button onClick={handleLogout} className="logout-button">
                  Déconnexion
                </button>
              </li>
            </ul>
          </nav>
        </header>

        <main>
          {activeTab === 'card' && (
            <div className="card-editor">
              <CardForm
                card={cardData}
                onSave={handleCardSave}
                onDelete={handleDeleteCard}
                spellIds={spellIds}
                tagIds={tagIds}
                onSpellIdsChange={setSpellIds}
                onTagIdsChange={setTagIds}
              />
              <div className="random-button-container">
                <button className="random-button" onClick={() => {
                  const menu = document.querySelector('.random-menu');
                  menu?.classList.toggle('show');
                }}>
                  Éditer au hasard
                </button>
                <div className="random-menu">
                  <button onClick={() => handleRandomEdit('image', setActiveTab)}>Sans image</button>
                  <button onClick={() => handleRandomEdit('description', setActiveTab)}>Sans description</button>
                  <button onClick={() => handleRandomEdit('tags', setActiveTab)}>Sans tags</button>
                  <button onClick={() => handleRandomEdit('spells', setActiveTab)}>Sans sorts</button>
                  <button onClick={() => handleRandomEdit('passiveEffect', setActiveTab)}>Sans effet passif</button>
                  <button onClick={() => handleRandomEdit(undefined, setActiveTab)}>WIP</button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'booster' && user?.isAdmin && (
            <BoosterForm booster={boosterData} onSave={() => {}} />
          )}
          {activeTab === 'browser' && (
            <CardBrowser
              cards={allCards}
              onCardSelect={(card: Card) => {
                setCardData(card);
                setSpellIds(loadedSpellsMap[card.id]?.map(spell => spell.id) || []);
                setTagIds(card.tags?.map(tag => tag.id) || []);
                setActiveTab('card');
              }}
              loadedSpellsMap={loadedSpellsMap}
            />
          )}
          {activeTab === 'alterations' && (
            <AlterationManager onChange={handleAlterationChange} />
          )}
          {activeTab === 'help' && (
            <Help />
          )}
        </main>

        <Objectives 
          cards={allCards} 
          onObjectiveComplete={handleObjectiveComplete} 
        />
      </div>
    </Router>
  );
};

export default App;
