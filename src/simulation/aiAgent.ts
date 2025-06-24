export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AiFeedback {
  actions: string[];
}

/**
 * Simule les actions de l'IA pour un nombre de tours donné.
 * Les actions générées dépendent du niveau de difficulté.
 */
export function runAi(turns: number, difficulty: Difficulty = 'medium'): AiFeedback {
  const actions: string[] = [];
  const actionSets: Record<Difficulty, string[]> = {
    easy: ['passe son tour', 'joue une carte faible', 'se défend'],
    medium: ['attaque', 'lance un sort', 'se défend'],
    hard: ['attaque agressivement', 'lance un sort puissant', 'optimise sa défense']
  };

  for (let t = 1; t <= turns; t++) {
    const set = actionSets[difficulty];
    const action = set[Math.floor(Math.random() * set.length)];
    actions.push(`Tour ${t} : IA ${action}`);
  }

  return { actions };
}

