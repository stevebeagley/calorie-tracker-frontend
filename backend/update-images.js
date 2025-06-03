const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function updateImages() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', 'update_food_images.sql'),
      'utf8'
    );
    
    await pool.query(sql);
    console.log('✅ Food images updated successfully');
    
    // Check a few examples
    const result = await pool.query('SELECT description, image_url FROM foods LIMIT 3');
    console.log('\nExample updated foods:');
    console.log(result.rows);
  } catch (err) {
    console.error('❌ Update failed:', err);
  } finally {
    await pool.end();
  }
}

updateImages(); 