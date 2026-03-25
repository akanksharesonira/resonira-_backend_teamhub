const sequelize = require('../src/config/database');

async function check() {
  try {
    console.log("--- Database Constraints Check ---");
    
    const [fks] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'tasks' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log("Foreign Keys in 'tasks' table:");
    console.log(JSON.stringify(fks, null, 2));

    const [columns] = await sequelize.query("DESCRIBE tasks");
    console.log("\nColumns in 'tasks' table:");
    console.log(JSON.stringify(columns, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
