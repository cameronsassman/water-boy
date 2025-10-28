const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.NEON_URL,
  ssl: { rejectUnauthorized: false },
});

async function fetchAllTables() {
  try {
    await client.connect();
    console.log('✅ Connected to Neon');

    // Get all tables from the public schema
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    const tables = tablesResult.rows.map(row => row.table_name);

    if (tables.length === 0) {
      console.log('⚠️ No tables found in your public schema.');
      return;
    }

    console.log(`📋 Found ${tables.length} tables:`, tables.join(', '));

    for (const table of tables) {
      try {
        console.log(`⬇️ Fetching data from ${table}...`);

        // Wrap table names in double quotes to preserve casing
        const result = await client.query(`SELECT * FROM "${table}"`);

        // Save each table to a separate JSON file
        const filename = `${table}.json`;
        fs.writeFileSync(filename, JSON.stringify(result.rows, null, 2));

        console.log(`💾 Saved ${result.rows.length} rows to ${filename}`);
      } catch (innerError) {
        console.error(`❌ Error fetching data from ${table}:`, innerError.message);
      }
    }

    console.log('✅ All tables exported successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fetchAllTables();
