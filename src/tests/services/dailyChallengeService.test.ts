import { jest } from '@jest/globals';
import { dailyChallengeService } from '../../services/dailyChallengeService';
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

describe('dailyChallengeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getChallenge creates challenge if none', async () => {
    const { select } = mockSelectChain({});
    const updateChain = mockUpdateChain();
    mockFrom
      .mockReturnValueOnce({ select })
      .mockReturnValueOnce({ update: updateChain.update });

    const challenge = await dailyChallengeService.getChallenge('u1');
    expect(challenge.tasks.length).toBeGreaterThan(0);
    expect(updateChain.update).toHaveBeenCalled();
  });

  test('claimReward gives currency when completed', async () => {
    const challenge = {
      id: 'c1',
      date: new Date().toISOString().slice(0,10),
      tasks: [{ id: 't1', description: 'x', done: true }],
      reward: 5,
      claimed: false
    };
    const { select } = mockSelectChain({ daily_challenge: challenge });
    const updateChain = mockUpdateChain();
    mockFrom.mockReturnValue({ select, update: updateChain.update });
    (userService.updateCurrency as unknown as jest.Mock).mockImplementation(async () => undefined);

    const result = await dailyChallengeService.claimReward('u1');

    expect(result).toBe(true);
    expect(userService.updateCurrency).toHaveBeenCalledWith('u1', challenge.reward);
    expect(updateChain.update).toHaveBeenCalled();
  });
});
