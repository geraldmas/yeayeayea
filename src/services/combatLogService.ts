import { TagRuleApplicationResult } from '../types/rules';
import { CardInstance } from '../types/combat';

export interface CombatLogEvent {
  message: string;
  result: TagRuleApplicationResult;
  targetCardId: string;
  timestamp: number;
}

type Listener = (event: CombatLogEvent) => void;

class CombatLogService {
  private listeners: Listener[] = [];
  public enabled: boolean;

  constructor() {
    this.enabled =
      process.env.NODE_ENV !== 'production' &&
      process.env.REACT_APP_ENABLE_COMBAT_LOGS !== 'false';
  }

  on(listener: Listener) {
    this.listeners.push(listener);
  }

  off(listener: Listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private emit(event: CombatLogEvent) {
    if (!this.enabled) return;
    this.listeners.forEach(l => l(event));
  }

  logTagRule(result: TagRuleApplicationResult, target: CardInstance) {
    const message = `Tag '${result.sourceTag}' \u2192 ${result.effectDescription}`;
    this.emit({ message, result, targetCardId: target.instanceId, timestamp: Date.now() });
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const combatLogService = new CombatLogService();
