const callingService = require('../../../services/calling.service');
const webrtcService = require('../../../services/webrtc.service');
const { success, error } = require('../../../utils/response');

const initiateCall = async (req, res) => {
  try {
    const call = await callingService.initiateCall(req.user.id, req.body);
    return success(res, call, 'Call initiated', 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const joinCall = async (req, res) => {
  try {
    const call = await callingService.joinCall(req.params.id, req.user.id);
    return success(res, call, 'Joined call');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const leaveCall = async (req, res) => {
  try {
    const call = await callingService.leaveCall(req.params.id, req.user.id);
    return success(res, call, 'Left call');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const endCall = async (req, res) => {
  try {
    const call = await callingService.endCall(req.params.id, req.user.id);
    return success(res, call, 'Call ended');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getCallHistory = async (req, res) => {
  try {
    const result = await callingService.getCallHistory(req.user.id, req.query);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getIceServers = async (req, res) => {
  try {
    const config = webrtcService.getConfiguration();
    return success(res, config);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { initiateCall, joinCall, leaveCall, endCall, getCallHistory, getIceServers };
