const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const supabase = require('./config/db');
const apiRoutes = require('./routes/api');
const bcrypt = require('bcryptjs');

dotenv.config();

// Run the seeder function to initialize admin user
seedData();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compatibility Middleware: Inject _id for frontend compatibility with MongoDB client-side structures
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    const addUnderscoreId = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(item => addUnderscoreId(item));
        return;
      }
      if (obj.id !== undefined && obj._id === undefined) {
        obj._id = obj.id;
      }
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (obj[key] && typeof obj[key] === 'object') {
            addUnderscoreId(obj[key]);
          }
        }
      }
    };
    addUnderscoreId(body);
    return originalJson.call(this, body);
  };
  next();
});

app.use('/api', apiRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

async function seedData() {
  try {
    const { data: adminExists, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'gowdaroshan49@gmail.com')
      .maybeSingle();

    if (checkError) throw checkError;

    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('OnePiece@#6362', salt);
      
      const { error: createError } = await supabase
        .from('users')
        .insert([{
          name: 'System Admin',
          email: 'gowdaroshan49@gmail.com',
          password_hash,
          employee_id: 'ADMIN001',
          department: 'Administration',
          designation: 'Principal',
          role: 'admin',
          status: 'approved'
        }]);

      if (createError) throw createError;
      console.log('Seeded default admin account: gowdaroshan49@gmail.com / OnePiece@#6362');
    }
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
}
