// API endpoint for generating mushroom descriptions from web sources
const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// API tokens
const GBIF_API_TOKEN = ''; // GBIF doesn't require a token for basic usage
const WIKI_API_TOKEN = ''; // Wikipedia doesn't require a token for basic usage

// API endpoint to get a description for a mushroom
router.get('/', async (req, res) => {
  const latinName = req.query.name;
  
  if (!latinName) {
    return res.status(400).json({ error: 'Latin name is required' });
  }
  
  try {
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
    // Try to get description from Wikipedia
    const wikiDescription = await fetchFromWikipedia(latinName);
    if (wikiDescription) {
      return wikiDescription;
    }
    
    // Try to get description from GBIF
    const gbifDescription = await fetchFromGBIF(latinName);
    if (gbifDescription) {
      return gbifDescription;
    }
    
    // If all else fails, return a generic description
    return generateGenericDescription(latinName);
  } catch (error) {
    console.error('Error fetching mushroom description:', error);
    return generateGenericDescription(latinName);
  }
}

// Fetch description from Wikipedia
async function fetchFromWikipedia(latinName) {
  try {
    // Wikipedia API doesn't require authentication for basic usage
    const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(latinName)}`, {
      headers: {
        'User-Agent': 'VernacularWebApp/1.0 (https://github.com/yourusername/vernacular-web; your-email@example.com)'
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

// Generate a generic description based on the Latin name
function generateGenericDescription(latinName) {
  const genus = latinName.split(' ')[0];
  const species = latinName.split(' ')[1] || '';
  
  // Use the species name to deterministically select a template
  const templates = [
    `${latinName} is a fascinating fungus found in forest ecosystems. Like other members of the ${genus} genus, it plays an important role in nutrient cycling and biodiversity.`,
    `This species (${latinName}) is part of the ${genus} genus, known for its distinctive characteristics and ecological importance in woodland habitats.`,
    `${latinName} is an interesting mushroom species that showcases the incredible diversity of fungi in our forests. It contributes to the complex web of relationships in forest ecosystems.`,
    `Found in its natural habitat, ${latinName} is a representative of the ${genus} genus, which includes various species with unique ecological adaptations.`,
    `This beautiful specimen of ${latinName} demonstrates the important role fungi play in forest ecosystems, forming relationships with trees and other organisms.`
  ];
  
  // Select a template based on the species name length to ensure consistency
  const index = species.length % templates.length;
  return templates[index];
}

module.exports = router;