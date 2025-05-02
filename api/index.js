const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { formatLatinName, capitalize, fetchEstonianWikiName, fetchLajiFiNames, fetchGBIFName } = require('../utils'); // NB! Tee kindlaks, et tee failini utils.js on õige

const app = express();

app.use(cors());

app.get('/api/vernacular', async (req, res) => {
  const latinName = req.query.latin;

  if (!latinName) {
    return res.status(400).json({ error: 'Palun sisesta ladinakeelne nimi.' });
  }

  const formatted = formatLatinName(latinName);

  const names = {
    et: await fetchEstonianWikiName(formatted),
    ...await fetchLajiFiNames(formatted),
    en: await fetchGBIFName(formatted),
  };

  res.json(names);
});

// Ekspordi Express app serverless funktsioonina
module.exports = async (req, res) => {
  await app(req, res);
};