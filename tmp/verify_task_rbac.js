const taskController = require('../src/api/v1/controllers/task.controller');
const { Task, User, Employee } = require('../src/database/models');

async function verify() {
  try {
    console.log("--- Starting Task RBAC Verification ---");

    // Mock request and response
    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(data) { this.data = data; return this; }
    };

    // 1. Test getAll for an Employee
    const employeeUser = { id: 2, role: 'employee' }; // Assuming User ID 2 is an employee
    const reqEmployee = {
      user: employeeUser,
      query: { page: 1, limit: 10 }
    };

    console.log(`\nTesting getAll for Employee (User ID ${employeeUser.id})...`);
    await taskController.getAll(reqEmployee, res);
    console.log("Response Data:", JSON.stringify(res.data, null, 2));
    
    if (res.data && res.data.success) {
      const tasks = res.data.data;

      console.log(`Fetched ${tasks.length} tasks.`);
      const allAssignedToMe = tasks.every(t => t.assigned_to === employeeUser.id);
      if (allAssignedToMe) {
        console.log("✅ SUCCESS: All tasks are assigned to the employee.");
      } else {
        console.log("❌ FAILURE: Found tasks NOT assigned to the employee!");
        tasks.filter(t => t.assigned_to !== employeeUser.id).forEach(t => {
          console.log(`- Task ID ${t.id} is assigned to ${t.assigned_to}`);
        });
      }
    } else {
      console.error("❌ API Error:", res.data ? res.data.message : "Unknown error");
    }

    // 2. Test getAll for HR
    const hrUser = { id: 1, role: 'hr' }; // Assuming User ID 1 is HR
    const reqHR = {
      user: hrUser,
      query: { page: 1, limit: 10 }
    };

    console.log(`\nTesting getAll for HR (User ID ${hrUser.id})...`);
    await taskController.getAll(reqHR, res);
    
    if (res.data && res.data.status === 'success') {
      const tasks = res.data.data;
      console.log(`Fetched ${tasks.length} tasks.`);
      const hasOthersTasks = tasks.some(t => t.assigned_to !== hrUser.id);
      if (hasOthersTasks) {
        console.log("✅ SUCCESS: HR can see tasks assigned to others.");
      } else {
        console.log("⚠️ INFO: HR only sees their own tasks (maybe no others exist?).");
      }
    }

  } catch (error) {
    console.error("Verification error:", error);
  } finally {
    process.exit(0);
  }
}

verify();
