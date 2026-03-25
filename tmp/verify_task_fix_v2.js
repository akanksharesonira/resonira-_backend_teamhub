const path = require('path');
const root = path.resolve(__dirname, '..');
const employeeController = require(path.join(root, 'src/api/v1/controllers/employee.controller'));
const taskController = require(path.join(root, 'src/api/v1/controllers/task.controller'));
const { Task, User, Employee, Department, Designation } = require(path.join(root, 'src/database/models'));

async function verify() {
  try {
    console.log("--- Starting Production API Verification ---");

    const res = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(data) { this.data = data; return this; }
    };

    // 1. Test Departments Endpoint
    console.log("\nTesting GET /employees/departments...");
    await employeeController.getDepartments({}, res);
    console.log("Response success:", res.data.success);
    if (res.data.success) {
      console.log("Departments found:", res.data.data.length);
    }

    // 2. Test Designations Endpoint
    console.log("\nTesting GET /employees/designations...");
    await employeeController.getDesignations({}, res);
    console.log("Response success:", res.data.success);
    if (res.data.success) {
      console.log("Designations found:", res.data.data.length);
    }

    // 3. Test Task Creation with assignedTo
    console.log("\nTesting Task Creation with assignedTo (camelCase)...");
    const mockUser = { id: 1, role: 'admin' };
    
    // Ensure an employee with ID 2 exists or use ID 1
    const testEmployee = await Employee.findOne();
    if (!testEmployee) {
        console.log("❌ No employees found in DB to test assignment!");
        process.exit(1);
    }
    const empId = testEmployee.id;

    const reqCreate = {
      user: mockUser,
      body: {
        title: "Test Task Scoping V2",
        description: "Verify assignedTo population",
        assignedTo: empId,
        priority: 'high'
      }
    };

    await taskController.create(reqCreate, res);
    console.log("Task Create Status:", res.statusCode);
    if (res.data && res.data.success) {
      const task = res.data.data;
      console.log("Saved Task ID:", task.id);
      console.log("Population Check (assignedTo):", JSON.stringify(task.assignedTo, null, 2));
      
      if (task.assignedTo && task.assignedTo.name && task.assignedTo.department) {
        console.log("✅ SUCCESS: Task assignedTo is fully populated and camelCased.");
      } else {
        console.log("❌ FAILURE: assignedTo is missing or incomplete.");
      }
      
      if (task.assigned_to === undefined) {
        console.log("✅ SUCCESS: assigned_to (snake_case) is hidden from response.");
      }
    } else {
      console.log("❌ Create Failed:", res.data ? res.data.message : "No data");
    }

  } catch (error) {
    console.error("Verification error:", error);
  } finally {
    process.exit(0);
  }
}

verify();
