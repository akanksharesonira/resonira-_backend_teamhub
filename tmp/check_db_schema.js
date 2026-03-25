const sequelize = require('../src/config/database');
const { LeaveType, Leave } = require('../src/database/models');


async function checkSchema() {
  try {
    const [results] = await sequelize.query("DESCRIBE leave_requests");
    console.log("leave_requests table structure:");
    console.log(JSON.stringify(results, null, 2));

    const [types] = await sequelize.query("SELECT * FROM leave_types");
    console.log("\nleave_types records:");
    console.log(JSON.stringify(types, null, 2));

    const [fks] = await sequelize.query(`
      SELECT 
          COLUMN_NAME, 
          CONSTRAINT_NAME, 
          REFERENCED_TABLE_NAME, 
          REFERENCED_COLUMN_NAME
      FROM
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
          TABLE_NAME = 'leave_requests' 
          AND TABLE_SCHEMA = '${sequelize.config.database}'
          AND REFERENCED_TABLE_NAME IS NOT NULL;
    `);
    const fs = require('fs');
    const output = {
      leave_requests_structure: results,
      leave_types_records: types,
      foreign_keys: fks
    };
    fs.writeFileSync('tmp/schema_output.json', JSON.stringify(output, null, 2));
    console.log("Results written to tmp/schema_output.json");

  } catch (error) {
    console.error("Error checking schema:", error);
  } finally {
    await sequelize.close();
  }
}

checkSchema();
