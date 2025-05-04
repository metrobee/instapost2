// API endpoint for mushroom name suggestions from laji.fi
const express = require('express');
const router = express.Router();
const axios = require('axios');

// API token for laji.fi
const LAJI_FI_TOKEN = '7QLHuUdYIx9MNIlnUVgYxND3mSzXGGXRNsscKazTuGgFjcCIlKxMJJHdvy1J6Z4o';

// API endpoint to get mushroom name suggestions
router.get('/', async (req, res) => {
  const query = req.query.q || '';
  
  if (!query || query.length < 3) {
    return res.json([]);
  }
  
  try {
    // Fetch suggestions from laji.fi API with the token
    const response = await axios.get(
      `https://api.laji.fi/v0/taxa/search?query=${encodeURIComponent(query)}&limit=10&matchType=partial&includePayload=false&includeMedia=false&includeDescriptions=false&sortBy=scientificName&onlyFungi=true&access_token=${LAJI_FI_TOKEN}`
    );
    
    let suggestions = [];
    
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      // Extract scientific names from the results
      suggestions = response.data.results
        .filter(item => item.scientificName)
        .map(item => item.scientificName)
        .sort(); // Sort alphabetically
    }
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

module.exports = router;