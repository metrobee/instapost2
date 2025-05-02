// utils.js

const axios = require('axios');

function formatLatinName(input) {
  const [genus, species] = input.trim().split(" ");
  return `${capitalize(genus)} ${species.toLowerCase()}`;
}
function capitalize(str) {
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
    const searchRes = await axios.get(
      `https://laji.fi/api/taxa/search?query=${encodeURIComponent(latin)}&limit=1`
    );

    if (searchRes.data?.results && Array.isArray(searchRes.data.results) && searchRes.data.results.length > 0) {
      return {
        fi: capitalize(searchRes.data.results[0]?.vernacularName?.fi) || null,
        sv: capitalize(searchRes.data.results[0]?.vernacularName?.sv) || null
      };
    } else if (Array.isArray(searchRes.data) && searchRes.data.length > 0) {
      return {
        fi: capitalize(searchRes.data[0]?.vernacularName?.fi) || null,
        sv: capitalize(searchRes.data[0]?.vernacularName?.sv) || null
      };
    }
  } catch (err) {
    console.error("Laji.fi error:", err.response?.status, err.message, err.response?.data);
    return { fi: null, sv: null };
  }
  return { fi: null, sv: null };
}

async function fetchGBIFName(latin) {
  try {
    const match = await axios.get(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(latin)}`);
    if (!match.data.usageKey) return null;

    const vernacular = await axios.get(`https://api.gbif.org/v1/species/${match.data.usageKey}/vernacularNames`);
    const eng = vernacular.data.results.find(e => e.language === "eng");
    return eng?.vernacularName ? capitalize(eng.vernacularName) : null;
  } catch {
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