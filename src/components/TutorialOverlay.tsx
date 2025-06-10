import React, { useState } from 'react';
import './TutorialOverlay.css';

export interface TutorialStep {
  title: string;
  content: string;
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  onFinish?: () => void;
}

/**
 * Overlay guidant l'utilisateur pas à pas pour expliquer les bases du jeu.
 * L'état d'avancement est stocké dans localStorage afin de ne pas répéter
 * le tutoriel une fois terminé.
 */
const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, onFinish }) => {
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    const next = current + 1;
    if (next >= steps.length) {
      localStorage.setItem('tutorialCompleted', 'true');
      if (onFinish) onFinish();
    } else {
      setCurrent(next);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('tutorialCompleted', 'true');
    if (onFinish) onFinish();
  };

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-box">
        <h2>{steps[current].title}</h2>
        <p>{steps[current].content}</p>
        <div className="tutorial-actions">
          <button onClick={handleNext} className="tutorial-next">
            {current === steps.length - 1 ? 'Terminer' : 'Suivant'}
          </button>
          <button onClick={handleSkip} className="tutorial-skip">Ignorer</button>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
