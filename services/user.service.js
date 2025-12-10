const BaseService = require('./base.service');
const { User } = require('../models');
const HttpError = require('../utils/httpError');

/**
 * User Service class
 * Handles all user-related business logic
 */
class UserService extends BaseService {
  constructor() {
    super(User);
  }

  /**
   * Register a new user
   */
  async register(userData) {
    // Check if email already exists
    const existingUser = await this.model.findByEmail(userData.email);
    if (existingUser) {
      throw HttpError.conflict('Email already registered');
    }

    // Create user
    const user = await this.create(userData);

    // Generate token
    const token = user.generateAuthToken();

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user with password field
    const user = await this.model
      .findOne({ email: email.toLowerCase() })
      .select('+password');

    if (!user) {
      throw HttpError.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw HttpError.forbidden('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw HttpError.unauthorized('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await this.findById(userId);
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    // Prevent updating sensitive fields
    const { password, role, isActive, ...allowedUpdates } = updateData;

    // Check if email is being updated and if it already exists
    if (allowedUpdates.email) {
      const existingUser = await this.model.findByEmail(allowedUpdates.email);
      if (existingUser && existingUser._id.toString() !== userId) {
        throw HttpError.conflict('Email already in use');
      }
    }

    const user = await this.updateById(userId, allowedUpdates);
    return user;
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Get user with password
    const user = await this.model.findById(userId).select('+password');

    if (!user) {
      throw HttpError.notFound('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw HttpError.badRequest('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = user.generateAuthToken();

    return { token };
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId, avatarPath) {
    const user = await this.updateById(userId, { avatar: avatarPath });
    return user;
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(options = {}) {
    const { page = 1, limit = 10, search, role, isActive } = options;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    return this.findAll(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
    });
  }

  /**
   * Deactivate user (admin only)
   */
  async deactivateUser(userId) {
    const user = await this.updateById(userId, { isActive: false });
    return user;
  }

  /**
   * Activate user (admin only)
   */
  async activateUser(userId) {
    const user = await this.updateById(userId, { isActive: true });
    return user;
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId, role) {
    const user = await this.updateById(userId, { role });
    return user;
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId) {
    return this.deleteById(userId);
  }

  /**
   * Verify JWT token and get user
   */
  async verifyTokenAndGetUser(token) {
    try {
      const decoded = this.model.verifyToken(token);
      const user = await this.model.findById(decoded.id);

      if (!user || !user.isActive) {
        throw HttpError.unauthorized('Invalid or expired token');
      }

      return user;
    } catch (error) {
      throw HttpError.unauthorized('Invalid or expired token');
    }
  }
}

module.exports = new UserService();
