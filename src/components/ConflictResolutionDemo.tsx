import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Divider, Grid, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';

import { 
  ActionResolutionService, 
  ConflictResolutionStrategy, 
  ActionType, 
  PlannedAction 
} from '../services/actionResolutionService';
import { CardInstanceImpl } from '../services/combatService';
import { Card, Spell, SpellEffect } from '../types/index';

import ConflictResolutionManager from './ConflictResolutionManager';
import './ConflictResolutionDemo.css';

// Mock des cartes et sorts pour la démonstration
const createMockCards = (): Card[] => [
  {
    id: 1,
    name: 'Guerrier',
    type: 'personnage',
    rarity: 'interessant',
    description: 'Un guerrier puissant',
    image: 'warrior.png',
    passive_effect: '',
    properties: { health: 20 },
    is_wip: false,
    is_crap: false,
    summon_cost: 3
  },
  {
    id: 2,
    name: 'Archer',
    type: 'personnage',
    rarity: 'interessant',
    description: 'Un archer précis',
    image: 'archer.png',
    passive_effect: '',
    properties: { health: 15 },
    is_wip: false,
    is_crap: false,
    summon_cost: 2
  },
  {
    id: 3,
    name: 'Mage',
    type: 'personnage',
    rarity: 'banger',
    description: 'Un mage puissant',
    image: 'mage.png',
    passive_effect: '',
    properties: { health: 12 },
    is_wip: false,
    is_crap: false,
    summon_cost: 4
  },
  {
    id: 4,
    name: 'Voleur',
    type: 'personnage',
    rarity: 'interessant',
    description: 'Un voleur agile',
    image: 'thief.png',
    passive_effect: '',
    properties: { health: 10 },
    is_wip: false,
    is_crap: false,
    summon_cost: 2
  }
];

const createMockSpells = (): Spell[] => [
  {
    id: 1,
    name: 'Frappe puissante',
    description: 'Inflige des dégâts importants',
    cost: 3,
    range_min: 1,
    range_max: 1,
    effects: [
      { type: 'damage', value: 8 } as SpellEffect
    ],
    is_value_percentage: false
  },
  {
    id: 2,
    name: 'Tir précis',
    description: 'Inflige des dégâts modérés',
    cost: 2,
    range_min: 2,
    range_max: 4,
    effects: [
      { type: 'damage', value: 5 } as SpellEffect
    ],
    is_value_percentage: false
  },
  {
    id: 3,
    name: 'Boule de feu',
    description: 'Inflige des dégâts de zone',
    cost: 4,
    range_min: 1,
    range_max: 3,
    effects: [
      { type: 'damage', value: 7 } as SpellEffect,
      { type: 'apply_alteration', value: 1, alteration: 1 } as SpellEffect
    ],
    is_value_percentage: false
  },
  {
    id: 4,
    name: 'Poison',
    description: 'Applique du poison à la cible',
    cost: 2,
    range_min: 1,
    range_max: 2,
    effects: [
      { type: 'apply_alteration', value: 1, alteration: 2 } as SpellEffect
    ],
    is_value_percentage: false
  }
];

/**
 * Composant de démonstration pour tester le système de résolution des conflits
 * 
 * Ce composant permet de:
 * - Créer des actions simulées
 * - Générer des conflits
 * - Tester différentes stratégies de résolution
 * - Visualiser les résultats
 */
const ConflictResolutionDemo: React.FC = () => {
  // Initialisation du service de résolution
  const [service] = useState<ActionResolutionService>(
    new ActionResolutionService(ConflictResolutionStrategy.FIFO, 0)
  );
  
  // Instances de cartes pour la démonstration
  const [cardInstances, setCardInstances] = useState<CardInstanceImpl[]>([]);
  
  // Données de configuration
  const [strategy, setStrategy] = useState<ConflictResolutionStrategy>(ConflictResolutionStrategy.FIFO);
  const [randomChance, setRandomChance] = useState<number>(0);
  
  // Actions et résultats
  const [executedActions, setExecutedActions] = useState<PlannedAction[]>([]);
  const [message, setMessage] = useState<string>('');
  
  // Données pour l'affichage
  const [conflictInfo, setConflictInfo] = useState<{
    conflicts: any[];
    resolutions: any[];
  }>({ conflicts: [], resolutions: [] });
  
  // Initialisation des données de démonstration
  useEffect(() => {
    initDemoData();
  }, []);
  
  /**
   * Initialise les données de démonstration
   */
  const initDemoData = () => {
    const mockCards = createMockCards();
    const instances = mockCards.map(card => {
      const instance = new CardInstanceImpl(card);
      instance.temporaryStats.motivation = 10; // Ajouter la motivation pour les tests
      return instance;
    });
    
    setCardInstances(instances);
    
    // Réinitialiser le service
    service.setConflictStrategy(ConflictResolutionStrategy.FIFO);
    service.setRandomResolutionChance(0);
    setStrategy(ConflictResolutionStrategy.FIFO);
    setRandomChance(0);
    
    setMessage('Système initialisé. Vous pouvez maintenant créer des actions pour tester la résolution des conflits.');
  };
  
  /**
   * Met à jour la stratégie de résolution des conflits
   */
  const handleStrategyChange = (newStrategy: ConflictResolutionStrategy) => {
    service.setConflictStrategy(newStrategy);
    setStrategy(newStrategy);
    setMessage(`Stratégie de résolution changée pour: ${newStrategy}`);
  };
  
  /**
   * Met à jour la probabilité de résolution aléatoire
   */
  const handleRandomChanceChange = (newChance: number) => {
    service.setRandomResolutionChance(newChance);
    setRandomChance(newChance);
    setMessage(`Probabilité aléatoire définie à ${newChance}%`);
  };
  
  /**
   * Crée des actions qui génèrent des conflits de ressources
   */
  const createResourceConflict = () => {
    if (cardInstances.length < 2) {
      setMessage('Pas assez de cartes disponibles pour créer un conflit');
      return;
    }
    
    const source = cardInstances[0];
    const target1 = cardInstances[1];
    const target2 = cardInstances[2];
    const spells = createMockSpells();
    
    // Créer deux actions de sort coûteuses qui partagent la même source
    service.planAction({
      type: ActionType.CAST_SPELL,
      source,
      targets: [target1],
      spell: spells[2], // Boule de feu (coût: 4)
      priority: 2,
      cost: 7, // Coût élevé
    });
    
    service.planAction({
      type: ActionType.CAST_SPELL,
      source, // Même source
      targets: [target2],
      spell: spells[0], // Frappe puissante (coût: 3)
      priority: 1,
      cost: 6, // Coût élevé
    });
    
    updateConflictInfo();
    setMessage('Conflit de ressources créé: deux actions coûteuses pour la même source.');
  };
  
  /**
   * Crée des actions qui génèrent des conflits d'exclusivité
   */
  const createExclusivityConflict = () => {
    if (cardInstances.length < 3) {
      setMessage('Pas assez de cartes disponibles pour créer un conflit');
      return;
    }
    
    const source1 = cardInstances[0];
    const source2 = cardInstances[1];
    const target = cardInstances[2]; // Même cible
    const spells = createMockSpells();
    
    // Créer deux actions de sort avec des altérations sur la même cible
    service.planAction({
      type: ActionType.CAST_SPELL,
      source: source1,
      targets: [target],
      spell: spells[3], // Poison
      priority: 2,
      cost: 2,
    });
    
    service.planAction({
      type: ActionType.CAST_SPELL,
      source: source2,
      targets: [target], // Même cible
      spell: spells[2], // Boule de feu (avec altération)
      priority: 3,
      cost: 4,
    });
    
    updateConflictInfo();
    setMessage('Conflit d\'exclusivité créé: deux altérations appliquées à la même cible.');
  };
  
  /**
   * Crée des actions qui génèrent des conflits de ciblage
   */
  const createTargetingConflict = () => {
    if (cardInstances.length < 3) {
      setMessage('Pas assez de cartes disponibles pour créer un conflit');
      return;
    }
    
    const source1 = cardInstances[0];
    const source2 = cardInstances[1];
    const target = cardInstances[2]; // Même cible
    
    // Créer deux actions d'attaque sur la même cible
    service.planAction({
      type: ActionType.ATTACK,
      source: source1,
      targets: [target],
      priority: 1,
      cost: 1,
    });
    
    service.planAction({
      type: ActionType.ATTACK,
      source: source2,
      targets: [target], // Même cible
      priority: 2,
      cost: 1,
    });
    
    updateConflictInfo();
    setMessage('Conflit de ciblage créé: deux attaques sur la même cible.');
  };
  
  /**
   * Crée toutes les actions de démonstration d'un coup
   */
  const createAllDemoActions = () => {
    clearActions();
    createResourceConflict();
    createExclusivityConflict();
    createTargetingConflict();
    setMessage('Tous les types de conflits ont été créés.');
  };
  
  /**
   * Résout toutes les actions et affiche les résultats
   */
  const resolveActions = () => {
    const executed: PlannedAction[] = [];
    
    // Résoudre les actions
    service.resolveActions((action) => {
      executed.push(action);
    });
    
    setExecutedActions(executed);
    setMessage(`${executed.length} action(s) exécutée(s), les conflits ont été résolus selon la stratégie ${strategy}.`);
    
    // Réinitialiser les données de conflit car les actions ont été résolues
    setConflictInfo({ conflicts: [], resolutions: [] });
  };
  
  /**
   * Efface toutes les actions planifiées
   */
  const clearActions = () => {
    // Récupérer toutes les actions
    const actions = service.getPlannedActions();
    
    // Annuler chaque action
    actions.forEach(action => {
      service.cancelAction(action.id);
    });
    
    setExecutedActions([]);
    setConflictInfo({ conflicts: [], resolutions: [] });
    setMessage('Toutes les actions ont été effacées.');
  };
  
  /**
   * Met à jour les informations de conflit pour l'affichage
   */
  const updateConflictInfo = () => {
    const info = service.getConflictInfo();
    setConflictInfo({
      conflicts: info.conflicts,
      resolutions: info.resolutions
    });
  };
  
  /**
   * Renvoie un résumé d'une action pour l'affichage
   */
  const getActionSummary = (action: PlannedAction): string => {
    const actionType = action.type === ActionType.CAST_SPELL 
      ? `Sort: ${action.spell?.name || 'Inconnu'}`
      : action.type;
      
    const sourceName = action.source.cardDefinition.name;
    const targetNames = action.targets.map(t => t.cardDefinition.name).join(', ');
    
    return `${actionType} | ${sourceName} → ${targetNames} | Priorité: ${action.priority} | Coût: ${action.cost}`;
  };
  
  return (
    <div className="conflict-resolution-demo">
      <Typography variant="h4" component="h1" gutterBottom>
        Démonstration du Système de Résolution des Conflits
      </Typography>
      
      {/* Panneau de configuration */}
      <ConflictResolutionManager
        currentStrategy={strategy}
        randomChance={randomChance}
        conflicts={conflictInfo.conflicts}
        resolutions={conflictInfo.resolutions}
        onStrategyChange={handleStrategyChange}
        onRandomChanceChange={handleRandomChanceChange}
      />
      
      {/* Actions de démonstration */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Actions de démonstration
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              fullWidth
              startIcon={<AddIcon />}
              onClick={createResourceConflict}
            >
              Conflit de ressources
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              fullWidth
              startIcon={<AddIcon />}
              onClick={createExclusivityConflict}
            >
              Conflit d'exclusivité
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              fullWidth
              startIcon={<AddIcon />}
              onClick={createTargetingConflict}
            >
              Conflit de ciblage
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              color="primary"
              fullWidth
              startIcon={<AddIcon />}
              onClick={createAllDemoActions}
            >
              Tous les conflits
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            color="success"
            startIcon={<PlayArrowIcon />}
            onClick={resolveActions}
            sx={{ mr: 1 }}
          >
            Résoudre les actions
          </Button>
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<DeleteIcon />}
            onClick={clearActions}
            sx={{ mr: 1 }}
          >
            Effacer les actions
          </Button>
          <Button 
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={initDemoData}
          >
            Réinitialiser
          </Button>
        </Box>
      </Paper>
      
      {/* Message */}
      {message && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
      
      {/* Actions exécutées */}
      {executedActions.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Actions exécutées ({executedActions.length})
          </Typography>
          
          <Box component="ul" sx={{ pl: 2 }}>
            {executedActions.map((action, index) => (
              <Box component="li" key={index} sx={{ mb: 1 }}>
                {getActionSummary(action)}
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </div>
  );
};

export default ConflictResolutionDemo; 