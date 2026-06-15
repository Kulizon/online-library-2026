const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const rentalRoutes = require('./routes/rentals');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.use('/api/rentals', rentalRoutes);

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`RentalService running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start RentalService:', error.message);
  process.exit(1);
});
