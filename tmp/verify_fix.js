const leaveService = require('../src/services/leave.service');
const { Leave, LeaveType, Employee, User } = require('../src/database/models');

async function verify() {
  try {
    console.log("--- Starting Verification ---");

    // 1. Test case-insensitive string matching in applyLeave
    const testUserId = 2; // Assuming this user exists (checked in previous steps)
    const testData = {
      leave_type: 'sick', // lowercase
      start_date: '2026-10-01',
      end_date: '2026-10-02',
      reason: 'Verification Test'
    };

    console.log(`Applying for 'sick' leave for user ID ${testUserId}...`);
    try {
      const result = await leaveService.applyLeave(testUserId, testData);
      console.log("✅ applyLeave successful!");
      console.log("Stored leave_type_id:", result.leave_type_id);
      
      // Clean up the test leave
      await Leave.destroy({ where: { id: result.id } });
      console.log("Test leave record cleaned up.");
    } catch (err) {
      console.error("❌ applyLeave failed:", err.message);
    }

    // 2. Test data mapping in getMyLeaves
    console.log("\nFetching leaves to verify mapping...");
    const leaves = await leaveService.getMyLeaves(testUserId, { page: 1, limit: 1 });
    if (leaves.data.length > 0) {
      const firstLeave = leaves.data[0];
      console.log("✅ getMyLeaves returned data.");
      console.log("leave_type_name:", firstLeave.leave_type_name);
      console.log("leave_type (alias):", firstLeave.leave_type);
      
      if (firstLeave.leave_type_name && firstLeave.leave_type) {
        console.log("✅ Mapping is correct!");
      } else {
        console.log("❌ Mapping failed - fields are missing.");
      }
    } else {
      console.log("⚠️ No leaves found for testing mapping.");
    }

    console.log("\n--- Verification Finished ---");
  } catch (error) {
    console.error("Verification error:", error);
  } finally {
    process.exit(0);
  }
}

verify();
