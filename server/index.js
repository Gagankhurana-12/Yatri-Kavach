const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store: { token: { lat, lng, updatedAt } }
const tokens = new Map();

const toRad = (d) => (d * Math.PI) / 180;
const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

app.get('/', (req, res) => res.json({ ok: true }));

app.post('/register', (req, res) => {
  const { token, lat, lng } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token required' });
  tokens.set(token, { lat: lat ?? null, lng: lng ?? null, updatedAt: Date.now() });
  res.json({ ok: true });
});

app.post('/updateLocation', (req, res) => {
  const { token, lat, lng } = req.body || {};
  if (!token || typeof lat !== 'number' || typeof lng !== 'number') return res.status(400).json({ error: 'token, lat, lng required' });
  if (!tokens.has(token)) tokens.set(token, { lat, lng, updatedAt: Date.now() });
  else tokens.set(token, { lat, lng, updatedAt: Date.now() });
  res.json({ ok: true });
});

app.post('/broadcast', async (req, res) => {
  const { lat, lng, radius = 500, title = 'SOS Alert', body = 'A nearby user needs help' } = req.body || {};
  if (typeof lat !== 'number' || typeof lng !== 'number') return res.status(400).json({ error: 'lat,lng required' });

  const recipients = [];
  for (const [token, info] of tokens) {
    if (!info.lat || !info.lng) continue;
    const dist = distanceMeters(lat, lng, info.lat, info.lng);
    if (dist <= radius) recipients.push(token);
  }

  if (!recipients.length) return res.json({ ok: true, sent: 0 });

  const chunks = [];
  for (let i = 0; i < recipients.length; i += 100) chunks.push(recipients.slice(i, i + 100));
  let sent = 0;
  for (const chunk of chunks) {
    const messages = chunk.map((to) => ({ to, sound: 'default', title, body, data: { type: 'sos', lat, lng } }));
    const resp = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    if (resp.ok) sent += messages.length;
  }

  res.json({ ok: true, sent });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));


