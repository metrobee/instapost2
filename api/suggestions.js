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
    console.log(`Fetching suggestions for: ${query}`);
    
    // Use a public endpoint that doesn't require authentication
    const url = `https://laji.fi/api/taxa/search?q=${encodeURIComponent(query)}&limit=10`;
    console.log(`Using URL: ${url}`);
    
    const response = await axios.get(url);
    console.log(`Response status: ${response.status}`);
    
    let suggestions = [];
    
    if (response.data && Array.isArray(response.data.results)) {
      console.log(`Found ${response.data.results.length} results`);
      suggestions = response.data.results
        .filter(item => item.scientificName)
        .map(item => item.scientificName)
        .sort();
      
      console.log('Processed suggestions:', suggestions);
    } else {
      console.log('No results found or unexpected response format');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    }
    
    if (suggestions.length === 0) {
      // Return some common mushroom names as fallback
      suggestions = getCommonMushroomSuggestions(query);
      console.log('Using fallback suggestions:', suggestions);
    }
    
    res.json(suggestions);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Return some common mushroom names as fallback
    const fallbackSuggestions = getCommonMushroomSuggestions(query);
    console.log('Using fallback suggestions after error:', fallbackSuggestions);
    res.json(fallbackSuggestions);
  }
});

function getCommonMushroomSuggestions(query) {
  const commonMushrooms = [
    'Boletus edulis', 'Cantharellus cibarius', 'Amanita muscaria',
    'Russula virescens', 'Lactarius deliciosus', 'Morchella esculenta',
    'Craterellus cornucopioides', 'Hydnum repandum', 'Suillus luteus',
    'Leccinum scabrum', 'Gyromitra esculenta', 'Tricholoma matsutake',
    'Armillaria mellea', 'Macrolepiota procera', 'Coprinus comatus',
    'Agaricus campestris', 'Pleurotus ostreatus', 'Fomitopsis pinicola',
    'Fomes fomentarius', 'Piptoporus betulinus', 'Lycoperdon perlatum',
    'Amanita phalloides', 'Amanita rubescens', 'Boletus reticulatus',
    'Boletus pinophilus', 'Crustoderma dryinum'
  ];
  
  return commonMushrooms.filter(name => 
    name.toLowerCase().includes(query.toLowerCase())
  ).sort();
}

module.exports = router;