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
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Utils
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

// API TAG
app.get('/api/tag', (req, res) => {
  const data = readJSON(TAG_FILE);
  res.json({ tag: data.tag });
});

app.post('/api/tag', (req, res) => {
  const { tag } = req.body;
  if (!tag || typeof tag !== 'string') return res.status(400).json({ error: 'Tag invalide' });
  writeJSON(TAG_FILE, { tag });
  res.json({ success: true, tag });
});

// API STATS
app.get('/api/stats/:tag', async (req, res) => {
  try {
    const data = await getPlayerStats(req.params.tag);
    res.json(data);
  } catch (err) {
    console.error('Erreur API:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur API Brawl Stars' });
  }
});

// API WINSTREAK
app.get('/api/winstreak/:tag', (req, res) => {
  const tag = decodeURIComponent(req.params.tag);
  const all = readJSON(WINSTREAK_FILE);
  res.json(all[tag] || { current: 0, best: 0 });
});

app.post('/api/winstreak/:tag', (req, res) => {
  const tag = decodeURIComponent(req.params.tag);
  const { current } = req.body;
  if (typeof current !== 'number') return res.status(400).json({ error: "Invalid value" });

  const all = readJSON(WINSTREAK_FILE);
  const best = Math.max(current, all[tag]?.best || 0);
  all[tag] = { current, best };
  writeJSON(WINSTREAK_FILE, all);
  res.json(all[tag]);
});

// Index fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${port}`);
});
