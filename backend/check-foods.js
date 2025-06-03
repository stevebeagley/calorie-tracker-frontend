const pool = require('./db');

async function checkFoods() {
  try {
    const result = await pool.query('SELECT description, image_url FROM foods LIMIT 5');
    console.log('Sample foods from database:');
    console.log(result.rows);
  } catch (err) {
    console.error('Error checking foods:', err);
  } finally {
    await pool.end();
  }
}

checkFoods(); 