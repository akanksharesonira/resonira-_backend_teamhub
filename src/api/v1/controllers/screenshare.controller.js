const screenshareService = require('../../../services/screenshare.service');
const { success, error } = require('../../../utils/response');

const startSession = async (req, res) => {
  try {
    const session = await screenshareService.startSession({ ...req.body, shared_by: req.user.id });
    return success(res, session, 'Screen share started', 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const stopSession = async (req, res) => {
  try {
    const session = await screenshareService.stopSession(req.params.id, req.user.id);
    return success(res, session, 'Screen share stopped');
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getActiveByCall = async (req, res) => {
  try {
    const sessions = await screenshareService.getActiveByCallId(req.params.callId);
    return success(res, sessions);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { startSession, stopSession, getActiveByCall };
