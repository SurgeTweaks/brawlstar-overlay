const express = require('express');
const path = require('path');
const { getPlayerStats } = require('./api/brawlstars');
const { port } = require('./config');

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/stats/:tag', async (req, res) => {
  try {
    const data = await getPlayerStats(req.params.tag);
    res.json(data);
  } catch (err) {
    console.error('Erreur API:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur API Brawl Stars' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${port}`);
});
