// Composant principal de l'application. Il gère la logique d'authentification,
// la récupération des données et la configuration des routes. La majorité de la
// logique métier côté client est centralisée ici.
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import CardForm from './components/CardForm';
import BoosterForm from './components/BoosterForm';
import CardBrowser from './components/CardBrowser';
import Login from './components/Login';
import Help from './components/Help';
import UserManager from './components/UserManager';
import GameBoardTest from './components/GameBoardTest';
import DebugPanel from './components/DebugPanel';
import { Card, Booster, User } from './types';
import { saveCard, getAllCards, deleteCard } from './utils/supabaseClient';
import './App.css';
import AlterationManager from './components/AlterationManager';
import Objectives from './components/Objectives';
import TodoProgress from './components/TodoProgress';
import Achievements from './components/Achievements';
import InventoryPage from './components/InventoryPage';
import { supabase } from './utils/supabaseClient';

// Import de nos nouveaux composants UI
import { GameLayout, GameCardGrid, AdminPanel, Notification } from './components/ui';
import ManualTargetSelector from './components/ManualTargetSelector';
import SimulationPanel from './components/SimulationPanel';
import ConflictSettingsPage from './components/ConflictSettingsPage';
import { TargetingService, TargetingResult } from './services/targetingService';
import { CardInstance } from './types/combat';

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

const targetingService = new TargetingService();

// Composant conteneur pour les routes
const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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
  const [manualTargeting, setManualTargeting] = useState<{
    possibleTargets: CardInstance[];
    minTargets?: number;
    maxTargets?: number;
    onComplete: (result: TargetingResult) => void;
    onCancel: () => void;
  } | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    targetingService.registerManualTargetingCallback((options) => {
      setManualTargeting({
        possibleTargets: options.possibleTargets,
        minTargets: options.minTargets,
        maxTargets: options.maxTargets,
        onComplete: options.onComplete,
        onCancel: options.onCancel,
      });
    });
  }, []);

  // Déterminer si l'utilisateur est dans une section admin
  const isAdminView = location.pathname === '/users' || location.pathname === '/admin';

  // Fonction pour réinitialiser les données de carte
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

  // Gérer le changement d'altération
  const handleAlterationChange = (alteration: any) => {
    // Logique de gestion des altérations
  };

  // Afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  // Sauvegarder une carte
  const handleCardSave = async (card: Card) => {
    try {
      const result = await saveCard(card);
      if (result.error) {
        throw result.error;
      }
      
      showNotification('Carte sauvegardée avec succès', 'success');
      
      // Si c'est une nouvelle carte, réinitialiser le formulaire
      if (!card.id) {
        resetCard();
      }
      
      // Actualiser la liste des cartes
      fetchAllCards();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la carte :', error);
      showNotification('Erreur lors de la sauvegarde de la carte', 'error');
    }
  };

  // Supprimer une carte
  const handleDeleteCard = async (card: Card) => {
    if (!card || !card.id) {
      showNotification('Erreur : impossible de supprimer une carte sans identifiant', 'error');
      return;
    }
    
    // Confirmer la suppression
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette carte ? Cette action est irréversible.')) {
      try {
        // La fonction deleteCard ne retourne rien en cas de succès, mais peut lancer une erreur
        await deleteCard(card.id);
        showNotification('Carte supprimée avec succès', 'success');
        resetCard();
        
        // Actualiser la liste des cartes
        fetchAllCards();
      } catch (error) {
        console.error('Erreur lors de la suppression de la carte :', error);
        showNotification('Erreur lors de la suppression de la carte', 'error');
      }
    }
  };

  // Récupérer toutes les cartes
  const fetchAllCards = async () => {
    try {
      // getAllCards retourne directement un tableau de cartes
      const cards = await getAllCards();
      setAllCards(cards);
    } catch (error) {
      console.error('Erreur lors de la récupération des cartes :', error);
      showNotification('Erreur lors du chargement des cartes', 'error');
    }
  };

  // Modifier une carte au hasard
  const handleRandomEdit = (type?: string) => {
    let cardToEdit: Card | null = null;
    
    const getRandomCard = (filterFn: (card: Card) => boolean) => {
      const eligibleCards = allCards.filter(filterFn);
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
      navigate('/cards');
    } else {
      showNotification('Aucune carte ne correspond à ces critères !', 'info');
    }
  };

  // Gérer la complétion d'un objectif
  const handleObjectiveComplete = (message: string) => {
    showNotification(message, 'success');
  };

  // Gérer la connexion
  const handleLogin = (userData: any) => {
    // Assurons-nous que is_admin est correctement défini
    if (userData.isAdmin !== undefined && userData.is_admin === undefined) {
      userData.is_admin = userData.isAdmin;
    }
    
    setUser(userData as User);
    setIsAuthenticated(true);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Effet pour déboguer l'utilisateur
  useEffect(() => {
    console.log("L'utilisateur a changé:", user);
    // Forçons le statut admin pour TOUS les utilisateurs temporairement
    if (user && !user.is_admin) {
      console.log("Forçage du statut admin pour test...");
      const adminUser = { ...user, is_admin: true };
      console.log("Nouvel utilisateur avec admin forcé:", adminUser);
      setUser(adminUser);
      
      // Mettons à jour aussi le localStorage pour que ce soit persistant
      localStorage.setItem('rememberedUser', JSON.stringify(adminUser));
      localStorage.setItem('user', JSON.stringify(adminUser));
    }
  }, [user]);

  // Effet pour logger l'état de l'utilisateur
  useEffect(() => {
    // Logger les changements d'état utilisateur pour le débogage
    if (user) {
      console.log("État utilisateur actuel:", user);
      console.log("Statut admin:", user.is_admin ? "Administrateur" : "Utilisateur standard");
      
      // Vérifier si l'utilisateur a bien la propriété is_admin définie
      if (user.is_admin === undefined || user.is_admin === null) {
        console.warn("ATTENTION: La propriété is_admin n'est pas définie pour cet utilisateur!");
      }
    }
  }, [user]);

  // Effet pour récupérer les cartes au chargement
  useEffect(() => {
    fetchAllCards();
  }, []);

  // Vérifier si l'utilisateur est authentifié
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur :', error);
      }
    }
  }, []);

  // Effet pour charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Afficher un message de chargement
        showNotification('Chargement des données...', 'info');
        
        // Charger les cartes
        await fetchAllCards();
        
        // Charger d'autres données si nécessaire...
        
        // Supprimer le message de chargement
        setNotification(null);
      } catch (error) {
        console.error('Erreur lors du chargement des données initiales :', error);
        showNotification('Erreur lors du chargement des données', 'error');
      }
    };
    
    // Charger les données si l'utilisateur est authentifié
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]); // S'exécute uniquement lors de l'authentification

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <GameLayout
      user={user}
      isAdmin={user?.is_admin || false}
      onLogout={handleLogout}
      isAdminView={isAdminView}
    >
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {manualTargeting && (
        <ManualTargetSelector
          targets={manualTargeting.possibleTargets}
          minTargets={manualTargeting.minTargets}
          maxTargets={manualTargeting.maxTargets}
          onConfirm={(targets) => {
            manualTargeting.onComplete({ id: 'manual', targets, success: true });
            setManualTargeting(null);
          }}
          onCancel={() => {
            manualTargeting.onCancel();
            setManualTargeting(null);
          }}
        />
      )}

      {/* Contenu principal basé sur les routes */}
      <Routes>
        {/* Page d'accueil */}
        <Route path="/" element={
          <div className="home-container">
            <div className="welcome-section">
              <h1>Bienvenue dans Yeayeayea</h1>
              <p className="subtitle">Créez, modifiez et testez vos cartes de jeu</p>
              
              <div className="quick-actions">
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/cards')}>
                  Éditer une carte
                </button>
                <button className="btn btn-outline btn-lg" onClick={() => navigate('/browser')}>
                  Parcourir les cartes
                </button>
                <button className="btn btn-secondary btn-lg" onClick={() => navigate('/gameboard')}>
                  Tester le jeu
                </button>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/simulation')}>
                  Simulations
                </button>
              </div>
            </div>
            
            {/* Aperçu des cartes récentes */}
            <GameCardGrid
              title="Cartes récentes"
              subtitle="Les dernières cartes ajoutées ou modifiées"
              cards={allCards.slice(0, 6)}
              onCardClick={(card: any) => {
                // Créer une copie complète de la carte en s'assurant que toutes les propriétés requises sont présentes
                const completeCard: Card = {
                  id: card.id,
                  name: card.name,
                  type: card.type,
                  rarity: card.rarity,
                  description: card.description || '',
                  image: card.image || '',
                  passive_effect: card.passive_effect || '',
                  properties: card.properties || {},
                  is_wip: card.is_wip !== undefined ? card.is_wip : true,
                  is_crap: card.is_crap !== undefined ? card.is_crap : false,
                  summon_cost: card.summon_cost || 0
                };
                
                setCardData(completeCard);
                
                // Gérer les spells et tags
                setSpellIds(loadedSpellsMap[card.id]?.map((spell: any) => spell.id) || []);
                setTagIds((card.tags || []).map((tag: any) => tag.id) || []);
                navigate('/cards');
              }}
              maxCards={6}
              showLoadMore={allCards.length > 6}
              onLoadMore={() => navigate('/browser')}
            />
            
            {/* Section objectifs */}
            <Objectives
              cards={allCards}
              onObjectiveComplete={handleObjectiveComplete}
            />
            
            {/* Section de progression */}
            <TodoProgress />
          </div>
        } />
        
        {/* Éditeur de carte */}
        <Route path="/cards" element={
          <div className="card-editor-container">
            <div className="card-editor-header">
              <h1>Éditeur de Carte</h1>
              
              <div className="card-editor-actions">
                <button className="btn btn-primary" onClick={resetCard}>
                  Nouvelle carte
                </button>
                
                <div className="random-edit-dropdown">
                  <button className="btn btn-outline dropdown-toggle">
                    Compléter au hasard
                  </button>
                  <div className="dropdown-menu">
                    <button onClick={() => handleRandomEdit('image')}>Sans image</button>
                    <button onClick={() => handleRandomEdit('description')}>Sans description</button>
                    <button onClick={() => handleRandomEdit('tags')}>Sans tags</button>
                    <button onClick={() => handleRandomEdit('spells')}>Sans sorts</button>
                    <button onClick={() => handleRandomEdit('passiveEffect')}>Sans effet passif</button>
                    <button onClick={() => handleRandomEdit()}>En cours (WIP)</button>
                  </div>
                </div>
              </div>
            </div>
            
            <CardForm
              card={cardData}
              onSave={handleCardSave}
              onDelete={(card: Card) => handleDeleteCard(card)}
              spellIds={spellIds}
              tagIds={tagIds}
              onSpellIdsChange={setSpellIds}
              onTagIdsChange={setTagIds}
            />
          </div>
        } />
        
        {/* Explorateur de cartes */}
        <Route path="/browser" element={
          <CardBrowser
            cards={allCards}
            onCardSelect={(card: Card) => {
              // Faire une copie profonde de la carte pour éviter les problèmes de référence
              const cardCopy = JSON.parse(JSON.stringify(card));
              
              // S'assurer que l'ID est correctement défini et pas 0
              if (!cardCopy.id || cardCopy.id === 0) {
                setNotification({
                  message: 'Erreur: ID de carte invalide',
                  type: 'error'
                });
                return;
              }
              
              // Vérifier et initialiser les propriétés si nécessaire
              if (!cardCopy.properties) {
                cardCopy.properties = {};
              }
              
              setCardData(cardCopy);
              
              // Charger les sorts et tags associés
              setSpellIds(loadedSpellsMap[cardCopy.id]?.map(spell => spell.id) || []);
              setTagIds(cardCopy.tags?.map((tag: { id: number }) => tag.id) || []);
              
              // Naviguer vers l'éditeur
              navigate('/cards');
            }}
            loadedSpellsMap={loadedSpellsMap}
          />
        } />
        
        {/* Éditeur de booster */}
        <Route path="/boosters" element={
          <BoosterForm booster={boosterData} onSave={() => {}} />
        } />
        
        {/* Gestionnaire d'altérations */}
        <Route path="/alterations" element={
          <AlterationManager onChange={handleAlterationChange} />
        } />

        {/* Réalisations */}
        <Route path="/achievements" element={
          <Achievements user={user as User} />
        } />

        {/* Inventaire */}
        <Route path="/inventory" element={
          user ? (
            <InventoryPage user={user as User} />
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Page d'aide */}
        <Route path="/help" element={
          <Help />
        } />
        
        {/* Gestionnaire d'utilisateurs (admin uniquement) */}
        <Route path="/users" element={
          user?.is_admin ? (
            <AdminPanel title="Gestionnaire d'utilisateurs" icon="👥">
              <UserManager />
            </AdminPanel>
          ) : (
            <Navigate to="/" replace />
          )
        } />

        {/* Panneau de debug (admin uniquement) */}
        <Route path="/debug" element={
          user?.is_admin ? (
            <AdminPanel title="Debug" icon="🛠">
              <DebugPanel />
            </AdminPanel>
          ) : (
            <Navigate to="/" replace />
          )
        } />

        {/* Gestion des conflits (admin uniquement) */}
        <Route path="/conflicts" element={
          user?.is_admin ? (
            <AdminPanel title="Résolution des conflits" icon="⚔️">
              <ConflictSettingsPage />
            </AdminPanel>
          ) : (
            <Navigate to="/" replace />
          )
        } />
        
        {/* Plateau de jeu */}
        <Route path="/gameboard" element={
          <GameBoardTest />
        } />

        {/* Panneau de simulation */}
        <Route path="/simulation" element={
          <SimulationPanel user={user} />
        } />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GameLayout>
  );
};

// Composant principal de l'application
const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
