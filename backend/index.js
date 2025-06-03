// index.js (backend)
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dayjs = require('dayjs'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || {
    user: 'steve',
    host: 'localhost',
    database: 'calorie_tracker',
    password: 'yourpassword',
    port: 5432,
  }
});

// Enable SSL if in production
if (process.env.NODE_ENV === 'production') {
  pool.ssl = { rejectUnauthorized: false };
}

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(cors({
  origin: CLIENT_URL
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// -------------------- AUTH MIDDLEWARE --------------------

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
}

// -------------------- AUTH ROUTES --------------------

app.post('/api/register', async (req, res) => {
  const { name, email, password, daily_calorie_goal } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, daily_calorie_goal) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, password_hash, daily_calorie_goal]
    );
    res.json({ message: 'User registered', userId: result.rows[0].id });
  } catch (err) {
    console.error('❌ Error registering user:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user.id });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// -------------------- PROTECTED ROUTES --------------------

app.get('/api/users/:userId', authenticateToken, async (req, res) => {
  if (parseInt(req.params.userId) !== req.userId) return res.sendStatus(403);
  try {
    const result = await pool.query('SELECT id, name, email, daily_calorie_goal FROM users WHERE id = $1', [req.userId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.get('/api/entries/:userId/:date', authenticateToken, async (req, res) => {
  const { userId, date } = req.params;
  if (parseInt(userId) !== req.userId) return res.sendStatus(403);
  const result = await pool.query(`
    SELECT SUM(calories) AS total_calories
    FROM consumed_items ci
    JOIN daily_entries de ON ci.daily_entry_id = de.id
    WHERE de.user_id = $1 AND de.entry_date = $2
  `, [userId, date]);
  res.json({ total_calories: result.rows[0].total_calories || 0 });
});

app.get('/api/entries/grouped/:userId/:date', async (req, res) => {
  const { userId, date } = req.params;
  try {
    const result = await pool.query(`
      SELECT f.description, ci.food_id, COUNT(*) AS times_scanned,
             SUM(ci.portion_weight) AS total_weight, SUM(ci.calories) AS total_calories,
             f.image_url
      FROM consumed_items ci
      JOIN daily_entries de ON ci.daily_entry_id = de.id
      JOIN foods f ON ci.food_id = f.id
      WHERE de.user_id = $1 AND de.entry_date = $2
      GROUP BY f.description, ci.food_id, f.image_url
      ORDER BY f.description
    `, [userId, date]);
    console.log('Grouped entries response:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 Error in /api/entries/grouped:', err);
    res.status(500).json({ error: 'Failed to fetch grouped entries' });
  }
});

app.get('/api/entries/list/:userId/:date', async (req, res) => {
  const { userId, date } = req.params;
  try {
    const result = await pool.query(`
      SELECT ci.id, f.description, ci.portion_weight, ci.calories, f.image_url
      FROM consumed_items ci
      JOIN daily_entries de ON ci.daily_entry_id = de.id
      JOIN foods f ON ci.food_id = f.id
      WHERE de.user_id = $1 AND de.entry_date = $2
      ORDER BY ci.time_added DESC
    `, [userId, date]);
    console.log('List entries response:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 Error in /api/entries/list:', err);
    res.status(500).json({ error: 'Failed to fetch list entries' });
  }
});

app.get('/api/history/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await pool.query(`
    SELECT de.entry_date, SUM(ci.calories) AS total_calories
    FROM daily_entries de
    JOIN consumed_items ci ON ci.daily_entry_id = de.id
    WHERE de.user_id = $1
    GROUP BY de.entry_date
    ORDER BY de.entry_date DESC
  `, [userId]);
  res.json(result.rows);
});

app.post('/api/entries', async (req, res) => {
  try {
    const { user_id, barcode, portion_weight, date } = req.body;
    const foodRes = await pool.query(
      'SELECT id, calories_per_gram FROM foods WHERE barcode = $1',
      [barcode]
    );
    if (foodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Food not found' });
    }
    const { id: food_id, calories_per_gram } = foodRes.rows[0];
    const calories = portion_weight * calories_per_gram;

    let dailyEntry = await pool.query(
      'SELECT id FROM daily_entries WHERE user_id = $1 AND entry_date = $2',
      [user_id, date]
    );
    if (dailyEntry.rows.length === 0) {
      dailyEntry = await pool.query(
        'INSERT INTO daily_entries (user_id, entry_date) VALUES ($1, $2) RETURNING id',
        [user_id, date]
      );
    }

    const daily_entry_id = dailyEntry.rows[0].id;

    await pool.query(
      'INSERT INTO consumed_items (daily_entry_id, food_id, portion_weight, calories) VALUES ($1, $2, $3, $4)',
      [daily_entry_id, food_id, portion_weight, calories]
    );

    res.json({ message: 'Entry added', calories });
  } catch (err) {
    console.error('🔥 Error saving entry:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM consumed_items WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/foods', async (req, res) => {
  const { description, barcode, calories_per_gram, portion_weight, requires_manual_weight } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO foods (description, barcode, calories_per_gram, portion_weight, requires_manual_weight) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [description, barcode, calories_per_gram, portion_weight, requires_manual_weight]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error adding food:', err);
    res.status(500).json({ error: 'Failed to add food' });
  }
});

app.get('/api/foods', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM foods ORDER BY description');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching foods:', err);
    res.status(500).json({ error: 'Failed to fetch foods' });
  }
});

app.get('/api/foods/:barcode', async (req, res) => {
  const { barcode } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM foods WHERE barcode = $1',
      [barcode]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Food not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching food by barcode:', err);
    res.status(500).json({ error: 'Failed to fetch food' });
  }
});

app.delete('/api/foods/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM foods WHERE id = $1', [req.params.id]);
    res.json({ message: 'Food deleted' });
  } catch (err) {
    console.error('Error deleting food:', err);
    res.status(500).json({ error: 'Failed to delete food' });
  }
});

// Weekly summary: total calories for current week
app.get('/api/weekly-summary/:userId/:start/:end', async (req, res) => {
  const { userId, start, end } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        SUM(ci.calories) AS total_calories
      FROM daily_entries de
      JOIN consumed_items ci ON ci.daily_entry_id = de.id
      WHERE de.user_id = $1 AND de.entry_date BETWEEN $2 AND $3
    `, [userId, start, end]);

    res.json({ total_calories: result.rows[0].total_calories || 0 });
  } catch (err) {
    console.error('🔥 Error fetching weekly summary:', err);
    res.status(500).json({ error: 'Failed to fetch weekly summary' });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password, daily_calorie_goal } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, daily_calorie_goal) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, password_hash, daily_calorie_goal]
    );
    res.json({ message: 'User registered', userId: result.rows[0].id });
  } catch (err) {
    console.error('❌ Error registering user:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user.id });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
}

// Update food image
app.patch('/api/foods/:id/image', async (req, res) => {
  const { id } = req.params;
  const { image_url } = req.body;

  try {
    await pool.query(
      'UPDATE foods SET image_url = $1 WHERE id = $2',
      [image_url, id]
    );
    res.json({ message: 'Image updated successfully' });
  } catch (err) {
    console.error('Error updating food image:', err);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// Update user profile
app.patch('/api/users/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { name, email, currentPassword, newPassword, daily_calorie_goal } = req.body;
  
  // Verify user is updating their own profile
  if (parseInt(userId) !== req.userId) {
    return res.sendStatus(403);
  }

  try {
    // If changing password, verify current password
    if (newPassword) {
      const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (newPassword) {
      const password_hash = await bcrypt.hash(newPassword, 10);
      updates.push(`password_hash = $${paramCount}`);
      values.push(password_hash);
      paramCount++;
    }

    if (daily_calorie_goal) {
      updates.push(`daily_calorie_goal = $${paramCount}`);
      values.push(daily_calorie_goal);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, email, daily_calorie_goal
    `;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));