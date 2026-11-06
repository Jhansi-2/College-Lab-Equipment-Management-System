const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'College Lab Management API is running.' });
});

app.use('/api/equipment', require('./src/routes/equipment'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/issues', require('./src/routes/issues'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
