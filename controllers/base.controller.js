const ApiResponse = require('../utils/apiResponse');
const { logError, logInfo } = require('../utils/logger');

/**
 * Base Controller class with common functionality
 * All controllers should extend this class
 */
class BaseController {
  constructor(service, resourceName = 'Resource') {
    this.service = service;
    this.resourceName = resourceName;
    
    // Bind methods to ensure proper 'this' context
    this.bindMethods();
  }

  /**
   * Bind all methods to the instance
   * Override in child classes to add more methods
   */
  bindMethods() {
    const prototype = Object.getPrototypeOf(this);
    const methods = Object.getOwnPropertyNames(prototype);
    
    methods.forEach((method) => {
      if (method !== 'constructor' && typeof this[method] === 'function') {
        this[method] = this[method].bind(this);
      }
    });
  }

  /**
   * Handle async operations with error catching
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        logError(`${this.resourceName}Controller`, error);
        next(error);
      });
    };
  }

  /**
   * Get all resources with pagination
   */
  async getAll(req, res) {
    const { page = 1, limit = 10, ...filters } = req.query;
    
    const result = await this.service.findAll(filters, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return ApiResponse.paginated(
      res,
      result.data,
      result.pagination,
      `${this.resourceName}s retrieved successfully`
    );
  }

  /**
   * Get single resource by ID
   */
  async getById(req, res) {
    const { id } = req.params;
    const resource = await this.service.findById(id);

    return ApiResponse.success(
      res,
      resource,
      `${this.resourceName} retrieved successfully`
    );
  }

  /**
   * Create new resource
   */
  async create(req, res) {
    const resource = await this.service.create(req.body);

    return ApiResponse.created(
      res,
      resource,
      `${this.resourceName} created successfully`
    );
  }

  /**
   * Update resource by ID
   */
  async update(req, res) {
    const { id } = req.params;
    const resource = await this.service.updateById(id, req.body);

    return ApiResponse.success(
      res,
      resource,
      `${this.resourceName} updated successfully`
    );
  }

  /**
   * Delete resource by ID
   */
  async delete(req, res) {
    const { id } = req.params;
    await this.service.deleteById(id);

    return ApiResponse.success(
      res,
      null,
      `${this.resourceName} deleted successfully`
    );
  }

  /**
   * Log controller action
   */
  logAction(action, userId, resourceId = null) {
    const message = resourceId
      ? `User ${userId} ${action} ${this.resourceName} ${resourceId}`
      : `User ${userId} ${action} ${this.resourceName}`;
    
    logInfo(`${this.resourceName}Controller`, message);
  }
}

module.exports = BaseController;
