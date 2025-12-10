const BaseRouter = require('../base.router');
const { userController } = require('../../controllers');
const { authenticate } = require('../../middlewares/auth.middleware');
const { uploadAvatar } = require('../../middlewares/upload.middleware');
const { validate, userValidation } = require('../../utils/validations');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The user's unique identifier
 *         name:
 *           type: string
 *           description: The user's full name
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *         role:
 *           type: string
 *           enum: [admin, manager, user]
 *           description: The user's role
 *         isActive:
 *           type: boolean
 *           description: Whether the user account is active
 *         avatar:
 *           type: string
 *           description: URL to user's avatar image
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           maxLength: 128
 *           example: password123
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           example: password123
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT authentication token
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *         newPassword:
 *           type: string
 *           minLength: 6
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * Auth Router class
 * Handles authentication routes
 */
class AuthRouter extends BaseRouter {
  constructor() {
    super();
  }

  initializeRoutes() {
    /**
     * @swagger
     * /api/auth/register:
     *   post:
     *     summary: Register a new user
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterRequest'
     *     responses:
     *       201:
     *         description: User registered successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       409:
     *         description: Email already registered
     *       422:
     *         description: Validation error
     */
    this.post(
      '/register',
      validate(userValidation.register),
      userController.register
    );

    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: Login user
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       401:
     *         description: Invalid credentials
     *       422:
     *         description: Validation error
     */
    this.post(
      '/login',
      validate(userValidation.login),
      userController.login
    );

    /**
     * @swagger
     * /api/auth/profile:
     *   get:
     *     summary: Get current user profile
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Profile retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   $ref: '#/components/schemas/User'
     *       401:
     *         description: Unauthorized
     */
    this.get(
      '/profile',
      authenticate,
      userController.getProfile
    );

    /**
     * @swagger
     * /api/auth/profile:
     *   put:
     *     summary: Update current user profile
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               email:
     *                 type: string
     *                 format: email
     *     responses:
     *       200:
     *         description: Profile updated successfully
     *       401:
     *         description: Unauthorized
     *       422:
     *         description: Validation error
     */
    this.put(
      '/profile',
      authenticate,
      validate(userValidation.updateProfile),
      userController.updateProfile
    );

    /**
     * @swagger
     * /api/auth/password:
     *   put:
     *     summary: Change user password
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ChangePasswordRequest'
     *     responses:
     *       200:
     *         description: Password changed successfully
     *       400:
     *         description: Current password is incorrect
     *       401:
     *         description: Unauthorized
     */
    this.put(
      '/password',
      authenticate,
      validate(userValidation.changePassword),
      userController.changePassword
    );

    /**
     * @swagger
     * /api/auth/avatar:
     *   put:
     *     summary: Update user avatar
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               avatar:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Avatar updated successfully
     *       400:
     *         description: No image uploaded
     *       401:
     *         description: Unauthorized
     */
    this.put(
      '/avatar',
      authenticate,
      uploadAvatar,
      userController.updateAvatar
    );

    /**
     * @swagger
     * /api/auth/verify:
     *   get:
     *     summary: Verify token validity
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Token is valid
     *       401:
     *         description: Invalid or expired token
     */
    this.get(
      '/verify',
      authenticate,
      userController.verifyToken
    );
  }
}

module.exports = new AuthRouter().getRouter();
