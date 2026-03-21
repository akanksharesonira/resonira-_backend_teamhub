module.exports = {
  register: (socket, io) => {
    socket.on('call_status_update', (data) => {
      // Logic handled via socket/call.socket.js
      // Module can add robust retry/heartbeat logic here
    });
  }
};
