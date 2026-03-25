const path = require('path');
const root = path.resolve(__dirname, '..');
require(path.join(root, 'src/config/database'));
const { Calendar } = require(path.join(root, 'src/database/models'));

async function testCreate() {
  try {
    console.log("Testing Calendar Creation...");
    const payload = {
      title: "Test Event",
      description: "Test Description",
      start_date: new Date(),
      end_date: new Date(Date.now() + 3600000),
      is_all_day: true, // Controller uses this
      event_type: 'holiday', // Controller misses this
      color: '#ff0000' // Controller misses this
    };

    // Simulate what the controller does:
    const ALLOWED_FIELDS = [
      'title',
      'description',
      'start_date',
      'end_date',
      'location',
      'is_all_day'
    ];
    
    const picked = Object.keys(payload)
      .filter((key) => ALLOWED_FIELDS.includes(key))
      .reduce((obj, key) => {
        obj[key] = payload[key];
        return obj;
      }, {});
    
    console.log("Picked Data:", picked);

    const event = await Calendar.create({
      ...picked,
      user_id: 1 // Assume user 1 exists
    });

    console.log("Created Event (from DB):", event.toJSON());
    
    if (event.all_day === false && payload.is_all_day === true) {
      console.log("❌ BUG CONFIRMED: all_day was not set correctly (mismatch with is_all_day)");
    }
    if (event.event_type !== payload.event_type) {
      console.log("❌ BUG CONFIRMED: event_type was ignored");
    }

  } catch (err) {
    console.error("Test Failed:", err);
  } finally {
    process.exit(0);
  }
}

testCreate();
