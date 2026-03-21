// Stub for future cloud recording integration (AWS Chime / Kurento / mediasoup)
module.exports = {
  startRecording: async (roomId) => {
    return { status: 'recording', url: null };
  },
  stopRecording: async (roomId) => {
    return { status: 'stopped', url: 's3://bucket/recording.mp4' };
  }
};
