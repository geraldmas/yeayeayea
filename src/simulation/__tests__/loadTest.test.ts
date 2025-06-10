import { jest } from '@jest/globals';

jest.mock('../gameSimulator', () => ({
  simulateGame: jest.fn(() => Promise.resolve({ winner: 'a', turns: 1 }))
}));

import { runLoadTest } from '../loadTest';
import { simulateGame } from '../gameSimulator';

describe('runLoadTest', () => {
  it('appelle simulateGame le nombre requis de fois', async () => {
    const result = await runLoadTest({ iterations: 5, deckId: 'a', opponentDeckId: 'b' });
    expect((simulateGame as jest.Mock).mock.calls.length).toBe(5);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
