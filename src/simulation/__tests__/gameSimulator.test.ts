import { jest } from '@jest/globals';
jest.mock('../../utils/dataService', () => ({
  simulationResultsService: {
    create: jest.fn(() => Promise.resolve({}))
  }
}));

import { simulateGame } from '../gameSimulator';
import { simulationResultsService } from '../../utils/dataService';

const { simulationResultsService: mockedService } = jest.requireMock('../../utils/dataService') as {
  simulationResultsService: { create: jest.Mock }
};

describe('simulateGame', () => {
  it('enregistre le resultat dans simulationResultsService', async () => {
    await simulateGame({ deckId: 'deck1', opponentDeckId: 'deck2' });
    expect(mockedService.create).toHaveBeenCalledTimes(1);
  });
});
