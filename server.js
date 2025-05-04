const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { formatLatinName, capitalize, fetchEstonianWikiName, fetchLajiFiNames, fetchGBIFName } = require('./utils');

const app = express();
// Use environment variable for port or default to 3000
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname)));

// Import API routes
const descriptionRouter = require('./api/description');
const suggestionsRouter = require('./api/suggestions');

// API endpoint for vernacular names
app.get('/api/vernacular', async (req, res) => {
  const latinName = req.query.latin;

  if (!latinName) {
    return res.status(400).json({ error: 'Palun sisesta ladinakeelne nimi.' });
  }

  try {
    console.log(`Processing vernacular name request for: ${latinName}`);
    const formatted = formatLatinName(latinName);
    console.log(`Formatted Latin name: ${formatted}`);

    // Fetch names from different sources
    const etName = await fetchEstonianWikiName(formatted);
    const lajiFiNames = await fetchLajiFiNames(formatted);
    const enName = await fetchGBIFName(formatted);

    const names = {
      latinName: formatted,
      et: etName ? capitalize(etName) : '',
      ...lajiFiNames,
      en: enName ? capitalize(enName) : ''
    };

    console.log(`Vernacular names for ${formatted}:`, names);
    res.json(names);
  } catch (error) {
    console.error('Error fetching vernacular names:', error);
    res.status(500).json({ error: 'Failed to fetch vernacular names', details: error.message });
  }
});

// Use API routers
app.use('/api/description', descriptionRouter);
app.use('/api/suggestions', suggestionsRouter);

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the Instagram text generator page
app.get('/instagram-text', (req, res) => {
  res.sendFile(path.join(__dirname, 'instagram-text.html'));
});

// For Vercel serverless deployment
if (process.env.VERCEL) {
  // Export the Express app as a serverless function
  module.exports = app;
} else {
  // Start the server normally for local development
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Main page: http://localhost:${port}`);
    console.log(`Instagram text generator: http://localhost:${port}/instagram-text.html`);
  });
}