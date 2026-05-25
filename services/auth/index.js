const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`AuthService running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start AuthService:', error.message);
  process.exit(1);
});
