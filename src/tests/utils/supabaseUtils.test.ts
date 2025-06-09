import { updateCardSpells, updateCardTags } from '../../utils/supabaseUtils';
import { mockSupabase } from '../mocks/supabase';
import { setupMockFrom } from '../utils/testUtils';

const mockFrom = mockSupabase.from as jest.Mock;

describe('supabaseUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateCardSpells', () => {
    it('deletes existing relations and inserts new ones', async () => {
      const { mock: fromMock, helpers } = setupMockFrom();
      mockFrom.mockImplementation(() => fromMock());

      await updateCardSpells(1, [2,3]);

      expect(mockFrom).toHaveBeenCalledWith('card_spells');
      expect(helpers.delete).toHaveBeenCalled();
      expect(helpers.insert).toHaveBeenCalled();
    });
  });

  describe('updateCardTags', () => {
    it('deletes existing relations and inserts new ones', async () => {
      const { mock: fromMock, helpers } = setupMockFrom();
      mockFrom.mockImplementation(() => fromMock());

      await updateCardTags(1, [4]);

      expect(mockFrom).toHaveBeenCalledWith('card_tags');
      expect(helpers.delete).toHaveBeenCalled();
      expect(helpers.insert).toHaveBeenCalled();
    });
  });
});
