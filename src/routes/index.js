import express from 'express';
import db from '../db/db.js';

const router = express.Router();

// GET /:code
router.get('/:code', (req, res) => {
  try {
    const { code } = req.params;

    const link = db.prepare('SELECT id, original_url, password FROM links WHERE short_code = ?').get(code);

    if (!link) {
      return res.status(404).send('Link not found');
    }

    if (link.password) {
      // It has a password, redirect to decrypt page
      return res.redirect(302, `/decrypt/${code}`);
    }

    const referrer = req.get('Referer') || null;
    const userAgent = req.get('User-Agent') || null;

    // Asynchronously log the click
    const logClick = () => {
      try {
        db.prepare('INSERT INTO clicks (link_id, referrer, user_agent) VALUES (?, ?, ?)').run(link.id, referrer, userAgent);
      } catch (err) {
        console.error('Error logging click:', err);
      }
    };
    
    // Defer the execution so the redirect happens immediately
    setImmediate(logClick);

    return res.redirect(302, link.original_url);
  } catch (error) {
    console.error('Error resolving link:', error);
    return res.status(500).send('Internal server error');
  }
});

export default router;
