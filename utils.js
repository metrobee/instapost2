// utils.js

const axios = require('axios');
const NodeCache = require('node-cache');

// Create a cache with 24-hour TTL
const apiCache = new NodeCache({ stdTTL: 86400 });

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
  // Check cache first
  const cacheKey = `et_wiki_${latin}`;
  const cachedName = apiCache.get(cacheKey);
  if (cachedName !== undefined) {
    console.log(`Using cached Estonian name for ${latin}`);
    return cachedName;
  }

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
        const name = capitalize(redirectMatch[1].trim());
        apiCache.set(cacheKey, name);
        return name;
      }

      redirectMatch = content.match(/^#redirect\s*\[\[(.*?)\]\]/i);
      if (redirectMatch && redirectMatch[1]) {
        console.log(`Found Estonian name via redirect: ${redirectMatch[1].trim()}`);
        const name = capitalize(redirectMatch[1].trim());
        apiCache.set(cacheKey, name);
        return name;
      }

      const boldMatch = content.match(/^'''([A-ZÕÄÖÜÜŠŽa-zõäöüšž\\s\\-]+?)'''/);
      if (boldMatch && boldMatch[1]) {
        console.log(`Found Estonian name via bold text: ${boldMatch[1].trim()}`);
        const name = capitalize(boldMatch[1].trim());
        apiCache.set(cacheKey, name);
        return name;
      }
    }
    console.log(`No Estonian name found for ${latin}`);
    apiCache.set(cacheKey, null);
  } catch (err) {
    console.error(`Wikipedia error for ${latin}:`, err.message);
  }
  return null;
}

async function fetchLajiFiNames(latin) {
  // Check cache first
  const cacheKey = `laji_${latin}`;
  const cachedNames = apiCache.get(cacheKey);
  if (cachedNames !== undefined) {
    console.log(`Using cached Finnish/Swedish names for ${latin}`);
    return cachedNames;
  }

  try {
    console.log(`Fetching Finnish and Swedish names for ${latin}`);
    
    // Try multiple endpoints with different parameters
    const endpoints = [
      `https://laji.fi/api/taxa/${encodeURIComponent(latin)}?lang=fi&langFallback=true`,
      `https://laji.fi/api/taxa/search?q=${encodeURIComponent(latin)}&limit=1`,
      `https://api.laji.fi/v0/taxa?taxonomyId=MX.37600&lang=fi&langFallback=true&maxLevel=4&query=${encodeURIComponent(latin)}`
    ];
    
    for (const url of endpoints) {
      try {
        console.log(`Trying URL: ${url}`);
        const response = await axios.get(url);
        
        if (response.data && response.data.vernacularName) {
          const names = {
            fi: response.data.vernacularName.fi ? capitalize(response.data.vernacularName.fi) : null,
            sv: response.data.vernacularName.sv ? capitalize(response.data.vernacularName.sv) : null
          };
          
          // Cache the result
          apiCache.set(cacheKey, names);
          return names;
        }
        
        if (response.data && response.data.results && response.data.results.length > 0) {
          const result = response.data.results[0];
          if (result.vernacularName) {
            const names = {
              fi: result.vernacularName.fi ? capitalize(result.vernacularName.fi) : null,
              sv: result.vernacularName.sv ? capitalize(result.vernacularName.sv) : null
            };
            
            // Cache the result
            apiCache.set(cacheKey, names);
            return names;
          }
        }
      } catch (err) {
        console.error(`Error with endpoint ${url}: ${err.message}`);
        // Continue to next endpoint
      }
    }
    
    // Try to get names from Finnish Wikipedia
    try {
      const fiWiki = await axios.get(`https://fi.wikipedia.org/w/api.php`, {
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
      
      const fiPages = fiWiki.data?.query?.pages;
      const fiPageId = Object.keys(fiPages)[0];
      const fiPage = fiPages?.[fiPageId];
      const fiContent = fiPage?.revisions?.[0]?.['*'];
      
      if (fiContent) {
        const fiMatch = fiContent.match(/'''([^']+)'''/);
        if (fiMatch && fiMatch[1]) {
          const fiName = capitalize(fiMatch[1].trim());
          const names = { fi: fiName, sv: null };
          apiCache.set(cacheKey, names);
          return names;
        }
      }
    } catch (err) {
      console.error(`Finnish Wikipedia error: ${err.message}`);
    }
    
    // Try to get names from Swedish Wikipedia
    try {
      const svWiki = await axios.get(`https://sv.wikipedia.org/w/api.php`, {
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
      
      const svPages = svWiki.data?.query?.pages;
      const svPageId = Object.keys(svPages)[0];
      const svPage = svPages?.[svPageId];
      const svContent = svPage?.revisions?.[0]?.['*'];
      
      if (svContent) {
        const svMatch = svContent.match(/'''([^']+)'''/);
        if (svMatch && svMatch[1]) {
          const svName = capitalize(svMatch[1].trim());
          const names = { fi: null, sv: svName };
          apiCache.set(cacheKey, names);
          return names;
        }
      }
    } catch (err) {
      console.error(`Swedish Wikipedia error: ${err.message}`);
    }
    
    // If all attempts fail, return empty result and cache it
    const emptyResult = { fi: null, sv: null };
    apiCache.set(cacheKey, emptyResult);
    return emptyResult;
  } catch (err) {
    console.error(`Error fetching names: ${err.message}`);
    const emptyResult = { fi: null, sv: null };
    apiCache.set(cacheKey, emptyResult);
    return emptyResult;
  }
}

async function fetchGBIFName(latin) {
  // Check cache first
  const cacheKey = `gbif_${latin}`;
  const cachedName = apiCache.get(cacheKey);
  if (cachedName !== undefined) {
    console.log(`Using cached English name for ${latin}`);
    return cachedName;
  }

  try {
    console.log(`Fetching English name for ${latin} from GBIF`);
    const match = await axios.get(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(latin)}`);
    
    if (!match.data.usageKey) {
      console.log(`No GBIF match found for ${latin}`);
      apiCache.set(cacheKey, null);
      return null;
    }
    
    console.log(`GBIF match found for ${latin}, usageKey: ${match.data.usageKey}`);
    
    const vernacular = await axios.get(`https://api.gbif.org/v1/species/${match.data.usageKey}/vernacularNames`);
    
    if (vernacular.data && vernacular.data.results) {
      const eng = vernacular.data.results.find(e => e.language === "eng");
      
      if (eng && eng.vernacularName) {
        console.log(`Found English name: ${eng.vernacularName}`);
        const name = capitalize(eng.vernacularName);
        apiCache.set(cacheKey, name);
        return name;
      }
    }
    
    // Try English Wikipedia as a fallback
    try {
      const enWiki = await axios.get(`https://en.wikipedia.org/w/api.php`, {
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
      
      const enPages = enWiki.data?.query?.pages;
      const enPageId = Object.keys(enPages)[0];
      const enPage = enPages?.[enPageId];
      const enContent = enPage?.revisions?.[0]?.['*'];
      
      if (enContent) {
        // Look for common name patterns in Wikipedia articles
        const commonNamePatterns = [
          /'''[^']*'''\s*\(([^)]+)\)/,
          /commonly known as (?:the )?([\w\s-]+)[,\.]/i,
          /known as (?:the )?([\w\s-]+)[,\.]/i
        ];
        
        for (const pattern of commonNamePatterns) {
          const match = enContent.match(pattern);
          if (match && match[1]) {
            const name = capitalize(match[1].trim());
            apiCache.set(cacheKey, name);
            return name;
          }
        }
      }
    } catch (err) {
      console.error(`English Wikipedia error: ${err.message}`);
    }
    
    console.log(`No English vernacular name found for ${latin}`);
    apiCache.set(cacheKey, null);
    return null;
  } catch (err) {
    console.error(`GBIF error for ${latin}:`, err.message);
    apiCache.set(cacheKey, null);
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