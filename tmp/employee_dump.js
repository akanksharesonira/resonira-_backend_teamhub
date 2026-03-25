const path = require('path');
const root = 'c:\\Users\\DELL\\Desktop\\Team_hub_2';
const sequelize = require(path.join(root, 'src/config/database'));

async function check() {
  try {
    const [r] = await sequelize.query("SELECT id, first_name, last_name, dob, joining_date FROM employees");
    console.log("Employees Count:", r.length);
    console.log("Employees Data:", JSON.stringify(r.map(e => ({ id:e.id, name: `${e.first_name} ${e.last_name}`, dob: e.dob, joining_date: e.joining_date })), null, 2));
  } catch (e) {
    console.error("Check failed:", e.message);
  } finally {
    process.exit(0);
  }
}
check();
