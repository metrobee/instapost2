// utils.js

const axios = require('axios');

// API tokens
const WIKI_API_TOKEN = ''; // Wikipedia doesn't require a token for basic usage
const LAJI_FI_TOKEN = '7QLHuUdYIx9MNIlnUVgYxND3mSzXGGXRNsscKazTuGgFjcCIlKxMJJHdvy1J6Z4o';
const GBIF_API_TOKEN = ''; // GBIF doesn't require a token for basic usage

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
      },
      headers: {
        'User-Agent': 'VernacularWebApp/1.0'
      }
    });
    const pages = wiki.data?.query?.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages?.[pageId];
    const content = page?.revisions?.[0]?.['*'];

    if (content) {
      let redirectMatch = content.match(/^#suuna\s*\[\[(.*?)\]\]/i);
      if (redirectMatch && redirectMatch[1]) {
        return capitalize(redirectMatch[1].trim());
      }

      redirectMatch = content.match(/^#redirect\s*\[\[(.*?)\]\]/i);
      if (redirectMatch && redirectMatch[1]) {
        return capitalize(redirectMatch[1].trim());
      }

      const boldMatch = content.match(/^'''([A-ZÕÄÖÜÜŠŽa-zõäöüšž\s\-]+?)'''/);
      if (boldMatch && boldMatch[1]) {
        return capitalize(boldMatch[1].trim());
      }
    }
  } catch (err) {
    console.error("Wikipedia error:", err.message);
  }
  return null;
}

async function fetchLajiFiNames(latin) {
  try {
    // Use the correct API endpoint and parameters
    const searchRes = await axios.get(
      `https://api.laji.fi/v0/taxa/search?query=${encodeURIComponent(latin)}&limit=1&includePayload=true&matchType=exact&access_token=${LAJI_FI_TOKEN}`
    );

    console.log('Laji.fi response:', JSON.stringify(searchRes.data, null, 2));

    if (searchRes.data && searchRes.data.results && Array.isArray(searchRes.data.results) && searchRes.data.results.length > 0) {
      const result = searchRes.data.results[0];
      return {
        fi: capitalize(result.vernacularName?.fi || '') || null,
        sv: capitalize(result.vernacularName?.sv || '') || null
      };
    }
    return { fi: null, sv: null };
  } catch (err) {
    console.error("Laji.fi error:", err.message);
    console.error("Laji.fi response status:", err.response?.status);
    console.error("Laji.fi response data:", err.response?.data);
    return { fi: null, sv: null };
  }
}

async function fetchGBIFName(latin) {
  try {
    const match = await axios.get(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(latin)}`);
    if (!match.data.usageKey) return null;

    const vernacular = await axios.get(`https://api.gbif.org/v1/species/${match.data.usageKey}/vernacularNames`);
    const eng = vernacular.data.results.find(e => e.language === "eng");
    return eng?.vernacularName ? capitalize(eng.vernacularName) : null;
  } catch (err) {
    console.error("GBIF error:", err.message);
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