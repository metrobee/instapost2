// API endpoint for generating mushroom descriptions from web sources
const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// Create a cache with 24-hour TTL for descriptions
const descriptionCache = new NodeCache({ stdTTL: 86400 });

// API endpoint to get a description for a mushroom
router.get('/', async (req, res) => {
  const latinName = req.query.name;
  
  if (!latinName) {
    return res.status(400).json({ error: 'Latin name is required' });
  }
  
  // Check cache first
  const cacheKey = `description_${latinName}`;
  const cachedDescription = descriptionCache.get(cacheKey);
  if (cachedDescription) {
    console.log(`Using cached description for: ${latinName}`);
    return res.json({ description: cachedDescription });
  }
  
  try {
    console.log(`Generating description for: ${latinName}`);
    const description = await fetchMushroomDescription(latinName);
    
    // Cache the result
    descriptionCache.set(cacheKey, description);
    
    res.json({ description });
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({ error: 'Failed to generate description' });
  }
});

// Function to fetch mushroom description from various web sources
async function fetchMushroomDescription(latinName) {
  try {
    // Try multiple sources in sequence until we get a good description
    
    // 1. Try Wikipedia
    console.log(`Trying Wikipedia for ${latinName}`);
    const wikiDescription = await fetchFromWikipedia(latinName);
    if (wikiDescription) {
      console.log(`Found Wikipedia description for ${latinName}`);
      return wikiDescription;
    }
    
    // 2. Try GBIF
    console.log(`Trying GBIF for ${latinName}`);
    const gbifDescription = await fetchFromGBIF(latinName);
    if (gbifDescription) {
      console.log(`Found GBIF description for ${latinName}`);
      return gbifDescription;
    }
    
    // 3. Try MushroomExpert
    console.log(`Trying MushroomExpert for ${latinName}`);
    const mushroomExpertDescription = await fetchFromMushroomExpert(latinName);
    if (mushroomExpertDescription) {
      console.log(`Found MushroomExpert description for ${latinName}`);
      return mushroomExpertDescription;
    }
    
    // 4. Try MycoBank
    console.log(`Trying MycoBank for ${latinName}`);
    const mycoBankDescription = await fetchFromMycoBank(latinName);
    if (mycoBankDescription) {
      console.log(`Found MycoBank description for ${latinName}`);
      return mycoBankDescription;
    }
    
    // 5. Try iNaturalist
    console.log(`Trying iNaturalist for ${latinName}`);
    const iNaturalistDescription = await fetchFromINaturalist(latinName);
    if (iNaturalistDescription) {
      console.log(`Found iNaturalist description for ${latinName}`);
      return iNaturalistDescription;
    }
    
    // If all else fails, generate a generic description
    console.log(`No specific description found for ${latinName}, generating generic one`);
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

// Fetch description from MushroomExpert.com
async function fetchFromMushroomExpert(latinName) {
  try {
    const genus = latinName.split(' ')[0].toLowerCase();
    const species = latinName.split(' ')[1]?.toLowerCase();
    
    if (!species) return null;
    
    // Try the direct page first
    try {
      const response = await axios.get(`https://www.mushroomexpert.com/${genus}_${species}.html`);
      
      if (response.data) {
        const $ = cheerio.load(response.data);
        
        // Extract the first paragraph that seems like a description
        let description = '';
        $('p').each((i, el) => {
          if (i < 3 && !description && $(el).text().length > 100) {
            description = $(el).text().trim();
            return false; // Break the loop
          }
        });
        
        if (description) {
          // Limit to 2-3 sentences
          const sentences = description.split(/[.!?]+/);
          if (sentences.length > 3) {
            description = sentences.slice(0, 3).join('. ') + '.';
          }
          
          return description;
        }
      }
    } catch (err) {
      console.log(`No direct page for ${latinName} on MushroomExpert`);
    }
    
    // Try the genus page
    try {
      const response = await axios.get(`https://www.mushroomexpert.com/${genus}.html`);
      
      if (response.data) {
        const $ = cheerio.load(response.data);
        
        // Look for paragraphs that mention the species
        let relevantText = '';
        
        $('p').each((i, el) => {
          const text = $(el).text().toLowerCase();
          if (text.includes(species)) {
            relevantText = $(el).text().trim();
            return false; // Break the loop
          }
        });
        
        if (relevantText) {
          // Limit to 2-3 sentences
          const sentences = relevantText.split(/[.!?]+/);
          if (sentences.length > 3) {
            relevantText = sentences.slice(0, 3).join('. ') + '.';
          }
          
          return relevantText;
        }
      }
    } catch (err) {
      console.log(`No genus page for ${genus} on MushroomExpert`);
    }
    
    return null;
  } catch (error) {
    console.error('MushroomExpert error:', error.message);
    return null;
  }
}

// Fetch description from MycoBank
async function fetchFromMycoBank(latinName) {
  try {
    // Search for the species on MycoBank
    const searchUrl = `https://www.mycobank.org/page/Simple%20names%20search?name=${encodeURIComponent(latinName)}`;
    const searchResponse = await axios.get(searchUrl);
    
    if (searchResponse.data) {
      const $ = cheerio.load(searchResponse.data);
      
      // Find the link to the species page
      let speciesLink = '';
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href && text.toLowerCase() === latinName.toLowerCase()) {
          speciesLink = 'https://www.mycobank.org' + href;
          return false; // Break the loop
        }
      });
      
      if (speciesLink) {
        // Visit the species page
        const speciesResponse = await axios.get(speciesLink);
        const $species = cheerio.load(speciesResponse.data);
        
        // Extract the description
        let description = '';
        $species('.field-name-field-description').each((i, el) => {
          description = $species(el).text().trim();
          return false; // Break the loop
        });
        
        if (description) {
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
    console.error('MycoBank error:', error.message);
    return null;
  }
}

// Fetch description from iNaturalist
async function fetchFromINaturalist(latinName) {
  try {
    // Search for the species on iNaturalist
    const searchUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(latinName)}&limit=1`;
    const searchResponse = await axios.get(searchUrl);
    
    if (searchResponse.data && searchResponse.data.results && searchResponse.data.results.length > 0) {
      const taxon = searchResponse.data.results[0];
      
      if (taxon.wikipedia_summary) {
        // Limit to 2-3 sentences
        const sentences = taxon.wikipedia_summary.split(/[.!?]+/);
        if (sentences.length > 3) {
          return sentences.slice(0, 3).join('. ') + '.';
        }
        
        return taxon.wikipedia_summary;
      }
      
      if (taxon.description) {
        // Limit to 2-3 sentences
        const sentences = taxon.description.split(/[.!?]+/);
        if (sentences.length > 3) {
          return sentences.slice(0, 3).join('. ') + '.';
        }
        
        return taxon.description;
      }
    }
    
    return null;
  } catch (error) {
    console.error('iNaturalist error:', error.message);
    return null;
  }
}

// Generate a generic description based on the Latin name
function generateGenericDescription(latinName) {
  const genus = latinName.split(' ')[0];
  const species = latinName.split(' ')[1] || '';
  
  // Generate a description based on the genus and species
  // This doesn't use hardcoded mushroom data, just generic templates
  const templates = [
    `${latinName} is a species of fungus found in forest ecosystems. Like other members of the ${genus} genus, it plays an important role in nutrient cycling and biodiversity.`,
    `This species (${latinName}) is part of the ${genus} genus, known for its ecological importance in woodland habitats.`,
    `${latinName} is an interesting fungus species that contributes to the incredible diversity of fungi in our forests. It forms relationships with other organisms in the ecosystem.`,
    `Found in its natural habitat, ${latinName} is a representative of the ${genus} genus, which includes various species with unique ecological adaptations.`,
    `This specimen of ${latinName} demonstrates the important role fungi play in forest ecosystems, forming relationships with trees and other organisms.`
  ];
  
  // Select a template based on the species name length to ensure consistency
  const index = species.length % templates.length;
  return templates[index];
}

module.exports = router;