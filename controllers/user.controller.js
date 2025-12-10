const BaseController = require('./base.controller');
const { userService } = require('../services');
const ApiResponse = require('../utils/apiResponse');
const { processFileInfo } = require('../middlewares/upload.middleware');

/**
 * User Controller class
 * Handles all user-related HTTP requests
 */
class UserController extends BaseController {
  constructor() {
    super(userService, 'User');
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res) {
    const result = await this.service.register(req.body);
    
    this.logAction('registered', result.user.id);
    
    return ApiResponse.created(res, result, 'User registered successfully');
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res) {
    const { email, password } = req.body;
    const result = await this.service.login(email, password);
    
    this.logAction('logged in', result.user.id);
    
    return ApiResponse.success(res, result, 'Login successful');
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  async getProfile(req, res) {
    const user = await this.service.getProfile(req.user._id);
    
    return ApiResponse.success(res, user, 'Profile retrieved successfully');
  }

  /**
   * Update current user profile
   * PUT /api/auth/profile
   */
  async updateProfile(req, res) {
    const user = await this.service.updateProfile(req.user._id, req.body);
    
    this.logAction('updated profile', req.user._id);
    
    return ApiResponse.success(res, user, 'Profile updated successfully');
  }

  /**
   * Change user password
   * PUT /api/auth/password
   */
  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const result = await this.service.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );
    
    this.logAction('changed password', req.user._id);
    
    return ApiResponse.success(res, result, 'Password changed successfully');
  }

  /**
   * Update user avatar
   * PUT /api/auth/avatar
   */
  async updateAvatar(req, res) {
    if (!req.file) {
      return ApiResponse.error(res, 'Please upload an image', 400);
    }

    const fileInfo = processFileInfo(req.file);
    const user = await this.service.updateAvatar(req.user._id, fileInfo.path);
    
    this.logAction('updated avatar', req.user._id);
    
    return ApiResponse.success(res, user, 'Avatar updated successfully');
  }

  /**
   * Get all users (Admin only)
   * GET /api/users
   */
  async getAllUsers(req, res) {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      search: req.query.search,
      role: req.query.role,
      isActive: req.query.isActive === 'true' ? true : 
                req.query.isActive === 'false' ? false : undefined,
    };

    const result = await this.service.getAllUsers(options);
    
    return ApiResponse.paginated(
      res,
      result.data,
      result.pagination,
      'Users retrieved successfully'
    );
  }

  /**
   * Get user by ID (Admin only)
   * GET /api/users/:id
   */
  async getUserById(req, res) {
    const user = await this.service.getProfile(req.params.id);
    
    return ApiResponse.success(res, user, 'User retrieved successfully');
  }

  /**
   * Update user role (Admin only)
   * PUT /api/users/:id/role
   */
  async updateUserRole(req, res) {
    const { role } = req.body;
    const user = await this.service.updateUserRole(req.params.id, role);
    
    this.logAction('updated role for', req.params.id);
    
    return ApiResponse.success(res, user, 'User role updated successfully');
  }

  /**
   * Deactivate user (Admin only)
   * PUT /api/users/:id/deactivate
   */
  async deactivateUser(req, res) {
    const user = await this.service.deactivateUser(req.params.id);
    
    this.logAction('deactivated', req.params.id);
    
    return ApiResponse.success(res, user, 'User deactivated successfully');
  }

  /**
   * Activate user (Admin only)
   * PUT /api/users/:id/activate
   */
  async activateUser(req, res) {
    const user = await this.service.activateUser(req.params.id);
    
    this.logAction('activated', req.params.id);
    
    return ApiResponse.success(res, user, 'User activated successfully');
  }

  /**
   * Delete user (Admin only)
   * DELETE /api/users/:id
   */
  async deleteUser(req, res) {
    await this.service.deleteUser(req.params.id);
    
    this.logAction('deleted', req.params.id);
    
    return ApiResponse.success(res, null, 'User deleted successfully');
  }

  /**
   * Verify token validity
   * GET /api/auth/verify
   */
  async verifyToken(req, res) {
    return ApiResponse.success(
      res,
      { user: req.user },
      'Token is valid'
    );
  }
}

module.exports = new UserController();
