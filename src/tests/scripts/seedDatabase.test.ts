import { seedService } from '../../utils/seedService';
import { main } from '../../scripts/seedDatabase';

jest.mock('../../utils/seedService', () => ({
  seedService: {
    seedAll: jest.fn()
  }
}));

describe('seedDatabase script', () => {
  const originalLog = console.log;
  const originalError = console.error;
  const exitMock = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    (seedService.seedAll as jest.Mock).mockReset();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    exitMock.mockClear();
  });

  afterAll(() => {
    exitMock.mockRestore();
  });

  it('runs seed successfully', async () => {
    (seedService.seedAll as jest.Mock).mockResolvedValue(undefined);
    await main();
    expect(seedService.seedAll).toHaveBeenCalled();
  });

  it('handles errors', async () => {
    (seedService.seedAll as jest.Mock).mockRejectedValue(new Error('boom'));
    await main();
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
