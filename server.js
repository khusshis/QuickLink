import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './src/routes/api.js';
import indexRoutes from './src/routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Serve Frontend static files
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Handle React Router specific paths BEFORE the redirect routes catch them
app.get(['/', '/stats/:code'], (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// Redirect Routes (catches /:code)
app.use('/', indexRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
