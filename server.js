const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Vajalik CORS probleemide vältimiseks brauseris
const { formatLatinName, capitalize, fetchEstonianWikiName, fetchLajiFiNames, fetchGBIFName } = require('./utils'); // Eeldame, et sinu senine kood on failis utils.js

const app = express();
const port = 3000;

app.use(cors()); // Luba kõik CORS päringud (arenduseks)

// Loo API lõpp-punkt ladinakeelse nime vastuvõtmiseks
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

app.listen(port, () => {
  console.log(`Server töötab pordil ${port}`);
});

// Eralda sinu senised funktsioonid (formatLatinName, capitalize, fetch...) eraldi faili utils.js
// ja impordi need siia (nagu näidatud ülal)