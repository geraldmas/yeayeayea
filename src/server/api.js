// API endpoints for the TCG Card Editor
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