const path = require('path');
const root = 'c:\\Users\\DELL\\Desktop\\Team_hub_2';
const sequelize = require(path.join(root, 'src/config/database'));

async function searchAll() {
  try {
    const [tables] = await sequelize.query("SHOW TABLES");
    const dbName = 'resonira_db';
    const tableNames = tables.map(t => t[`Tables_in_${dbName}`]);

    for (const tableName of tableNames) {
      try {
        const [columns] = await sequelize.query(`DESCRIBE ${tableName}`);
        const stringCols = columns
          .filter(c => c.Type.includes('char') || c.Type.includes('text'))
          .map(c => c.Field);
        
        if (stringCols.length === 0) continue;

        const whereClause = stringCols.map(c => `${c} LIKE '%Abhishek%' OR ${c} LIKE '%Palle%' OR ${c} LIKE '%Sri Rama%'`).join(' OR ');
        const [r] = await sequelize.query(`SELECT * FROM ${tableName} WHERE ${whereClause}`);
        
        if (r && r.length > 0) {
          console.log(`FOUND IN TABLE [${tableName}]:`, JSON.stringify(r, null, 2));
        }
      } catch (err) {
        // Skip tables that don't have the columns we expect or other errors
      }
    }
  } catch (e) {
    console.error("Global search failed:", e.message);
  } finally {
    process.exit(0);
  }
}
searchAll();
