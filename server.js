const express = require('express');
const path = require('path');
const fs = require('fs');
const { getPlayerStats } = require('./api/brawlstars');
const { port } = require('./config');

const app = express();

const TAG_FILE = path.join(__dirname, 'tag.json');
const WINSTREAK_FILE = path.join(__dirname, 'winstreaks.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// JSON utils
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return {};
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// API : TAG
app.get('/api/tag', (req, res) => {
  const data = readJSON(TAG_FILE);
  res.json({ tag: data.tag });
});

app.post('/api/tag', (req, res) => {
  const { tag } = req.body;
  if (!tag || typeof tag !== 'string') {
    return res.status(400).json({ error: 'Tag invalide' });
  }
  writeJSON(TAG_FILE, { tag });
  res.json({ success: true, tag });
});

// API : STATS
app.get('/api/stats/:tag', async (req, res) => {
  try {
    const data = await getPlayerStats(req.params.tag);
    res.json(data);
  } catch (err) {
    console.error('Erreur API:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur API Brawl Stars' });
  }
});

// API : WINSTREAK
app.get('/api/winstreak/:tag', (req, res) => {
  const tag = decodeURIComponent(req.params.tag);
  const all = readJSON(WINSTREAK_FILE);
  res.json(all[tag] || { current: 0, best: 0, lastTrophies: null });
});

app.post('/api/winstreak/:tag', (req, res) => {
  const tag = decodeURIComponent(req.params.tag);
  const { newTrophies } = req.body;

  if (typeof newTrophies !== 'number') {
    return res.status(400).json({ error: "newTrophies must be a number" });
  }

  const all = readJSON(WINSTREAK_FILE);
  const record = all[tag] || { current: 0, best: 0, lastTrophies: null };

  if (record.lastTrophies !== null) {
    const delta = newTrophies - record.lastTrophies;
    if (delta > 0) {
      record.current += 1;
    } else if (delta < 0) {
      record.current = 0;
    }
  }

  record.lastTrophies = newTrophies;
  record.best = Math.max(record.current, record.best);
  all[tag] = record;
  writeJSON(WINSTREAK_FILE, all);
  res.json(record);
});

// Route par défaut
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${port}`);
});