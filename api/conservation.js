// API endpoint for conservation status
const express = require('express');
const router = express.Router();
const axios = require('axios');

// API tokens
const IUCN_API_TOKEN = '9bb4facb6d23f48efbf424bb05c0c1ef1cf6f468393bc745d42179ac4aca5fee'; // Example token, replace with your own

// API endpoint to get conservation status
router.get('/', async (req, res) => {
  const latinName = req.query.name;
  
  if (!latinName) {
    return res.status(400).json({ error: 'Latin name is required' });
  }
  
  try {
    const status = await fetchConservationStatus(latinName);
    res.json(status);
  } catch (error) {
    console.error('Error fetching conservation status:', error);
    res.status(500).json({ error: 'Failed to fetch conservation status' });
  }
});

// Function to fetch conservation status from various sources
async function fetchConservationStatus(latinName) {
  try {
    // Try to get status from IUCN Red List
    const iucnStatus = await fetchFromIUCN(latinName);
    
    // Return results from all sources
    return {
      latinName: latinName,
      iucn: iucnStatus,
      // Add more sources as needed
    };
  } catch (error) {
    console.error('Error fetching conservation status:', error);
    return { latinName: latinName };
  }
}

// Fetch status from IUCN Red List
async function fetchFromIUCN(latinName) {
  try {
    // Note: This is a simplified example. The actual IUCN API requires registration
    // and has specific endpoints and parameters.
    const response = await axios.get(
      `https://apiv3.iucnredlist.org/api/v3/species/${encodeURIComponent(latinName)}?token=${IUCN_API_TOKEN}`
    );
    
    if (response.data && response.data.result) {
      return {
        status: response.data.result[0]?.category,
        source: 'IUCN Red List'
      };
    }
    return null;
  } catch (error) {
    console.error('IUCN error:', error.message);
    return null;
  }
}

module.exports = router;