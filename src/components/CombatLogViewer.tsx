import React, { useEffect, useState } from 'react';
import { combatLogService, CombatLogEvent } from '../services/combatLogService';
import './CombatLogViewer.css';
import { Tooltip, Snackbar, Alert, FormControlLabel, Switch } from '@mui/material';

const CombatLogViewer: React.FC = () => {
  const [events, setEvents] = useState<CombatLogEvent[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(
    localStorage.getItem('showCombatLogNotifications') !== 'false'
  );
  const [notification, setNotification] = useState<CombatLogEvent | null>(null);

  useEffect(() => {
    const handler = (event: CombatLogEvent) => {
      setEvents(prev => [...prev, event].slice(-20));
      if (showNotifications) {
        setNotification(event);
      }
    };
    combatLogService.on(handler);
    return () => combatLogService.off(handler);
  }, [showNotifications]);

  useEffect(() => {
    localStorage.setItem(
      'showCombatLogNotifications',
      showNotifications ? 'true' : 'false'
    );
  }, [showNotifications]);

  if (!combatLogService.enabled) return null;

  return (
    <div className="combat-log-viewer">
      <h4>Actions récentes</h4>
      <FormControlLabel
        control={
          <Switch
            checked={showNotifications}
            onChange={e => setShowNotifications(e.target.checked)}
          />
        }
        label="Notifications"
      />
      <ul>
        {events.map((e, idx) => (
          <li key={idx}>
            <Tooltip title={e.result.effectDescription} arrow>
              <span>{e.message}</span>
            </Tooltip>
          </li>
        ))}
      </ul>
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity="info"
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CombatLogViewer;
