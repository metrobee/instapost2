// API endpoint for mushroom name suggestions from multiple sources
const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');

// Create a cache with 1-hour TTL for suggestions
const suggestionsCache = new NodeCache({ stdTTL: 3600 });

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
    
    // Try laji.fi public API first
    try {
      const url = `https://laji.fi/api/taxa/search?q=${encodeURIComponent(query)}&limit=10`;
      console.log(`Using URL: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.data && Array.isArray(response.data.results)) {
        console.log(`Found ${response.data.results.length} results from laji.fi`);
        suggestions = response.data.results
          .filter(item => item.scientificName)
          .map(item => item.scientificName)
          .sort();
        
        if (suggestions.length > 0) {
          success = true;
        }
      }
    } catch (error) {
      console.error(`Error with laji.fi: ${error.message}`);
    }
    
    // If laji.fi fails, try alternative laji.fi endpoint
    if (!success) {
      try {
        const url = `https://api.laji.fi/v0/taxa?taxonomyId=MX.37600&lang=fi&langFallback=true&maxLevel=4&query=${encodeURIComponent(query)}`;
        console.log(`Using alternative URL: ${url}`);
        
        const response = await axios.get(url);
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`Found ${response.data.length} results from alternative laji.fi endpoint`);
          suggestions = response.data
            .filter(item => item.scientificName)
            .map(item => item.scientificName)
            .sort();
          
          if (suggestions.length > 0) {
            success = true;
          }
        }
      } catch (error) {
        console.error(`Error with alternative laji.fi endpoint: ${error.message}`);
      }
    }
    
    // If laji.fi fails, try GBIF
    if (!success) {
      try {
        const url = `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(query)}&rank=SPECIES&highertaxon_key=5&limit=10`;
        console.log(`Using GBIF URL: ${url}`);
        
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
        console.error(`Error with GBIF: ${error.message}`);
      }
    }
    
    // If all APIs fail, try a simple search in Wikipedia
    if (!success) {
      try {
        const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}%20fungus&limit=10&namespace=0&format=json&origin=*`;
        console.log(`Using Wikipedia URL: ${url}`);
        
        const response = await axios.get(url);
        
        if (response.data && Array.isArray(response.data[1])) {
          console.log(`Found ${response.data[1].length} results from Wikipedia`);
          suggestions = response.data[1]
            .filter(item => /^[A-Z][a-z]+ [a-z]+$/.test(item)) // Only include items that look like Latin names
            .sort();
          
          if (suggestions.length > 0) {
            success = true;
          }
        }
      } catch (error) {
        console.error(`Error with Wikipedia: ${error.message}`);
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