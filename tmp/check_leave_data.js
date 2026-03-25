const sequelize = require('../src/config/database');

async function checkData() {
  try {
    const [leaves] = await sequelize.query(`
      SELECT lr.*, lt.name as leave_type_name 
      FROM leave_requests lr 
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id 
      LIMIT 10
    `);
    console.log("Recent leave requests:");
    const fs = require('fs');
    fs.writeFileSync('tmp/leave_data_output.json', JSON.stringify(leaves, null, 2));
    console.log("Results written to tmp/leave_data_output.json");
  } catch (error) {
    console.error("Error checking data:", error);
  } finally {
    await sequelize.close();
  }
}

checkData();
