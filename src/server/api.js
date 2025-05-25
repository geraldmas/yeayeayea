// API endpoints for the Yeayeayea
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const router = express.Router();

/**
 * Check user endpoint - Retrieves user info from the database
 * Used for debugging authentication issues
 */
router.get('/check-user', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter'
      });
    }
    
    // Get user from database
    const { data, error } = await supabase
      .from('users')
      .select('id, username, is_admin, properties, created_at, last_login')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking user:', error);
      return res.status(500).json({
        error: 'Failed to check user',
        details: error.message
      });
    }
    
    if (!data) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    // Return user info (excluding sensitive data)
    return res.json({
      user: {
        id: data.id,
        username: data.username,
        is_admin: data.is_admin,
        properties: data.properties,
        created_at: data.created_at,
        last_login: data.last_login
      },
      message: 'User found'
    });
    
  } catch (err) {
    console.error('Unexpected error checking user:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

module.exports = router;

// Helper function to validate existence of IDs in a table
const validateIds = async (ids, tableName, idColumn = 'id') => {
  if (!ids || ids.length === 0) {
    return { valid: true, missing: [] };
  }
  const { data: existingItems, error } = await supabase
    .from(tableName)
    .select(idColumn)
    .in(idColumn, ids);

  if (error) {
    throw error; // Propagate DB error
  }

  if (existingItems.length !== ids.length) {
    const existingIds = existingItems.map(item => item[idColumn]);
    const missingIds = ids.filter(id => !existingIds.includes(id));
    return { valid: false, missing: missingIds };
  }
  return { valid: true, missing: [] };
};

// --- Booster Pack Definitions (Hardcoded for now) ---
const boosterPackDefinitions = {
  standard_booster: {
    name: 'Standard Booster',
    contents: [
      { rarity: 'commun', count: 3 },
      { rarity: 'rare', count: 1 },
      { rarity: 'epic_legendary_random', count: 1 }, // Special category for one random epic OR legendary
    ],
    totalCards: 5,
  },
  // Add other booster types here if needed
};

// Helper function to get random cards by rarity and count
const getRandomCardsByRarity = async (rarity, count, excludeIds = []) => {
  let query = supabase.from('cards').select('id, name, rarity, description, properties').eq('rarity', rarity);
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  // Fetch more than needed and shuffle in code to simulate randomness.
  // For very large datasets, a DB function (e.g., using TABLESAMPLE or ordering by a random column) would be more performant.
  const { data, error } = await query.limit(Math.max(count * 5, 10)); // Fetch more to pick from

  if (error) {
    console.error(`Error fetching cards of rarity ${rarity}:`, error);
    throw error;
  }

  if (!data || data.length < count) {
    console.warn(`Not enough cards of rarity ${rarity} available. Requested ${count}, found ${data ? data.length : 0}.`);
    return data || []; // Return what's available; calling function must handle shortages.
  }

  const shuffled = data.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to get random cards from a list of rarities
const getRandomCardsFromRarities = async (rarities, count, excludeIds = []) => {
    let query = supabase.from('cards').select('id, name, rarity, description, properties').in('rarity', rarities);
    if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }
    const { data, error } = await query.limit(Math.max(count * 5, 10)); // Fetch more

    if (error) {
        console.error(`Error fetching cards from rarities ${rarities.join(', ')}:`, error);
        throw error;
    }

    if (!data || data.length < count) {
        console.warn(`Not enough cards from rarities ${rarities.join(', ')} available. Requested ${count}, found ${data ? data.length : 0}.`);
        return data || [];
    }
    const shuffled = data.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};


// --- Cards CRUD Endpoints ---

// POST /api/cards (Create Card)
router.post('/cards', async (req, res) => {
  const { name, description, type, rarity, properties: initialProperties, summon_cost, image, passive_effect, is_wip, is_crap, spell_ids, tag_ids } = req.body;

  // Basic validation
  if (!name || !type || !rarity) {
    return res.status(400).json({ error: 'Missing required fields: name, type, rarity' });
  }

  try {
    // Validate spell_ids
    if (spell_ids && spell_ids.length > 0) {
      const spellValidation = await validateIds(spell_ids, 'spells');
      if (!spellValidation.valid) {
        return res.status(400).json({ error: `Invalid spell IDs provided: ${spellValidation.missing.join(', ')}` });
      }
    }

    // Validate tag_ids
    if (tag_ids && tag_ids.length > 0) {
      const tagValidation = await validateIds(tag_ids, 'tags');
      if (!tagValidation.valid) {
        return res.status(400).json({ error: `Invalid tag IDs provided: ${tagValidation.missing.join(', ')}` });
      }
    }

    // Prepare properties, merging provided spell_ids and tag_ids
    const properties = { ...initialProperties };
    if (spell_ids) {
      properties.spell_ids = spell_ids;
    }
    if (tag_ids) {
      properties.tag_ids = tag_ids;
    }

    const cardData = {
      name,
      description,
      type,
      rarity,
      properties, // Merged properties
      summon_cost,
      image,
      passive_effect,
      is_wip: is_wip || false,
      is_crap: is_crap || false,
    };

    const { data, error } = await supabase
      .from('cards')
      .insert(cardData)
      .select()
      .single(); // Assuming you want to return the created card

    if (error) {
      console.error('Error creating card:', error);
      return res.status(500).json({ error: 'Failed to create card', details: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Unexpected error creating card:', err);
    if (!res.headersSent) { // Ensure headers aren't already sent
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
});

// --- Booster Pack Endpoints ---

// POST /api/users/:userId/grant-booster (Grant Booster Pack)
// Assumption: This is an admin-protected route. Authorization should be handled by preceding middleware.
router.post('/users/:userId/grant-booster', async (req, res) => {
  const { userId } = req.params;
  const { booster_type, quantity } = req.body;

  if (!booster_type || !boosterPackDefinitions[booster_type]) {
    return res.status(400).json({ error: `Invalid or missing booster_type. Available types: ${Object.keys(boosterPackDefinitions).join(', ')}` });
  }
  if (quantity === undefined || typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ error: 'Missing or invalid quantity. Must be a positive number.' });
  }

  try {
    // Fetch the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, settings')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      if ((userError && userError.code === 'PGRST116') || !user) { // PGRST116: Not Found
        return res.status(404).json({ error: 'User not found' });
      }
      console.error('Error fetching user for granting booster:', userError);
      return res.status(500).json({ error: 'Failed to fetch user', details: userError.message });
    }

    // Update user's settings for available_packs
    const currentSettings = user.settings || {};
    const availablePacks = currentSettings.available_packs || {};
    
    availablePacks[booster_type] = (availablePacks[booster_type] || 0) + quantity;
    currentSettings.available_packs = availablePacks;

    const { data: updatedUserData, error: updateError } = await supabase
      .from('users')
      .update({ settings: currentSettings, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, settings->available_packs') // Select only the updated packs for response
      .single();

    if (updateError) {
      console.error('Error updating user settings for booster pack:', updateError);
      return res.status(500).json({ error: 'Failed to update user settings', details: updateError.message });
    }

    res.json({ 
        message: `Successfully granted ${quantity} of ${booster_type} to user ${userId}.`,
        available_packs: updatedUserData.available_packs
    });

  } catch (err) {
    console.error('Unexpected error granting booster pack:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
});


// POST /api/me/open-booster (User Opens Booster Pack)
// Assumption: req.user.id is populated by auth middleware.
router.post('/me/open-booster', async (req, res) => {
  // const userId = req.user.id; // Uncomment when auth middleware is in place
  const userId = req.body.userId_TEMP; // TEMPORARY: for testing without auth. Replace with req.user.id
  if (!userId) { // Remove this block when req.user.id is available
      return res.status(401).json({ error: 'User not authenticated (userId_TEMP missing from body for testing)' });
  }

  const { booster_type } = req.body;

  if (!booster_type || !boosterPackDefinitions[booster_type]) {
    return res.status(400).json({ error: `Invalid or missing booster_type. Available types: ${Object.keys(boosterPackDefinitions).join(', ')}` });
  }

  const packDefinition = boosterPackDefinitions[booster_type];
  let openedCards = [];
  let obtainedCardDetails = []; // To store full details of cards obtained

  try {
    // 1. Fetch user and validate pack availability
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, settings')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      if ((userError && userError.code === 'PGRST116') || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      console.error('Error fetching user for opening booster:', userError);
      return res.status(500).json({ error: 'Failed to fetch user', details: userError.message });
    }

    const currentSettings = user.settings || {};
    const availablePacks = currentSettings.available_packs || {};

    if (!availablePacks[booster_type] || availablePacks[booster_type] <= 0) {
      return res.status(400).json({ error: `No ${booster_type} packs available to open.` });
    }

    // 2. Card Selection Logic
    let notEnoughCardsError = null;
    for (const item of packDefinition.contents) {
      let cardsForItem = [];
      if (item.rarity === 'epic_legendary_random') {
        cardsForItem = await getRandomCardsFromRarities(['epic', 'legendaire'], item.count, openedCards.map(c => c.id));
      } else {
        cardsForItem = await getRandomCardsByRarity(item.rarity, item.count, openedCards.map(c => c.id));
      }
      
      if (cardsForItem.length < item.count) {
        notEnoughCardsError = `Could not find enough cards for rarity rule: ${item.rarity} (requested ${item.count}, found ${cardsForItem.length}).`;
        // Decide if to break or continue with fewer cards. For now, we'll collect what we can and report later if any category failed.
      }
      openedCards.push(...cardsForItem);
    }

    if (openedCards.length < packDefinition.totalCards && !notEnoughCardsError) {
         // This might happen if some getRandomCardsByRarity calls returned empty due to no cards of that rarity at all.
        notEnoughCardsError = `Could not obtain the total number of cards (${packDefinition.totalCards}) for the booster. Obtained ${openedCards.length}.`;
    }
    
    // If there was an issue finding enough cards, and we want to be strict:
    if (notEnoughCardsError) {
        console.warn(notEnoughCardsError); // Log it
        // Optionally, return an error to the user if the pack cannot be fulfilled as defined
        // return res.status(500).json({ error: "Failed to generate full booster pack due to card availability.", details: notEnoughCardsError});
        // For now, we'll proceed with what cards were found.
    }

    if (openedCards.length === 0) {
        return res.status(500).json({ error: "Failed to obtain any cards for the booster pack. Check card availability for defined rarities."});
    }


    // 3. Add Cards to Inventory (Upsert: Insert or Update quantity)
    const inventoryUpdates = openedCards.map(card => ({
      user_id: userId,
      card_id: card.id,
      quantity: 1, // We'll increment this on conflict
      favorite: false, // Default for new entries
      // acquired_at is handled by DB default or trigger ideally
    }));

    // Upsert logic: if conflict on (user_id, card_id), increment quantity.
    // This requires a bit more care with Supabase JS client if not using a DB function.
    // Standard upsert with `onConflict` might just update other fields, not increment.
    // A common way is to fetch existing, then update/insert. Or use a PL/pgSQL function.

    // Simpler approach for now: fetch existing quantities, then batch inserts/updates.
    // More robust: loop and upsert one-by-one or use a dedicated DB function.
    
    const existingInventoryItems = await supabase
        .from('card_inventory')
        .select('card_id, quantity')
        .eq('user_id', userId)
        .in('card_id', openedCards.map(c => c.id));

    if (existingInventoryItems.error) throw existingInventoryItems.error;

    const existingInventoryMap = new Map(existingInventoryItems.data.map(item => [item.card_id, item.quantity]));
    const newInventoryEntries = [];
    const inventoryToUpdate = [];

    for (const card of openedCards) {
      obtainedCardDetails.push({id: card.id, name: card.name, rarity: card.rarity}); // Store details for response
      if (existingInventoryMap.has(card.id)) {
        inventoryToUpdate.push({
          user_id: userId,
          card_id: card.id,
          quantity: existingInventoryMap.get(card.id) + 1
        });
      } else {
        newInventoryEntries.push({
          user_id: userId,
          card_id: card.id,
          quantity: 1,
          favorite: false
        });
      }
    }

    if (newInventoryEntries.length > 0) {
      const { error: insertError } = await supabase.from('card_inventory').insert(newInventoryEntries);
      if (insertError) throw insertError;
    }
    if (inventoryToUpdate.length > 0) {
      for (const item of inventoryToUpdate) { // Batch update can be tricky with different values per row
        const { error: updateError } = await supabase
          .from('card_inventory')
          .update({ quantity: item.quantity, updated_at: new Date().toISOString() }) // Assuming an updated_at column
          .eq('user_id', userId)
          .eq('card_id', item.card_id);
        if (updateError) throw updateError;
      }
    }
    
    // 4. Decrement Booster Pack Count
    availablePacks[booster_type] -= 1;
    if (availablePacks[booster_type] <= 0) {
      delete availablePacks[booster_type]; // Clean up if count is zero
    }
    currentSettings.available_packs = availablePacks;

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ settings: currentSettings, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (userUpdateError) {
      // This is tricky. Cards were added, but pack count failed to update.
      // Ideally, this whole process should be a transaction.
      // Log this inconsistency for now.
      console.error(`CRITICAL: Cards added to inventory for user ${userId}, but failed to decrement booster pack count. Error: ${userUpdateError.message}`);
      // Don't throw, as cards are already given. But inform user of partial success.
      return res.status(207).json({ 
        message: 'Cards obtained, but failed to update pack count. Please contact support.',
        cards: obtainedCardDetails,
        pack_update_error: userUpdateError.message
      });
    }

    res.json({
      message: `Successfully opened ${booster_type} pack!`,
      cards: obtainedCardDetails, // Return simplified card info
      remaining_packs: currentSettings.available_packs,
      warning: notEnoughCardsError // Include warning if pack wasn't full
    });

  } catch (err) {
    console.error(`Unexpected error opening booster pack for user ${userId}:`, err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error while opening booster pack', details: err.message });
    }
  }
});

// GET /api/cards (List Cards)
router.get('/cards', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*');

    if (error) {
      console.error('Error listing cards:', error);
      return res.status(500).json({ error: 'Failed to retrieve cards', details: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error('Unexpected error listing cards:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// GET /api/cards/:id (Get Card by ID)
router.get('/cards/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Differentiate between "not found" (PGRST116) and other errors
      if (error.code === 'PGRST116') { // PostgREST code for "Not Found"
        return res.status(404).json({ error: 'Card not found' });
      }
      console.error('Error getting card by ID:', error);
      return res.status(500).json({ error: 'Failed to retrieve card', details: error.message });
    }

    if (!data) { // Should be covered by PGRST116, but as a fallback
        return res.status(404).json({ error: 'Card not found' });
    }
    res.json(data);
  } catch (err) {
    console.error('Unexpected error getting card by ID:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// PUT /api/cards/:id (Update Card)
router.put('/cards/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, type, rarity, properties: initialProperties, summon_cost, image, passive_effect, is_wip, is_crap, spell_ids, tag_ids } = req.body;

  try {
    // Validate spell_ids if provided
    if (spell_ids !== undefined) { // Check if spell_ids is part of the update
        if (spell_ids && spell_ids.length > 0) {
            const spellValidation = await validateIds(spell_ids, 'spells');
            if (!spellValidation.valid) {
            return res.status(400).json({ error: `Invalid spell IDs provided: ${spellValidation.missing.join(', ')}` });
            }
        }
    }

    // Validate tag_ids if provided
    if (tag_ids !== undefined) { // Check if tag_ids is part of the update
        if (tag_ids && tag_ids.length > 0) {
            const tagValidation = await validateIds(tag_ids, 'tags');
            if (!tagValidation.valid) {
            return res.status(400).json({ error: `Invalid tag IDs provided: ${tagValidation.missing.join(', ')}` });
            }
        }
    }
    
    // Fetch existing card to merge properties correctly
    const { data: existingCard, error: fetchError } = await supabase
        .from('cards')
        .select('properties')
        .eq('id', id)
        .single();

    if (fetchError || !existingCard) {
        if (fetchError && fetchError.code === 'PGRST116' || !existingCard ) {
            return res.status(404).json({ error: 'Card not found for update' });
        }
        console.error('Error fetching card for update:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch card for update', details: fetchError?.message });
    }


    // Prepare properties for update
    // Start with existing properties, then overlay with new initialProperties from request,
    // then specifically set/unset spell_ids and tag_ids based on request.
    const properties = { ...existingCard.properties, ...initialProperties };
    if (spell_ids !== undefined) { // If spell_ids is explicitly in the request
      properties.spell_ids = spell_ids && spell_ids.length > 0 ? spell_ids : []; // Set to new list or empty if provided as empty/null
    }
    if (tag_ids !== undefined) { // If tag_ids is explicitly in the request
      properties.tag_ids = tag_ids && tag_ids.length > 0 ? tag_ids : []; // Set to new list or empty if provided as empty/null
    }


    const cardUpdateData = {
      name,
      description,
      type,
      rarity,
      properties, // Updated, merged properties
      summon_cost,
      image,
      passive_effect,
      is_wip,
      is_crap,
      updated_at: new Date().toISOString(), // Explicitly set updated_at
    };

    // Remove undefined fields from update data to avoid overwriting with null
    Object.keys(cardUpdateData).forEach(key => cardUpdateData[key] === undefined && delete cardUpdateData[key]);


    const { data, error } = await supabase
      .from('cards')
      .update(cardUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Differentiate between "not found" (e.g. if the .eq('id', id) found no row) and other errors
      // Supabase update().eq().select().single() returns error PGRST116 if .eq() finds no rows.
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Card not found, update failed' });
      }
      console.error('Error updating card:', error);
      return res.status(500).json({ error: 'Failed to update card', details: error.message });
    }
    
    if (!data) { // Should be covered by PGRST116 if id doesn't exist
        return res.status(404).json({ error: 'Card not found, update failed' });
    }

    res.json(data);
  } catch (err) {
    console.error('Unexpected error updating card:', err);
    if (!res.headersSent) {
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
});

// DELETE /api/cards/:id (Delete Card)
router.delete('/cards/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Note: If using join tables, you'd delete related entries from them here first.
    // Since we are storing spell_ids/tag_ids in properties, deleting the card itself is sufficient.

    const { error, count } = await supabase // Using count to check if a row was actually deleted
      .from('cards')
      .delete({ count: 'exact' }) // Request row count
      .eq('id', id);

    if (error) {
      console.error('Error deleting card:', error);
      return res.status(500).json({ error: 'Failed to delete card', details: error.message });
    }

    if (count === 0) {
        return res.status(404).json({ error: 'Card not found, nothing deleted' });
    }

    res.status(200).json({ message: 'Card deleted successfully' });
  } catch (err) {
    console.error('Unexpected error deleting card:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});