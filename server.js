import express from 'express';
import apiRoutes from './src/routes/api.js';
import indexRoutes from './src/routes/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Redirect Routes
app.use('/', indexRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
