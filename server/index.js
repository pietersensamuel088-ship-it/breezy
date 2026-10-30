import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getOrDownloadTrack } from './downloader.js';
import { streamAudioFile } from './streamer.js';
import { pool, initDatabase } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'breezy_super_secret_jwt_key_2026';

app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize PostgreSQL on startup
initDatabase();

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Breezy Proxmox Master Streamer',
    version: '1.0.0',
    mode: 'on-demand-autonomous',
    timestamp: new Date().toISOString(),
  });
});

// 2. On-Demand Stream Endpoint (Spotify-like: zero client disk space)
app.get('/api/stream', async (req, res) => {
  const { title = 'Under the Influence', artist = 'Chris Brown' } = req.query;

  try {
    // Proxmox server checks local disk or downloads autonomously
    const trackPath = await getOrDownloadTrack(String(title), String(artist));
    streamAudioFile(trackPath, req, res);
  } catch (err) {
    console.error('[Stream Error]', err);
    res.status(500).send('Streaming error on Proxmox backend.');
  }
});

// 3. User Registration (PostgreSQL + bcrypt)
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username and password (min 6 chars) required.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, role, created_at',
      [username.trim(), passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ message: 'User registered successfully', user, token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username is already taken.' });
    }
    res.status(500).json({ error: 'Database registration failed.' });
  }
});

// 4. User Login (PostgreSQL + bcrypt)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username.trim()]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = userResult.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      message: 'Logged in successfully',
      user: { id: user.id, username: user.username, role: user.role },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server login error.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  BREEZY PROXMOX AUDIO SERVER ONLINE ON PORT ${PORT}`);
  console.log(`  Streaming Mode: On-Demand Spotify Protocol`);
  console.log(`=======================================================`);
});
