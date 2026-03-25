const path = require('path');
const root = path.resolve(__dirname, '..');
const sequelize = require(path.join(root, 'src/config/database'));
const taskController = require(path.join(root, 'src/api/v1/controllers/task.controller'));
const { Task, Employee, User } = require(path.join(root, 'src/database/models'));


async function verify() {
  try {
    console.log("--- Starting Task Compatibility Verification ---");

    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(data) { this.data = data; return this; }
    };

    // 1. Get an employee (to assign task to)
    const targetEmployee = await Employee.findOne({ attributes: ['id'] });
    if (!targetEmployee) {
        console.error("❌ No employees found in DB!");
        process.exit(1);
    }
    const empId = targetEmployee.id;

    // 2. Get a User for creator (who has an employee record)
    const creatorUser = await User.findOne({ 
        where: { role: 'admin' },
        include: [{ model: Employee, as: 'employee', required: true }]
    });
    if (!creatorUser) {
        console.error("❌ No admin/manager with an employee record found!");
        process.exit(1);
    }

    // 3. Test Task Creation with frontend-style payload:
    // - deadline (instead of due_date)
    // - assignedTo as object
    console.log("\nTesting Task Creation with complex payload...");
    const reqCreate = {
      user: { id: creatorUser.id, role: 'admin' },
      body: {
        title: "Compatibility Test Task",
        description: "Checking payload aliasing and object normalization",
        assignedTo: { _id: empId },
        deadline: "2026-12-31"
      }
    };

    await taskController.create(reqCreate, res);
    console.log("Create Status:", res.statusCode);
    if (res.data && res.data.success) {
      const task = res.data.data;
      console.log("✅ SUCCESS: Task created with deadline and object assignedTo.");
      console.log("AssignedTo in response:", JSON.stringify(task.assignedTo, null, 2));
      console.log("Due Date in response:", task.due_date);
      
      if (task.due_date === "2026-12-31") {
          console.log("✅ SUCCESS: deadline correctly mapped to due_date.");
      }
    } else {
        console.error("❌ FAILURE:", res.data);
    }

    // 4. Test Error Handling (Try / Catch 400)
    console.log("\nTesting Error Handling (Missing title)...");
    const reqFail = { user: { id: creatorUser.id }, body: { assignedTo: empId } };
    await taskController.create(reqFail, res);
    if (res.statusCode === 400) {
        console.log("✅ SUCCESS: Correct 400 error for missing title.");
    }

  } catch (error) {
    console.error("Verification error:", error);
  } finally {
    process.exit(0);
  }
}

verify();
