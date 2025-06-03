// create-user.js
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'steve',
  host: 'localhost',
  database: 'calorie_tracker',
  password: 'yourpassword', // update if needed
  port: 5432,
});

async function createUser() {
  const name = 'Steve';
  const email = 'steve@example.com';
  const password = 'password123';
  const dailyGoal = 2000;

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, daily_calorie_goal) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, passwordHash, dailyGoal]
    );
    console.log('✅ User created:', result.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating user:', err);
    process.exit(1);
  }
}

createUser();
