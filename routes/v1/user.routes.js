const BaseRouter = require('../base.router');
const { userController } = require('../../controllers');
const { authenticate, adminOnly, authorize } = require('../../middlewares/auth.middleware');
const { validate, idParamValidation } = require('../../utils/validations');
const { USER_ROLES } = require('../../utils/enums');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalItems:
 *               type: integer
 *             itemsPerPage:
 *               type: integer
 *             hasNextPage:
 *               type: boolean
 *             hasPrevPage:
 *               type: boolean
 *     UpdateRoleRequest:
 *       type: object
 *       required:
 *         - role
 *       properties:
 *         role:
 *           type: string
 *           enum: [admin, manager, user]
 */

// Validation schemas for admin routes
const updateRoleValidation = Joi.object({
  role: Joi.string()
    .valid(...Object.values(USER_ROLES))
    .required()
    .messages({
      'any.only': `Role must be one of: ${Object.values(USER_ROLES).join(', ')}`,
    }),
});

/**
 * User Router class (Admin routes)
 * Handles user management routes
 */
class UserRouter extends BaseRouter {
  constructor() {
    super();
  }

  initializeRoutes() {
    /**
     * @swagger
     * /api/users:
     *   get:
     *     summary: Get all users (Admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Items per page
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search by name or email
     *       - in: query
     *         name: role
     *         schema:
     *           type: string
     *           enum: [admin, manager, user]
     *         description: Filter by role
     *       - in: query
     *         name: isActive
     *         schema:
     *           type: boolean
     *         description: Filter by active status
     *     responses:
     *       200:
     *         description: Users retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserListResponse'
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - Admin access required
     */
    this.get(
      '/',
      authenticate,
      adminOnly,
      userController.getAllUsers
    );

    /**
     * @swagger
     * /api/users/{id}:
     *   get:
     *     summary: Get user by ID (Admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: User ID
     *     responses:
     *       200:
     *         description: User retrieved successfully
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
     *       403:
     *         description: Forbidden
     *       404:
     *         description: User not found
     */
    this.get(
      '/:id',
      authenticate,
      adminOnly,
      validate(idParamValidation, 'params'),
      userController.getUserById
    );

    /**
     * @swagger
     * /api/users/{id}/role:
     *   put:
     *     summary: Update user role (Admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: User ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateRoleRequest'
     *     responses:
     *       200:
     *         description: User role updated successfully
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: User not found
     */
    this.put(
      '/:id/role',
      authenticate,
      adminOnly,
      validate(idParamValidation, 'params'),
      validate(updateRoleValidation),
      userController.updateUserRole
    );

    /**
     * @swagger
     * /api/users/{id}/deactivate:
     *   put:
     *     summary: Deactivate user (Admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: User ID
     *     responses:
     *       200:
     *         description: User deactivated successfully
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: User not found
     */
    this.put(
      '/:id/deactivate',
      authenticate,
      adminOnly,
      validate(idParamValidation, 'params'),
      userController.deactivateUser
    );

    /**
     * @swagger
     * /api/users/{id}/activate:
     *   put:
     *     summary: Activate user (Admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: User ID
     *     responses:
     *       200:
     *         description: User activated successfully
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: User not found
     */
    this.put(
      '/:id/activate',
      authenticate,
      adminOnly,
      validate(idParamValidation, 'params'),
      userController.activateUser
    );

    /**
     * @swagger
     * /api/users/{id}:
     *   delete:
     *     summary: Delete user (Admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: User ID
     *     responses:
     *       200:
     *         description: User deleted successfully
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       404:
     *         description: User not found
     */
    this.delete(
      '/:id',
      authenticate,
      adminOnly,
      validate(idParamValidation, 'params'),
      userController.deleteUser
    );
  }
}

module.exports = new UserRouter().getRouter();
