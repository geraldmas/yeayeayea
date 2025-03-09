import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Slider, 
  Card, 
  CardContent, 
  Grid, 
  Paper, 
  Divider, 
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  SelectChangeEvent
} from '@mui/material';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { 
  ConflictResolutionStrategy, 
  ActionType,
  ConflictDetails, 
  ConflictResolution 
} from '../services/actionResolutionService';

import './ConflictResolutionManager.css';

/**
 * Props pour le composant ConflictResolutionManager
 */
interface ConflictResolutionManagerProps {
  /**
   * Stratégie de résolution actuelle
   */
  currentStrategy: ConflictResolutionStrategy;
  
  /**
   * Probabilité d'utiliser l'aléatoire pour résoudre les conflits (0-100)
   */
  randomChance: number;
  
  /**
   * Liste des conflits détectés
   */
  conflicts?: ConflictDetails[];
  
  /**
   * Liste des résolutions appliquées
   */
  resolutions?: ConflictResolution[];
  
  /**
   * Callback appelé lorsque la stratégie est modifiée
   */
  onStrategyChange: (strategy: ConflictResolutionStrategy) => void;
  
  /**
   * Callback appelé lorsque la probabilité aléatoire est modifiée
   */
  onRandomChanceChange: (chance: number) => void;
}

/**
 * Traduit le type d'action en texte français
 * @param type Le type d'action à traduire
 * @returns Traduction en français du type d'action
 */
const getActionTypeLabel = (type: ActionType): string => {
  switch (type) {
    case ActionType.ATTACK:
      return 'Attaque';
    case ActionType.CAST_SPELL:
      return 'Sort';
    case ActionType.USE_ABILITY:
      return 'Capacité';
    case ActionType.USE_ITEM:
      return 'Objet';
    case ActionType.ACTIVATE_EFFECT:
      return 'Effet passif';
    default:
      return 'Action';
  }
};

/**
 * Traduit le type de conflit en texte français
 * @param type Le type de conflit à traduire
 * @returns Traduction en français du type de conflit
 */
const getConflictTypeLabel = (type: string): string => {
  switch (type) {
    case 'resource':
      return 'Ressources';
    case 'exclusivity':
      return 'Exclusivité';
    case 'target':
      return 'Ciblage';
    case 'other':
      return 'Autre';
    default:
      return 'Inconnu';
  }
};

/**
 * Renvoie l'icône appropriée pour un type de conflit
 * @param type Le type de conflit
 * @returns L'élément icône correspondant
 */
const getConflictTypeIcon = (type: string) => {
  switch (type) {
    case 'resource':
      return <AttachMoneyIcon color="warning" />;
    case 'exclusivity':
      return <PriorityHighIcon color="error" />;
    case 'target':
      return <ErrorIcon color="info" />;
    case 'other':
      return <ErrorIcon color="action" />;
    default:
      return <ErrorIcon />;
  }
};

/**
 * Composant pour gérer et visualiser la configuration du système de résolution des conflits
 * 
 * Ce composant permet de:
 * - Sélectionner la stratégie de résolution des conflits
 * - Configurer la probabilité d'utiliser l'aléatoire
 * - Visualiser les conflits détectés et leur résolution
 */
const ConflictResolutionManager: React.FC<ConflictResolutionManagerProps> = ({
  currentStrategy,
  randomChance,
  conflicts = [],
  resolutions = [],
  onStrategyChange,
  onRandomChanceChange
}) => {
  const [strategy, setStrategy] = useState<ConflictResolutionStrategy>(currentStrategy);
  const [randomProbability, setRandomProbability] = useState<number>(randomChance);
  
  // Synchroniser les props avec l'état local
  useEffect(() => {
    setStrategy(currentStrategy);
    setRandomProbability(randomChance);
  }, [currentStrategy, randomChance]);
  
  /**
   * Gestionnaire de changement de stratégie
   */
  const handleStrategyChange = (event: SelectChangeEvent<ConflictResolutionStrategy>) => {
    const newStrategy = event.target.value as ConflictResolutionStrategy;
    setStrategy(newStrategy);
    onStrategyChange(newStrategy);
  };
  
  /**
   * Gestionnaire de changement de probabilité aléatoire
   */
  const handleRandomChange = (_event: Event, newValue: number | number[]) => {
    const newChance = Array.isArray(newValue) ? newValue[0] : newValue;
    setRandomProbability(newChance);
  };
  
  /**
   * Gestionnaire de fin de glissement du slider
   */
  const handleRandomChangeCommitted = (_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
    const newChance = Array.isArray(newValue) ? newValue[0] : newValue;
    onRandomChanceChange(newChance);
  };
  
  /**
   * Renvoie le libellé d'une stratégie de résolution
   */
  const getStrategyLabel = (strategy: ConflictResolutionStrategy): string => {
    switch (strategy) {
      case ConflictResolutionStrategy.FIFO:
        return 'Premier arrivé, premier servi';
      case ConflictResolutionStrategy.LIFO:
        return 'Dernier arrivé, premier servi';
      case ConflictResolutionStrategy.RANDOM:
        return 'Aléatoire';
      case ConflictResolutionStrategy.PRIORITY:
        return 'Par priorité';
      case ConflictResolutionStrategy.COST:
        return 'Par coût (le plus élevé)';
      case ConflictResolutionStrategy.LOW_COST:
        return 'Par coût (le plus faible)';
      default:
        return 'Inconnu';
    }
  };
  
  /**
   * Renvoie une description de la stratégie de résolution
   */
  const getStrategyDescription = (strategy: ConflictResolutionStrategy): string => {
    switch (strategy) {
      case ConflictResolutionStrategy.FIFO:
        return 'Les actions planifiées en premier sont prioritaires en cas de conflit.';
      case ConflictResolutionStrategy.LIFO:
        return 'Les actions planifiées en dernier sont prioritaires en cas de conflit.';
      case ConflictResolutionStrategy.RANDOM:
        return 'En cas de conflit, une action est choisie au hasard.';
      case ConflictResolutionStrategy.PRIORITY:
        return 'Les actions avec la priorité la plus élevée sont exécutées en premier.';
      case ConflictResolutionStrategy.COST:
        return 'Les actions avec le coût le plus élevé sont prioritaires.';
      case ConflictResolutionStrategy.LOW_COST:
        return 'Les actions avec le coût le plus faible sont prioritaires.';
      default:
        return 'Stratégie inconnue.';
    }
  };
  
  /**
   * Renvoie l'icône correspondant à une stratégie
   */
  const getStrategyIcon = (strategy: ConflictResolutionStrategy) => {
    switch (strategy) {
      case ConflictResolutionStrategy.FIFO:
      case ConflictResolutionStrategy.LIFO:
        return <ScheduleIcon />;
      case ConflictResolutionStrategy.RANDOM:
        return <ShuffleIcon />;
      case ConflictResolutionStrategy.PRIORITY:
        return <PriorityHighIcon />;
      case ConflictResolutionStrategy.COST:
      case ConflictResolutionStrategy.LOW_COST:
        return <AttachMoneyIcon />;
      default:
        return <ErrorIcon />;
    }
  };
  
  /**
   * Résumé d'une action pour l'affichage
   */
  const getActionSummary = (action: any) => {
    return `${getActionTypeLabel(action.type)} de ${action.source.cardDefinition.name} ${action.targets.length > 0 ? `→ ${action.targets[0].cardDefinition.name}${action.targets.length > 1 ? ` (+${action.targets.length - 1})` : ''}` : ''}`;
  };
  
  return (
    <div className="conflict-resolution-manager">
      <Typography variant="h5" component="h2" gutterBottom>
        Système de Résolution des Conflits
      </Typography>
      
      <Grid container spacing={3}>
        {/* Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Stratégie de résolution</InputLabel>
                <Select
                  value={strategy}
                  onChange={handleStrategyChange}
                  label="Stratégie de résolution"
                >
                  {Object.values(ConflictResolutionStrategy).map((s) => (
                    <MenuItem key={s} value={s}>
                      {getStrategyLabel(s)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ mt: 3 }}>
                <Typography gutterBottom>
                  Probabilité de résolution aléatoire: {randomProbability}%
                </Typography>
                <Slider
                  value={randomProbability}
                  onChange={handleRandomChange}
                  onChangeCommitted={handleRandomChangeCommitted}
                  aria-labelledby="random-chance-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                />
                <Typography variant="body2" color="text.secondary">
                  Cette valeur définit la probabilité qu'un conflit soit résolu aléatoirement, ignorant la stratégie choisie.
                </Typography>
              </Box>
              
              <Paper sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getStrategyIcon(strategy)}
                  <Typography variant="subtitle1" sx={{ ml: 1 }}>
                    {getStrategyLabel(strategy)}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {getStrategyDescription(strategy)}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Conflits détectés */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conflits détectés ({conflicts.length})
              </Typography>
              
              {conflicts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Aucun conflit détecté pour l'instant.
                </Typography>
              ) : (
                <List>
                  {conflicts.map((conflict, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <Divider variant="inset" component="li" />}
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          {getConflictTypeIcon(conflict.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="subtitle1">
                                Conflit de {getConflictTypeLabel(conflict.type)}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={`ID ${index + 1}`} 
                                sx={{ ml: 1 }} 
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {conflict.reason}
                              </Typography>
                              <Typography variant="body2" component="div">
                                <strong>Action 1:</strong> {getActionSummary(conflict.action1)}<br />
                                <strong>Action 2:</strong> {getActionSummary(conflict.action2)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
          
          {/* Résolutions */}
          {resolutions.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Résolutions appliquées ({resolutions.length})
                </Typography>
                
                <List>
                  {resolutions.map((resolution, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <Divider variant="inset" component="li" />}
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="subtitle1">
                                Résolution du conflit {index + 1}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={getConflictTypeLabel(resolution.conflict.type)} 
                                sx={{ ml: 1 }} 
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {resolution.resolution}
                              </Typography>
                              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                                  <Typography variant="body2">
                                    Action conservée: {getActionSummary(
                                      resolution.conflict.action1.id === resolution.keptActionId 
                                        ? resolution.conflict.action1 
                                        : resolution.conflict.action2
                                    )}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CancelIcon color="error" fontSize="small" sx={{ mr: 1 }} />
                                  <Typography variant="body2">
                                    Action annulée: {getActionSummary(
                                      resolution.conflict.action1.id === resolution.cancelledActionId 
                                        ? resolution.conflict.action1 
                                        : resolution.conflict.action2
                                    )}
                                  </Typography>
                                </Box>
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </div>
  );
};

export default ConflictResolutionManager; 