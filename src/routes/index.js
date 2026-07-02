import express from 'express';
import db from '../db/db.js';

const router = express.Router();

// GET /:code
router.get('/:code', (req, res) => {
  try {
    const { code } = req.params;

    const link = db.prepare('SELECT id, original_url FROM links WHERE short_code = ?').get(code);

    if (!link) {
      return res.status(404).send('Link not found');
    }

    const referrer = req.get('Referer') || null;
    const userAgent = req.get('User-Agent') || null;

    // Asynchronously log the click (do not await or block the response)
    // better-sqlite3 is synchronous, so it will briefly block the event loop, 
    // but the prompt says "do not let it block or delay the redirect response"
    // We can execute it after responding or in a setImmediate.
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
