import { jest } from '@jest/globals';
import { progressService } from '../progressService';
import { mockSupabase } from '../../tests/mocks/supabase';
import { userService } from '../../utils/userService';

const mockFrom = mockSupabase.from as jest.Mock;

jest.mock('../../utils/userService', () => ({
  userService: {
    unlockAchievement: jest.fn()
  }
}));

const selectBuilder = (data: any) => {
  const single = jest.fn(async () => ({ data, error: null }));
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq, single });
  return { select };
};

const upsertBuilder = (data: any) => {
  const single = jest.fn(async () => ({ data, error: null }));
  const select = jest.fn().mockReturnValue({ single });
  const upsert = jest.fn().mockReturnValue({ select });
  return { upsert };
};

describe('progressService.recordMatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates stats when none exist', async () => {
    const sel = selectBuilder(null);
    const up = upsertBuilder({ user_id: 'u1', wins: 1, losses: 0, card_usage: { '1': 1 } });
    mockFrom
      .mockReturnValueOnce({ select: sel.select })
      .mockReturnValueOnce({ upsert: up.upsert });

    const result = await progressService.recordMatch('u1', [1], true);

    expect(result.wins).toBe(1);
    expect(up.upsert).toHaveBeenCalled();
    expect(userService.unlockAchievement).toHaveBeenCalledWith('u1', 1);
  });

  test('increments existing stats', async () => {
    const sel = selectBuilder({ user_id: 'u1', wins: 2, losses: 0, card_usage: { '1': 1 } });
    const up = upsertBuilder({ user_id: 'u1', wins: 3, losses: 0, card_usage: { '1': 2, '2': 1 } });
    mockFrom
      .mockReturnValueOnce({ select: sel.select })
      .mockReturnValueOnce({ upsert: up.upsert });

    const result = await progressService.recordMatch('u1', [1,2], true);

    expect(result.wins).toBe(3);
    expect(result.card_usage['1']).toBe(2);
    expect(result.card_usage['2']).toBe(1);
  });
});
