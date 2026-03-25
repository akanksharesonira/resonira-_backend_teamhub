const { Meeting, MeetingParticipant, Task, Employee, Project, User } = require('../src/database/models');

async function testQueries() {
  try {
    console.log('Testing Meeting associations...');
    await Meeting.findAll({
      include: [{ model: MeetingParticipant, as: 'participants' }]
    });
    console.log('✅ Meeting associations OK');

    console.log('Testing Task associations...');
    await Task.findAll({
      include: [
        { model: Employee, as: 'assignee' },
        { model: Project, as: 'project' }
      ]
    });
    console.log('✅ Task associations OK');

    console.log('Testing Leave associations...');
    const { Leave, LeaveType } = require('../src/database/models');
    await Leave.findAll({
      include: [
        { model: Employee, as: 'employee' },
        { model: LeaveType, as: 'leaveType' }
      ]
    });
    console.log('✅ Leave associations OK');

  } catch (error) {
    console.error('❌ Query failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testQueries();
