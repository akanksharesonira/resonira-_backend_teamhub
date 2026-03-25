const path = require('path');
const root = path.resolve(__dirname, '..');
const taskController = require(path.join(root, 'src/api/v1/controllers/task.controller'));
const { Task, User, Employee } = require(path.join(root, 'src/database/models'));

async function verify() {
  try {
    console.log("--- Starting Task Refactor Verification ---");

    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(data) { this.data = data; return this; }
    };

    // 1. Get a valid user (for assignment)
    const testUser = await User.findOne({ where: { role: 'employee' } });
    if (!testUser) {
      console.error("❌ No users found in DB to test assignment!");
      process.exit(1);
    }
    const userId = testUser.id;

    // 2. Test Task Creation (POST /tasks) - Valid
    console.log(`\nTesting valid Task Creation for user ${userId}...`);
    const reqCreate = {
      user: { id: 1, _id: 1, role: 'admin' },
      body: {
        title: "Standardized Task",
        description: "Checking assignedTo and createdBy",
        assignedTo: userId,
        priority: 'high'
      }
    };

    await taskController.create(reqCreate, res);
    console.log("Create Status:", res.statusCode);
    if (res.data && res.data.success) {
      const task = res.data.data;
      console.log("Response assignedTo:", JSON.stringify(task.assignedTo, null, 2));
      if (task.assignedTo && task.assignedTo._id === userId && task.assignedTo.name && task.assignedTo.email) {
        console.log("✅ SUCCESS: assignedTo is populated with _id, name, email.");
      } else {
        console.log("❌ FAILURE: assignedTo population failed.");
      }
      
      if (task.assigned_to === undefined && task.assigned_by === undefined) {
        console.log("✅ SUCCESS: Legacy fields are removed from response.");
      }
    }

    // 3. Test Validation: Missing assignedTo
    console.log("\nTesting Validation: Missing assignedTo...");
    const reqMissing = { user: { id: 1, role: 'admin' }, body: { title: "Fail" } };
    await taskController.create(reqMissing, res);
    if (res.statusCode === 400 && res.data.message === 'assignedTo is required') {
      console.log("✅ SUCCESS: Correct 400 error for missing assignedTo.");
    } else {
        console.log("❌ FAILURE: Expected 400 'assignedTo is required', got", res.statusCode, res.data.message);
    }

    // 4. Test Validation: Non-existent employee (404)
    console.log("\nTesting Validation: Non-existent employee (404)...");
    const req404 = { user: { id: 1, role: 'admin' }, body: { title: "Fail", assignedTo: 99999 } };
    await taskController.create(req404, res);
    if (res.statusCode === 404 && res.data.message === 'Employee not found') {
      console.log("✅ SUCCESS: Correct 404 error for invalid assignedTo.");
    } else {
        console.log("❌ FAILURE: Expected 404 'Employee not found', got", res.statusCode, res.data.message);
    }

    // 5. Test Fetch API (GET /tasks)
    console.log("\nTesting Fetch API (GET /tasks) population...");
    await taskController.getAll({ user: { id: 1, role: 'admin' }, query: { limit: 1 } }, res);
    if (res.data && res.data.success && res.data.data.length > 0) {
        const task = res.data.data[0];
        console.log("First task assignedTo:", JSON.stringify(task.assignedTo, null, 2));
        if (task.assignedTo && task.assignedTo._id && task.assignedTo.name) {
            console.log("✅ SUCCESS: Fetch API correctly populates assignedTo.");
        }
    }

  } catch (error) {
    console.error("Verification error:", error);
  } finally {
    process.exit(0);
  }
}

verify();
