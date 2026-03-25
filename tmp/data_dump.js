const path = require('path');
const root = 'c:\\Users\\DELL\\Desktop\\Team_hub_2';
const sequelize = require(path.join(root, 'src/config/database'));

async function check() {
  try {
    const [r] = await sequelize.query("SELECT id, first_name, last_name, date_of_birth, joining_date FROM employees");
    console.log(`Found ${r.length} employees.`);
    r.forEach(e => {
      console.log(`- ID ${e.id}: ${e.first_name} ${e.last_name} | DOB: ${e.date_of_birth} | JOIN: ${e.joining_date}`);
    });

    const [c] = await sequelize.query("SELECT id, title, start_date, user_id FROM calendar_events");
    console.log(`Found ${c.length} calendar events.`);
    c.forEach(ev => {
      console.log(`- ID ${ev.id}: ${ev.title} | START: ${ev.start_date} | USER: ${ev.user_id}`);
    });

  } catch (e) {
    console.error("Check failed:", e.message);
  } finally {
    process.exit(0);
  }
}
check();
