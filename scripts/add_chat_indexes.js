/**
 * Migration: Add performance indexes for the chat system tables.
 * Run once: node scripts/add_chat_indexes.js
 */
const sequelize = require('../src/config/database');

async function addIndexes() {
  const indexes = [
    ['idx_chat_msg_sender',  'chat_messages',         '(sender_id)'],
    ['idx_chat_msg_conv',    'chat_messages',         '(conversation_id)'],
    ['idx_chat_msg_room',    'chat_messages',         '(chat_room_id)'],
    ['idx_chat_msg_created', 'chat_messages',         '(created_at)'],
    ['idx_conv_last_msg',    'conversations',         '(last_message_at)'],
  ];

  for (const [name, table, cols] of indexes) {
    try {
      await sequelize.query(`ALTER TABLE ${table} ADD INDEX ${name} ${cols}`);
      console.log(`✅ Created index: ${name}`);
    } catch (e) {
      if (e.message.includes('Duplicate')) {
        console.log(`⏩ Skipped (already exists): ${name}`);
      } else {
        console.error(`❌ Failed: ${name} — ${e.message}`);
      }
    }
  }

  // Composite unique index to prevent duplicate conversation memberships
  try {
    await sequelize.query(
      'ALTER TABLE conversation_members ADD UNIQUE INDEX idx_conv_member_unique (conversation_id, user_id)'
    );
    console.log('✅ Created unique index: idx_conv_member_unique');
  } catch (e) {
    if (e.message.includes('Duplicate')) {
      console.log('⏩ Skipped (already exists): idx_conv_member_unique');
    } else {
      console.error(`❌ Failed: idx_conv_member_unique — ${e.message}`);
    }
  }

  console.log('\n✅ Index migration complete.');
  process.exit(0);
}

addIndexes();
