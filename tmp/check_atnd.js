const path = require('path');
const root = 'c:\\Users\\DELL\\Desktop\\Team_hub_2';
const sequelize = require(path.join(root, 'src/config/database'));

async function check() {
  try {
    const [r] = await sequelize.query(`
      SELECT a.*, e.first_name, e.last_name 
      FROM attendance_logs a 
      JOIN employees e ON a.employee_id = e.id 
      WHERE e.first_name LIKE '%Abhishek%' 
         OR e.first_name LIKE '%Palle%' 
         OR e.first_name LIKE '%Sri Rama%'
         OR e.last_name LIKE '%marriage%'
    `);
    console.log("Attendance found:", JSON.stringify(r.map(a => ({ date:a.date, check_in:a.check_in, name: `${a.first_name} ${a.last_name}` })), null, 2));
  } catch (e) {
    console.error("Check failed:", e.message);
  } finally {
    process.exit(0);
  }
}
check();
