const path = require('path');
const root = path.resolve(__dirname, '..');
require(path.join(root, 'src/config/database'));
const { Calendar } = require(path.join(root, 'src/database/models'));

async function verifyFix() {
  try {
    console.log("Verifying Calendar Fix...");
    
    // Clear previous test data if any
    await Calendar.destroy({ where: { title: 'Fix Verification Event' } });

    const payload = {
      title: "Fix Verification Event",
      description: "Testing if all fields are saved",
      start_date: new Date(),
      end_date: new Date(Date.now() + 7200000),
      is_all_day: true, // Should map to all_day
      event_type: 'holiday', // Should be picked now
      color: '#00ff00', // Should be picked now
      location: 'Remote'
    };

    // We'll manually invoke the pickFields logic as it is internal to the controller
    // but better to test the actual controller if possible via a mock req/res
    const calendarController = require(path.join(root, 'src/api/v1/controllers/calendar.controller'));
    
    const req = {
      user: { id: 1 },
      body: payload
    };
    
    const res = {
      statusCode: 0,
      status: function(s) { this.statusCode = s; return this; },
      json: function(data) { this.data = data; return this; }
    };

    await calendarController.create(req, res);

    if (res.statusCode !== 201) {
      throw new Error(`Failed to create event: ${JSON.stringify(res.data)}`);
    }

    const eventId = res.data.data.id;
    const savedEvent = await Calendar.findByPk(eventId);
    const eventJson = savedEvent.toJSON();

    console.log("Saved Event:", eventJson);

    let success = true;
    if (eventJson.all_day !== true) {
      console.error("❌ FAILURE: all_day was not set from is_all_day");
      success = false;
    }
    if (eventJson.event_type !== 'holiday') {
      console.error("❌ FAILURE: event_type was ignored");
      success = false;
    }
    if (eventJson.color !== '#00ff00') {
      console.error("❌ FAILURE: color was ignored");
      success = false;
    }

    if (success) {
      console.log("✅ SUCCESS: All fields correctly mapped and stored in the database.");
    }

  } catch (err) {
    console.error("Verification Failed:", err);
  } finally {
    process.exit(0);
  }
}

verifyFix();
