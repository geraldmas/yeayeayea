import { jest } from '@jest/globals';
import cardCreationService, { PartialCardInput } from '../cardCreationService';
import { mockSupabase } from '../../tests/mocks/supabase';

const mockFrom = mockSupabase.from as jest.Mock;

function setupInsert(returnData: any, isError = false) {
  const single = jest.fn().mockImplementation(() => Promise.resolve({ data: returnData, error: isError ? returnData : null }));
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });
  mockFrom.mockReturnValue({ insert });
  return { insert, select, single };
}

describe('cardCreationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates card and keeps wip when mandatory fields missing', async () => {
    const input: PartialCardInput = { name: 'Test', type: 'personnage', properties: {} };
    const expected = { id: 1, name: 'Test', type: 'personnage', is_wip: true };
    setupInsert(expected);

    const result = await cardCreationService.create(input);
    expect(mockFrom).toHaveBeenCalledWith('cards');
    expect(result.is_wip).toBe(true);
  });

  test('creates card without wip when fields complete', async () => {
    const input: PartialCardInput = { name: 'Ok', type: 'personnage', rarity: 'banger', properties: { health: 5 }, is_wip: false };
    const expected = { id: 2, name: 'Ok', type: 'personnage', rarity: 'banger', properties: { health: 5 }, is_wip: false };
    setupInsert(expected);

    const result = await cardCreationService.create(input);
    expect(result.is_wip).toBe(false);
  });
});
