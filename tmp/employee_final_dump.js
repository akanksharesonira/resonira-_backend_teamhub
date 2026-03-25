const path = require('path');
const root = 'c:\\Users\\DELL\\Desktop\\Team_hub_2';
const sequelize = require(path.join(root, 'src/config/database'));

async function check() {
  try {
    const [r] = await sequelize.query("SELECT id, first_name, last_name, date_of_birth, date_of_joining FROM employees");
    console.log("--- EMPLOYEES DUMP ---");
    r.forEach(e => {
      console.log(`ID: ${e.id} | Name: ${e.first_name} ${e.last_name} | DOB: ${e.date_of_birth} | JOIN: ${e.date_of_joining}`);
    });
    console.log("--- END DUMP ---");
  } catch (e) {
    console.error("Check failed:", e.message);
  } finally {
    process.exit(0);
  }
}
check();
