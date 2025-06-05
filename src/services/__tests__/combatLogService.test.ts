import { combatLogService } from '../combatLogService';
import { TagRuleApplicationResult } from '../../types/rules';
import { CardInstance } from '../../types/combat';

describe('combatLogService', () => {
  const sampleResult: TagRuleApplicationResult = {
    success: true,
    sourceTag: 'FIRE',
    affectedEntities: ['x'],
    effectDescription: 'burns',
    originalValue: 1,
    newValue: 2
  };

  const target: CardInstance = { instanceId: 'card1' } as unknown as CardInstance;

  beforeEach(() => {
    combatLogService.setEnabled(true);
  });

  afterEach(() => {
    combatLogService.setEnabled(true);
  });

  test('should notify listeners when enabled', () => {
    const listener = jest.fn();
    combatLogService.on(listener);

    combatLogService.logTagRule(sampleResult, target);

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0];
    expect(event.result).toBe(sampleResult);
    expect(event.targetCardId).toBe('card1');
    combatLogService.off(listener);
  });

  test('should not notify listeners when disabled', () => {
    const listener = jest.fn();
    combatLogService.on(listener);
    combatLogService.setEnabled(false);

    combatLogService.logTagRule(sampleResult, target);

    expect(listener).not.toHaveBeenCalled();
    combatLogService.off(listener);
  });

  test('off should remove listener', () => {
    const listener = jest.fn();
    combatLogService.on(listener);
    combatLogService.off(listener);

    combatLogService.logTagRule(sampleResult, target);
    expect(listener).not.toHaveBeenCalled();
  });
});
