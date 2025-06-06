import React, { useEffect, useState } from 'react';
import { ConflictResolutionManager } from './index';
import { ConflictResolutionStrategy } from '../services/actionResolutionService';
import { gameConfigService } from '../utils/dataService';

const DEFAULT_STRATEGY = ConflictResolutionStrategy.FIFO;
const DEFAULT_RANDOM = 0;

const ConflictSettingsPage: React.FC = () => {
  const [strategy, setStrategy] = useState<ConflictResolutionStrategy>(DEFAULT_STRATEGY);
  const [randomChance, setRandomChance] = useState<number>(DEFAULT_RANDOM);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await gameConfigService.getValue<string>('conflict_strategy');
        const r = await gameConfigService.getValue<number>('conflict_random_chance');
        if (s) {
          setStrategy(s as ConflictResolutionStrategy);
        }
        if (r !== null && r !== undefined) {
          setRandomChance(r);
        }
      } catch (err) {
        console.error('Erreur chargement config conflit:', err);
      }
    };
    load();
  }, []);

  const handleStrategyChange = async (newStrategy: ConflictResolutionStrategy) => {
    setStrategy(newStrategy);
    try {
      await gameConfigService.update('conflict_strategy', { value: newStrategy });
    } catch (err) {
      console.error('Erreur maj stratégie:', err);
    }
  };

  const handleRandomChange = async (chance: number) => {
    setRandomChance(chance);
    try {
      await gameConfigService.update('conflict_random_chance', { value: chance });
    } catch (err) {
      console.error('Erreur maj probabilité:', err);
    }
  };

  return (
    <ConflictResolutionManager
      currentStrategy={strategy}
      randomChance={randomChance}
      onStrategyChange={handleStrategyChange}
      onRandomChanceChange={handleRandomChange}
      conflicts={[]}
      resolutions={[]}
    />
  );
};

export default ConflictSettingsPage;
