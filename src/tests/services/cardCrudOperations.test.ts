import { supabase } from '../../utils/supabaseClient';
import { Database } from '../../types/database.types';

// Define a type for the card data, excluding auto-generated fields for inserts
type CardInsert = Database['public']['Tables']['cards']['Insert'];
type CardRow = Database['public']['Tables']['cards']['Row'];

// Mock the Supabase client
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Helper function to set up the mock chain for Supabase calls
const setupMockSupabaseChain = (returnData: any, isError: boolean = false) => {
  const mockEq = jest.fn().mockReturnThis();
  const mockSingle = jest.fn().mockImplementation(() => 
    isError ? Promise.resolve({ data: null, error: returnData }) : Promise.resolve({ data: returnData, error: null })
  );
  const mockSelect = jest.fn().mockReturnValue({ single: mockSingle, eq: mockEq }); // Common methods
  const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
  const mockUpdate = jest.fn().mockReturnValue({ select: mockSelect, eq: mockEq });
  const mockDelete = jest.fn().mockReturnValue({ eq: mockEq }); // Delete might not have select().single() in the same way

  // More flexible mocking for delete which often just returns { error } or { data: null, error: null }
   const mockDeleteChain = jest.fn().mockImplementation(() => 
    isError ? Promise.resolve({ data: null, error: returnData }) : Promise.resolve({ data: [], error: null }) // Supabase delete often returns { data: [], error: null } on success
  );
  
  (supabase.from as jest.Mock).mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: jest.fn().mockReturnValue({eq: mockDeleteChain}), // Use the flexible delete mock
    eq: mockEq, // Allow .eq to be called directly on from() if needed, though less common
    single: mockSingle // Allow .single to be called directly on from() if needed
  });

  // Return individual mocks for more specific assertions if needed
  return { mockSelect, mockInsert, mockUpdate, mockDelete: mockDeleteChain, mockEq, mockSingle };
};


// Mock card data for tests
const mockDate = new Date().toISOString();
const mockCardRow: CardRow = {
  id: 1,
  name: 'Test Card',
  description: 'A card for testing',
  type: 'personnage',
  rarity: 'commun',
  properties: { hp: 10, attack: 5 },
  summon_cost: 3,
  image: null,
  passive_effect: null,
  is_wip: false,
  is_crap: false,
  created_at: mockDate,
  updated_at: mockDate,
};

// Test functions that mimic direct Supabase calls for cards
async function createCard(cardData: CardInsert): Promise<CardRow | null> {
  const { data, error } = await supabase.from('cards').insert(cardData).select().single();
  if (error) {
    console.error('Error creating card:', error);
    throw error;
  }
  return data;
}

async function getCardById(id: number): Promise<CardRow | null> {
  const { data, error } = await supabase.from('cards').select('*').eq('id', id).single();
  if (error) {
    console.error('Error getting card by ID:', error);
    throw error;
  }
  return data;
}

async function updateCard(id: number, updateData: Partial<CardInsert>): Promise<CardRow | null> {
  const { data, error } = await supabase.from('cards').update(updateData).eq('id', id).select().single();
  if (error) {
    console.error('Error updating card:', error);
    throw error;
  }
  return data;
}

async function deleteCard(id: number): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', id);
  if (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
}


describe('Card CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Card', () => {
    const newCardData: CardInsert = {
      name: 'New Test Card',
      description: 'A new card for testing',
      type: 'sort',
      rarity: 'rare',
      properties: { mana_cost: 4 },
      summon_cost: 0, // Assuming 0 for sort type or if not applicable
      is_wip: true,
      is_crap: false,
    };

    it('should create a new card successfully', async () => {
      const createdCard = { ...newCardData, id: 2, created_at: mockDate, updated_at: mockDate };
      const { mockInsert, mockSelect, mockSingle } = setupMockSupabaseChain(createdCard);
      
      const result = await createCard(newCardData);

      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(mockInsert).toHaveBeenCalledWith(newCardData);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(createdCard);
    });

    it('should handle error during card creation', async () => {
      const error = { message: 'Database error', code: '500' };
      const { mockInsert } = setupMockSupabaseChain(error, true);

      await expect(createCard(newCardData)).rejects.toEqual(error);
      
      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(mockInsert).toHaveBeenCalledWith(newCardData);
    });
  });

  describe('Read Card', () => {
    it('should retrieve a card by ID successfully', async () => {
      const { mockSelect, mockEq, mockSingle } = setupMockSupabaseChain(mockCardRow);

      const result = await getCardById(mockCardRow.id);

      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', mockCardRow.id);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockCardRow);
    });

    it('should return null if card not found', async () => {
      const { mockSelect, mockEq, mockSingle } = setupMockSupabaseChain(null);
      const nonExistentId = 999;

      const result = await getCardById(nonExistentId);

      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', nonExistentId);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle error during card retrieval', async () => {
      const error = { message: 'Database error', code: '500' };
      const { mockSelect, mockEq } = setupMockSupabaseChain(error, true);
      const cardId = 1;

      await expect(getCardById(cardId)).rejects.toEqual(error);

      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', cardId);
    });
  });

  describe('Update Card', () => {
    const cardIdToUpdate = 1;
    const updateData: Partial<CardInsert> = {
      name: 'Updated Test Card',
      is_wip: true,
    };
    const updatedCardRow: CardRow = {
      ...mockCardRow,
      ...updateData,
      updated_at: new Date().toISOString(), // Should be a new timestamp
    };

    it('should update an existing card successfully', async () => {
      const { mockUpdate, mockEq, mockSelect, mockSingle } = setupMockSupabaseChain(updatedCardRow);

      const result = await updateCard(cardIdToUpdate, updateData);

      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
      expect(mockEq).toHaveBeenCalledWith('id', cardIdToUpdate);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(updatedCardRow);
      expect(result?.name).toBe(updateData.name);
      expect(result?.is_wip).toBe(updateData.is_wip);
    });

    it('should handle updating a non-existent card (e.g., return null or specific error)', async () => {
      // Supabase update on non-existent ID usually returns data as null without error if no rows match
      const { mockUpdate, mockEq } = setupMockSupabaseChain(null); 
      const nonExistentId = 999;

      const result = await updateCard(nonExistentId, updateData);

      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
      expect(mockEq).toHaveBeenCalledWith('id', nonExistentId);
      expect(result).toBeNull();
    });
    
    it('should handle error during card update', async () => {
      const error = { message: 'Database error', code: '500' };
      const { mockUpdate, mockEq } = setupMockSupabaseChain(error, true);

      await expect(updateCard(cardIdToUpdate, updateData)).rejects.toEqual(error);

      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
      expect(mockEq).toHaveBeenCalledWith('id', cardIdToUpdate);
    });
  });

  describe('Delete Card', () => {
    const cardIdToDelete = 1;

    it('should delete a card successfully', async () => {
      // Successful delete returns { data: [], error: null } or just no error
      const { mockDelete } = setupMockSupabaseChain(null); // No error means success

      await expect(deleteCard(cardIdToDelete)).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(mockDelete).toHaveBeenCalledWith('id', cardIdToDelete);
    });

    it('should handle deleting a non-existent card (e.g., no error thrown)', async () => {
      // Supabase delete on non-existent ID also typically returns no error
      const { mockDelete } = setupMockSupabaseChain(null);
      const nonExistentId = 999;

      await expect(deleteCard(nonExistentId)).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(mockDelete).toHaveBeenCalledWith('id', nonExistentId);
    });

    it('should handle error during card deletion', async () => {
      const error = { message: 'Database error', code: '500' };
      const { mockDelete } = setupMockSupabaseChain(error, true);

      await expect(deleteCard(cardIdToDelete)).rejects.toEqual(error);

      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(mockDelete).toHaveBeenCalledWith('id', cardIdToDelete);
    });
  });
});
