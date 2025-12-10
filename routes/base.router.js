const express = require('express');
const { asyncHandler } = require('../utils/errorHandler');

/**
 * Base Router class with common functionality
 * All routers should extend this class
 */
class BaseRouter {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  /**
   * Initialize routes - must be implemented by child classes
   */
  initializeRoutes() {
    throw new Error('initializeRoutes() must be implemented');
  }

  /**
   * Wrap controller method with async error handling
   */
  wrap(fn) {
    return asyncHandler(fn);
  }

  /**
   * Add GET route
   */
  get(path, ...middlewares) {
    const handler = middlewares.pop();
    this.router.get(path, ...middlewares, this.wrap(handler));
    return this;
  }

  /**
   * Add POST route
   */
  post(path, ...middlewares) {
    const handler = middlewares.pop();
    this.router.post(path, ...middlewares, this.wrap(handler));
    return this;
  }

  /**
   * Add PUT route
   */
  put(path, ...middlewares) {
    const handler = middlewares.pop();
    this.router.put(path, ...middlewares, this.wrap(handler));
    return this;
  }

  /**
   * Add PATCH route
   */
  patch(path, ...middlewares) {
    const handler = middlewares.pop();
    this.router.patch(path, ...middlewares, this.wrap(handler));
    return this;
  }

  /**
   * Add DELETE route
   */
  delete(path, ...middlewares) {
    const handler = middlewares.pop();
    this.router.delete(path, ...middlewares, this.wrap(handler));
    return this;
  }

  /**
   * Get the express router instance
   */
  getRouter() {
    return this.router;
  }
}

module.exports = BaseRouter;
