import React, { useState, useEffect } from 'react';
import './Notification.css';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  duration = 3000,
  onClose
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Durée de l'animation
  };

  // Icônes pour les différents types de notification
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`game-notification ${type} ${isClosing ? 'closing' : ''}`}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">{message}</div>
      <button 
        className="notification-close"
        onClick={handleClose}
        aria-label="Fermer la notification"
      >
        ✕
      </button>
    </div>
  );
};

export default Notification; 