// Serverless API endpoint for Vercel
const express = require('express');
const cors = require('cors');
const { formatLatinName, capitalize, fetchEstonianWikiName, fetchLajiFiNames, fetchGBIFName } = require('../utils');
const descriptionGenerator = require('./generate-description');

const app = express();
app.use(cors());

// API endpoint for vernacular names
app.get('/api/vernacular', async (req, res) => {
  const latinName = req.query.latin;

  if (!latinName) {
    return res.status(400).json({ error: 'Palun sisesta ladinakeelne nimi.' });
  }

  try {
    const formatted = formatLatinName(latinName);

    const names = {
      latinName: formatted, // Return the properly formatted Latin name
      et: capitalize(await fetchEstonianWikiName(formatted) || ''),
      ...await fetchLajiFiNames(formatted),
      en: capitalize(await fetchGBIFName(formatted) || ''),
    };

    // Capitalize Finnish and Swedish names
    if (names.fi) names.fi = capitalize(names.fi);
    if (names.sv) names.sv = capitalize(names.sv);

    res.json(names);
  } catch (error) {
    console.error('Error fetching vernacular names:', error);
    res.status(500).json({ error: 'Failed to fetch vernacular names' });
  }
});

// API endpoint for mushroom descriptions
app.get('/api/description', (req, res) => {
  const latinName = req.query.name;
  
  if (!latinName) {
    return res.status(400).json({ error: 'Latin name is required' });
  }
  
  try {
    const description = descriptionGenerator.getMushroomDescription(latinName);
    res.json({ description });
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({ error: 'Failed to generate description' });
  }
});

// Export the Express app as a serverless function
module.exports = app;