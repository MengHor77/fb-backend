const express = require('express');
const cors = require('cors');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/profile', profileRoutes);

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));