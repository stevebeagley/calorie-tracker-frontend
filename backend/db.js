const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'steve',
  host: 'localhost',
  database: 'calorie_tracker',
  password: 'pass',
  port: 5432,
});

module.exports = pool;

