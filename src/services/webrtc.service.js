const { getIceServers } = require('../config/webrtc');

class WebRTCService {
  getConfiguration() {
    return {
      iceServers: getIceServers(),
      iceTransportPolicy: 'all',
    };
  }
}

module.exports = new WebRTCService();
