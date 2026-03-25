const path = require('path');
const root = path.resolve(__dirname, '..');
const taskController = require(path.join(root, 'src/api/v1/controllers/task.controller'));
const { Task, Employee, Project } = require(path.join(root, 'src/database/models'));

async function verify() {
  try {
    console.log("--- Starting Task Creation Verification ---");

    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(data) { this.data = data; return this; }
    };

    // 1. Get a valid employee
    const employee = await Employee.findOne();
    if (!employee) {
      console.error("❌ No employees found in DB!");
      process.exit(1);
    }

    // 2. Test Task Creation WITHOUT project_id
    console.log(`\nTesting task creation WITHOUT project_id for Employee ${employee.id}...`);
    const reqNoProject = {
      user: { id: 1, role: 'admin' },
      body: {
        title: "Task without Project",
        description: "Testing optional project_id",
        assignedTo: employee.id,
        priority: 'Medium'
      }
    };

    await taskController.create(reqNoProject, res);
    console.log("Response status:", res.statusCode);
    if (res.data && res.data.success) {
      console.log("✅ SUCCESS: Task created without project_id.");
    } else {
      console.log("❌ FAILURE:", res.data ? res.data.message : "No data");
    }

    // 3. Test Task Creation with INVALID project_id
    console.log("\nTesting task creation with INVALID project_id (9999)...");
    const reqInvalidProject = {
      user: { id: 1, role: 'admin' },
      body: {
        title: "Task with Invalid Project",
        description: "Testing invalid project_id handling",
        assignedTo: employee.id,
        priority: 'Low',
        project_id: 9999
      }
    };

    await taskController.create(reqInvalidProject, res);
    console.log("Response status:", res.statusCode);
    if (res.data && res.data.success) {
      console.log("✅ SUCCESS: Task created despite invalid project_id (manually set to null in controller).");
    } else {
      console.log("❌ FAILURE:", res.data ? res.data.message : "No data");
    }

  } catch (error) {
    console.error("Verification error:", error);
  } finally {
    process.exit(0);
  }
}

verify();
