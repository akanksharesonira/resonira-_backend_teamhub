const sequelize = require('../src/config/database');
const fs = require('fs');

async function check() {
  try {
    const [fks] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'tasks' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    const [cols] = await sequelize.query("DESCRIBE tasks");
    
    const report = {
        foreignKeys: fks,
        columns: cols
    };

    fs.writeFileSync('./tmp/db_report.json', JSON.stringify(report, null, 2));
    console.log("Report written to ./tmp/db_report.json");

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
