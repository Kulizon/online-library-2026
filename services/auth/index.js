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

async function ensureBootstrapAdmin() {
  const { User } = require('./models');
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;

  const existing = await User.findOne({ where: { email: ADMIN_EMAIL } });
  if (existing) return;

  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.create({
    email: ADMIN_EMAIL,
    password: hash,
    firstName: ADMIN_FIRST_NAME || 'System',
    lastName: ADMIN_LAST_NAME || 'Admin',
    role: 'admin',
  });
  console.log(`Bootstrap admin created: ${ADMIN_EMAIL}`);
}

sequelize.sync().then(async () => {
  await ensureBootstrapAdmin();
  app.listen(PORT, () => {
    console.log(`AuthService running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start AuthService:', error.message);
  process.exit(1);
});
