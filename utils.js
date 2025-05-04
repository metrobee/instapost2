// utils.js

const axios = require('axios');
const NodeCache = require('node-cache');

// Create a cache with 24-hour TTL
const apiCache = new NodeCache({ stdTTL: 86400 });

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
    
    // Try the FinBIF API directly with token (most reliable)
    try {
      const url = `https://api.laji.fi/v0/taxa/${encodeURIComponent(latin)}?lang=multi&langFallback=true&access_token=${LAJI_FI_TOKEN}`;
      console.log(`Trying FinBIF direct API: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.data && response.data.vernacularName) {
        const names = {
          fi: response.data.vernacularName.fi ? capitalize(response.data.vernacularName.fi) : null,
          sv: response.data.vernacularName.sv ? capitalize(response.data.vernacularName.sv) : null
        };
        
        if (names.fi || names.sv) {
          console.log(`Found names from FinBIF: FI=${names.fi}, SV=${names.sv}`);
          apiCache.set(cacheKey, names);
          return names;
        }
      }
    } catch (err) {
      console.error(`Error with FinBIF direct API: ${err.message}`);
    }
    
    // Try the laji.fi search API
    try {
      const url = `https://api.laji.fi/v0/taxa/search?query=${encodeURIComponent(latin)}&matchType=exact&includePayload=true&onlyFungi=true&access_token=${LAJI_FI_TOKEN}`;
      console.log(`Trying laji.fi search API: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        
        if (result.payload && result.payload.vernacularName) {
          const names = {
            fi: result.payload.vernacularName.fi ? capitalize(result.payload.vernacularName.fi) : null,
            sv: result.payload.vernacularName.sv ? capitalize(result.payload.vernacularName.sv) : null
          };
          
          if (names.fi || names.sv) {
            console.log(`Found names from laji.fi search: FI=${names.fi}, SV=${names.sv}`);
            apiCache.set(cacheKey, names);
            return names;
          }
        }
      }
    } catch (err) {
      console.error(`Error with laji.fi search API: ${err.message}`);
    }
    
    // Try the public laji.fi API
    try {
      const url = `https://laji.fi/api/taxa/${encodeURIComponent(latin)}?lang=multi`;
      console.log(`Trying public laji.fi API: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.data && response.data.vernacularName) {
        const names = {
          fi: response.data.vernacularName.fi ? capitalize(response.data.vernacularName.fi) : null,
          sv: response.data.vernacularName.sv ? capitalize(response.data.vernacularName.sv) : null
        };
        
        if (names.fi || names.sv) {
          console.log(`Found names from public laji.fi: FI=${names.fi}, SV=${names.sv}`);
          apiCache.set(cacheKey, names);
          return names;
        }
      }
    } catch (err) {
      console.error(`Error with public laji.fi API: ${err.message}`);
    }
    
    // Try to get names from Finnish Wikipedia
    try {
      console.log(`Trying Finnish Wikipedia for ${latin}`);
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
      
      // Skip if page doesn't exist (negative page ID)
      if (!fiPageId.startsWith('-')) {
        const fiPage = fiPages?.[fiPageId];
        const fiContent = fiPage?.revisions?.[0]?.['*'];
        
        if (fiContent) {
          // Try different patterns for Finnish names
          const patterns = [
            /'''([^']+)'''/,
            /\(suomeksi ([^)]+)\)/i,
            /suomenkielinen nimi on ([^.]+)/i
          ];
          
          for (const pattern of patterns) {
            const fiMatch = fiContent.match(pattern);
            if (fiMatch && fiMatch[1]) {
              const fiName = capitalize(fiMatch[1].trim());
              console.log(`Found Finnish name from Wikipedia: ${fiName}`);
              
              // Continue looking for Swedish name
              let svName = null;
              try {
                console.log(`Trying Swedish Wikipedia for ${latin}`);
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
                
                // Skip if page doesn't exist
                if (!svPageId.startsWith('-')) {
                  const svPage = svPages?.[svPageId];
                  const svContent = svPage?.revisions?.[0]?.['*'];
                  
                  if (svContent) {
                    // Try different patterns for Swedish names
                    const svPatterns = [
                      /'''([^']+)'''/,
                      /\(på svenska: ([^)]+)\)/i,
                      /svenska namnet är ([^.]+)/i
                    ];
                    
                    for (const pattern of svPatterns) {
                      const svMatch = svContent.match(pattern);
                      if (svMatch && svMatch[1]) {
                        svName = capitalize(svMatch[1].trim());
                        console.log(`Found Swedish name from Wikipedia: ${svName}`);
                        break;
                      }
                    }
                  }
                }
              } catch (svErr) {
                console.error(`Swedish Wikipedia error: ${svErr.message}`);
              }
              
              const names = { fi: fiName, sv: svName };
              apiCache.set(cacheKey, names);
              return names;
            }
          }
        }
      }
    } catch (err) {
      console.error(`Finnish Wikipedia error: ${err.message}`);
    }
    
    // Try to get names from Swedish Wikipedia only if we haven't found Finnish name
    try {
      console.log(`Trying Swedish Wikipedia for ${latin}`);
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
      
      // Skip if page doesn't exist
      if (!svPageId.startsWith('-')) {
        const svPage = svPages?.[svPageId];
        const svContent = svPage?.revisions?.[0]?.['*'];
        
        if (svContent) {
          // Try different patterns for Swedish names
          const svPatterns = [
            /'''([^']+)'''/,
            /\(på svenska: ([^)]+)\)/i,
            /svenska namnet är ([^.]+)/i
          ];
          
          for (const pattern of svPatterns) {
            const svMatch = svContent.match(pattern);
            if (svMatch && svMatch[1]) {
              const svName = capitalize(svMatch[1].trim());
              console.log(`Found Swedish name from Wikipedia: ${svName}`);
              const names = { fi: null, sv: svName };
              apiCache.set(cacheKey, names);
              return names;
            }
          }
        }
      }
    } catch (err) {
      console.error(`Swedish Wikipedia error: ${err.message}`);
    }
    
    // If all attempts fail, return empty result and cache it
    console.log(`No Finnish or Swedish names found for ${latin}`);
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
    
    // Try GBIF API first
    try {
      const match = await axios.get(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(latin)}`);
      
      if (match.data.usageKey) {
        console.log(`GBIF match found for ${latin}, usageKey: ${match.data.usageKey}`);
        
        const vernacular = await axios.get(`https://api.gbif.org/v1/species/${match.data.usageKey}/vernacularNames`);
        
        if (vernacular.data && vernacular.data.results) {
          // Try multiple language codes for English
          const engNames = vernacular.data.results.filter(e => 
            e.language === "eng" || e.language === "en" || e.language === "en-GB" || e.language === "en-US"
          );
          
          if (engNames.length > 0) {
            const name = capitalize(engNames[0].vernacularName);
            console.log(`Found English name from GBIF: ${name}`);
            apiCache.set(cacheKey, name);
            return name;
          }
        }
      }
    } catch (err) {
      console.error(`GBIF API error: ${err.message}`);
    }
    
    // Try iNaturalist API
    try {
      console.log(`Trying iNaturalist for ${latin}`);
      const inatResponse = await axios.get(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(latin)}&limit=1`);
      
      if (inatResponse.data && inatResponse.data.results && inatResponse.data.results.length > 0) {
        const taxon = inatResponse.data.results[0];
        if (taxon.preferred_common_name) {
          const name = capitalize(taxon.preferred_common_name);
          console.log(`Found English name from iNaturalist: ${name}`);
          apiCache.set(cacheKey, name);
          return name;
        }
      }
    } catch (err) {
      console.error(`iNaturalist API error: ${err.message}`);
    }
    
    // Try English Wikipedia
    try {
      console.log(`Trying English Wikipedia for ${latin}`);
      // First try the summary API
      try {
        const wikiResponse = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(latin)}`);
        
        if (wikiResponse.data && wikiResponse.data.extract) {
          const extract = wikiResponse.data.extract;
          
          // Look for common name patterns
          const commonNamePatterns = [
            /commonly known as (?:the )?([\w\s-]+)[,\.]/i,
            /known as (?:the )?([\w\s-]+)[,\.]/i,
            /called (?:the )?([\w\s-]+)[,\.]/i
          ];
          
          for (const pattern of commonNamePatterns) {
            const match = extract.match(pattern);
            if (match && match[1]) {
              const name = capitalize(match[1].trim());
              console.log(`Found English name from Wikipedia extract: ${name}`);
              apiCache.set(cacheKey, name);
              return name;
            }
          }
        }
      } catch (err) {
        console.error(`Wikipedia summary API error: ${err.message}`);
      }
      
      // If summary API fails, try the content API
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
      
      // Skip if page doesn't exist
      if (!enPageId.startsWith('-')) {
        const enPage = enPages?.[enPageId];
        const enContent = enPage?.revisions?.[0]?.['*'];
        
        if (enContent) {
          // Look for common name patterns in Wikipedia articles
          const commonNamePatterns = [
            /'''[^']*'''\s*\(([^)]+)\)/,
            /commonly known as (?:the )?([\w\s-]+)[,\.]/i,
            /known as (?:the )?([\w\s-]+)[,\.]/i,
            /called (?:the )?([\w\s-]+)[,\.]/i
          ];
          
          for (const pattern of commonNamePatterns) {
            const match = enContent.match(pattern);
            if (match && match[1]) {
              // Clean up the name (remove "or" and text after it)
              let name = match[1].split(/\s+or\s+/)[0].trim();
              // Remove any remaining parentheses
              name = name.replace(/\([^)]*\)/g, '').trim();
              
              const finalName = capitalize(name);
              console.log(`Found English name from Wikipedia content: ${finalName}`);
              apiCache.set(cacheKey, finalName);
              return finalName;
            }
          }
        }
      }
    } catch (err) {
      console.error(`English Wikipedia error: ${err.message}`);
    }
    
    // Try Mushroom Observer as a last resort
    try {
      console.log(`Trying Mushroom Observer for ${latin}`);
      const moResponse = await axios.get(`https://mushroomobserver.org/api/names?format=json&name=${encodeURIComponent(latin)}`);
      
      if (moResponse.data && moResponse.data.results && moResponse.data.results.length > 0) {
        const result = moResponse.data.results[0];
        if (result.vernacular_names && result.vernacular_names.eng) {
          const name = capitalize(result.vernacular_names.eng);
          console.log(`Found English name from Mushroom Observer: ${name}`);
          apiCache.set(cacheKey, name);
          return name;
        }
      }
    } catch (err) {
      console.error(`Mushroom Observer error: ${err.message}`);
    }
    
    console.log(`No English vernacular name found for ${latin}`);
    apiCache.set(cacheKey, null);
    return null;
  } catch (err) {
    console.error(`Error fetching English name: ${err.message}`);
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