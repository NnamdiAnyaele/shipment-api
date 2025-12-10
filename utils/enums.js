/**
 * Application-wide enums and constants
 */

const SHIPMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
  MANAGER: 'manager',
});

const VALIDATION_STATUS = Object.freeze({
  SUCCESS: 'success',
  FAILURE: 'failure',
});

const FILE_TYPES = Object.freeze({
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALL: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
});

const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
});

const PAGINATION_DEFAULTS = Object.freeze({
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
});

module.exports = {
  SHIPMENT_STATUS,
  USER_ROLES,
  VALIDATION_STATUS,
  FILE_TYPES,
  HTTP_STATUS,
  PAGINATION_DEFAULTS,
};
