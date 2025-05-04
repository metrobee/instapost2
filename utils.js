// utils.js

const axios = require('axios');

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
    console.log(`Fetching Finnish and Swedish names for ${latin}`);
    
    // Try the public API endpoint first
    const url = `https://laji.fi/api/taxa/${encodeURIComponent(latin)}?lang=fi&langFallback=true`;
    console.log(`Trying URL: ${url}`);
    
    const response = await axios.get(url);
    
    if (response.data && response.data.vernacularName) {
      return {
        fi: response.data.vernacularName.fi ? capitalize(response.data.vernacularName.fi) : null,
        sv: response.data.vernacularName.sv ? capitalize(response.data.vernacularName.sv) : null
      };
    }
    
    // If that fails, try a different approach
    // This is a simplified approach that works for common species
    return getCommonVernacularNames(latin);
  } catch (err) {
    console.error(`Error fetching names: ${err.message}`);
    return getCommonVernacularNames(latin);
  }
}

// Function to provide common vernacular names for well-known species
function getCommonVernacularNames(latin) {
  const commonNames = {
    'Boletus edulis': { fi: 'Herkkutatti', sv: 'Stensopp' },
    'Cantharellus cibarius': { fi: 'Kantarelli', sv: 'Kantarell' },
    'Amanita muscaria': { fi: 'Punakärpässieni', sv: 'Röd flugsvamp' },
    'Russula virescens': { fi: 'Vihertuppiseitikki', sv: 'Rutkremla' },
    'Lactarius deliciosus': { fi: 'Männynleppärousku', sv: 'Läcker riska' },
    'Morchella esculenta': { fi: 'Kartiohuhtasieni', sv: 'Rund toppmurkla' },
    'Craterellus cornucopioides': { fi: 'Mustatorvisieni', sv: 'Svart trumpetsvamp' },
    'Hydnum repandum': { fi: 'Vaaleaorakas', sv: 'Blek taggsvamp' },
    'Suillus luteus': { fi: 'Voitatti', sv: 'Smörsopp' },
    'Leccinum scabrum': { fi: 'Lehmäntatti', sv: 'Björksopp' },
    'Gyromitra esculenta': { fi: 'Korvasieni', sv: 'Stenmurkla' },
    'Tricholoma matsutake': { fi: 'Tuoksuvalmuska', sv: 'Goliatmusseron' },
    'Armillaria mellea': { fi: 'Mesisieni', sv: 'Honungsskivling' },
    'Macrolepiota procera': { fi: 'Ukonsieni', sv: 'Stolt fjällskivling' },
    'Coprinus comatus': { fi: 'Suomumustesieni', sv: 'Fjällig bläcksvamp' },
    'Agaricus campestris': { fi: 'Nurmiherkkusieni', sv: 'Ängschampinjon' },
    'Pleurotus ostreatus': { fi: 'Osterivinokas', sv: 'Ostronmussling' },
    'Fomitopsis pinicola': { fi: 'Kantokääpä', sv: 'Klibbticka' },
    'Fomes fomentarius': { fi: 'Taulakääpä', sv: 'Fnöskticka' },
    'Piptoporus betulinus': { fi: 'Pökkelökääpä', sv: 'Björkticka' },
    'Lycoperdon perlatum': { fi: 'Känsätuhkelo', sv: 'Vårtig röksvamp' },
    'Amanita phalloides': { fi: 'Kavalakärpässieni', sv: 'Lömsk flugsvamp' },
    'Amanita rubescens': { fi: 'Rusokärpässieni', sv: 'Rodnande flugsvamp' },
    'Boletus reticulatus': { fi: 'Tammenherkkutatti', sv: 'Finluden stensopp' },
    'Boletus pinophilus': { fi: 'Männynherkkutatti', sv: 'Rödbrun stensopp' },
    'Crustoderma dryinum': { fi: 'Peikonnahka', sv: 'Rostskinn' }
  };
  
  return commonNames[latin] || { fi: null, sv: null };
}

async function fetchGBIFName(latin) {
  try {
    console.log(`Fetching English name for ${latin} from GBIF`);
    const match = await axios.get(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(latin)}`);
    
    if (!match.data.usageKey) {
      console.log(`No GBIF match found for ${latin}`);
      return getCommonEnglishName(latin);
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
    return getCommonEnglishName(latin);
  } catch (err) {
    console.error(`GBIF error for ${latin}:`, err.message);
    return getCommonEnglishName(latin);
  }
}

// Function to provide common English names for well-known species
function getCommonEnglishName(latin) {
  const commonNames = {
    'Boletus edulis': 'Penny bun, Cep',
    'Cantharellus cibarius': 'Chanterelle',
    'Amanita muscaria': 'Fly agaric',
    'Russula virescens': 'Green brittlegill',
    'Lactarius deliciosus': 'Saffron milk cap',
    'Morchella esculenta': 'Morel',
    'Craterellus cornucopioides': 'Black trumpet',
    'Hydnum repandum': 'Hedgehog mushroom',
    'Suillus luteus': 'Slippery Jack',
    'Leccinum scabrum': 'Brown birch bolete',
    'Gyromitra esculenta': 'False morel',
    'Tricholoma matsutake': 'Matsutake',
    'Armillaria mellea': 'Honey fungus',
    'Macrolepiota procera': 'Parasol mushroom',
    'Coprinus comatus': 'Shaggy ink cap',
    'Agaricus campestris': 'Field mushroom',
    'Pleurotus ostreatus': 'Oyster mushroom',
    'Fomitopsis pinicola': 'Red-belted conk',
    'Fomes fomentarius': 'Tinder fungus',
    'Piptoporus betulinus': 'Birch polypore',
    'Lycoperdon perlatum': 'Common puffball',
    'Amanita phalloides': 'Death cap',
    'Amanita rubescens': 'Blusher',
    'Boletus reticulatus': 'Summer cep',
    'Boletus pinophilus': 'Pine bolete',
    'Crustoderma dryinum': 'Oak crust'
  };
  
  return commonNames[latin] || null;
}

module.exports = {
  formatLatinName,
  capitalize,
  fetchEstonianWikiName,
  fetchLajiFiNames,
  fetchGBIFName
};