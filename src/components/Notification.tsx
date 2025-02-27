import React, { useState, useEffect } from 'react';

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

  const baseClass = `notification ${type} ${isClosing ? 'closing' : ''}`;

  return (
    <div className={baseClass}>
      <div className="notification-content">
        {message}
      </div>
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

// Ajout d'une exportation vide pour s'assurer que le fichier est traité comme un module
export {};