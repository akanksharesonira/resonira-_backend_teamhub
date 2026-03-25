const { User, Employee } = require('../src/database/models');
const { hashPassword } = require('../src/utils/encryption');

async function seedAdmin() {
  try {
    const email = 'admin@resonira.com';
    const password = 'Admin@123';
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('Admin user already exists. Updating password...');
      const password_hash = await hashPassword(password);
      await existingUser.update({ password_hash, role: 'admin' });
      console.log('Admin password updated successfully.');
    } else {
      console.log('Creating new admin user...');
      const password_hash = await hashPassword(password);
      const user = await User.create({
        email,
        password_hash,
        role: 'admin',
        is_active: true
      });

      await Employee.create({
        user_id: user.id,
        first_name: 'System',
        last_name: 'Administrator',
        employee_code: 'ADM00001',
        department_id: 1, // Defaulting to 1
        designation_id: 1, // Defaulting to 1
        status: 'active'
      });
      console.log('Admin user created successfully.');
    }
    
    console.log('\n-----------------------------------');
    console.log('Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('-----------------------------------\n');

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
