import { jest } from '@jest/globals';

jest.useFakeTimers();

jest.mock('../../simulation/gameSimulator', () => ({
  simulateGame: jest.fn(() => Promise.resolve({ winner: 'a', turns: 1 }))
}));

import { aiTrainingService } from '../aiTrainingService';
import { simulateGame } from '../../simulation/gameSimulator';

describe('aiTrainingService', () => {
  afterEach(() => {
    aiTrainingService.stop();
    jest.clearAllTimers();
  });

  it('appelle simulateGame à intervalle régulier', async () => {
    aiTrainingService.start({ deckPairs: [{ deckId: 'a', opponentDeckId: 'b' }], intervalMs: 1000 });

    expect(simulateGame).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(simulateGame).toHaveBeenCalledWith({ deckId: 'a', opponentDeckId: 'b', simulationType: 'training' });
  });

  it('stoppe correctement les entraînements', async () => {
    aiTrainingService.start({ deckPairs: [{ deckId: 'a', opponentDeckId: 'b' }], intervalMs: 1000 });

    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    aiTrainingService.stop();

    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect((simulateGame as jest.Mock).mock.calls.length).toBe(1);
  });
});
