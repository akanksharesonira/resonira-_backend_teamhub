const sequelize = require('../src/config/database');
const employeeService = require('../src/services/employee.service');
const { User, Employee } = require('../src/database/models');
const { comparePassword } = require('../src/utils/encryption');

async function verifyUpdate() {
  try {
    console.log('--- VERIFYING MULTI-MODEL UPDATE ---');
    
    // 1. Find a test user (e.g., ADM00001 from earlier seeder)
    const emp = await Employee.findOne({ where: { id: 4 }, include: ['user'] }); // abhi@example.com is ID 6, Test Manager is ID 2
    if (!emp) {
      console.log('Employee with ID 4 not found. Trying ID 2...');
      const emp2 = await Employee.findByPk(2, { include: ['user'] });
      if (!emp2) throw new Error('No test employee found');
      return runTest(emp2);
    }
    await runTest(emp);

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    process.exit(0);
  }
}

async function runTest(emp) {
  const newPassword = 'UpdatedPassword@456';
  const newRole = 'manager';
  
  console.log(`Original: UserID=${emp.user_id}, Email=${emp.user.email}, Role=${emp.user.role}`);
  
  // 2. Perform update
  console.log(`Updating user ${emp.user.email} to role '${newRole}' and new password...`);
  const updatedEmp = await employeeService.update(emp.id, {
    password: newPassword,
    role: newRole,
    status: 'active'
  });
  
  // 3. Verify User model updated
  const updatedUser = await User.findByPk(emp.user_id);
  console.log(`Updated: UserID=${updatedUser.id}, Email=${updatedUser.email}, Role=${updatedUser.role}`);
  
  const isPasswordMatch = await comparePassword(newPassword, updatedUser.password_hash);
  console.log(`Password verification: ${isPasswordMatch ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Role verification: ${updatedUser.role === newRole ? 'SUCCESS' : 'FAILED'}`);
  
  if (isPasswordMatch && updatedUser.role === newRole) {
    console.log('\n✅ VERIFICATION SUCCESSFUL: Credentials and Roles are correctly synchronized!');
  } else {
    console.log('\n❌ VERIFICATION FAILED!');
  }
}

verifyUpdate();
