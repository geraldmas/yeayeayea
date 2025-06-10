import React, { useEffect, useState } from 'react';
import { TextField, Button, Grid } from '@mui/material';
import { gameConfigService } from '../utils/dataService';
import { InfoTooltip } from './ui';

interface ConfigValues {
  [key: string]: number;
}

const CONFIG_KEYS = [
  'max_personnages',
  'emplacements_objet',
  'budget_motivation_initial',
  'pv_base_initial'
];

const TOOLTIPS: Record<string, string> = {
  max_personnages: 'Nombre maximum de personnages simultanés sur le terrain',
  emplacements_objet: "Nombre d'emplacements disponibles pour les objets",
  budget_motivation_initial: 'Motivation de départ pour chaque joueur',
  pv_base_initial: 'Points de vie initiaux de la base des joueurs'
};

const DebugPanel: React.FC = () => {
  const [values, setValues] = useState<ConfigValues>({});
  const [inputs, setInputs] = useState<ConfigValues>({});

  const loadConfigs = async () => {
    try {
      const configs = await gameConfigService.getAll();
      const result: ConfigValues = {};
      configs.forEach(cfg => {
        if (CONFIG_KEYS.includes(cfg.key)) {
          const raw = cfg.value as any;
          const val = raw && typeof raw === 'object' && 'value' in raw ? raw.value : raw;
          result[cfg.key] = Number(val);
        }
      });
      setValues(result);
      setInputs(result);
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleChange = (key: string, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (key: string) => {
    try {
      await gameConfigService.update(key, { value: inputs[key] });
      await loadConfigs();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  return (
    <div className="debug-panel">
      <h2>Configuration du jeu</h2>
      <Grid container spacing={2}>
        {CONFIG_KEYS.map(key => (
          <Grid item xs={12} md={6} key={key}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label={key}
                type="number"
                value={inputs[key] ?? ''}
                onChange={e => handleChange(key, Number(e.target.value))}
              />
              {TOOLTIPS[key] && <InfoTooltip title={TOOLTIPS[key]} />}
            </div>
            <Button
              variant="contained"
              onClick={() => handleSubmit(key)}
              sx={{ mt: 1 }}
            >
              Valider
            </Button>
            <div style={{ marginTop: '0.5rem' }}>Valeur actuelle: {values[key]}</div>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default DebugPanel;
