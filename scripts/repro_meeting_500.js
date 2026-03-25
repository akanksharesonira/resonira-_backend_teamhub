const { Meeting, MeetingParticipant, User } = require('./src/database/models');
const { Op } = require('sequelize');

async function testMeetings() {
  const userId = 1; // Try with admin or an existing user
  try {
    const { count, rows } = await Meeting.findAndCountAll({
      include: [
        {
          model: MeetingParticipant,
          as: 'participants',
          required: false
        }
      ],
      where: {
        [Op.or]: [
          { organizer_id: userId },
          { '$participants.user_id$': userId }
        ]
      },
      limit: 10,
      offset: 0,
      distinct: true
    });
    console.log('Success! Count:', count);
  } catch (err) {
    console.error('Failed with error:', err.message);
    if (err.sql) console.log('SQL:', err.sql);
  }
}

testMeetings();
