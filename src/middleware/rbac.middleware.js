const { error } = require('../utils/response');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      console.log(`[RBAC] Forbidden: User Role="${req.user.role}", AllowedRoles=[${allowedRoles.join(', ')}]`);
      return error(res, 'Insufficient permissions', 403);
    }
    next();
  };
};

const authorizeOwnerOrRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required', 401);
    }
    const isOwner = req.params.id && parseInt(req.params.id) === req.user.id;
    if (isOwner || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return error(res, 'Insufficient permissions', 403);
  };
};

module.exports = { authorize, authorizeOwnerOrRoles };
