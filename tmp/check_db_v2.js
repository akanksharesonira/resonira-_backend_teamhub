const sequelize = require('../src/config/database');

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
    
    console.log("FOREIGN_KEYS_START");
    console.log(JSON.stringify(fks, null, 2));
    console.log("FOREIGN_KEYS_END");

    const [cols] = await sequelize.query("DESCRIBE tasks");
    console.log("COLUMNS_START");
    console.log(JSON.stringify(cols, null, 2));
    console.log("COLUMNS_END");

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
