// Main server file for TCG Card Editor
const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../build')));

// API routes
app.use('/api', apiRoutes);

// For any other request, send back the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 