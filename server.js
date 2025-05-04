const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Vajalik CORS probleemide vältimiseks brauseris
const path = require('path');
const { formatLatinName, capitalize, fetchEstonianWikiName, fetchLajiFiNames, fetchGBIFName } = require('./utils'); // Eeldame, et sinu senine kood on failis utils.js

const app = express();
// Use environment variable for port or default to 3000
const port = process.env.PORT || 3000;

app.use(cors()); // Luba kõik CORS päringud (arenduseks)
app.use(express.static(path.join(__dirname))); // Serve static files

// Loo API lõpp-punkt ladinakeelse nime vastuvõtmiseks
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
    console.log(`Server töötab pordil ${port}`);
    console.log(`Main page: http://localhost:${port}`);
    console.log(`Instagram text generator: http://localhost:${port}/instagram-text.html`);
  });
}