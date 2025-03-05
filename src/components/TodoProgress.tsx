import React, { useEffect, useState } from 'react';
import './TodoProgress.css';

interface PriorityProgress {
  completed: number;
  total: number;
}

interface TodoProgressState {
  critical: PriorityProgress;
  high: PriorityProgress;
  medium: PriorityProgress;
  low: PriorityProgress;
  total: PriorityProgress;
}

const initialProgressState: TodoProgressState = {
  critical: { completed: 0, total: 0 },
  high: { completed: 0, total: 0 },
  medium: { completed: 0, total: 0 },
  low: { completed: 0, total: 0 },
  total: { completed: 0, total: 0 }
};

const priorityEmojis = {
  critical: '🔥',
  high: '🚀',
  medium: '⚡',
  low: '🌱'
};

const TodoProgress: React.FC = () => {
  const [todoProgress, setTodoProgress] = useState<TodoProgressState>(initialProgressState);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    const fetchTodoContent = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/TODO.md`);
        if (!response.ok) {
          throw new Error(`Impossible de charger TODO.md`);
        }
        const text = await response.text();
        calculateTodoProgress(text);
      } catch (error) {
        console.error(`Erreur lors du chargement de TODO.md:`, error);
      }
    };

    const calculateTodoProgress = (todoContent: string) => {
      // Réinitialiser les compteurs
      const progress: TodoProgressState = {
        critical: { completed: 0, total: 0 },
        high: { completed: 0, total: 0 },
        medium: { completed: 0, total: 0 },
        low: { completed: 0, total: 0 },
        total: { completed: 0, total: 0 }
      };

      // Extraire les lignes du contenu
      const lines = todoContent.split('\n');

      // Parcourir chaque ligne
      for (const line of lines) {
        // Ignorer les lignes qui ne sont pas des tâches
        if (!line.trim().startsWith('- [')) continue;

        // Vérifier si la tâche est complétée
        const isCompleted = line.includes('- [x]');
        
        // Déterminer la priorité
        let priority: keyof Omit<TodoProgressState, 'total'> = 'medium'; // Par défaut
        
        if (line.includes('🔥')) {
          priority = 'critical';
        } else if (line.includes('🚀')) {
          priority = 'high';
        } else if (line.includes('⚡')) {
          priority = 'medium';
        } else if (line.includes('🌱')) {
          priority = 'low';
        }

        // Incrémenter les compteurs appropriés
        progress[priority].total++;
        progress.total.total++;
        
        if (isCompleted) {
          progress[priority].completed++;
          progress.total.completed++;
        }
      }

      setTodoProgress(progress);
    };

    fetchTodoContent();
  }, []);

  // Calculer les pourcentages de progression
  const getProgressPercentage = (completed: number, total: number): number => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const progressPercentages = {
    critical: getProgressPercentage(todoProgress.critical.completed, todoProgress.critical.total),
    high: getProgressPercentage(todoProgress.high.completed, todoProgress.high.total),
    medium: getProgressPercentage(todoProgress.medium.completed, todoProgress.medium.total),
    low: getProgressPercentage(todoProgress.low.completed, todoProgress.low.total),
    total: getProgressPercentage(todoProgress.total.completed, todoProgress.total.total)
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`todo-progress-container ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="todo-progress-header" onClick={toggleExpanded}>
        <div className="todo-progress-text">
          {progressPercentages.total}% terminé
        </div>
        <div className="todo-progress-details">
          {todoProgress.total.completed}/{todoProgress.total.total} tâches
        </div>
        <div className="expand-button">
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      <div className="todo-progress-indicator">
        <div className="todo-progress-bar">
          <div 
            className="todo-progress-completed" 
            style={{ width: `${progressPercentages.total}%` }}
          ></div>
        </div>
      </div>

      {expanded && (
        <div className="todo-progress-by-priority">
          {(Object.keys(priorityEmojis) as Array<keyof typeof priorityEmojis>).map(priority => (
            <div className="priority-progress" key={priority}>
              <div className="priority-header">
                <div className="priority-emoji">{priorityEmojis[priority]}</div>
                <div className="priority-percentage">
                  {progressPercentages[priority]}%
                </div>
                <div className="priority-details">
                  {todoProgress[priority].completed}/{todoProgress[priority].total}
                </div>
              </div>
              <div className="todo-progress-bar">
                <div 
                  className={`todo-progress-completed ${priority}`} 
                  style={{ width: `${progressPercentages[priority]}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoProgress; 