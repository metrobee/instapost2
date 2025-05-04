// API endpoint for mushroom name suggestions from multiple sources
const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');

// Create a cache with 1-hour TTL for suggestions
const suggestionsCache = new NodeCache({ stdTTL: 3600 });

// API token for laji.fi
const LAJI_FI_TOKEN = '7QLHuUdYIx9MNIlnUVgYxND3mSzXGGXRNsscKazTuGgFjcCIlKxMJJHdvy1J6Z4o';

// API endpoint to get mushroom name suggestions
router.get('/', async (req, res) => {
  const query = req.query.q || '';
  
  if (!query || query.length < 3) {
    return res.json([]);
  }
  
  // Check cache first
  const cacheKey = `suggestions_${query}`;
  const cachedSuggestions = suggestionsCache.get(cacheKey);
  if (cachedSuggestions) {
    console.log(`Using cached suggestions for: ${query}`);
    return res.json(cachedSuggestions);
  }
  
  try {
    console.log(`Fetching suggestions for: ${query}`);
    
    // Try multiple sources for suggestions
    let suggestions = [];
    let success = false;
    
    // Try FinBIF API with token (most reliable)
    try {
      const url = `https://api.laji.fi/v0/taxa/search?query=${encodeURIComponent(query)}&matchType=partial&includePayload=false&onlyFungi=true&limit=10&access_token=${LAJI_FI_TOKEN}`;
      console.log(`Using FinBIF API: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        console.log(`Found ${response.data.results.length} results from FinBIF`);
        suggestions = response.data.results
          .filter(item => item.matchingName)
          .map(item => item.matchingName)
          .sort();
        
        if (suggestions.length > 0) {
          success = true;
        }
      }
    } catch (error) {
      console.error(`Error with FinBIF API: ${error.message}`);
    }
    
    // If FinBIF fails, try public laji.fi API
    if (!success) {
      try {
        const url = `https://laji.fi/api/taxa/search?q=${encodeURIComponent(query)}&limit=10`;
        console.log(`Using public laji.fi API: ${url}`);
        
        const response = await axios.get(url);
        
        if (response.data && Array.isArray(response.data.results)) {
          console.log(`Found ${response.data.results.length} results from public laji.fi`);
          suggestions = response.data.results
            .filter(item => item.scientificName)
            .map(item => item.scientificName)
            .sort();
          
          if (suggestions.length > 0) {
            success = true;
          }
        }
      } catch (error) {
        console.error(`Error with public laji.fi API: ${error.message}`);
      }
    }
    
    // If laji.fi fails, try GBIF
    if (!success) {
      try {
        const url = `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(query)}&rank=SPECIES&highertaxon_key=5&limit=10`;
        console.log(`Using GBIF API: ${url}`);
        
        const response = await axios.get(url);
        
        if (response.data && Array.isArray(response.data.results)) {
          console.log(`Found ${response.data.results.length} results from GBIF`);
          suggestions = response.data.results
            .filter(item => item.scientificName)
            .map(item => item.scientificName)
            .sort();
          
          if (suggestions.length > 0) {
            success = true;
          }
        }
      } catch (error) {
        console.error(`Error with GBIF API: ${error.message}`);
      }
    }
    
    // If all APIs fail, try Mushroom Observer
    if (!success) {
      try {
        const url = `https://mushroomobserver.org/api/names?format=json&name=${encodeURIComponent(query)}`;
        console.log(`Using Mushroom Observer API: ${url}`);
        
        const response = await axios.get(url);
        
        if (response.data && response.data.results && Array.isArray(response.data.results)) {
          console.log(`Found ${response.data.results.length} results from Mushroom Observer`);
          suggestions = response.data.results
            .filter(item => item.name && item.name.includes(' ')) // Only include binomial names
            .map(item => item.name)
            .sort();
          
          if (suggestions.length > 0) {
            success = true;
          }
        }
      } catch (error) {
        console.error(`Error with Mushroom Observer API: ${error.message}`);
      }
    }
    
    // Cache the results
    suggestionsCache.set(cacheKey, suggestions);
    
    res.json(suggestions);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch suggestions', details: error.message });
  }
});

module.exports = router;