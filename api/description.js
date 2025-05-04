// API endpoint for generating mushroom descriptions from web sources
const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// API endpoint to get a description for a mushroom
router.get('/', async (req, res) => {
  const latinName = req.query.name;
  
  if (!latinName) {
    return res.status(400).json({ error: 'Latin name is required' });
  }
  
  try {
    console.log(`Generating description for: ${latinName}`);
    const description = await fetchMushroomDescription(latinName);
    res.json({ description });
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({ error: 'Failed to generate description' });
  }
});

// Function to fetch mushroom description from various web sources
async function fetchMushroomDescription(latinName) {
  try {
    console.log(`Trying Wikipedia for ${latinName}`);
    // Try to get description from Wikipedia
    const wikiDescription = await fetchFromWikipedia(latinName);
    if (wikiDescription) {
      console.log(`Found Wikipedia description for ${latinName}`);
      return wikiDescription;
    }
    
    console.log(`Trying GBIF for ${latinName}`);
    // Try to get description from GBIF
    const gbifDescription = await fetchFromGBIF(latinName);
    if (gbifDescription) {
      console.log(`Found GBIF description for ${latinName}`);
      return gbifDescription;
    }
    
    console.log(`No specific description found for ${latinName}, generating generic one`);
    // If all else fails, return a generic description
    return `${latinName} is a fascinating fungus found in forest ecosystems. It plays an important role in nutrient cycling and biodiversity.`;
  } catch (error) {
    console.error('Error fetching mushroom description:', error);
    return `${latinName} is a species of fungus that contributes to the rich biodiversity of forest ecosystems.`;
  }
}

// Fetch description from Wikipedia
async function fetchFromWikipedia(latinName) {
  try {
    // Wikipedia API doesn't require authentication for basic usage
    const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(latinName)}`, {
      headers: {
        'User-Agent': 'VernacularWebApp/1.0'
      }
    });
    
    if (response.data && response.data.extract) {
      // Clean up and limit the description
      let description = response.data.extract;
      
      // Limit to 2-3 sentences
      const sentences = description.split(/[.!?]+/);
      if (sentences.length > 3) {
        description = sentences.slice(0, 3).join('. ') + '.';
      }
      
      return description;
    }
    return null;
  } catch (error) {
    console.error('Wikipedia error:', error.message);
    return null;
  }
}

// Fetch description from GBIF
async function fetchFromGBIF(latinName) {
  try {
    // First get the taxon key
    const matchResponse = await axios.get(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(latinName)}`);
    
    if (matchResponse.data && matchResponse.data.usageKey) {
      const taxonKey = matchResponse.data.usageKey;
      
      // Then get the species info
      const speciesResponse = await axios.get(`https://api.gbif.org/v1/species/${taxonKey}/descriptions`);
      
      if (speciesResponse.data && speciesResponse.data.results && speciesResponse.data.results.length > 0) {
        // Find an English description
        const englishDescription = speciesResponse.data.results.find(desc => 
          desc.language === 'eng' || desc.language === 'en'
        );
        
        if (englishDescription && englishDescription.description) {
          // Clean up and limit the description
          let description = englishDescription.description;
          
          // Remove HTML tags
          description = description.replace(/<[^>]*>/g, '');
          
          // Limit to 2-3 sentences
          const sentences = description.split(/[.!?]+/);
          if (sentences.length > 3) {
            description = sentences.slice(0, 3).join('. ') + '.';
          }
          
          return description;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('GBIF error:', error.message);
    return null;
  }
}

module.exports = router;