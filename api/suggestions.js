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
    console.log(`Fetching suggestions for query: ${query}`);
    
    // Try the most reliable endpoint first
    const url = `https://api.laji.fi/v0/taxa?taxonomyId=MX.37600&lang=fi&langFallback=true&maxLevel=4&query=${encodeURIComponent(query)}&access_token=${LAJI_FI_TOKEN}`;
    console.log(`Laji.fi URL: ${url}`);
    
    const response = await axios.get(url);
    console.log('Laji.fi suggestions response status:', response.status);
    
    let suggestions = [];
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`Found ${response.data.length} potential matches`);
      
      // Extract scientific names from the results
      suggestions = response.data
        .filter(item => item.scientificName)
        .map(item => item.scientificName)
        .sort(); // Sort alphabetically
      
      console.log('Processed suggestions:', suggestions);
    } else {
      console.log('No results found or unexpected response format');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      // Try alternative endpoint if the first one fails
      const altUrl = `https://api.laji.fi/v0/taxa/search?query=${encodeURIComponent(query)}&access_token=${LAJI_FI_TOKEN}`;
      console.log(`Trying alternative Laji.fi URL: ${altUrl}`);
      
      const altResponse = await axios.get(altUrl);
      
      if (altResponse.data && altResponse.data.results && Array.isArray(altResponse.data.results)) {
        console.log(`Found ${altResponse.data.results.length} results from alternative endpoint`);
        
        suggestions = altResponse.data.results
          .filter(item => item.scientificName)
          .map(item => item.scientificName)
          .sort();
        
        console.log('Processed suggestions from alternative endpoint:', suggestions);
      }
    }
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).json({ error: 'Failed to fetch suggestions', details: error.message });
  }
});

module.exports = router;