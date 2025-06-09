import { getById, getByIds } from '../../utils/spellService';
import { mockSupabase } from '../mocks/supabase';
import { setupMockFrom } from '../utils/testUtils';

const mockFrom = mockSupabase.from as jest.Mock;

describe('spellService util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getById returns spell data', async () => {
    const { mock: fromMock, helpers } = setupMockFrom();
    const spell = { id: 1, name: 'fire', effects: '[]' };
    helpers.mockSingleSuccess(spell);
    mockFrom.mockImplementation(() => fromMock());

    const result = await getById(1);
    expect(mockFrom).toHaveBeenCalledWith('spells');
    expect(result).toEqual(spell);
  });

  it('getByIds returns list of spells', async () => {
    const spells = [{ id:1, effects:'[]' }, { id:2, effects:'[]' }];
    const selectMock = jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue({ data: spells, error: null }) });
    mockFrom.mockReturnValue({ select: selectMock } as any);

    const result = await getByIds([{ spell_id: 1 }, { spell_id: 2 }]);
    expect(selectMock).toHaveBeenCalled();
    expect(result).toEqual(spells);
  });
});
