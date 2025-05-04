// utils.js

const axios = require('axios');

// API token for laji.fi
const LAJI_FI_TOKEN = '7QLHuUdYIx9MNIlnUVgYxND3mSzXGGXRNsscKazTuGgFjcCIlKxMJJHdvy1J6Z4o';

function formatLatinName(input) {
  if (!input || !input.includes(" ")) {
    return capitalize(input || '');
  }
  const [genus, ...speciesParts] = input.trim().split(" ");
  return `${capitalize(genus)} ${speciesParts.join(' ').toLowerCase()}`;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function fetchEstonianWikiName(latin) {
  try {
    console.log(`Fetching Estonian name for ${latin} from Wikipedia`);
    const wiki = await axios.get(`https://et.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        format: 'json',
        titles: latin,
        prop: 'revisions',
        rvprop: 'content',
        rvlimit: 1,
        rvsection: 0,
        origin: '*'
      }
    });
    const pages = wiki.data?.query?.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages?.[pageId];
    const content = page?.revisions?.[0]?.['*'];

    if (content) {
      let redirectMatch = content.match(/^#suuna\s*\[\[(.*?)\]\]/i);
      if (redirectMatch && redirectMatch[1]) {
        console.log(`Found Estonian name via redirect: ${redirectMatch[1].trim()}`);
        return capitalize(redirectMatch[1].trim());
      }

      redirectMatch = content.match(/^#redirect\s*\[\[(.*?)\]\]/i);
      if (redirectMatch && redirectMatch[1]) {
        console.log(`Found Estonian name via redirect: ${redirectMatch[1].trim()}`);
        return capitalize(redirectMatch[1].trim());
      }

      const boldMatch = content.match(/^'''([A-ZÕÄÖÜÜŠŽa-zõäöüšž\s\-]+?)'''/);
      if (boldMatch && boldMatch[1]) {
        console.log(`Found Estonian name via bold text: ${boldMatch[1].trim()}`);
        return capitalize(boldMatch[1].trim());
      }
    }
    console.log(`No Estonian name found for ${latin}`);
  } catch (err) {
    console.error(`Wikipedia error for ${latin}:`, err.message);
  }
  return null;
}

async function fetchLajiFiNames(latin) {
  try {
    console.log(`Fetching Finnish and Swedish names for ${latin} from laji.fi`);
    
    // Direct API call with minimal parameters to ensure it works
    const url = `https://api.laji.fi/v0/taxa?taxonomyId=MX.37600&lang=fi&langFallback=true&maxLevel=4&query=${encodeURIComponent(latin)}&access_token=${LAJI_FI_TOKEN}`;
    console.log(`Laji.fi URL: ${url}`);
    
    const response = await axios.get(url);
    console.log(`Laji.fi response status: ${response.status}`);
    
    // Log the entire response for debugging
    console.log('Full response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      // Find the matching taxon
      const matchingTaxon = response.data.find(taxon => 
        taxon.scientificName.toLowerCase() === latin.toLowerCase()
      );
      
      if (matchingTaxon) {
        console.log('Found matching taxon:', matchingTaxon.scientificName);
        
        return {
          fi: matchingTaxon.vernacularName?.fi ? capitalize(matchingTaxon.vernacularName.fi) : null,
          sv: matchingTaxon.vernacularName?.sv ? capitalize(matchingTaxon.vernacularName.sv) : null
        };
      }
    }
    
    // Try alternative endpoint if the first one fails
    const altUrl = `https://api.laji.fi/v0/taxa/search?query=${encodeURIComponent(latin)}&access_token=${LAJI_FI_TOKEN}`;
    console.log(`Trying alternative Laji.fi URL: ${altUrl}`);
    
    const altResponse = await axios.get(altUrl);
    
    if (altResponse.data && altResponse.data.results && Array.isArray(altResponse.data.results) && altResponse.data.results.length > 0) {
      const result = altResponse.data.results[0];
      
      return {
        fi: result.vernacularName?.fi ? capitalize(result.vernacularName.fi) : null,
        sv: result.vernacularName?.sv ? capitalize(result.vernacularName.sv) : null
      };
    }
    
    console.log(`No results found for ${latin} in laji.fi`);
    return { fi: null, sv: null };
  } catch (err) {
    console.error(`Laji.fi error for ${latin}:`, err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    return { fi: null, sv: null };
  }
}

async function fetchGBIFName(latin) {
  try {
    console.log(`Fetching English name for ${latin} from GBIF`);
    const match = await axios.get(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(latin)}`);
    
    if (!match.data.usageKey) {
      console.log(`No GBIF match found for ${latin}`);
      return null;
    }
    
    console.log(`GBIF match found for ${latin}, usageKey: ${match.data.usageKey}`);
    
    const vernacular = await axios.get(`https://api.gbif.org/v1/species/${match.data.usageKey}/vernacularNames`);
    
    if (vernacular.data && vernacular.data.results) {
      const eng = vernacular.data.results.find(e => e.language === "eng");
      
      if (eng && eng.vernacularName) {
        console.log(`Found English name: ${eng.vernacularName}`);
        return capitalize(eng.vernacularName);
      }
    }
    
    console.log(`No English vernacular name found for ${latin}`);
    return null;
  } catch (err) {
    console.error(`GBIF error for ${latin}:`, err.message);
    return null;
  }
}

module.exports = {
  formatLatinName,
  capitalize,
  fetchEstonianWikiName,
  fetchLajiFiNames,
  fetchGBIFName
};