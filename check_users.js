const { User } = require('./src/database/models');
async function run() {
  try {
    const users = await User.findAll({ attributes: ['id', 'email', 'first_name'] });
    console.log("Users:", users.map(u => u.toJSON()));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
