import express from 'express';
import { customAlphabet } from 'nanoid';
import db from '../db/db.js';

const router = express.Router();

// Base62 alphabet for URL-friendly short codes
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 6);

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

// POST /api/shorten
router.post('/shorten', (req, res) => {
  try {
    const { url, customCode } = req.body;
    
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Valid http/https url is required.' });
    }

    let shortCode;

    if (customCode) {
      if (!/^[a-zA-Z0-9-]+$/.test(customCode) || customCode.length > 30) {
        return res.status(400).json({ error: 'Custom code can only contain letters, numbers, and dashes (max 30 chars).' });
      }
      
      const existing = db.prepare('SELECT id FROM links WHERE short_code = ?').get(customCode);
      if (existing) {
        return res.status(409).json({ error: 'Custom code is already in use.' });
      }
      shortCode = customCode;
    } else {
      let attempts = 0;
      const maxAttempts = 5;

      // Retry loop in case of collision
      while (attempts < maxAttempts) {
        shortCode = nanoid();
        const existing = db.prepare('SELECT id FROM links WHERE short_code = ?').get(shortCode);
        if (!existing) {
          break;
        }
        attempts++;
      }

      if (attempts === maxAttempts) {
        return res.status(500).json({ error: 'Failed to generate unique short code. Try again.' });
      }
    }

    // Insert new link
    const insert = db.prepare('INSERT INTO links (short_code, original_url, password) VALUES (?, ?, ?)');
    insert.run(shortCode, url, req.body.password || null);

    // Use BASE_URL environment variable if set, otherwise fallback to the current host
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const shortUrl = `${baseUrl}/${shortCode}`;

    return res.json({
      shortCode,
      shortUrl,
      originalUrl: url
    });
  } catch (error) {
    console.error('Error shortening URL:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/decrypt/:code
router.post('/decrypt/:code', (req, res) => {
  try {
    const { code } = req.params;
    const { password } = req.body;

    const link = db.prepare('SELECT id, original_url, password FROM links WHERE short_code = ?').get(code);

    if (!link) {
      return res.status(404).json({ error: 'Link not found.' });
    }

    if (link.password && link.password !== password) {
      return res.status(401).json({ error: 'ACCESS DENIED: Incorrect password.' });
    }

    // Log the click now that they have successfully decrypted it
    const referrer = req.get('Referer') || null;
    const userAgent = req.get('User-Agent') || null;
    try {
      db.prepare('INSERT INTO clicks (link_id, referrer, user_agent) VALUES (?, ?, ?)').run(link.id, referrer, userAgent);
    } catch (err) {
      console.error('Error logging click:', err);
    }

    return res.json({ originalUrl: link.original_url });
  } catch (error) {
    console.error('Error decrypting link:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/links/:code/stats
router.get('/links/:code/stats', (req, res) => {
  try {
    const { code } = req.params;

    const link = db.prepare('SELECT id, short_code, original_url, created_at FROM links WHERE short_code = ?').get(code);

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const clicks = db.prepare('SELECT timestamp, referrer, user_agent AS userAgent FROM clicks WHERE link_id = ? ORDER BY timestamp DESC').all(link.id);

    return res.json({
      shortCode: link.short_code,
      originalUrl: link.original_url,
      createdAt: link.created_at,
      totalClicks: clicks.length,
      clicks
    });
  } catch (error) {
    console.error('Error fetching link stats:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
