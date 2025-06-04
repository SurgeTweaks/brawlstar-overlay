const express = require('express');
const path = require('path');
const { getPlayerStats } = require('./api/brawlstars');
const { port } = require('./config');

const app = express();
const fs = require('fs');
const TAG_FILE = path.join(__dirname, 'tag.json');

// GET tag
app.get('/api/tag', (req, res) => {
  const data = fs.readFileSync(TAG_FILE, 'utf-8');
  const tag = JSON.parse(data).tag;
  res.json({ tag });
});

// POST tag (depuis admin)
app.use(express.json());
app.post('/api/tag', (req, res) => {
  const newTag = req.body.tag;
  if (!newTag || typeof newTag !== 'string') {
    return res.status(400).json({ error: 'Tag invalide' });
  }

  fs.writeFileSync(TAG_FILE, JSON.stringify({ tag: newTag }));
  res.json({ success: true, tag: newTag });
});


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
