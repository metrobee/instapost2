// API endpoint for mushroom name suggestions from laji.fi
const express = require('express');
const router = express.Router();
const axios = require('axios');

// API endpoint to get mushroom name suggestions
router.get('/', async (req, res) => {
  const query = req.query.q || '';
  
  if (!query || query.length < 3) {
    return res.json([]);
  }
  
  try {
    // Fetch suggestions from laji.fi API
    const response = await axios.get(
      `https://laji.fi/api/taxa/search?query=${encodeURIComponent(query)}&limit=10&includePayload=false&includeMedia=false&includeDescriptions=false&sortBy=scientificName&onlyFungi=true`
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