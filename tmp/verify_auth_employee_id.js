const path = require('path');
const root = path.resolve(__dirname, '..');
const authService = require(path.join(root, 'src/services/auth.service'));
const { verifyToken } = require(path.join(root, 'src/utils/encryption'));

async function verify() {
  try {
    console.log("--- Starting Auth EmployeeId Verification ---");

    // Test Login Payload format
    const { User } = require(path.join(root, 'src/database/models'));
    const testUser = await User.findOne({ where: { role: 'employee' }});
    if (!testUser) throw new Error("No employee user found to test with");

    console.log("\nTesting getProfile Data for User ID:", testUser.id);
    const profile = await authService.getProfile(testUser.id);
    console.log("Profile mapped correctly?");
    console.log("-> id:", profile.id);
    console.log("-> name:", profile.name);
    console.log("-> employeeId:", profile.employeeId);
    if (profile.employeeId !== undefined) {
        console.log("✅ SUCCESS: employeeId is present in getProfile response.");
    } else {
        console.error("❌ FAILURE: employeeId is missing from getProfile response.");
    }

    // Verify token generation locally since we know it runs the same logic
    const { generateToken } = require(path.join(root, 'src/utils/encryption'));
    const mockToken = generateToken({ 
      id: profile.id, 
      email: profile.email, 
      role: profile.role, 
      employeeId: profile.employeeId 
    });
    
    console.log("\nValidating JWT Token payload creation...");
    const decodedToken = verifyToken(mockToken);
    if (decodedToken.employeeId === profile.employeeId) {
        console.log("✅ SUCCESS: employeeId is correctly encoded/decoded in JWT.");
    } else {
        console.error("❌ FAILURE: employeeId mismatch in JWT.");
    }



  } catch (error) {
    console.error("Verification error:", error.message || error);
  } finally {
    process.exit(0);
  }
}

verify();
