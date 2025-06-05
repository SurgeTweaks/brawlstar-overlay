const express = require('express');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://TON-PROJET-ID.firebaseio.com' // remplace ici
});

const db = admin.database();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const API_KEY = 'VOTRE_CLÉ_API_BRAWLSTARS';

async function getPlayerData(tag) {
  const url = `https://api.brawlstars.com/v1/players/${encodeURIComponent(tag)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// Get current tag
app.get('/api/tag', async (req, res) => {
  const snapshot = await db.ref('currentTag').once('value');
  res.json({ tag: snapshot.val() });
});

// Set new tag
app.post('/api/tag', async (req, res) => {
  const { tag } = req.body;
  await db.ref('currentTag').set(tag);
  res.sendStatus(200);
});

// Get stats from Brawl Stars API
app.get('/api/stats/:tag', async (req, res) => {
  try {
    const tag = req.params.tag;
    const data = await getPlayerData(tag);
    res.json({
      name: data.name,
      trophies: data.trophies,
      club: data.club
    });
  } catch (err) {
    res.status(500).json({ error: 'API Brawl Stars', details: err });
  }
});

// Get winstreak
app.get('/api/winstreak/:tag', async (req, res) => {
  const tag = req.params.tag;
  const snapshot = await db.ref(`winstreaks/${tag}`).once('value');
  const record = snapshot.val();
  if (record) {
    res.json(record);
  } else {
    res.json({ current: 0, best: 0, lastTrophies: null });
  }
});

// Update winstreak automatically based on trophies
app.post('/api/check/:tag', async (req, res) => {
  const tag = req.params.tag;
  const data = await getPlayerData(tag);
  const trophies = data.trophies;

  const ref = db.ref(`winstreaks/${tag}`);
  const snapshot = await ref.once('value');
  let record = snapshot.val();

  if (!record) {
    record = { current: 0, best: 0, lastTrophies: trophies };
  } else {
    const diff = trophies - record.lastTrophies;
    if (diff > 0) {
      record.current += 1;
      if (record.current > record.best) record.best = record.current;
    } else if (diff < 0) {
      record.current = 0;
    }
    record.lastTrophies = trophies;
  }

  await ref.set(record);
  res.json(record);
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
