const { userService } = require('../services');
const HttpError = require('../utils/httpError');
const ApiResponse = require('../utils/apiResponse');
const { USER_ROLES } = require('../utils/enums');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw HttpError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token and get user
    const user = await userService.verifyTokenAndGetUser(token);

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.isOperational) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    return ApiResponse.error(res, 'Authentication failed', 401);
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await userService.verifyTokenAndGetUser(token);
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

/**
 * Authorization middleware factory
 * Checks if user has required role(s)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        'You do not have permission to perform this action',
        403
      );
    }

    next();
  };
};

/**
 * Admin only middleware
 */
const adminOnly = authorize(USER_ROLES.ADMIN);

/**
 * Manager or Admin middleware
 */
const managerOrAdmin = authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER);

/**
 * Check if user is account owner or admin
 */
const ownerOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    const resourceId = req.params[paramName];
    const isOwner = req.user._id.toString() === resourceId;
    const isAdmin = req.user.role === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return ApiResponse.error(
        res,
        'You do not have permission to access this resource',
        403
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  adminOnly,
  managerOrAdmin,
  ownerOrAdmin,
};
