const sequelize = require('./src/config/database');
async function search() {
  try {
    const tables = ['tasks', 'holidays', 'meetings', 'calendar_events'];
    for (const t of tables) {
      console.log(`Checking table ${t}...`);
      const [r] = await sequelize.query(`SELECT * FROM ${t} WHERE title LIKE '%Palle%' OR title LIKE '%Abhishek%' OR title LIKE '%Sri Rama%'`);
      if (r && r.length > 0) {
        console.log(`Found in ${t}:`, JSON.stringify(r, null, 2));
      }
    }
  } catch (e) {
    console.error("Search failed:", e.message);
  } finally {
    process.exit(0);
  }
}
search();
