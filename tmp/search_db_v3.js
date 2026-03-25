const path = require('path');
const root = 'c:\\Users\\DELL\\Desktop\\Team_hub_2';
const sequelize = require(path.join(root, 'src/config/database'));

async function search() {
  try {
    const tables = ['tasks', 'holidays', 'meetings', 'calendar_events'];
    for (const t of tables) {
      console.log(`Checking table ${t}...`);
      // Use name for holiday, title for others
      const nameCol = (t === 'holidays') ? 'name' : 'title';
      const [r] = await sequelize.query(`SELECT * FROM ${t} WHERE ${nameCol} LIKE '%Palle%' OR ${nameCol} LIKE '%Abhishek%' OR ${nameCol} LIKE '%Sri Rama%'`);
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
