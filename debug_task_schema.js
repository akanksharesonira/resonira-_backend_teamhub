const sequelize = require('./src/config/database');

async function checkSchema() {
  try {
    const [results] = await sequelize.query("DESCRIBE tasks");
    console.log("TASKS TABLE SCHEMA:");
    console.table(results);
    
    const [results2] = await sequelize.query("DESCRIBE employees");
    console.log("EMPLOYEES TABLE SCHEMA:");
    console.table(results2);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
