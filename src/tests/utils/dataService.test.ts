import { joinTableService } from '../../utils/dataService';
import { mockSupabase } from '../mocks/supabase';

const mockFrom = mockSupabase.from as jest.Mock;

describe('dataService joinTableService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getTagsByCardId returns tag ids', async () => {
    const selectMock = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [{ tag_id: 1 }], error: null }) });
    mockFrom.mockReturnValue({ select: selectMock } as any);

    const result = await joinTableService.getTagsByCardId(1);
    expect(mockFrom).toHaveBeenCalledWith('card_tags');
    expect(result).toEqual([{ tag_id: 1 }]);
  });

  it('getSpellsByCardId returns spell ids', async () => {
    const selectMock = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [{ spell_id: 2 }], error: null }) });
    mockFrom.mockReturnValue({ select: selectMock } as any);

    const result = await joinTableService.getSpellsByCardId(1);
    expect(mockFrom).toHaveBeenCalledWith('card_spells');
    expect(result).toEqual([{ spell_id: 2 }]);
  });
});
