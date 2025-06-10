import { jest } from '@jest/globals';
import { dailyRewardService } from '../../services/dailyRewardService';
import { mockSupabase } from '../mocks/supabase';
import { userService } from '../../utils/userService';

const mockFrom = mockSupabase.from as jest.Mock;

jest.mock('../../utils/userService', () => ({
  userService: {
    updateCurrency: jest.fn()
  }
}));

const mockSelectChain = (properties: any) => {
  const single = jest.fn(async () => ({ data: { properties }, error: null }));
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq, single });
  return { select, eq, single };
};

const mockUpdateChain = () => {
  const single = jest.fn(async () => ({ data: {}, error: null }));
  const select = jest.fn().mockReturnValue({ single });
  const eq = jest.fn().mockReturnValue({ select });
  const update = jest.fn().mockReturnValue({ eq });
  return { update, eq, select, single };
};

describe('dailyRewardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('canClaim returns true when no previous reward', async () => {
    const { select } = mockSelectChain({});
    const { update } = mockUpdateChain();
    mockFrom.mockReturnValue({ select, update });

    const result = await dailyRewardService.canClaim('u1');
    expect(result).toBe(true);
  });

  test('canClaim returns false when reward claimed today', async () => {
    const last = new Date().toISOString();
    const { select } = mockSelectChain({ last_daily_reward: last });
    const { update } = mockUpdateChain();
    mockFrom.mockReturnValue({ select, update });

    const result = await dailyRewardService.canClaim('u1');
    expect(result).toBe(false);
  });

  test('claim updates currency and date when eligible', async () => {
    const last = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
    const { select, single } = mockSelectChain({ last_daily_reward: last });
    const updateChain = mockUpdateChain();
    mockFrom.mockReturnValue({ select, update: updateChain.update });
    (userService.updateCurrency as unknown as jest.Mock).mockImplementation(async () => undefined);

    const result = await dailyRewardService.claim('u1', 5);

    expect(result).toBe(true);
    expect(userService.updateCurrency).toHaveBeenCalledWith('u1', 5);
    expect(updateChain.update).toHaveBeenCalled();
  });
});
