/**
 * Fix the chat_messages.sender_id FK from employees.id → users.id.
 *
 * The Sequelize ORM model defines:
 *   Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' })
 * but the MySQL table has a FK constraint pointing to employees.id.
 *
 * This migration aligns the database with the ORM.
 */
const sequelize = require('../src/config/database');

async function run() {
  try {
    // Step 1: Drop the incorrect FK constraint
    console.log('Dropping chat_messages_ibfk_2 (sender_id → employees.id)...');
    await sequelize.query('ALTER TABLE chat_messages DROP FOREIGN KEY chat_messages_ibfk_2');
    console.log('✅ Dropped.');

    // Step 2: Add the correct FK constraint (sender_id → users.id)
    console.log('Adding FK: sender_id → users.id...');
    await sequelize.query(
      'ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_fk FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE'
    );
    console.log('✅ Added new FK: chat_messages.sender_id → users.id');

    // Step 3: Verify existing data — any messages with sender_id not in users?
    const [orphans] = await sequelize.query(
      'SELECT m.id, m.sender_id FROM chat_messages m LEFT JOIN users u ON m.sender_id = u.id WHERE u.id IS NULL'
    );
    if (orphans.length > 0) {
      console.log(`⚠️ ${orphans.length} orphaned message(s) found. Updating their sender_id...`);
      for (const o of orphans) {
        // sender_id was probably an employee.id, find the user_id for that employee
        const [emp] = await sequelize.query(
          'SELECT user_id FROM employees WHERE id = ?', { replacements: [o.sender_id] }
        );
        if (emp.length > 0) {
          await sequelize.query(
            'UPDATE chat_messages SET sender_id = ? WHERE id = ?', { replacements: [emp[0].user_id, o.id] }
          );
          console.log(`  Fixed msg ${o.id}: ${o.sender_id} → ${emp[0].user_id}`);
        }
      }
    } else {
      console.log('✅ No orphaned messages.');
    }

    console.log('\n✅ Migration complete.');
  } catch (e) {
    console.error('Migration failed:', e.message);
    if (e.message.includes("check that it exists")) {
      console.log('The FK constraint may already have been updated. Checking...');
      const [fks] = await sequelize.query(
        "SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'sender_id' AND REFERENCED_TABLE_NAME IS NOT NULL"
      );
      fks.forEach(f => console.log(`  FK: ${f.CONSTRAINT_NAME} → ${f.REFERENCED_TABLE_NAME}`));
    }
  }
  process.exit(0);
}

run();
