const callSession = require('./call.session');
const screenshareSession = require('./screenshare.session');
const signalingHandler = require('./signaling.handler');
const roomManager = require('./room.manager');

class CallingModule {
  initialize(io) {
    this.io = io;
    
    io.on('connection', (socket) => {
      if (!socket.user) return;
      
      // Attach handlers specific to the calling module
      signalingHandler.register(socket, io);
      roomManager.register(socket, io);
      callSession.register(socket, io);
      screenshareSession.register(socket, io);
    });
    
    return this;
  }
}

module.exports = new CallingModule();
