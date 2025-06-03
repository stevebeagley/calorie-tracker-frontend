const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigration() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_image_url_to_foods.sql'),
      'utf8'
    );
    
    await pool.query(sql);
    console.log('✅ Migration completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration(); 