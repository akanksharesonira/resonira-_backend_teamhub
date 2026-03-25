const sequelize = require('../src/config/database');
const fs = require('fs');

async function check() {
  try {
    const [[result]] = await sequelize.query('SHOW CREATE TABLE tasks');
    const createSql = result['Create Table'];
    fs.writeFileSync('./tmp/tasks_schema.sql', createSql);
    console.log("Schema written to ./tmp/tasks_schema.sql");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
