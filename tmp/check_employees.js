const path = require('path');
const root = 'c:\\Users\\DELL\\Desktop\\Team_hub_2';
const sequelize = require(path.join(root, 'src/config/database'));

async function check() {
  try {
    const [r] = await sequelize.query("SELECT * FROM employees WHERE first_name LIKE '%Palle%' OR first_name LIKE '%Sri Rama%' OR last_name LIKE '%marriage%' OR first_name LIKE '%Sri rama%'");
    console.log("Employees found:", JSON.stringify(r.map(e => ({ id:e.id, first_name:e.first_name, last_name:e.last_name, joining_date:e.joining_date })), null, 2));
  } catch (e) {
    console.error("Check failed:", e.message);
  } finally {
    process.exit(0);
  }
}
check();
