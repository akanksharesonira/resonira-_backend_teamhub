const { Message, Conversation, ConversationMember, User } = require('./src/database/models');
const fs = require('fs');

async function run() {
  try {
    const messages = await Message.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'sender', attributes: ['email'] }]
    });

    const conversations = await Conversation.findAll({
      limit: 5,
      include: [{ model: ConversationMember, as: 'members' }]
    });

    const report = {
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      recentMessages: messages.map(m => ({
        id: m.id,
        sender: m.sender?.email,
        text: m.content,
        conv: m.conversation_id,
        type: m.message_type,
        file: !!m.file_url
      })),
      conversations: conversations.map(c => ({
        id: c.id,
        members: c.members?.map(m => m.user_id)
      }))
    };

    fs.writeFileSync('/tmp/chat_debug.json', JSON.stringify(report, null, 2));
    console.log('✅ Debug report written to /tmp/chat_debug.json');
  } catch (err) {
    fs.writeFileSync('/tmp/chat_debug.json', JSON.stringify({ error: err.message, stack: err.stack }));
  }
}

run();
