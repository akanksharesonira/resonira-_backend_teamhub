const path = require('path');
const root = path.resolve(__dirname, '..');
require(path.join(root, 'src/config/database')); // initialize DB connection
const meetingController = require(path.join(root, 'src/api/v1/controllers/meeting.controller'));

async function verify() {
  try {
    console.log("--- Starting Meeting POST Verification ---");

    const req = {
      user: { id: 1 }, // Assuming user with ID 1 exists
      body: {
        title: "Test Meeting",
        description: "Checking date/time parsing",
        date: "25-03-2026",
        time: "14:30",
        participants: [2, 3]
      }
    };

    const res = {
      statusCode: 0,
      status: function(s) { this.statusCode = s; return this; },
      json: function(data) { this.data = data; return this; }
    };

    await meetingController.create(req, res);
    
    console.log("Create Status:", res.statusCode);
    if (res.statusCode === 201) {
      console.log("✅ SUCCESS: Meeting created");
      console.log("start_time evaluated to:", res.data.data.start_time);
      console.log("end_time evaluated to:", res.data.data.end_time);
    } else {
      console.error("❌ FAILURE:", res.data);
    }

  } catch (error) {
    console.error("Verification error:", error.message || error);
  } finally {
    process.exit(0);
  }
}

verify();
