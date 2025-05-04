// Serverless API endpoint for Vercel
const express = require('express');
const cors = require('cors');
const { formatLatinName, capitalize, fetchEstonianWikiName, fetchLajiFiNames, fetchGBIFName } = require('../utils');

const app = express();
app.use(cors());

// Import API routes
const descriptionRouter = require('./description');
const suggestionsRouter = require('./suggestions');

// API endpoint for vernacular names
app.get('/api/vernacular', async (req, res) => {
  const latinName = req.query.latin;

  if (!latinName) {
    return res.status(400).json({ error: 'Palun sisesta ladinakeelne nimi.' });
  }

  try {
    console.log(`[Vercel] Processing vernacular name request for: ${latinName}`);
    const formatted = formatLatinName(latinName);
    console.log(`[Vercel] Formatted Latin name: ${formatted}`);

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

    console.log(`[Vercel] Vernacular names for ${formatted}:`, names);
    res.json(names);
  } catch (error) {
    console.error('[Vercel] Error fetching vernacular names:', error);
    res.status(500).json({ error: 'Failed to fetch vernacular names', details: error.message });
  }
});

// Use API routers
app.use('/api/description', descriptionRouter);
app.use('/api/suggestions', suggestionsRouter);

// Serve static files for Vercel
app.use(express.static('.'));

// Export the Express app as a serverless function
module.exports = app;